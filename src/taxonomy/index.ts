// datapitfalls — taxonomy library API
//
// Loads the compiled pitfall catalog and exposes simple queries over it. The
// rules are generated from the per-rule YAML files into data.ts; see
// scripts/build-taxonomy.mjs.

import { rules, TAXONOMY_VERSION } from './data.js';
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

/**
 * Content fingerprint of the compiled catalog. It changes whenever any rule
 * changes, so reports, memories and benchmark runs can record exactly which
 * taxonomy they were grounded on.
 */
export const taxonomyVersion: string = TAXONOMY_VERSION;

// Former ids of renamed rules, mapped to their current id.
const aliasToId = new Map<string, string>();
for (const rule of rules) {
  for (const alias of rule.aliases ?? []) aliasToId.set(alias, rule.id);
}

/**
 * Resolve a rule id or a former id (alias) to the rule's current id, or
 * `undefined` if it names no rule. Use this before storing an id long-term.
 */
export function resolveRuleId(id: string): string | undefined {
  if (rules.some((rule) => rule.id === id)) return id;
  return aliasToId.get(id);
}

/**
 * Look up a single rule by its id, or `undefined` if there is no such rule.
 * A former id of a renamed rule (an alias) resolves to the rule too.
 */
export function getRule(id: string): PitfallRule | undefined {
  const current = resolveRuleId(id);
  return current === undefined ? undefined : rules.find((rule) => rule.id === current);
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

/** The input kinds the rule selection distinguishes. Slides and multi-stage
 *  chains are reviewed against the whole catalog, like code and text. */
export type RuleInputKind = 'code' | 'text' | 'image' | 'document';

/** Chart images default to the two visual domains plus the cross-cutting
 *  epistemic rule charts most often trip (treating the chart as reality). */
export const IMAGE_DEFAULT_DOMAINS: readonly Domain[] = ['Graphical Gaffes', 'Design Dangers'];
export const IMAGE_EXTRA_RULE_ID = 'data-reality-gap';

/**
 * The rules that apply to a kind of input. This is the one place that decides
 * it: the detection engine and the MCP server both call it, so they can't drift
 * apart. `domains`, when given, overrides the default and returns those
 * domains' rules in the order given.
 */
export function rulesForInput(kind: RuleInputKind, domains?: readonly Domain[]): PitfallRule[] {
  if (domains) return domains.flatMap((domain) => getRulesByDomain(domain));
  if (kind === 'image') {
    const visual = IMAGE_DEFAULT_DOMAINS.flatMap((domain) => getRulesByDomain(domain));
    const extra = getRule(IMAGE_EXTRA_RULE_ID);
    return extra ? [...visual, extra] : visual;
  }
  return [...rules];
}
