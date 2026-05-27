#!/usr/bin/env node
// datapitfalls verification kit — DEV ONLY launch-readiness check.
//
// Proves every input mode actually runs end to end against a live Anthropic API
// key, and (with --url) that the deployed web layer works too. Unlike evals/,
// which grades accuracy, this just answers "does it run?" — the check to do
// before pointing the public domain at the app.
//
// Usage:
//   ANTHROPIC_API_KEY=... npm run verify
//   ANTHROPIC_API_KEY=... node verify/run.mjs [--url https://your-app.vercel.app]
//                                             [--rate-check] [--rate-max 8]
//
//   --url         also POST each input to <url>/api/audit and check the response
//   --rate-check  confirm the rate limiter returns 429 over the limit (needs --url;
//                 uses empty payloads rejected before any model call, so it's free)
//   --rate-max    the server's RATE_LIMIT_MAX, for --rate-check (default 8)
//
// The text and code modes always run. Image, multi-image, and document modes run
// only if you drop matching files into verify/fixtures/:
//   chart.png (or .jpg/.jpeg/.gif/.webp)   -> single-chart audit
//   two or more images                     -> multi-chart audit
//   report.pdf                             -> document audit

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, imageMediaTypeForExtension } from '../dist/index.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

// Approximate API prices, $ per 1M tokens: [input, output].
const PRICES = {
  'claude-opus-4-7': [5, 25],
  'claude-sonnet-4-6': [3, 15],
  'claude-haiku-4-5': [1, 5],
};
function estimateCostUsd(usage, model) {
  if (!usage) return 0;
  const [pin, pout] = PRICES[model] ?? [0, 0];
  const input =
    usage.inputTokens * pin +
    usage.cacheCreationInputTokens * pin * 1.25 +
    usage.cacheReadInputTokens * pin * 0.1;
  return (input + usage.outputTokens * pout) / 1e6;
}

function parseArgs(argv) {
  const opts = { url: null, rateCheck: false, rateMax: 8 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--url') opts.url = argv[++i] ?? null;
    else if (argv[i] === '--rate-check') opts.rateCheck = true;
    else if (argv[i] === '--rate-max') opts.rateMax = Math.max(1, Number(argv[++i]) || 8);
  }
  return opts;
}

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

let failures = 0;
function pass(label, detail = '') {
  console.log(`  ${GREEN}PASS${RESET}  ${label}${detail ? `  ${DIM}${detail}${RESET}` : ''}`);
}
function fail(label, detail = '') {
  failures += 1;
  console.log(`  ${RED}FAIL${RESET}  ${label}${detail ? `  ${detail}` : ''}`);
}
function skip(label, why) {
  console.log(`  ${DIM}SKIP  ${label} — ${why}${RESET}`);
}

/** Read any chart images and a PDF the user dropped into verify/fixtures/. */
function discoverFixtures() {
  let entries = [];
  try {
    entries = readdirSync(fixturesDir);
  } catch {
    return { images: [], pdf: null };
  }
  const images = [];
  let pdf = null;
  for (const name of entries.sort()) {
    const ext = extname(name).toLowerCase();
    const mediaType = imageMediaTypeForExtension(ext);
    if (mediaType) {
      images.push({
        content: readFileSync(join(fixturesDir, name)).toString('base64'),
        mediaType,
        filename: name,
      });
    } else if (ext === '.pdf') {
      pdf = {
        content: readFileSync(join(fixturesDir, name)).toString('base64'),
        mediaType: 'application/pdf',
        filename: name,
      };
    }
  }
  return { images, pdf };
}

/** Run one analyze() call and check it came back as a usable report. */
async function checkEngine(label, input, { expectFindings }) {
  try {
    const report = await analyze(input);
    const okKind = report.kind === input.kind;
    const okRules = report.rulesConsidered > 0;
    const okFindings = Array.isArray(report.findings);
    if (!okKind || !okRules || !okFindings) {
      fail(label, `kind=${report.kind} rules=${report.rulesConsidered} findings=${okFindings}`);
      return;
    }
    const ids = report.findings.map((f) => f.ruleId);
    const cost = estimateCostUsd(report.usage, report.model);
    const detail =
      `${report.findings.length} finding(s) [${ids.join(', ') || 'none'}] · ` +
      `${report.rulesConsidered} rules · ${report.model} · ~$${cost.toFixed(4)}`;
    if (expectFindings && report.findings.length === 0) {
      // Not a hard failure — the call worked — but flag it: this fixture has
      // planted pitfalls, so zero findings is worth a human look.
      fail(label, `ran OK but found nothing (expected pitfalls). ${detail}`);
      return;
    }
    pass(label, detail);
  } catch (err) {
    fail(label, err instanceof Error ? err.message : String(err));
  }
}

