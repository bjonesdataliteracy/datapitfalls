// Compiles the per-rule YAML files into a generated, typed TypeScript module
// (src/taxonomy/data.ts) that the library imports at runtime — no YAML parsing
// or filesystem access needed once built. Run via `npm run build:taxonomy`.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
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
  // Optional: former ids of a renamed rule. Emitted only when present, so
  // existing rules compile exactly as before.
  if (Array.isArray(raw.aliases) && raw.aliases.length > 0) rule.aliases = raw.aliases;
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
// The taxonomy is licensed under CC BY-NC 4.0; see LICENSE-TAXONOMY.md.

import type { PitfallRule } from "./types.js";
`;

// A content fingerprint of the compiled catalog: it changes whenever any rule's
// text, id, alias, domain or severity changes, so a report or benchmark run can
// record exactly which taxonomy it was grounded on.
const rulesJson = JSON.stringify(rules, null, 2);
const taxonomyVersion = createHash('sha256').update(JSON.stringify(rules)).digest('hex').slice(0, 12);

const body =
  `\n/** Content fingerprint of this catalog (first 12 hex chars of a SHA-256). */\n` +
  `export const TAXONOMY_VERSION = ${JSON.stringify(taxonomyVersion)};\n` +
  `\nexport const rules: PitfallRule[] = ${rulesJson};\n`;

writeFileSync(outFile, header + body);
console.log(`Wrote ${relative(root, outFile)} (${rules.length} rules, taxonomy ${taxonomyVersion})`);

// The package version as a constant, for code that must not read package.json at
// runtime: bundlers (Next.js on Vercel) inline the MCP server, and a relative
// require of package.json from the bundle fails there.
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const versionFile = join(root, 'src', 'version.ts');
writeFileSync(
  versionFile,
  `// GENERATED FILE — do not edit by hand. Regenerate with: npm run build:taxonomy\n\nexport const PACKAGE_VERSION = '${version}';\n`
);
console.log(`Wrote ${relative(root, versionFile)} (${version})`);
