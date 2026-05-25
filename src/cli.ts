#!/usr/bin/env node
// datapitfalls — command-line entry point

import { DOMAINS, TAGLINE, VERSION, ruleCount, ruleCountsByDomain } from './index.js';

const command = process.argv[2];

if (command === 'stats') {
  // Smoke test that the compiled taxonomy loads and is queryable.
  const counts = ruleCountsByDomain();
  console.log(`datapitfalls v${VERSION} — ${ruleCount()} rules across ${DOMAINS.length} domains\n`);
  for (const domain of DOMAINS) {
    console.log(`  ${String(counts[domain]).padStart(3)}  ${domain}`);
  }
} else {
  console.log(
    `datapitfalls v${VERSION} — ${TAGLINE}\n` +
      'Usage:\n' +
      '  datapitfalls stats     Show the pitfall catalog size by domain\n' +
      '\n(More commands arrive with the Phase 2 analyzer — see ROADMAP.md.)'
  );
}