async function runEngineChecks(fx) {
  console.log('\nEngine (analyze() against the live API):');
  await checkEngine(
    'text  — written analysis',
    { kind: 'text', content: readFileSync(join(fixturesDir, 'analysis.txt'), 'utf8') },
    { expectFindings: true }
  );
  await checkEngine(
    'code  — Python transform',
    {
      kind: 'code',
      content: readFileSync(join(fixturesDir, 'transform.py'), 'utf8'),
      language: 'Python',
      filename: 'transform.py',
    },
    { expectFindings: true }
  );

  if (fx.images.length >= 1) {
    await checkEngine('image — single chart', { kind: 'image', images: [fx.images[0]] }, {});
  } else {
    skip('image — single chart', 'drop a chart.png into verify/fixtures/');
  }

  if (fx.images.length >= 2) {
    await checkEngine('image — multi-chart', { kind: 'image', images: fx.images }, {});
  } else {
    skip('image — multi-chart', 'drop a second chart image into verify/fixtures/');
  }

  if (fx.pdf) {
    await checkEngine('document — PDF report', { kind: 'document', ...fx.pdf }, {});
  } else {
    skip('document — PDF report', 'drop a report.pdf into verify/fixtures/');
  }
}

/** POST one input to <url>/api/audit and check it returns a report. */
async function checkApi(label, url, makeRequest) {
  try {
    const res = await fetch(`${url}/api/audit`, makeRequest());
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      fail(label, `HTTP ${res.status} — ${data.error ?? 'no error message'}`);
      return;
    }
    if (!Array.isArray(data.findings)) {
      fail(label, `HTTP 200 but response had no findings array`);
      return;
    }
    pass(label, `HTTP 200 · ${data.findings.length} finding(s) · ${data.model ?? '?'}`);
  } catch (err) {
    fail(label, err instanceof Error ? err.message : String(err));
  }
}

function jsonReq(body) {
  return () => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function fileReq(file, mode) {
  return () => {
    const form = new FormData();
    const bytes = Buffer.from(file.content, 'base64');
    form.append('file', new Blob([bytes], { type: file.mediaType }), file.filename);
    if (mode) form.append('mode', mode);
    return { method: 'POST', body: form };
  };
}

async function runApiChecks(url, fx) {
  console.log(`\nWeb API (POST ${url}/api/audit):`);
  await checkApi('text  — JSON body', url, jsonReq({
    kind: 'text',
    content: readFileSync(join(fixturesDir, 'analysis.txt'), 'utf8'),
  }));
  await checkApi('code  — JSON body', url, jsonReq({
    kind: 'code',
    content: readFileSync(join(fixturesDir, 'transform.py'), 'utf8'),
    language: 'Python',
  }));

  if (fx.images.length >= 1) {
    await checkApi('image — single upload', url, fileReq(fx.images[0], 'image'));
  } else {
    skip('image — single upload', 'drop a chart.png into verify/fixtures/');
  }
  if (fx.pdf) {
    await checkApi('document — PDF upload', url, fileReq(fx.pdf));
  } else {
    skip('document — PDF upload', 'drop a report.pdf into verify/fixtures/');
  }
}

/** Confirm the rate limiter returns 429 once over the limit. Uses empty
 *  payloads, which the route rejects (400) before any model call, so the
 *  limiter is exercised without spending anything. Run this on its own so the
 *  window isn't already partly consumed by the checks above. */
async function runRateCheck(url, rateMax) {
  console.log(`\nRate limiting (expecting a 429 after ${rateMax} requests):`);
  const statuses = [];
  for (let i = 0; i < rateMax + 1; i++) {
    try {
      const res = await fetch(`${url}/api/audit`, jsonReq({ kind: 'text', content: '' })());
      statuses.push(res.status);
    } catch (err) {
      fail('rate limit', err instanceof Error ? err.message : String(err));
      return;
    }
  }
  const got429 = statuses.includes(429);
  const firstNot429 = statuses[0] !== 429;
  if (got429 && firstNot429) {
    pass('rate limit', `statuses: ${statuses.join(',')}`);
  } else {
    fail('rate limit', `expected an early non-429 then a 429; got: ${statuses.join(',')}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const needKey = !opts.url || !opts.rateCheck; // engine + API checks need a key
  if (needKey && !process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Export your Anthropic API key to run the kit.');
    process.exitCode = 1;
    return;
  }

  const fx = discoverFixtures();
  console.log('datapitfalls verification kit');
  console.log(
    `${DIM}fixtures: text, code` +
      `${fx.images.length ? `, ${fx.images.length} image(s)` : ''}` +
      `${fx.pdf ? ', pdf' : ''}${RESET}`
  );

  // --rate-check on its own (with --url) skips the paid checks.
  if (opts.url && opts.rateCheck && !process.env.ANTHROPIC_API_KEY) {
    await runRateCheck(opts.url, opts.rateMax);
  } else {
    await runEngineChecks(fx);
    if (opts.url) await runApiChecks(opts.url, fx);
    if (opts.url && opts.rateCheck) await runRateCheck(opts.url, opts.rateMax);
  }

  console.log('');
  if (failures === 0) {
    console.log(`${GREEN}All checks passed.${RESET}`);
  } else {
    console.log(`${RED}${failures} check(s) failed.${RESET}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
