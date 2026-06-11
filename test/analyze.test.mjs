// Tests for the detection engine. They inject a fake Anthropic client, so they
// run fully offline with no API key and no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectPitfalls,
  imageMediaTypeForExtension,
  getAllRules,
  getRule,
  getRulesByDomain,
  ruleCount,
} from '../dist/index.js';

// A stand-in for the Anthropic client: messages.create returns the given
// findings (plus any extra top-level tool-input fields, e.g. a variant's
// verdict/strengths) as a report_findings tool call and records the params.
function fakeClient(findings, extra = {}) {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (params) => {
        calls.push(params);
        return {
          content: [{ type: 'tool_use', id: 't', name: 'report_findings', input: { findings, ...extra } }],
          usage: {
            input_tokens: 100,
            output_tokens: 20,
            cache_read_input_tokens: 80,
            cache_creation_input_tokens: 0,
          },
        };
      },
    },
  };
}

const textInput = { kind: 'code', content: 'SELECT 1', language: 'SQL', filename: 'q.sql' };

test('imageMediaTypeForExtension maps image extensions and rejects others', () => {
  assert.equal(imageMediaTypeForExtension('.png'), 'image/png');
  assert.equal(imageMediaTypeForExtension('.JPG'), 'image/jpeg');
  assert.equal(imageMediaTypeForExtension('.jpeg'), 'image/jpeg');
  assert.equal(imageMediaTypeForExtension('.gif'), 'image/gif');
  assert.equal(imageMediaTypeForExtension('.webp'), 'image/webp');
  assert.equal(imageMediaTypeForExtension('.svg'), undefined);
  assert.equal(imageMediaTypeForExtension('.txt'), undefined);
});

test('detectPitfalls drops findings that do not reference a real catalog rule', async () => {
  const realRule = getAllRules()[0];
  const client = fakeClient([
    { rule_id: realRule.id, confidence: 'high', nature: 'active', evidence: 'x', explanation: 'y' },
    { rule_id: '__not_a_real_rule__', confidence: 'high', nature: 'active', evidence: 'x', explanation: 'y' },
  ]);
  const report = await detectPitfalls(textInput, { client });
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0].ruleId, realRule.id);
});

test('detectPitfalls takes authoritative rule fields from the catalog, not the model', async () => {
  const realRule = getAllRules()[0];
  // The model supplies only rule_id and commentary; name/domain/severity/remediation
  // must come from the catalog so a model can never misreport them.
  const client = fakeClient([
    { rule_id: realRule.id, confidence: 'high', nature: 'active', evidence: 'x', explanation: 'y' },
  ]);
  const report = await detectPitfalls(textInput, { client });
  const f = report.findings[0];
  assert.equal(f.name, realRule.name);
  assert.equal(f.domain, realRule.domain);
  assert.equal(f.severity, realRule.severity);
  assert.equal(f.remediation, realRule.remediation.trim());
});

test('detectPitfalls normalizes a bad confidence and a missing nature', async () => {
  const realRule = getAllRules()[0];
  const client = fakeClient([{ rule_id: realRule.id, confidence: 'bogus', evidence: '', explanation: '' }]);
  const report = await detectPitfalls(textInput, { client });
  assert.equal(report.findings[0].confidence, 'medium');
  assert.equal(report.findings[0].nature, 'active');
});

test('detectPitfalls returns an empty report when the model finds nothing', async () => {
  const report = await detectPitfalls(textInput, { client: fakeClient([]) });
  assert.deepEqual(report.findings, []);
  assert.equal(report.kind, 'code');
});

test('detectPitfalls echoes the requested model and surfaces usage', async () => {
  const report = await detectPitfalls(textInput, { client: fakeClient([]), model: 'claude-test-9' });
  assert.equal(report.model, 'claude-test-9');
  assert.equal(report.usage.inputTokens, 100);
  assert.equal(report.usage.cacheReadInputTokens, 80);
});

test('code and text input ground on the entire catalog', async () => {
  const report = await detectPitfalls(textInput, { client: fakeClient([]) });
  assert.equal(report.rulesConsidered, ruleCount());
});

test('image input grounds on the visual domains plus the data-reality rule', async () => {
  const expected =
    getRulesByDomain('Graphical Gaffes').length +
    getRulesByDomain('Design Dangers').length +
    (getRule('data-reality-gap') ? 1 : 0);
  const report = await detectPitfalls(
    { kind: 'image', images: [{ content: 'AAAA', mediaType: 'image/png', filename: 'c.png' }] },
    { client: fakeClient([]) }
  );
  assert.equal(report.rulesConsidered, expected);
  assert.equal(report.kind, 'image');
});

