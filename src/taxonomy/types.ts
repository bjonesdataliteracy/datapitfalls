// datapitfalls — taxonomy types

/** The eight audit domains, in canonical order. */
export const DOMAINS = [
  'Epistemic Errors',
  'Technical Trespasses',
  'Mathematical Miscues',
  'Statistical Slip-Ups',
  'Analytical Aberrations',
  'Graphical Gaffes',
  'Design Dangers',
  'Biased Baseline',
] as const;

export type Domain = (typeof DOMAINS)[number];

/** Severity levels a detected pitfall can carry, least to most severe. */
export const SEVERITIES = ['info', 'warning', 'error'] as const;

export type Severity = (typeof SEVERITIES)[number];

/**
 * A single pitfall rule. Mirrors the YAML schema in src/taxonomy/schema.json;
 * the canonical source is the per-rule YAML files, compiled into data.ts.
 */
export interface PitfallRule {
  id: string;
  name: string;
  domain: Domain;
  severity: Severity;
  description: string;
  detection_strategy: string;
  example_bad: string;
  example_good: string;
  remediation: string;
  references: string[];
}
