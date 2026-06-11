// Unit tests for audit-report formatting and CI gating.
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatReport, hasBlockingFindings } from '../dist/index.js';

function finding(overrides = {}) {
  return {
    ruleId: 'demo-rule',
    name: 'Demo Pitfall',
    domain: 'Technical Trespasses',
    severity: 'warning',
    confidence: 'high',
    nature: 'active',
    condition: '',
    evidence: 'line 1',
    explanation: 'because reasons',
    remediation: 'do it better',
    ...overrides,
  };
}

function report(findings, overrides = {}) {
  return { findings, kind: 'code', model: 'test-model', rulesConsidered: 42, ...overrides };
}

test('hasBlockingFindings is true only for active error/warning findings', () => {
  assert.equal(hasBlockingFindings(report([finding({ nature: 'active', severity: 'error' })])), true);
  assert.equal(
    hasBlockingFindings(report([finding({ nature: 'active', severity: 'warning' })])),
    true
  );
  assert.equal(hasBlockingFindings(report([finding({ nature: 'active', severity: 'info' })])), false);
  assert.equal(hasBlockingFindings(report([finding({ nature: 'latent', severity: 'error' })])), false);
  assert.equal(hasBlockingFindings(report([])), false);
});

test('formatReport reports a clean bill when there are no findings', () => {
  const text = formatReport(report([]));
  assert.match(text, /No pitfalls detected/);
  assert.match(text, /42 rules/);
  assert.match(text, /test-model/);
});

test('formatReport always shows active findings', () => {
  const text = formatReport(report([finding({ nature: 'active', name: 'Active One' })]));
  assert.match(text, /Active One/);
  assert.match(text, /1 active, 0 latent/);
});

test('formatReport hides low-confidence latent findings unless showAll is set', () => {
  const findings = [
    finding({ nature: 'latent', confidence: 'low', name: 'Quiet Latent' }),
    finding({ nature: 'latent', confidence: 'high', name: 'Loud Latent' }),
  ];

  const def = formatReport(report(findings));
  assert.match(def, /Loud Latent/);
  assert.doesNotMatch(def, /Quiet Latent/);
  assert.match(def, /hidden/);

  const all = formatReport(report(findings), { showAll: true });
  assert.match(all, /Quiet Latent/);
  assert.match(all, /Loud Latent/);
});

test('formatReport notes the hidden count when every finding is filtered out', () => {
  const text = formatReport(report([finding({ nature: 'latent', confidence: 'low' })]));
  assert.match(text, /No active pitfalls detected/);
  assert.match(text, /1 lower-confidence latent note/);
});

test('formatReport leads with verdict and strengths when a variant produced them', () => {
  const text = formatReport(
    report([finding()], { verdict: 'Fundamentally sound.', strengths: 'Clear axis labels.' })
  );
  assert.match(text, /^Verdict: Fundamentally sound\.\nDone well: Clear axis labels\./);

  const clean = formatReport(report([], { verdict: 'Nothing to fix.' }));
  assert.match(clean, /^Verdict: Nothing to fix\./);
  assert.match(clean, /No pitfalls detected/);
});

test('formatReport shows a consequence rating in the finding header when present', () => {
  const text = formatReport(report([finding({ consequence: 'changes-takeaway' })]));
  assert.match(text, /changes the takeaway/);
});