test('multiple images are all sent in one request for a cross-chart audit', async () => {
  const client = fakeClient([]);
  const report = await detectPitfalls(
    {
      kind: 'image',
      images: [
        { content: 'AAAA', mediaType: 'image/png', filename: 'a.png' },
        { content: 'BBBB', mediaType: 'image/jpeg', filename: 'b.jpg' },
      ],
    },
    { client }
  );
  assert.equal(report.kind, 'image');
  const userContent = client.calls[0].messages[0].content;
  const imageBlocks = userContent.filter((b) => b.type === 'image');
  assert.equal(imageBlocks.length, 2);
  assert.equal(imageBlocks[0].source.data, 'AAAA');
  assert.equal(imageBlocks[1].source.data, 'BBBB');
});

test('the domains option overrides rule selection', async () => {
  const report = await detectPitfalls(textInput, {
    client: fakeClient([]),
    domains: ['Statistical Slip-Ups'],
  });
  assert.equal(report.rulesConsidered, getRulesByDomain('Statistical Slip-Ups').length);
});

test('a chain scans every stage together, grounded on the full catalog', async () => {
  const client = fakeClient([]);
  const report = await detectPitfalls(
    {
      kind: 'chain',
      stages: [
        { role: 'Code (Python): prep.py', artifact: { kind: 'code', content: 'df.dropna().mean()', language: 'Python' } },
        { role: 'Chart: revenue.png', artifact: { kind: 'image', images: [{ content: 'AAAA', mediaType: 'image/png', filename: 'revenue.png' }] } },
        { role: 'Written summary', artifact: { kind: 'text', content: 'The typical customer is worth $4,200.' } },
      ],
    },
    { client }
  );

  // Chains ground on the whole catalog (unlike a lone chart).
  assert.equal(report.kind, 'chain');
  assert.equal(report.rulesConsidered, getAllRules().length);

  // The chain system prompt and a per-stage layout (headers + the chart image) are sent.
  assert.match(client.calls[0].system[0].text, /analytics workflow/);
  const content = client.calls[0].messages[0].content;
  const headers = content.filter((b) => b.type === 'text' && b.text.startsWith('=== Stage '));
  assert.equal(headers.length, 3);
  assert.equal(content.filter((b) => b.type === 'image').length, 1);
});

// EXPERIMENTAL presentation variants (see evals/compare.mjs).

test('baseline keeps the shipped request and ignores stray verdict fields', async () => {
  const client = fakeClient([], { verdict: 'looks fine' });
  const report = await detectPitfalls(textInput, { client });

  assert.equal(report.verdict, undefined);
  const schema = client.calls[0].tools[0].input_schema;
  assert.equal(schema.properties.verdict, undefined);
  assert.ok(!schema.required.includes('verdict'));
  assert.doesNotMatch(client.calls[0].system[0].text, /verdict/);
});

test('the verdict variant asks for and surfaces a verdict and per-finding consequence', async () => {
  const realRule = getAllRules()[0];
  const client = fakeClient(
    [
      {
        rule_id: realRule.id,
        confidence: 'high',
        nature: 'active',
        evidence: 'x',
        explanation: 'y',
        consequence: 'changes-takeaway',
      },
    ],
    { verdict: '  Fundamentally sound; fix the legend.  ' }
  );
  const report = await detectPitfalls(textInput, { client, variant: 'verdict' });

  assert.equal(report.verdict, 'Fundamentally sound; fix the legend.');
  assert.equal(report.findings[0].consequence, 'changes-takeaway');

  const schema = client.calls[0].tools[0].input_schema;
  assert.ok(schema.required.includes('verdict'));
  assert.ok(schema.properties.findings.items.required.includes('consequence'));
  assert.match(client.calls[0].system[0].text, /"verdict"/);
});

test('a bogus consequence and an empty verdict are dropped rather than surfaced', async () => {
  const realRule = getAllRules()[0];
  const client = fakeClient(
    [{ rule_id: realRule.id, confidence: 'high', nature: 'active', evidence: 'x', explanation: 'y', consequence: 'huge' }],
    { verdict: '   ' }
  );
  const report = await detectPitfalls(textInput, { client, variant: 'verdict' });
  assert.equal(report.findings[0].consequence, undefined);
  assert.equal(report.verdict, undefined);
});
