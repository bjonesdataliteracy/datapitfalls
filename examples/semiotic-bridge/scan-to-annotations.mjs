// examples/semiotic-bridge/scan-to-annotations.mjs
//
// Part 1 + Part 2 of the round trip: a chart image → datapitfalls scan →
// findings → Semiotic annotation specs. Writes annotations.json next to this
// file, ready for demo.html (Part 3) to render.
//
// Requires an Anthropic API key (the scan calls the Claude API):
//
//   ANTHROPIC_API_KEY=sk-... node examples/semiotic-bridge/scan-to-annotations.mjs path/to/chart.png
//
// From inside this repo, `import 'datapitfalls'` resolves to the local build
// (run `npm run build` first). In your own project, `npm install datapitfalls`
// and the same import works unchanged.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import {
  detectPitfalls,
  fileToInput,
  buildSemioticAnnotationBridge,
} from 'datapitfalls';

const here = dirname(fileURLToPath(import.meta.url));
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('Usage: node scan-to-annotations.mjs <chart-image>');
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Set ANTHROPIC_API_KEY to run the scan (Part 1 calls the Claude API).');
  process.exit(1);
}

// Part 1 — route the image file and scan it.
const bytes = new Uint8Array(await readFile(imagePath));
const routed = await fileToInput({ bytes, filename: `chart${extname(imagePath)}` });
if ('error' in routed) throw new Error(routed.error);

const report = await detectPitfalls(routed.input);
console.log(`Found ${report.findings.length} finding(s) across ${report.rulesConsidered} rules.`);

// Part 2 — bridge the report into Semiotic annotation specs.
const bridge = buildSemioticAnnotationBridge(report);
const out = join(here, 'annotations.json');
await writeFile(out, JSON.stringify(bridge, null, 2));
console.log(`Wrote ${bridge.annotations.length} annotation(s) → ${out}`);
console.log('Open demo.html (Part 3) to see them rendered on a chart.');
