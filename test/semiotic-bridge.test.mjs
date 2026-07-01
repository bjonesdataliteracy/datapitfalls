// Tests for the datapitfalls → Semiotic annotation bridge. Pure data
// transformation — runs fully offline with no API key and no network.
//
// (The sprint doc sketched this suite as `src/bridges/semiotic.test.ts`, but the
// repo's gate runs `node --test test/*.test.mjs` against the compiled `dist/`,
// and a `.test.ts` under `src/` would be compiled into the published tarball. So
// it lives here, next to the other suites, and asserts the emitted shape the
// same way — importing the bridge from the package's built entry point.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  toSemioticAnnotations,
  buildSemioticAnnotationBridge,
  DEFAULT_SEMIOTIC_PALETTE,
} from '../dist/index.js';

// A minimal finding; override per-test. Mirrors the shape detectPitfalls emits.
function finding(overrides = {}) {
  return {
    ruleId: 'data-reality-gap',
    name: 'Data-reality gap',
    domain: 'Epistemic Errors',
    severity: 'warning',
    confidence: 'high',
    nature: 'active',
    condition: '',
    evidence: 'the chart shows the data as reality',
    explanation: 'readers will mistake the chart for the territory',
    remediation: 'Caveat what the data does and does not measure.',
    ...overrides,
  };
}

function report(findings, overrides = {}) {
  return {
    findings,
    kind: 'image',
    model: 'test-model',
    rulesConsidered: 42,
    ...overrides,
  };
}

test('empty report → no annotations', () => {
  assert.deepEqual(toSemioticAnnotations(report([])), []);
  const bridge = buildSemioticAnnotationBridge(report([]));
  assert.deepEqual(bridge.annotations, []);
  assert.equal(bridge.meta.count, 0);
  assert.equal(bridge.meta.kind, 'image');
});

test('each finding maps 1:1, in order, to a note spec', () => {
  const findings = [
    finding({ ruleId: 'a', name: 'First', remediation: 'Fix first', evidence: 'ev1' }),
    finding({ ruleId: 'b', name: 'Second', remediation: 'Fix second', evidence: 'ev2' }),
  ];
  const annotations = toSemioticAnnotations(report(findings));

  assert.equal(annotations.length, 2);
  assert.deepEqual(
    annotations.map((a) => a.dataPitfall.ruleId),
    ['a', 'b']
  );

  const [first] = annotations;
  assert.equal(first.type, 'note');
  assert.equal(first.note.title, 'First'); // name → title
  assert.equal(first.note.label, 'Fix first'); // remediation → label
  assert.equal(first.note.wrap, 240); // default wrap
  assert.deepEqual(first.dataPitfall, {
    ruleId: 'a',
    domain: 'Epistemic Errors',
    severity: 'warning',
    evidence: 'ev1',
  });
  // Honest seam: unanchored, no connector, no x/y.
  assert.deepEqual(first.disable, ['connector']);
  assert.equal('x' in first, false);
  assert.equal('y' in first, false);
});

test('severity drives color and className', () => {
  const findings = [
    finding({ severity: 'info' }),
    finding({ severity: 'warning' }),
    finding({ severity: 'error' }),
  ];
  const annotations = toSemioticAnnotations(report(findings));

  assert.deepEqual(
    annotations.map((a) => a.color),
    [DEFAULT_SEMIOTIC_PALETTE.info, DEFAULT_SEMIOTIC_PALETTE.warning, DEFAULT_SEMIOTIC_PALETTE.error]
  );
  assert.deepEqual(
    annotations.map((a) => a.className),
    ['pitfall-info', 'pitfall-warning', 'pitfall-error']
  );
});

test('a custom palette overrides the default colors', () => {
  const palette = { info: '#111111', warning: '#222222', error: '#333333' };
  const annotations = toSemioticAnnotations(report([finding({ severity: 'error' })]), { palette });
  assert.equal(annotations[0].color, '#333333');
});

test('a partial palette merges over the defaults', () => {
  const annotations = toSemioticAnnotations(report([finding({ severity: 'warning' })]), {
    palette: { warning: '#abcabc' },
  });
  assert.equal(annotations[0].color, '#abcabc');
  // Unspecified stops still resolve to the default.
  const errAnn = toSemioticAnnotations(report([finding({ severity: 'error' })]), {
    palette: { warning: '#abcabc' },
  });
  assert.equal(errAnn[0].color, DEFAULT_SEMIOTIC_PALETTE.error);
});

test('wrap is passed through to each note', () => {
  const annotations = toSemioticAnnotations(report([finding()]), { wrap: 320 });
  assert.equal(annotations[0].note.wrap, 320);
});

test('max truncates, and the cap is observable via meta.count (no silent caps)', () => {
  const findings = [finding({ ruleId: 'a' }), finding({ ruleId: 'b' }), finding({ ruleId: 'c' })];
  const bridge = buildSemioticAnnotationBridge(report(findings), { max: 2 });

  assert.equal(bridge.annotations.length, 2); // truncated
  assert.equal(bridge.meta.count, 3); // full count preserved
  assert.ok(bridge.meta.count > bridge.annotations.length); // truncation is visible
  assert.deepEqual(
    bridge.annotations.map((a) => a.dataPitfall.ruleId),
    ['a', 'b'] // keeps the first N, in order
  );
});

test('max: 0 emits nothing but still reports the true count', () => {
  const bridge = buildSemioticAnnotationBridge(report([finding(), finding()]), { max: 0 });
  assert.deepEqual(bridge.annotations, []);
  assert.equal(bridge.meta.count, 2);
});

test('meta.kind reflects the scanned artifact kind', () => {
  const bridge = buildSemioticAnnotationBridge(report([], { kind: 'chain' }));
  assert.equal(bridge.meta.kind, 'chain');
});

test('the bridge never imports Semiotic and the built module has zero runtime imports', () => {
  // The dependency-free guarantee: the compiled module must not pull in any
  // package at runtime (all its imports are type-only and are erased by tsc).
  const built = readFileSync(
    fileURLToPath(new URL('../dist/bridges/semiotic.js', import.meta.url)),
    'utf8'
  );
  // Strip line comments so the doc block's prose mentions don't trip the check.
  // Nothing is imported at runtime — not Semiotic, not any package — so an
  // absence of any import statement is the strongest form of the guarantee.
  const code = built.replace(/\/\/.*$/gm, '');
  assert.equal(/\bfrom\s+['"]/.test(code), false, 'no runtime `from` imports');
  assert.equal(/\brequire\s*\(/.test(code), false, 'no require() calls');
  assert.equal(/\bimport\s+/.test(code), false, 'no import statements at all');
});

test('output is JSON round-trippable (dependency-free / serializable)', () => {
  const findings = [finding({ severity: 'info' }), finding({ severity: 'error' })];
  const annotations = toSemioticAnnotations(report(findings));
  const roundTripped = JSON.parse(JSON.stringify(annotations));
  assert.deepEqual(roundTripped, annotations);

  const bridge = buildSemioticAnnotationBridge(report(findings), { max: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(bridge)), bridge);
});
