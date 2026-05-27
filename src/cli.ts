#!/usr/bin/env node
// datapitfalls — command-line entry point

import { DOMAINS, TAGLINE, VERSION, ruleCount, ruleCountsByDomain } from './index.js';
import { analyze } from './analyze.js';
import { formatReport, hasBlockingFindings } from './report.js';
import { buildScanInput } from './scan-input.js';

function printStats(): void {
  const counts = ruleCountsByDomain();
  console.log(`datapitfalls v${VERSION} — ${ruleCount()} rules across ${DOMAINS.length} domains\n`);
  for (const domain of DOMAINS) {
    console.log(`  ${String(counts[domain]).padStart(3)}  ${domain}`);
  }
}

function printHelp(): void {
  console.log(
    `datapitfalls v${VERSION} — ${TAGLINE}\n` +
      'Usage:\n' +
      '  datapitfalls stats               Show the pitfall catalog size by domain\n' +
      '  datapitfalls scan <file>         Audit a code file, analysis description, chart image, or PDF\n' +
      '  datapitfalls scan <a.png> <b.png> …  Audit several charts together (cross-chart pitfalls)\n' +
      '    --text                         Treat the file as a plain-English analysis description\n' +
      '    --thorough                     Use Opus 4.7 instead of the default Sonnet 4.6\n' +
      '    --fast                         Use Haiku 4.5 (cheapest)\n' +
      '    --all                          Show all findings, incl. lower-confidence latent ones\n' +
      '    --json                         Output the full report as JSON\n' +
      '    --ci                           Exit non-zero if an active error/warning is found\n' +
      '\nImage files (.png/.jpg/.jpeg/.gif/.webp) are audited with Claude Vision; pass several to\n' +
      'audit them as a set. PDFs (.pdf) are read as native documents (prose + charts/tables), Word\n' +
      'docs (.docx) are read as prose, and notebooks (.ipynb) are audited as their extracted code.\n' +
      '\nThe scan command needs an Anthropic API key in ANTHROPIC_API_KEY.\n' +
      'Default model is claude-sonnet-4-6; override with --thorough, --fast, or ANTHROPIC_MODEL.'
  );
}

const MODEL_FLAGS: Record<string, string> = {
  '--thorough': 'claude-opus-4-7',
  '--fast': 'claude-haiku-4-5',
};

async function scan(args: string[]): Promise<void> {
  const files = args.filter((arg) => !arg.startsWith('-'));
  let model: string | undefined;
  let showAll = false;
  let asJson = false;
  let ci = false;
  let forceText = false;
  for (const arg of args) {
    if (arg in MODEL_FLAGS) {
      model = MODEL_FLAGS[arg];
    } else if (arg === '--all') {
      showAll = true;
    } else if (arg === '--json') {
      asJson = true;
    } else if (arg === '--ci') {
      ci = true;
    } else if (arg === '--text') {
      forceText = true;
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      process.exitCode = 1;
      return;
    }
  }

  if (files.length === 0) {
    console.error('Usage: datapitfalls scan [--thorough|--fast] <file> [more charts…]');
    process.exitCode = 1;
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Export your Anthropic API key to run an audit.');
    process.exitCode = 1;
    return;
  }

  const result = await buildScanInput(files, forceText);
  if ('error' in result) {
    console.error(result.error);
    process.exitCode = 1;
    return;
  }

  const report = await analyze(result.input, { model });
  console.log(asJson ? JSON.stringify(report, null, 2) : formatReport(report, { showAll }));

  if (ci && hasBlockingFindings(report)) process.exitCode = 1;
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'stats':
      printStats();
      break;
    case 'scan':
      await scan(args);
      break;
    default:
      printHelp();
  }
}

main().catch((error: unknown) => {
  console.error(`datapitfalls error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
