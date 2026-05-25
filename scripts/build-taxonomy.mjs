// Compiles the per-rule YAML files into a generated, typed TypeScript module
// (src/taxonomy/data.ts) that the library imports at runtime — no YAML parsing
// or filesystem access needed once built. Run via `npm run build:taxonomy`.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const taxonomyDir = join(root, 'src', 'taxonomy');
const outFile = join(taxonomyDir, 'data.ts');

// Canonical domain order (keep in sync with src/taxonomy/types.ts).
const DOMAIN_ORDER = [
  'Epistemic Errors',
  'Technical Trespasses',
  'Mathematical Miscues',
  'Statistical Slip-Ups',
  'Analytical Aberrations',
  'Graphical Gaffes',
  'Design Dangers',
  'Biased Baseline',
];

const FIELDS = [
  'id',
  'name',
  'domain',
  'severity',
  'description',
  'detection_strategy',
  'example_bad',
  'example_good',
  'remediation',
  'references',
];

const files = readdirSync(taxonomyDir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
  .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
  .sort();

const rules = [];
for (const file of files) {
  const raw = yaml.load(readFileSync(file, 'utf8'));
  if (raw === null || typeof raw !== 'object') {
    throw new Error(`Not a rule object: ${relative(root, file)}`);
  }
  // Pick only the known fields, in a stable order, so the output is clean.
  const rule = {};
  for (const field of FIELDS) rule[field] = raw[field];
  rules.push(rule);
}

// Sort by canonical domain order, then by id, for stable, readable output.
rules.sort((a, b) => {
  const d = DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain);
  return d !== 0 ? d : a.id.localeCompare(b.id);
});

const header = `// GENERATED FILE — do not edit by hand.
// Source of truth: the per-rule YAML files in src/taxonomy/.
// Regenerate with: npm run build:taxonomy

import type { PitfallRule } from "./types.js";
`;

const body = `\nexport const rules: PitfallRule[] = ${JSON.stringify(rules, null, 2)};\n`;

writeFileSync(outFile, header + body);
console.log(`Wrote ${relative(root, outFile)} (${rules.length} rules)`);
