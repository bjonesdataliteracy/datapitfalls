// Tests for @datapitfalls/schemas: the schemas compile, the examples validate,
// and the engine's real output matches the contracts (a drift check).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { detectPitfalls, parseTranscript, getRule, getAllRules } from '../dist/index.js';

const dir = new URL('../packages/schemas/', import.meta.url);
const load = (rel) => JSON.parse(readFileSync(new URL(rel, dir), 'utf8'));
const files = readdirSync(new URL('schemas/', dir)).filter((f) => f.endsWith('.schema.json'));

const ajv = new Ajv2020({ allErrors: true, strict: true });
for (const file of files) ajv.addSchema(load(`schemas/${file}`));
const validator = (name) =>
  ajv.getSchema(`https://avoidingdatapitfalls.com/schemas/${name}.schema.json`);

test('all five contracts ship and compile', () => {
  assert.deepEqual(files.sort(), [
    'finding.schema.json',
    'memory-record.schema.json',
    'pitfall-report.schema.json',
    'transcript.schema.json',
    'trap.schema.json',
  ]);
  for (const name of ['finding', 'pitfall-report', 'transcript', 'memory-record', 'trap']) {
    assert.ok(validator(name), `${name} did not compile`);
  }
});

test('the shipped examples validate and cite real rule ids', () => {
  for (const [name, example] of [
    ['transcript', 'examples/transcript.example.json'],
    ['memory-record', 'examples/memory-record.example.json'],
    ['trap', 'examples/trap.example.json'],
  ]) {
    const validate = validator(name);
    const doc = load(example);
    assert.ok(validate(doc), `${example}: ${JSON.stringify(validate.errors)}`);
    for (const id of doc.pitfall_ids ?? [])
      assert.ok(getRule(id), `${example} cites unknown rule ${id}`);
  }
});

test('the transcript schema and parseTranscript agree on the example', () => {
  const example = load('examples/transcript.example.json');
  assert.ok(validator('transcript')(example));
  assert.ok('transcript' in parseTranscript(example));
});

test('a real engine report (transcript scan) validates against the report and finding schemas', async () => {
  const rule = getAllRules()[0];
  const client = {
    messages: {
      create: async () => ({
        content: [
          {
            type: 'tool_use',
            id: 't',
            name: 'report_findings',
            input: {
              findings: [
                {
                  rule_id: rule.id,
                  confidence: 'medium',
                  nature: 'latent',
                  condition: 'c',
                  evidence: '[event 1]',
                  explanation: 'e',
                },
              ],
            },
          },
        ],
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    },
  };
  const transcript = parseTranscript(load('examples/transcript.example.json')).transcript;
  const report = await detectPitfalls({ kind: 'transcript', transcript }, { client });
  const validate = validator('pitfall-report');
  assert.ok(validate(report), JSON.stringify(validate.errors));
});

test('the finding schema lists every field the engine can emit', () => {
  const props = Object.keys(load('schemas/finding.schema.json').properties).sort();
  assert.deepEqual(props, [
    'condition',
    'confidence',
    'consequence',
    'domain',
    'eventRefs',
    'evidence',
    'explanation',
    'name',
    'nature',
    'remediation',
    'ruleId',
    'severity',
  ]);
});
