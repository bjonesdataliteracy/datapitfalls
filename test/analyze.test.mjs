// Tests for the detection engine. They inject a fake Anthropic client, so they
// run fully offline with no API key and no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectPitfalls,
  PitfallDetectionError,
  supportsForcedToolChoice,
  imageMediaTypeForExtension,
  getAllRules,
  getRule,
  getRulesByDomain,
  ruleCount,
} from '../dist/index.js';

// A stand-in for the Anthropic client: messages.create returns the given
// findings (plus any extra top-level tool-input fields, e.g. a variant's
// summary) as a report_findings tool call and records the params.
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

test('baseline keeps the shipped request and ignores stray summary fields', async () => {
  const client = fakeClient([], { summary: 'looks fine' });
  const report = await detectPitfalls(textInput, { client });

  assert.equal(report.summary, undefined);
  const schema = client.calls[0].tools[0].input_schema;
  assert.equal(schema.properties.summary, undefined);
  assert.ok(!schema.required.includes('summary'));
  assert.doesNotMatch(client.calls[0].system[0].text, /"summary"/);
});

test('the summary variant asks for and surfaces a summary and per-finding consequence', async () => {
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
    { summary: '  Fundamentally sound; fix the legend.  ' }
  );
  const report = await detectPitfalls(textInput, { client, variant: 'summary' });

  assert.equal(report.summary, 'Fundamentally sound; fix the legend.');
  assert.equal(report.findings[0].consequence, 'changes-takeaway');

  const schema = client.calls[0].tools[0].input_schema;
  assert.ok(schema.required.includes('summary'));
  assert.ok(schema.properties.findings.items.required.includes('consequence'));
  // The addendum asks for the summary, the consequence rating, and the
  // guide-not-judge voice.
  assert.match(client.calls[0].system[0].text, /"summary"/);
  assert.match(client.calls[0].system[0].text, /audience/);
});

test('the summary variant validates avoided pitfalls against the catalog and findings', async () => {
  const [r0, r1, r2, r3] = getAllRules();
  const client = fakeClient(
    [{ rule_id: r0.id, confidence: 'high', nature: 'active', evidence: 'x', explanation: 'y', consequence: 'polish' }],
    {
      summary: 'ok',
      avoided: [
        { rule_id: r0.id, evidence: 'dup', explanation: 'also a finding — must drop' },
        { rule_id: '__not_a_real_rule__', evidence: 'n', explanation: 'n' },
        { rule_id: r1.id, evidence: 'a guard', explanation: 'kept' },
        { rule_id: r2.id, evidence: 'a caveat', explanation: 'kept' },
        { rule_id: r3.id, evidence: 'c', explanation: 'over the cap — must drop' },
      ],
    }
  );
  const report = await detectPitfalls(textInput, { client, variant: 'summary' });

  // Catalog-validated, disjoint from findings, capped at two, names from the catalog.
  assert.deepEqual(
    report.avoided.map((a) => a.ruleId),
    [r1.id, r2.id]
  );
  assert.equal(report.avoided[0].name, r1.name);
  assert.equal(report.avoided[0].evidence, 'a guard');

  const schema = client.calls[0].tools[0].input_schema;
  assert.ok(schema.required.includes('avoided'));
});

test('baseline reports no avoided list even if the model volunteers one', async () => {
  const realRule = getAllRules()[0];
  const client = fakeClient([], {
    avoided: [{ rule_id: realRule.id, evidence: 'e', explanation: 'x' }],
  });
  const report = await detectPitfalls(textInput, { client });
  assert.equal(report.avoided, undefined);
});

test('backslash-escaped quotes are removed from prose fields but not from evidence', async () => {
  const [r0, r1] = getAllRules();
  const client = fakeClient(
    [
      {
        rule_id: r0.id,
        confidence: 'high',
        nature: 'latent',
        evidence: 'df.query(\\"x > 0\\")',
        explanation: 'Readers will trust Slide 3\'s \\"best stretch ever\\" window.',
        condition: 'the \\\'peak\\\' month is \\\u201Cpartial\\\u201D',
        consequence: 'polish',
      },
    ],
    {
      summary: 'Sound overall; check Slide 3\'s \\"best stretch ever\\" window.',
      avoided: [{ rule_id: r1.id, evidence: 'print(\\"n=\\", n)', explanation: 'It notes the \\\u2018sample size\\\u2019.' }],
    }
  );
  const report = await detectPitfalls(textInput, { client, variant: 'summary' });

  assert.equal(report.summary, 'Sound overall; check Slide 3\'s "best stretch ever" window.');
  const [finding] = report.findings;
  assert.equal(finding.explanation, 'Readers will trust Slide 3\'s "best stretch ever" window.');
  assert.equal(finding.condition, "the 'peak' month is “partial”");
  assert.equal(report.avoided[0].explanation, 'It notes the ‘sample size’.');
  // Evidence can quote code, where \" is real, so it passes through untouched.
  assert.equal(finding.evidence, 'df.query(\\"x > 0\\")');
  assert.equal(report.avoided[0].evidence, 'print(\\"n=\\", n)');
});

test('baseline findings also get backslash-escaped quotes removed', async () => {
  const realRule = getAllRules()[0];
  const client = fakeClient([
    { rule_id: realRule.id, confidence: 'high', nature: 'active', evidence: 'e', explanation: 'the \\"typical\\" value' },
  ]);
  const report = await detectPitfalls(textInput, { client });
  assert.equal(report.findings[0].explanation, 'the "typical" value');
});

