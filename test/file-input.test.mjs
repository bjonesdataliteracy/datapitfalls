// Tests for the shared file router. Operates on in-memory bytes, so it runs
// fully offline with no API key, no temp files, and no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileToInput, filesToInput } from '../dist/index.js';

const enc = (s) => new TextEncoder().encode(s);

test('a plain-text file becomes a prose input', async () => {
  const r = await fileToInput({ bytes: enc('Revenue tripled this year.'), filename: 'notes.txt' });
  assert.ok('input' in r);
  assert.equal(r.input.kind, 'text');
});

test('a code file becomes code with an inferred language', async () => {
  const r = await fileToInput({ bytes: enc('SELECT 1'), filename: 'q.sql' });
  assert.ok('input' in r);
  assert.equal(r.input.kind, 'code');
  assert.equal(r.input.language, 'SQL');
});

test('maxTextChars yields a too_large error', async () => {
  const r = await fileToInput({ bytes: enc('x'.repeat(50)), filename: 'a.txt' }, { maxTextChars: 10 });
  assert.ok('error' in r);
  assert.equal(r.reason, 'too_large');
});

test('an oversized image yields a too_large error', async () => {
  const r = await fileToInput({ bytes: new Uint8Array(64), filename: 'chart.png' }, { maxImageBytes: 8 });
  assert.ok('error' in r);
  assert.equal(r.reason, 'too_large');
});

test('an unknown extension is unsupported without a fallback', async () => {
  const r = await fileToInput({ bytes: enc('data'), filename: 'mystery.xyz' });
  assert.ok('error' in r);
  assert.equal(r.reason, 'unsupported');
});

test('an unknown extension uses fallbackKind when given', async () => {
  const r = await fileToInput({ bytes: enc('print(1)'), filename: 'mystery.xyz' }, { fallbackKind: 'code' });
  assert.ok('input' in r);
  assert.equal(r.input.kind, 'code');
});

test('forceText reads any single file as prose', async () => {
  const r = await fileToInput({ bytes: enc('print(1)'), filename: 'x.py' }, { forceText: true });
  assert.ok('input' in r);
  assert.equal(r.input.kind, 'text');
});

test('several images become one multi-image input', async () => {
  const r = await filesToInput([
    { bytes: enc('a'), filename: 'a.png' },
    { bytes: enc('b'), filename: 'b.jpg' },
  ]);
  assert.ok('input' in r);
  assert.equal(r.input.kind, 'image');
  assert.equal(r.input.images.length, 2);
  assert.equal(r.input.images[1].mediaType, 'image/jpeg');
});

test('too many images is rejected via maxImages', async () => {
  const r = await filesToInput(
    [
      { bytes: enc('a'), filename: 'a.png' },
      { bytes: enc('b'), filename: 'b.png' },
    ],
    { maxImages: 1 }
  );
  assert.ok('error' in r);
  assert.equal(r.reason, 'too_large');
});

test('a non-image among several files is rejected', async () => {
  const r = await filesToInput([
    { bytes: enc('a'), filename: 'a.png' },
    { bytes: enc('hi'), filename: 'notes.txt' },
  ]);
  assert.ok('error' in r);
});
