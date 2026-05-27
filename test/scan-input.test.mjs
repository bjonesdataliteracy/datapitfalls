// Tests for the CLI's file routing: which AnalyzeInput each file (or set of
// files) becomes. Uses real temp files; no network or API key needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildScanInput } from '../dist/scan-input.js';

const dir = mkdtempSync(join(tmpdir(), 'dpf-scan-'));
function tmp(name, content) {
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
}

test('a single PDF becomes a native document input', () => {
  const result = buildScanInput([tmp('report.pdf', Buffer.from('%PDF-1.4 fake'))], false);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'document');
  assert.equal(result.input.mediaType, 'application/pdf');
  assert.equal(result.input.filename, 'report.pdf');
});

test('a single image becomes a one-image audit', () => {
  const result = buildScanInput([tmp('chart.png', Buffer.from('\x89PNG fake'))], false);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'image');
  assert.equal(result.input.images.length, 1);
  assert.equal(result.input.images[0].mediaType, 'image/png');
});

test('several images become one multi-image (cross-chart) audit', () => {
  const result = buildScanInput([tmp('a.png', Buffer.from('a')), tmp('b.jpg', Buffer.from('b'))], false);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'image');
  assert.equal(result.input.images.length, 2);
  assert.equal(result.input.images[1].mediaType, 'image/jpeg');
});

test('a non-image among several files is rejected', () => {
  const result = buildScanInput([tmp('a.png', Buffer.from('a')), tmp('notes.txt', 'hello')], false);
  assert.ok('error' in result);
});

test('a code file becomes a code input with an inferred language', () => {
  const result = buildScanInput([tmp('q.sql', 'SELECT 1')], false);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'code');
  assert.equal(result.input.language, 'SQL');
});

test('--text forces a single file to be read as prose', () => {
  const result = buildScanInput([tmp('script.py', 'print(1)')], true);
  assert.ok('input' in result);
  assert.equal(result.input.kind, 'text');
});

test('--text with several files is rejected', () => {
  const result = buildScanInput([tmp('a.png', Buffer.from('a')), tmp('c.png', Buffer.from('c'))], true);
  assert.ok('error' in result);
});
