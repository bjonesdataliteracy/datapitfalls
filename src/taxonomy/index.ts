// datapitfalls — taxonomy library API
//
// Loads the compiled pitfall catalog and exposes simple queries over it. The
// rules are generated from the per-rule YAML files into data.ts; see
// scripts/build-taxonomy.mjs.

import { rules } from './data.js';
import { DOMAINS, SEVERITIES, type Domain, type PitfallRule, type Severity } from './types.js';

export { DOMAINS, SEVERITIES };
export type { Domain, PitfallRule, Severity };

/** Every rule in the catalog. */
export function getAllRules(): readonly PitfallRule[] {
  return rules;
}

/** Total number of rules in the catalog. */
export function ruleCount(): number {
  return rules.length;
}

/** Look up a single rule by its id, or `undefined` if there is no such rule. */
export function getRule(id: string): PitfallRule | undefined {
  return rules.find((rule) => rule.id === id);
}

/** All rules in a given domain, in catalog order. */
export function getRulesByDomain(domain: Domain): PitfallRule[] {
  return rules.filter((rule) => rule.domain === domain);
}

/** All rules with a given severity, in catalog order. */
export function getRulesBySeverity(severity: Severity): PitfallRule[] {
  return rules.filter((rule) => rule.severity === severity);
}

/** Count of rules in each domain, in canonical domain order. */
export function ruleCountsByDomain(): Record<Domain, number> {
  const counts = Object.fromEntries(DOMAINS.map((domain) => [domain, 0])) as Record<Domain, number>;
  for (const rule of rules) counts[rule.domain] += 1;
  return counts;
}
