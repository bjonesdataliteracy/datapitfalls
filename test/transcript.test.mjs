// Tests for the transcript input kind (offline: a fake Anthropic client).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  detectPitfalls,
  parseTranscript,
  renderTranscript,
  extractEventRefs,
  formatReport,
  taxonomyVersion,
  MAX_EVENT_CHARS,
} from '../dist/index.js';
import { buildTranscriptInput } from '../dist/scan-input.js';

const example = JSON.parse(
  readFileSync(
    new URL('../packages/schemas/examples/transcript.example.json', import.meta.url),
    'utf8'
  )
);

function fakeClient(findings) {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (params) => {
        calls.push(params);
        return {
          content: [{ type: 'tool_use', id: 't', name: 'report_findings', input: { findings } }],
        };
      },
    },
  };
}

test('parseTranscript accepts the shipped example', () => {
  const result = parseTranscript(example);
  assert.ok('transcript' in result, result.error);
  assert.equal(result.transcript.events.length, 5);
  assert.equal(result.transcript.signals.correction, 1);
});

test('parseTranscript rejects malformed transcripts with a clear message', () => {
  assert.match(parseTranscript([]).error, /JSON object/);
  assert.match(parseTranscript({ ...example, agent: 'tableau' }).error, /agent/);
  assert.match(parseTranscript({ ...example, events: [] }).error, /non-empty/);
  const badEvent = { ...example, events: [{ role: 'bot', type: 'message', content: 'hi' }] };
  assert.match(parseTranscript(badEvent).error, /Event 0: "role"/);
  assert.match(parseTranscript({ ...example, signals: { rerun: -1 } }).error, /signals.rerun/);
});

test('renderTranscript numbers events from zero and shows SQL and signals', () => {
  const text = renderTranscript(parseTranscript(example).transcript);
  assert.match(text, /^Session demo-2026-11-09-01 · agent: claude-code/);
  assert.match(text, /Signals: user doubt 1, reruns 0, corrections 1/);
  assert.match(text, /\[event 0\] user · message/);
  assert.match(text, /\[event 1\] agent · query\nSQL:\nSELECT carrier/);
  assert.match(text, /\[event 4\] user · correction/);
});

test('renderTranscript clips very long event content', () => {
  const long = {
    ...example,
    events: [{ role: 'tool', type: 'result', content: 'x'.repeat(MAX_EVENT_CHARS + 10) }],
  };
  const text = renderTranscript(parseTranscript(long).transcript);
  assert.match(text, /\[… 10 more characters cut\]/);
});

test('extractEventRefs reads single, listed and ranged references within bounds', () => {
  assert.deepEqual(extractEventRefs('See [event 3].', 5), [3]);
  assert.deepEqual(extractEventRefs('In events 1, 3 and 4 the agent…', 5), [1, 3, 4]);
  assert.deepEqual(extractEventRefs('Across events 1-3.', 5), [1, 2, 3]);
  assert.deepEqual(extractEventRefs('[event 2] then [event 2] then [event 9]', 5), [2]);
  assert.deepEqual(extractEventRefs('no references here', 5), []);
});

test('detectPitfalls reviews a transcript, cites events and records the taxonomy version', async () => {
  const client = fakeClient([
    {
      rule_id: 'data-reality-gap',
      confidence: 'high',
      nature: 'active',
      evidence: '[event 1] sums t100_segment passengers; [event 4] the user flags double-counting.',
      explanation: 'Segment counts are legs, not travellers.',
    },
  ]);
  const input = {
    kind: 'transcript',
    transcript: parseTranscript(example).transcript,
    filename: 's.json',
  };
  const report = await detectPitfalls(input, { client });
  assert.equal(report.kind, 'transcript');
  assert.equal(report.taxonomyVersion, taxonomyVersion);
  assert.deepEqual(report.findings[0].eventRefs, [1, 4]);
  const prompt = client.calls[0].messages[0].content;
  assert.match(prompt, /<transcript>\nSession demo-2026-11-09-01/);
  assert.match(prompt, /\(s\.json\)/);
  assert.match(formatReport(report), /evident from the agent session/);
});

test('non-transcript findings carry no eventRefs', async () => {
  const client = fakeClient([
    {
      rule_id: 'data-reality-gap',
      confidence: 'high',
      nature: 'active',
      evidence: 'event 1',
      explanation: 'x',
    },
  ]);
  const report = await detectPitfalls({ kind: 'text', content: 'crime fell' }, { client });
  assert.equal(report.findings[0].eventRefs, undefined);
});

test('buildTranscriptInput reads a file and reports bad JSON or shape', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dp-transcript-'));
  const good = join(dir, 'good.json');
  writeFileSync(good, JSON.stringify(example));
  const ok = buildTranscriptInput(good);
  assert.equal(ok.input.kind, 'transcript');
  assert.equal(ok.input.filename, 'good.json');

  const notJson = join(dir, 'bad.json');
  writeFileSync(notJson, '{ nope');
  assert.match(buildTranscriptInput(notJson).error, /not valid JSON/);

  const wrongShape = join(dir, 'shape.json');
  writeFileSync(wrongShape, JSON.stringify({ session_id: 'x' }));
  assert.match(buildTranscriptInput(wrongShape).error, /agent/);

  assert.match(buildTranscriptInput(join(dir, 'missing.json')).error, /Could not read/);
});
