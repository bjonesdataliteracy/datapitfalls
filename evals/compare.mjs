#!/usr/bin/env node
// datapitfalls presentation A/B harness — DEV ONLY, not part of the shipped tool.
//
// Runs the same artifacts through the presentation variants of
// detectPitfalls() — baseline (shipped) and summary (adds an overall summary
// line in the book's guide-not-judge voice, which may naturally mention one
// genuine strength, plus a per-finding consequence rating) — and writes a
// side-by-side markdown report for human review.
//
// The detection task is unchanged across variants; this compares how the same
// scan READS, which is a judgment call that precision metrics can't answer:
// Does the summary feel proportionate? Does the consequence rating triage the
// list sensibly? Does the voice read like a guide, or does warmth bleed into
// hedging? It also surfaces any drift in WHICH rules fire (the Δ vs baseline
// lines) so you can spot detection regressions worth a full evals/run.mjs
// pass. It calls the API, so it costs money.
//
// Usage:
//   ANTHROPIC_API_KEY=... node evals/compare.mjs [--variants a,b] [--model id] [files...]
//
//   --variants  comma-separated subset of: baseline,summary (default: both)
//   --model     model id (default: the engine default)
//   files       artifacts to scan — chart images (.png/.jpg/.gif/.webp), code
//               files, .txt/.md prose, PDFs. Each file is scanned on its own.
//               Without files, the evals/fixtures code fixtures are used.
//
// Output: evals/compare-report.md (gitignored) plus a console summary.
// Note: each variant changes the system instructions, so each warms its own
// prompt-cache entry — the first run per variant pays full input price.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectPitfalls, fileToInput } from '../dist/index.js';
import { estimateCostUsd } from './score.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, 'fixtures');
const outPath = join(here, 'compare-report.md');

const ALL_VARIANTS = ['baseline', 'summary'];

function parseArgs(argv) {
  const opts = { variants: ALL_VARIANTS, model: undefined, files: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--variants') {
      opts.variants = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    } else if (argv[i] === '--model') {
      opts.model = argv[++i];
    } else {
      opts.files.push(argv[i]);
    }
  }
  const bad = opts.variants.filter((v) => !ALL_VARIANTS.includes(v));
  if (bad.length > 0 || opts.variants.length < 2) {
    console.error(
      `Pick at least two of: ${ALL_VARIANTS.join(', ')}${bad.length ? ` (unknown: ${bad.join(', ')})` : ''}`
    );
    process.exit(1);
  }
  return opts;
}

// The artifacts to scan: user-supplied files, else the code fixtures.
async function loadArtifacts(files) {
  if (files.length === 0) {
    return readdirSync(fixturesDir)
      .filter((f) => f.endsWith('.py'))
      .sort()
      .map((file) => {
        const name = basename(file, '.py');
        const spec = JSON.parse(readFileSync(join(fixturesDir, `${name}.expected.json`), 'utf8'));
        return {
          name: file,
          input: {
            kind: 'code',
            content: readFileSync(join(fixturesDir, file), 'utf8'),
            language: spec.language ?? 'Python',
            filename: file,
          },
        };
      });
  }
  const artifacts = [];
  for (const path of files) {
    const routed = await fileToInput({ bytes: readFileSync(path), filename: basename(path) });
    if ('error' in routed) {
      console.warn(`Skipping ${path}: ${routed.error}`);
      continue;
    }
    artifacts.push({ name: basename(path), input: routed.input });
  }
  return artifacts;
}

// Triage order used to nominate the headline finding: active before latent (a
// definite finding never queues behind a speculative one, however consequential
// the speculation), then consequence, severity, and confidence.
const CONSEQUENCE_RANK = { 'changes-takeaway': 0, 'weakens-support': 1, polish: 2 };
const SEVERITY_RANK = { error: 0, warning: 1, info: 2 };
const CONFIDENCE_RANK = { high: 0, medium: 1, low: 2 };

