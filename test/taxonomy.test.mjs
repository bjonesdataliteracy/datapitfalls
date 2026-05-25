// Unit tests for the taxonomy query API.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOMAINS,
  SEVERITIES,
  getAllRules,
  getRule,
  getRulesByDomain,
  getRulesBySeverity,
  ruleCount,
  ruleCountsByDomain,
} from '../dist/index.js';

test('catalog is non-empty and ruleCount matches getAllRules', () => {
  assert.ok(ruleCount() > 0);
  assert.equal(ruleCount(), getAllRules().length);
});

test('every rule is well-formed with a valid domain and severity', () => {
  for (const rule of getAllRules()) {
    assert.equal(typeof rule.id, 'string');
    assert.ok(rule.id.length > 0, `empty id`);
    assert.ok(DOMAINS.includes(rule.domain), `bad domain on ${rule.id}: ${rule.domain}`);
    assert.ok(SEVERITIES.includes(rule.severity), `bad severity on ${rule.id}: ${rule.severity}`);
    assert.ok(rule.name && rule.description && rule.remediation, `missing text on ${rule.id}`);
  }
});

test('rule ids are unique', () => {
  const ids = getAllRules().map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('getRule resolves a real id and returns undefined otherwise', () => {
  const first = getAllRules()[0];
  assert.deepEqual(getRule(first.id), first);
  assert.equal(getRule('__no_such_rule__'), undefined);
});

test('getRulesByDomain partitions the catalog', () => {
  let total = 0;
  for (const domain of DOMAINS) {
    const rules = getRulesByDomain(domain);
    for (const rule of rules) assert.equal(rule.domain, domain);
    total += rules.length;
  }
  assert.equal(total, ruleCount());
});

test('ruleCountsByDomain covers all domains and sums to the total', () => {
  const counts = ruleCountsByDomain();
  assert.deepEqual(Object.keys(counts).sort(), [...DOMAINS].sort());
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);
  assert.equal(sum, ruleCount());
  for (const domain of DOMAINS) {
    assert.equal(counts[domain], getRulesByDomain(domain).length);
  }
});

test('getRulesBySeverity returns only rules of that severity', () => {
  for (const severity of SEVERITIES) {
    for (const rule of getRulesBySeverity(severity)) {
      assert.equal(rule.severity, severity);
    }
  }
});
