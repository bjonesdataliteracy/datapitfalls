#!/usr/bin/env node
// datapitfalls — command-line entry point

import { DOMAINS, TAGLINE, VERSION, ruleCount, ruleCountsByDomain } from './index.js';
import { detectPitfalls } from './analyze.js';
import { formatReport, hasBlockingFindings } from './report.js';
import { buildScanInput } from './scan-input.js';

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

// Powered By Data palette, as 24-bit truecolor SGR parameters.
const LEMON = '38;2;226;229;35'; // Electric Lemon #E2E523
const OCEAN = '38;2;31;134;182'; // Ocean Blue     #1F86B6
const SKY = '38;2;105;223;250'; // Sky Blue       #69DFFA
const WHITE = '38;2;243;253;255'; // Floral White  #F3FDFF
const IRON = '38;2;60;55;68'; // Iron Gray      #3C3744
const RESET_CODE = '\x1b[0m';

const paint = (code: string, s: string): string => (useColor ? `\x1b[${code}m${s}${RESET_CODE}` : s);

// "DATA" stacked over "PITFALLS" — figlet "ANSI Shadow", colored two-tone for a
// retro extruded look (bright face + dark bevel). Rendered once and embedded.
const WORDMARK = [
  '██████╗  █████╗ ████████╗ █████╗ ',
  '██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗',
  '██║  ██║███████║   ██║   ███████║',
  '██║  ██║██╔══██║   ██║   ██╔══██║',
  '██████╔╝██║  ██║   ██║   ██║  ██║',
  '╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝',
  '██████╗ ██╗████████╗███████╗ █████╗ ██╗     ██╗     ███████╗',
  '██╔══██╗██║╚══██╔══╝██╔════╝██╔══██╗██║     ██║     ██╔════╝',
  '██████╔╝██║   ██║   █████╗  ███████║██║     ██║     ███████╗',
  '██╔═══╝ ██║   ██║   ██╔══╝  ██╔══██║██║     ██║     ╚════██║',
  '██║     ██║   ██║   ██║     ██║  ██║███████╗███████╗███████║',
  '╚═╝     ╚═╝   ╚═╝   ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝',
];

// Two-tone the block art: solid █ faces in Electric Lemon, the ╗╝║═ bevel edges
// in Ocean Blue, so the letters look extruded.
function colorizeWordmark(line: string): string {
  if (!useColor) return line;
  let out = '';
  let cur = '';
  for (const ch of line) {
    if (ch === ' ') {
      if (cur !== '') {
        out += RESET_CODE;
        cur = '';
      }
      out += ' ';
      continue;
    }
    const want = ch === '█' ? LEMON : OCEAN;
    if (want !== cur) {
      out += `\x1b[${want}m`;
      cur = want;
    }
    out += ch;
  }
  return cur !== '' ? out + RESET_CODE : out;
}

function introBox(): string {
  const width = 70;
  const lines = [
    'Catch data pitfalls in any data work — a chart, a code file, a',
    'report, or a description — whether a person or an AI produced it.',
    'Get back what is wrong, why it matters, and how to fix it.',
  ];
  const horiz = '─'.repeat(width - 2);
  const edge = (s: string): string => paint(IRON, s);
  const body = lines.map((l) => '  ' + edge('│') + ' ' + paint(WHITE, l.padEnd(width - 4)) + ' ' + edge('│'));
  return ['  ' + edge('╭' + horiz + '╮'), ...body, '  ' + edge('╰' + horiz + '╯')].join('\n');
}

function printSplash(): void {
  console.log();
  for (const line of WORDMARK) console.log('  ' + colorizeWordmark(line));
  console.log();
  console.log('  ' + paint(WHITE, 'Check the data work of humans and AI alike for the pitfalls that mislead.'));
  console.log();
  console.log(introBox());
  console.log();
  console.log('  ' + paint(`1;${SKY}`, 'Getting Started:'));
  console.log(
    '    ' + paint(`1;${LEMON}`, 'Human:') + '  ' + paint(SKY, 'datapitfalls scan <file>') + '  scan a chart, code, report, or description'
  );
  console.log('            ' + paint(OCEAN, 'add --all for every finding, --thorough for the deepest model'));
  console.log(
    '    ' + paint(`1;${LEMON}`, 'Agent:') + '  ' + paint(SKY, 'datapitfalls scan --json <file>') + '  machine-readable findings'
  );
  console.log('            ' + paint(OCEAN, 'add --ci to exit non-zero when a blocking pitfall is found'));
  console.log();
  console.log('  ' + paint(OCEAN, `Run datapitfalls --help for the full command list · v${VERSION}`));
  console.log('  ' + paint(IRON, 'Made by Data Literacy · github.com/bjonesdataliteracy/datapitfalls'));
  console.log();
}

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
      '  datapitfalls scan <file>         Scan a code file, analysis description, chart image, or PDF for pitfalls\n' +
      '  datapitfalls scan <a.png> <b.png> …  Scan several charts together (cross-chart pitfalls)\n' +
      '    --text                         Treat the file as a plain-English analysis description\n' +
      '    --thorough                     Use Opus 4.7 instead of the default Sonnet 4.6\n' +
      '    --fast                         Use Haiku 4.5 (cheapest)\n' +
      '    --all                          Show all findings, incl. lower-confidence latent ones\n' +
      '    --json                         Output the full report as JSON\n' +
      '    --ci                           Exit non-zero if an active error/warning is found\n' +
      '\nImage files (.png/.jpg/.jpeg/.gif/.webp) are scanned with Claude Vision; pass several to\n' +
      'scan them as a set. PDFs (.pdf) are read as native documents (prose + charts/tables), Word\n' +
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
    console.error('ANTHROPIC_API_KEY is not set. Export your Anthropic API key to run a scan.');
    process.exitCode = 1;
    return;
  }

  const result = await buildScanInput(files, forceText);
  if ('error' in result) {
    console.error(result.error);
    process.exitCode = 1;
    return;
  }

  const report = await detectPitfalls(result.input, { model });
  console.log(asJson ? JSON.stringify(report, null, 2) : formatReport(report, { showAll }));

  if (ci && hasBlockingFindings(report)) process.exitCode = 1;
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case undefined:
      printSplash();
      break;
    case 'stats':
      printStats();
      break;
    case 'scan':
      await scan(args);
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      printHelp();
  }
}

main().catch((error: unknown) => {
  console.error(`datapitfalls error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