function triageOrder(a, b) {
  return (
    (a.nature === 'latent' ? 1 : 0) - (b.nature === 'latent' ? 1 : 0) ||
    (CONSEQUENCE_RANK[a.consequence] ?? 3) - (CONSEQUENCE_RANK[b.consequence] ?? 3) ||
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
    CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
  );
}

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function renderFinding(f, headline) {
  const star = headline ? '★ ' : '';
  const consequence = f.consequence ? ` · ${f.consequence}` : '';
  const lines = [
    `- ${star}**${f.name}** \`${f.ruleId}\` — ${f.severity} · ${f.confidence} confidence · ${f.nature}${consequence}`,
    `  - ${f.explanation}`,
  ];
  if (f.nature === 'latent' && f.condition) lines.push(`  - Bites if: ${f.condition}`);
  if (f.evidence) lines.push(`  - Evidence: ${truncate(f.evidence, 160)}`);
  return lines.join('\n');
}

function renderVariantSection(variant, report, baselineIds) {
  const lines = [`### ${variant}`, ''];
  if (report.summary) lines.push(`**Summary:** ${report.summary}`, '');
  if (report.findings.length === 0) {
    lines.push('No pitfalls detected.', '');
  } else {
    const sorted = [...report.findings].sort(triageOrder);
    sorted.forEach((f, i) => lines.push(renderFinding(f, i === 0 && variant !== 'baseline')));
    lines.push('');
  }
  if (variant !== 'baseline' && baselineIds) {
    const ids = new Set(report.findings.map((f) => f.ruleId));
    const added = [...ids].filter((id) => !baselineIds.has(id));
    const missing = [...baselineIds].filter((id) => !ids.has(id));
    if (added.length > 0 || missing.length > 0) {
      lines.push(
        `*Δ vs baseline:* ${[
          added.length > 0 ? `added ${added.map((i) => `\`${i}\``).join(', ')}` : '',
          missing.length > 0 ? `missing ${missing.map((i) => `\`${i}\``).join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('; ')}`,
        ''
      );
    }
  }
  return lines.join('\n');
}

const opts = parseArgs(process.argv.slice(2));
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Set ANTHROPIC_API_KEY — this harness calls the live API (and costs money).');
  process.exit(1);
}

const artifacts = await loadArtifacts(opts.files);
if (artifacts.length === 0) {
  console.error('Nothing to scan.');
  process.exit(1);
}

console.log(
  `Comparing ${opts.variants.join(' vs ')} on ${artifacts.length} artifact(s)` +
    `${opts.model ? ` (model ${opts.model})` : ''}…\n`
);

const md = [
  '# Presentation variant comparison',
  '',
  `Generated ${new Date().toISOString()} · variants: ${opts.variants.join(', ')}` +
    `${opts.model ? ` · model: ${opts.model}` : ''}`,
  '',
  '★ marks the derived headline finding (active-first → consequence → severity → confidence).',
  '',
];
const totals = Object.fromEntries(
  opts.variants.map((v) => [v, { findings: 0, consequence: {}, cost: 0 }])
);

for (const artifact of artifacts) {
  console.log(`— ${artifact.name} (${artifact.input.kind})`);
  md.push(`## ${artifact.name} (${artifact.input.kind})`, '');
  let baselineIds;
  for (const variant of opts.variants) {
    const report = await detectPitfalls(
      artifact.input,
      opts.model ? { variant, model: opts.model } : { variant }
    );
    if (variant === 'baseline') baselineIds = new Set(report.findings.map((f) => f.ruleId));
    const cost = estimateCostUsd(report.usage, report.model);
    const t = totals[variant];
    t.findings += report.findings.length;
    t.cost += cost;
    for (const f of report.findings) {
      const key = f.consequence ?? 'unrated';
      t.consequence[key] = (t.consequence[key] ?? 0) + 1;
    }
    console.log(`    ${variant}: ${report.findings.length} finding(s) · ~$${cost.toFixed(3)}`);
    md.push(renderVariantSection(variant, report, baselineIds));
  }
}

md.push('## Summary', '');
md.push('| variant | findings | avg/artifact | consequence mix | est. cost |');
md.push('|---|---|---|---|---|');
for (const variant of opts.variants) {
  const t = totals[variant];
  const mix =
    Object.entries(t.consequence)
      .map(([k, n]) => `${k}: ${n}`)
      .join(', ') || '—';
  md.push(
    `| ${variant} | ${t.findings} | ${(t.findings / artifacts.length).toFixed(1)} | ${mix} | $${t.cost.toFixed(3)} |`
  );
}
md.push('');

writeFileSync(outPath, md.join('\n'));
const grandTotal = Object.values(totals).reduce((s, t) => s + t.cost, 0);
console.log(`\nWrote ${outPath} · total est. cost ~$${grandTotal.toFixed(3)}`);
