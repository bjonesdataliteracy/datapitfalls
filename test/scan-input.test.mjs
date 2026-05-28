// Tests for the CLI's file routing: which DetectionInput each file (or set of
// files) becomes. Uses real temp files; no network or API key needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildScanInput, buildChainInput } from '../dist/scan-input.js';

const dir = mkdtempSync(join(tmpdir(), 'dpf-scan-'));
function tmp(name, content) {
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
}

test('a single PDF becomes a native document input', async () => {
  const result = await buildScanInput([tmp('report.pdf', Buffer.from('%PDF-1.4 fake'))], false);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'document');
  assert.equal(result.input.mediaType, 'application/pdf');
  assert.equal(result.input.filename, 'report.pdf');
});

test('a single image becomes a one-image audit', async () => {
  const result = await buildScanInput([tmp('chart.png', Buffer.from('\x89PNG fake'))], false);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'image');
  assert.equal(result.input.images.length, 1);
  assert.equal(result.input.images[0].mediaType, 'image/png');
});

test('several images become one multi-image (cross-chart) audit', async () => {
  const result = await buildScanInput([tmp('a.png', Buffer.from('a')), tmp('b.jpg', Buffer.from('b'))], false);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'image');
  assert.equal(result.input.images.length, 2);
  assert.equal(result.input.images[1].mediaType, 'image/jpeg');
});

test('a non-image among several files is rejected', async () => {
  const result = await buildScanInput([tmp('a.png', Buffer.from('a')), tmp('notes.txt', 'hello')], false);
  assert.ok('error' in result);
});

test('a code file becomes a code input with an inferred language', async () => {
  const result = await buildScanInput([tmp('q.sql', 'SELECT 1')], false);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'code');
  assert.equal(result.input.language, 'SQL');
});

test('--text forces a single file to be read as prose', async () => {
  const result = await buildScanInput([tmp('script.py', 'print(1)')], true);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'text');
});

test('--text with several files is rejected', async () => {
  const result = await buildScanInput([tmp('a.png', Buffer.from('a')), tmp('c.png', Buffer.from('c'))], true);
  assert.ok('error' in result);
});

test('a notebook is audited as its extracted code cells', async () => {
  const nb = JSON.stringify({
    cells: [
      { cell_type: 'markdown', source: ['# Title\n', 'narrative prose'] },
      { cell_type: 'code', source: ['import pandas as pd\n', 'df = pd.read_csv("x.csv")'] },
      { cell_type: 'code', source: 'df.dropna().mean()' },
    ],
    metadata: { kernelspec: { language: 'python' } },
  });
  const result = await buildScanInput([tmp('analysis.ipynb', nb)], false);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'code');
  assert.equal(result.input.language, 'Python');
  assert.match(result.input.content, /pandas/);
  assert.match(result.input.content, /dropna/);
  assert.doesNotMatch(result.input.content, /Title/); // markdown cells are excluded
});

test('a malformed notebook is rejected', async () => {
  const result = await buildScanInput([tmp('bad.ipynb', 'not json {')], false);
  assert.ok('error' in result);
});

test('a notebook with no code cells is rejected', async () => {
  const nb = JSON.stringify({ cells: [{ cell_type: 'markdown', source: ['just notes'] }] });
  const result = await buildScanInput([tmp('notes.ipynb', nb)], false);
  assert.ok('error' in result);
});

test('a file that is not a real .docx is rejected gracefully', async () => {
  const result = await buildScanInput([tmp('fake.docx', 'this is not a real Word document')], false);
  assert.ok('error' in result);
});

test('several mixed files become one whole-analysis chain', async () => {
  const result = await buildChainInput([
    tmp('prep.sql', 'SELECT AVG(amount) FROM orders'),
    tmp('revenue.png', Buffer.from('\x89PNG fake')),
    tmp('summary.md', 'The typical customer is worth $4,200.'),
  ]);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'chain');
  assert.equal(result.input.stages.length, 3);
  assert.equal(result.input.stages[0].artifact.kind, 'code');
  assert.match(result.input.stages[0].role, /SQL/);
  assert.equal(result.input.stages[1].artifact.kind, 'image');
  assert.match(result.input.stages[1].role, /Chart/);
  assert.equal(result.input.stages[2].artifact.kind, 'text');
});

test('a chain of fewer than two files is rejected', async () => {
  const result = await buildChainInput([tmp('only.py', 'print(1)')]);
  assert.ok('error' in result);
});
