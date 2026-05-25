#!/usr/bin/env node
// datapitfalls — command-line entry point

import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { DOMAINS, TAGLINE, VERSION, ruleCount, ruleCountsByDomain } from './index.js';
import { analyze, imageMediaTypeForExtension } from './analyze.js';
import type { AuditReport } from './analyze.js';
import { formatReport, hasBlockingFindings } from './report.js';

const EXT_LANGUAGE: Record<string, string> = {
  '.py': 'Python',
  '.sql': 'SQL',
  '.r': 'R',
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.ipynb': 'Jupyter notebook',
};

// Extensions treated as a plain-English analysis description rather than code.
const TEXT_EXTS = new Set(['.md', '.markdown', '.txt', '.text', '.rst']);

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
      '  datapitfalls scan <file>         Audit a code file, analysis description, or chart image\n' +
      '    --text                         Treat the file as a plain-English analysis description\n' +
      '    --thorough                     Use Opus 4.7 instead of the default Sonnet 4.6\n' +
      '    --fast                         Use Haiku 4.5 (cheapest)\n' +
      '    --all                          Show all findings, incl. lower-confidence latent ones\n' +
      '    --json                         Output the full report as JSON\n' +
      '    --ci                           Exit non-zero if an active error/warning is found\n' +
      '\nImage files (.png/.jpg/.jpeg/.gif/.webp) are audited with Claude Vision against the\n' +
      'visual pitfall domains (Graphical Gaffes & Design Dangers).\n' +
      '\nThe scan command needs an Anthropic API key in ANTHROPIC_API_KEY.\n' +
      'Default model is claude-sonnet-4-6; override with --thorough, --fast, or ANTHROPIC_MODEL.'
  );
}

const MODEL_FLAGS: Record<string, string> = {
  '--thorough': 'claude-opus-4-7',
  '--fast': 'claude-haiku-4-5',
};

async function scan(args: string[]): Promise<void> {
  const file = args.find((arg) => !arg.startsWith('-'));
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

  if (!file) {
    console.error('Usage: datapitfalls scan [--thorough|--fast] <file>');
    process.exitCode = 1;
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Export your Anthropic API key to run an audit.');
    process.exitCode = 1;
    return;
  }

  const ext = extname(file).toLowerCase();
  // An image extension (unless --text forces a text reading) routes to Vision.
  const mediaType = forceText ? undefined : imageMediaTypeForExtension(ext);

  let report: AuditReport;
  if (mediaType) {
    let data: string;
    try {
      data = readFileSync(file).toString('base64');
    } catch {
      console.error(`Could not read file: ${file}`);
      process.exitCode = 1;
      return;
    }
    report = await analyze(
      { content: data, kind: 'image', mediaType, filename: basename(file) },
      { model }
    );
  } else {
    let content: string;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      console.error(`Could not read file: ${file}`);
      process.exitCode = 1;
      return;
    }
    const kind = forceText || TEXT_EXTS.has(ext) ? 'text' : 'code';
    const language = kind === 'code' ? EXT_LANGUAGE[ext] : undefined;
    report = await analyze({ content, kind, language, filename: basename(file) }, { model });
  }

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