test('a bogus consequence and an empty summary are dropped rather than surfaced', async () => {
  const realRule = getAllRules()[0];
  const client = fakeClient(
    [{ rule_id: realRule.id, confidence: 'high', nature: 'active', evidence: 'x', explanation: 'y', consequence: 'huge' }],
    { summary: '   ' }
  );
  const report = await detectPitfalls(textInput, { client, variant: 'summary' });
  assert.equal(report.findings[0].consequence, undefined);
  assert.equal(report.summary, undefined);
});

// A client that replays scripted responses (or throws scripted errors) in order.
function scriptedClient(steps) {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (params) => {
        calls.push(params);
        const step = steps[calls.length - 1];
        if (step instanceof Error) throw step;
        return step;
      },
    },
  };
}

const reportMessage = (findings = []) => ({
  content: [{ type: 'tool_use', id: 't', name: 'report_findings', input: { findings } }],
  stop_reason: 'tool_use',
});
const proseMessage = {
  content: [{ type: 'text', text: 'Looks fine to me.' }],
  stop_reason: 'end_turn',
};

test('supportsForcedToolChoice is false only for models that reject forced tool use', () => {
  assert.equal(supportsForcedToolChoice('claude-sonnet-4-6'), true);
  assert.equal(supportsForcedToolChoice('claude-opus-4-7'), true);
  assert.equal(supportsForcedToolChoice('claude-haiku-4-5'), true);
  assert.equal(supportsForcedToolChoice('claude-sonnet-5'), true);
  assert.equal(supportsForcedToolChoice('claude-sonnet-5-5'), false);
  assert.equal(supportsForcedToolChoice('anthropic.claude-sonnet-5-5'), false);
  assert.equal(supportsForcedToolChoice('claude-opus-5-5'), false);
  assert.equal(supportsForcedToolChoice('claude-fable-5-1'), false);
});

test('4.x models keep the forced tool call and the shipped prompt', async () => {
  const client = fakeClient([]);
  await detectPitfalls(textInput, { client, model: 'claude-sonnet-4-6' });
  assert.deepEqual(client.calls[0].tool_choice, { type: 'tool', name: 'report_findings' });
  assert.doesNotMatch(client.calls[0].system[0].text, /exactly once/);
  assert.equal(client.calls[0].output_config, undefined);
});

test('Sonnet 5.5 is offered the tool with auto choice and told to call it', async () => {
  const client = fakeClient([]);
  await detectPitfalls(textInput, { client, model: 'claude-sonnet-5-5' });
  assert.deepEqual(client.calls[0].tool_choice, { type: 'auto' });
  assert.match(client.calls[0].system[0].text, /calling the report_findings tool exactly once/);
  // The catalog block stays last and cached.
  assert.deepEqual(client.calls[0].system[1].cache_control, { type: 'ephemeral' });
});

test('effort is sent as output_config.effort only when set', async () => {
  const client = fakeClient([]);
  await detectPitfalls(textInput, { client, model: 'claude-sonnet-5-5', effort: 'medium' });
  assert.deepEqual(client.calls[0].output_config, { effort: 'medium' });
});

test('a 400 rejecting forced tool use is retried once without forcing', async () => {
  const rejection = Object.assign(
    new Error('400 tool_choice: type "tool" and "any" are not supported for this model.'),
    { status: 400 }
  );
  const client = scriptedClient([rejection, reportMessage()]);
  const report = await detectPitfalls(textInput, { client, model: 'claude-future-9' });
  assert.deepEqual(report.findings, []);
  assert.equal(client.calls.length, 2);
  assert.deepEqual(client.calls[1].tool_choice, { type: 'auto' });
});

test('other API errors are not retried', async () => {
  const other = Object.assign(new Error('400 messages: bad request'), { status: 400 });
  const client = scriptedClient([other]);
  await assert.rejects(detectPitfalls(textInput, { client }), /bad request/);
  assert.equal(client.calls.length, 1);
});

test('an unforced prose answer is retried once, then reported as no_report', async () => {
  const recovered = scriptedClient([proseMessage, reportMessage()]);
  const report = await detectPitfalls(textInput, { client: recovered, model: 'claude-sonnet-5-5' });
  assert.deepEqual(report.findings, []);
  assert.equal(recovered.calls.length, 2);

  const stuck = scriptedClient([proseMessage, proseMessage]);
  await assert.rejects(
    detectPitfalls(textInput, { client: stuck, model: 'claude-sonnet-5-5' }),
    (error) => error instanceof PitfallDetectionError && error.code === 'no_report'
  );
});

test('a refusal or a truncated report throws instead of reading as clear', async () => {
  const refused = scriptedClient([{ content: [], stop_reason: 'refusal' }]);
  await assert.rejects(
    detectPitfalls(textInput, { client: refused, model: 'claude-sonnet-5-5' }),
    (error) => error instanceof PitfallDetectionError && error.code === 'refusal'
  );

  const truncated = scriptedClient([{ ...reportMessage(), stop_reason: 'max_tokens' }]);
  await assert.rejects(
    detectPitfalls(textInput, { client: truncated }),
    (error) => error instanceof PitfallDetectionError && error.code === 'truncated'
  );
});

test('thinking blocks ahead of the tool call are skipped', async () => {
  const client = scriptedClient([
    {
      content: [
        { type: 'thinking', thinking: '', signature: 's' },
        { type: 'tool_use', id: 't', name: 'report_findings', input: { findings: [] } },
      ],
      stop_reason: 'tool_use',
    },
  ]);
  const report = await detectPitfalls(textInput, { client, model: 'claude-sonnet-5-5' });
  assert.deepEqual(report.findings, []);
});
