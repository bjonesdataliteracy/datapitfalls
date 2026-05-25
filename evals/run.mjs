#!/usr/bin/env node
// datapitfalls eval harness — DEV ONLY benchmark, not part of the shipped tool.
//
// Runs analyze() over every fixture in evals/fixtures and scores it against the
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
import { analyze } from '../dist/index.js';
import { scoreRun, prf, estimateCostUsd } from './score.mjs';

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

async function evaluateModel(model, fixtures, repeats) {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let natureMatch = 0;
  let natureTotal = 0;
  let cost = 0;

  console.log(`Model: ${model ?? 'default (claude-sonnet-4-6)'}`);
  for (const fx of fixtures) {
    const expected = fx.spec.expected ?? [];
    const acceptable = fx.spec.acceptable ?? [];
    let f = { tp: 0, fp: 0, fn: 0 };
    let lastFound = [];
    for (let r = 0; r < repeats; r++) {
      const report = await analyze(
        {
          content: fx.content,
          kind: 'code',
          language: fx.spec.language ?? 'Python',
          filename: `${fx.name}.py`,
        },
        model ? { model } : {}
      );
      const s = scoreRun(report.findings, expected, acceptable);
      tp += s.tp;
      fp += s.fp;
      fn += s.fn;
      natureMatch += s.natureMatch;
      natureTotal += s.natureTotal;
      cost += estimateCostUsd(report.usage, report.model);
      f = { tp: f.tp + s.tp, fp: f.fp + s.fp, fn: f.fn + s.fn };
      lastFound = report.findings.map((x) => x.ruleId);
    }
    console.log(
      `  ${fx.name.padEnd(20)} tp ${f.tp} / fp ${f.fp} / fn ${f.fn}   found: ${lastFound.join(', ') || '(none)'}`
    );
  }

  const { precision, recall, f1 } = prf(tp, fp, fn);
  console.log(
    `  => Precision ${pct(precision)}  Recall ${pct(recall)}  F1 ${pct(f1)}  ` +
      `Calibration ${natureTotal ? pct(natureMatch / natureTotal) : 'n/a'} (${natureMatch}/${natureTotal})  ` +
      `Est. cost $${cost.toFixed(3)}`
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
