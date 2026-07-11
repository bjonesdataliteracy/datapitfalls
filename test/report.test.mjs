// Unit tests for audit-report formatting and CI gating.
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatReport, hasBlockingFindings, reportTier, TIERS, TIER_LABEL } from '../dist/index.js';

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

test('reportTier is clear when nothing is detected', () => {
  assert.equal(reportTier(report([])), 'clear');
  // Low/medium-confidence latent findings are display noise and never move the tier.
  assert.equal(reportTier(report([finding({ nature: 'latent', confidence: 'low' })])), 'clear');
  assert.equal(reportTier(report([finding({ nature: 'latent', confidence: 'medium' })])), 'clear');
});

test('reportTier floors latent-only reports at verify, whatever their severity', () => {
  assert.equal(
    reportTier(report([finding({ nature: 'latent', confidence: 'high', severity: 'error' })])),
    'verify'
  );
  assert.equal(
    reportTier(
      report([
        finding({
          nature: 'latent',
          confidence: 'high',
          severity: 'warning',
          consequence: 'changes-takeaway',
        }),
      ])
    ),
    'verify'
  );
});

test('reportTier ranks active findings by severity', () => {
  assert.equal(reportTier(report([finding({ severity: 'info' })])), 'verify');
  assert.equal(reportTier(report([finding({ severity: 'warning' })])), 'attention');
  assert.equal(reportTier(report([finding({ severity: 'error' })])), 'serious');
  // The worst finding wins.
  assert.equal(
    reportTier(
      report([
        finding({ severity: 'info' }),
        finding({ severity: 'error' }),
        finding({ nature: 'latent', confidence: 'high' }),
      ])
    ),
    'serious'
  );
});

test('reportTier promotes an active warning rated changes-takeaway to serious', () => {
  assert.equal(
    reportTier(report([finding({ severity: 'warning', consequence: 'changes-takeaway' })])),
    'serious'
  );
  // The promotion applies to warnings only — an info finding stays at verify.
  assert.equal(
    reportTier(report([finding({ severity: 'info', consequence: 'changes-takeaway' })])),
    'verify'
  );
  // Other consequence ratings do not promote.
  assert.equal(
    reportTier(report([finding({ severity: 'warning', consequence: 'weakens-support' })])),
    'attention'
  );
});

test('reportTier agrees with hasBlockingFindings at the attention boundary', () => {
  const cases = [
    report([]),
    report([finding({ severity: 'info' })]),
    report([finding({ severity: 'warning' })]),
    report([finding({ severity: 'error' })]),
    report([finding({ nature: 'latent', confidence: 'high', severity: 'error' })]),
    report([finding({ severity: 'warning', consequence: 'changes-takeaway' })]),
    report([finding({ severity: 'info', consequence: 'changes-takeaway' })]),
  ];
  for (const r of cases) {
    const blocked = TIERS.indexOf(reportTier(r)) >= TIERS.indexOf('attention');
    assert.equal(blocked, hasBlockingFindings(r));
  }
});

test('every tier has a human label', () => {
  for (const tier of TIERS) {
    assert.equal(typeof TIER_LABEL[tier], 'string');
    assert.ok(TIER_LABEL[tier].length > 0);
  }
});

test('formatReport reports a clean bill when there are no findings', () => {
  const text = formatReport(report([]));
  assert.match(text, /No pitfalls detected/);
  assert.match(text, /42 rules/);
  assert.match(text, /test-model/);
});

test('formatReport always shows detected (active) findings', () => {
  const text = formatReport(report([finding({ nature: 'active', name: 'Active One' })]));
  assert.match(text, /Active One/);
  assert.match(text, /1 detected, 0 potential/);
  assert.match(text, /Detected Pitfalls — evident from the code/);
  assert.match(text, /How to avoid it:/);
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
  assert.match(text, /No pitfalls detected/);
  assert.match(text, /1 lower-confidence potential pitfall/);
});

test('formatReport leads with the summary when a variant produced one', () => {
  const text = formatReport(report([finding()], { summary: 'Fundamentally sound.' }));
  assert.match(text, /^Summary: Fundamentally sound\./);

  const clean = formatReport(report([], { summary: 'Nothing to fix.' }));
  assert.match(clean, /^Summary: Nothing to fix\./);
  assert.match(clean, /No pitfalls detected/);
});

test('formatReport closes with avoided pitfalls, in both report shapes', () => {
  const avoided = [
    {
      ruleId: 'silent-null-drop',
      name: 'Silently Dropping Null Records',
      domain: 'Technical Trespasses',
      evidence: 'assert df["amount"].notna().all()',
      explanation: 'A null guard protects the aggregate.',
    },
  ];

  const withFindings = formatReport(report([finding()], { avoided }));
  assert.match(withFindings, /Pitfalls avoided/);
  assert.match(withFindings, /✓ Silently Dropping Null Records \(silent-null-drop\)/);
  assert.match(withFindings, /Seen in: assert/);
  // The avoided block closes the report, after the findings.
  assert.ok(withFindings.indexOf('Demo Pitfall') < withFindings.indexOf('Pitfalls avoided'));

  const clean = formatReport(report([], { avoided }));
  assert.match(clean, /No pitfalls detected/);
  assert.match(clean, /Pitfalls avoided/);
});

test('formatReport shows a consequence rating in the finding header when present', () => {
  const text = formatReport(report([finding({ consequence: 'changes-takeaway' })]));
  assert.match(text, /changes the takeaway/);
});

test('formatReport sorts by consequence before severity within a section', () => {
  const text = formatReport(
    report([
      finding({ severity: 'error', consequence: 'polish', name: 'Severe Polish' }),
      finding({ severity: 'info', consequence: 'changes-takeaway', name: 'Mild Takeaway' }),
    ])
  );
  assert.ok(text.indexOf('Mild Takeaway') < text.indexOf('Severe Polish'));
});
