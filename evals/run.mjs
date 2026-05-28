#!/usr/bin/env node
// datapitfalls eval harness — DEV ONLY benchmark, not part of the shipped tool.
//
// Runs detectPitfalls() over every fixture in evals/fixtures and scores it against the
// fixture's expected findings (precision / recall / F1 / active-latent
// calibration). Use it to compare models and catch regressions when the prompt
// or catalog changes. It calls the API, so it costs money.
//
// Usage:
//   ANTHROPIC_API_KEY=... node evals/run.mjs [--model a,b,c] [--repeats N]
//
//   --model    comma-separated model ids to compare (default: analyzer default)
//   --repeats  runs per fixture, to gauge run-to-run variance (default: 1)
//
// Each fixtures/<name>.py has a fixtures/<name>.expected.json:
//   { "description", "language", "expected": [{ "ruleId", "nature"? }], "acceptable": [ruleId...] }

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectPitfalls } from '../dist/index.js';
import { scoreRun, ratio, estimateCostUsd } from './score.mjs';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function parseArgs(argv) {
  const opts = { models: [], repeats: 1 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--model') opts.models = (argv[++i] ?? '').split(',').map((s) => s.trim());
    else if (argv[i] === '--repeats') opts.repeats = Math.max(1, Number(argv[++i]) || 1);
  }
  return opts;
}

function loadFixtures() {
  return readdirSync(fixturesDir)
    .filter((f) => f.endsWith('.py'))
    .sort()
    .map((file) => {
      const name = basename(file, '.py');
      return {
        name,
        content: readFileSync(join(fixturesDir, file), 'utf8'),
        spec: JSON.parse(readFileSync(join(fixturesDir, `${name}.expected.json`), 'utf8')),
      };
    });
}

const pct = (x) => `${(x * 100).toFixed(0)}%`;
const tag = (f) => (f.nature === 'latent' ? `${f.ruleId}(latent)` : f.ruleId);

async function evaluateModel(model, fixtures, repeats) {
  const total = {
    tp: 0,
    fn: 0,
    natureMatch: 0,
    natureTotal: 0,
    activeOn: 0,
    activeOff: 0,
    latentOn: 0,
    latentOff: 0,
    cost: 0,
  };

  console.log(`Model: ${model ?? 'default (claude-sonnet-4-6)'}`);
  for (const fx of fixtures) {
    const expected = fx.spec.expected ?? [];
    const acceptable = fx.spec.acceptable ?? [];
    const acc = { tp: 0, fn: 0, activeOff: 0, latentOff: 0 };
    let lastFound = [];
    for (let r = 0; r < repeats; r++) {
      const report = await detectPitfalls(
        {
          content: fx.content,
          kind: 'code',
          language: fx.spec.language ?? 'Python',
          filename: `${fx.name}.py`,
        },
        model ? { model } : {}
      );
      const s = scoreRun(report.findings, expected, acceptable);
      for (const k of Object.keys(total)) if (k !== 'cost') total[k] += s[k] ?? 0;
      total.cost += estimateCostUsd(report.usage, report.model);
      acc.tp += s.tp;
      acc.fn += s.fn;
      acc.activeOff += s.activeOff;
      acc.latentOff += s.latentOff;
      lastFound = report.findings.map(tag);
    }
    console.log(
      `  ${fx.name.padEnd(18)} recall ${acc.tp}/${acc.tp + acc.fn}  ` +
        `active-fp ${acc.activeOff}  latent-noise ${acc.latentOff}  ` +
        `found: ${lastFound.join(', ') || '(none)'}`
    );
  }

  const recall = ratio(total.tp, total.tp + total.fn);
  const activePrecision = ratio(total.activeOn, total.activeOn + total.activeOff);
  const calibration = ratio(total.natureMatch, total.natureTotal);
  console.log(
    `  => Recall ${pct(recall)}  Active precision ${pct(activePrecision)}  ` +
      `Latent ${total.latentOn + total.latentOff} (${total.latentOff} off-list)  ` +
      `Calibration ${total.natureTotal ? pct(calibration) : 'n/a'} (${total.natureMatch}/${total.natureTotal})  ` +
      `Est. cost $${total.cost.toFixed(3)}`
  );
  console.log('');
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Export your Anthropic API key to run the eval.');
    process.exitCode = 1;
    return;
  }
  const { models, repeats } = parseArgs(process.argv.slice(2));
  const modelList = models.length ? models : [undefined];
  const fixtures = loadFixtures();

  console.log(
    `Evaluating ${fixtures.length} fixtures x ${repeats} repeat(s) on: ` +
      `${modelList.map((m) => m ?? 'default').join(', ')}\n`
  );
  for (const model of modelList) {
    await evaluateModel(model, fixtures, repeats);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
