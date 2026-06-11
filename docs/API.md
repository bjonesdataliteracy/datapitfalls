# API Reference

datapitfalls ships as an npm package you can build on. This document is the
**supported public API**: the functions, types, and constants that the package
commits to keeping stable. The CLI (`datapitfalls scan`) and the web app are
both thin layers over this same surface.

```bash
npm install datapitfalls
```

> Requires Node.js **18 or later**. The package is ESM-only (`"type": "module"`)
> and ships its own TypeScript types.

```ts
import { detectPitfalls, formatReport, hasBlockingFindings } from 'datapitfalls';
```

- [API stability](#api-stability)
- [`detectPitfalls`](#detectpitfalls) — the core detector
- [Inputs](#inputs) — what you can scan
- [Reports](#reports) — what you get back
- [Formatting a report](#formatting-a-report)
- [Routing files to inputs](#routing-files-to-inputs)
- [Querying the taxonomy](#querying-the-taxonomy)
- [Extracting slide decks](#extracting-slide-decks)
- [Constants](#constants)

---

## API stability

The **supported surface is exactly what this document describes**. The package
also re-exports some lower-level helpers; those are implementation details and
may change without notice — if it isn't documented here, don't rely on it.

datapitfalls follows [Semantic Versioning](https://semver.org/). The project is
pre-1.0, so per semver a **minor** bump (`0.x.0`) may contain a breaking change
to the documented API — but every such change is called out in
[`CHANGELOG.md`](../CHANGELOG.md). Patch releases never break the documented API.

Everything in the engine requires an Anthropic API key (it calls the Claude
API). Provide it via `options.apiKey`, a pre-built `options.client`, or the
`ANTHROPIC_API_KEY` environment variable.

---

## `detectPitfalls`

```ts
function detectPitfalls(
  input: DetectionInput,
  options?: DetectionOptions
): Promise<PitfallReport>;
```

Scans one artifact — or a whole analysis chain — against the pitfall catalog and
returns a structured report. It grounds Claude on the relevant taxonomy rules,
collects findings via a forced tool call, and validates every rule id in the
result against the catalog, so a finding can only ever reference a real rule.

```ts
import { detectPitfalls } from 'datapitfalls';

const report = await detectPitfalls(
  { kind: 'code', content: 'SELECT AVG(rate) FROM metrics;', language: 'SQL' },
  { apiKey: process.env.ANTHROPIC_API_KEY }
);

for (const f of report.findings) {
  console.log(`[${f.severity}] ${f.name} — ${f.explanation}`);
}
```

### `DetectionOptions`

```ts
interface DetectionOptions {
  /** Model id. Defaults to ANTHROPIC_MODEL, then claude-sonnet-4-6. */
  model?: string;
  /** API key. Defaults to the ANTHROPIC_API_KEY environment variable. */
  apiKey?: string;
  /** Pre-constructed Anthropic client (overrides apiKey). */
  client?: Anthropic;
  /** Restrict grounding to these domains. Defaults to the whole catalog. */
  domains?: Domain[];
  /** Max output tokens. Defaults to 16000. */
  maxTokens?: number;
  /** EXPERIMENTAL — presentation variant to A/B test ('baseline' | 'summary').
   *  Defaults to 'baseline'. Not covered by the API-stability policy; may
   *  change or be removed once the experiment concludes. See evals/compare.mjs. */
  variant?: PresentationVariant;
}
```

---

## Inputs

`detectPitfalls` accepts a `DetectionInput`: either a single artifact or a
multi-stage chain.

```ts
type DetectionInput = SingleArtifactInput | ChainDetectionInput;

type SingleArtifactInput =
  | TextDetectionInput // code or plain-English description
  | ImageDetectionInput // one or several chart images
  | DocumentDetectionInput // a PDF, read natively
  | SlidesDetectionInput; // a slide deck, per-slide text + charts
```

### Code or prose — `TextDetectionInput`

```ts
interface TextDetectionInput {
  kind: 'code' | 'text';
  content: string;
  language?: string; // e.g. "Python", "SQL" — code only
  filename?: string;
}
```

### Charts — `ImageDetectionInput`

Pass **several images together** to catch cross-chart pitfalls (inconsistent
scales, inconsistent encodings, contradictory messages).

```ts
interface ImageDetectionInput {
  kind: 'image';
  images: ImageSource[];
}

interface ImageSource {
  content: string; // base64-encoded image bytes
  mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
  filename?: string;
}
```

### A PDF report — `DocumentDetectionInput`

The PDF is sent to Claude as a native document, so it reads the prose *and* sees
the charts and tables on the page.

```ts
interface DocumentDetectionInput {
  kind: 'document';
  content: string; // base64-encoded PDF bytes
  mediaType: 'application/pdf';
  filename?: string;
}
```

### A slide deck — `SlidesDetectionInput`

```ts
interface SlidesDetectionInput {
  kind: 'slides';
  slides: SlideContent[]; // each slide's text + embedded chart images
  filename?: string;
}

interface SlideContent {
  text: string;
  images: ImageSource[];
}
```

Use [`extractSlides`](#extracting-slide-decks) to build this from `.pptx` bytes.

### A whole analysis — `ChainDetectionInput`

Scan the ordered stages of one analysis *together* (data prep → analysis →
chart → narrative) so pitfalls that only emerge **across** stages surface — a
transform that biases a later chart, a metric computed one way and described
another, a chart the narrative over-claims.

```ts
interface ChainDetectionInput {
  kind: 'chain';
  stages: ChainStage[];
}

interface ChainStage {
  role: string; // e.g. "Data prep (Python)", "Chart", "Summary"
  artifact: SingleArtifactInput;
}
```

See [`fileToStage`](#routing-files-to-inputs) and `textStage` for building stages.

---

## Reports

```ts
interface PitfallReport {
  findings: Finding[];
  kind: InputKind; // 'code' | 'text' | 'image' | 'document' | 'slides' | 'chain'
  model: string; // the model id that produced the report
  rulesConsidered: number; // how many catalog rules were in scope
  usage?: DetectionUsage; // token counts, when the SDK reports them
}

interface Finding {
  ruleId: string; // always a real catalog rule id
  name: string;
  domain: Domain;
  severity: Severity; // 'info' | 'warning' | 'error'
  confidence: 'low' | 'medium' | 'high';
  /** 'active' = evident from the artifact; 'latent' = depends on unseen data. */
  nature: 'active' | 'latent';
  condition: string; // for latent findings: when the pitfall bites
  evidence: string;
  explanation: string;
  remediation: string;
}
```

The catalog fields on a finding (`name`, `domain`, `severity`, `remediation`)
are filled from the taxonomy, not from the model, so they are always
authoritative.

---

## Formatting a report

### `formatReport`

```ts
function formatReport(report: PitfallReport, options?: { showAll?: boolean }): string;
```

Renders a report as plain text for the terminal. By default it shows all active
findings plus only high-confidence latent ones; pass `{ showAll: true }` to
include lower-confidence latent findings.

### `hasBlockingFindings`

```ts
function hasBlockingFindings(report: PitfallReport): boolean;
```

`true` if the report has an **active** finding of severity `warning` or `error`
— the condition the CLI's `--ci` flag uses to exit non-zero. Info-level
advisories and all latent findings do not block.

```ts
const report = await detectPitfalls(input, { apiKey });
console.log(formatReport(report));
if (hasBlockingFindings(report)) process.exit(1);
```

---

## Routing files to inputs

These helpers turn raw files (bytes + filename + optional MIME type) into a
`DetectionInput`, covering images, PDF, `.pptx`, `.docx`, notebooks, and
code/prose — so a new input format is wired up once and every surface gets it.

```ts
interface FileInput {
  bytes: Uint8Array;
  filename: string;
  mimeType?: string;
}

type FileInputResult =
  | { input: SingleArtifactInput }
  | { error: string; reason: 'empty' | 'too_large' | 'unsupported' | 'unreadable' };
```

### `fileToInput` / `filesToInput`

```ts
function fileToInput(file: FileInput, opts?: FileInputOptions): Promise<FileInputResult>;
function filesToInput(files: FileInput[], opts?: FileInputOptions): Promise<FileInputResult>;
```

`fileToInput` routes a single file; `filesToInput` accepts several (a set of
chart images becomes one multi-image input). Both return either an `input` or a
descriptive `error` + `reason` — they don't throw on bad input.

```ts
import { readFile } from 'node:fs/promises';
import { fileToInput, detectPitfalls } from 'datapitfalls';

const bytes = await readFile('./chart.png');
const routed = await fileToInput({ bytes, filename: 'chart.png' });
if ('error' in routed) throw new Error(routed.error);

const report = await detectPitfalls(routed.input, { apiKey });
```

`FileInputOptions` lets you force prose mode (`forceText`), set a fallback kind
for unknown extensions (`fallbackKind`), and cap sizes (`maxImageBytes`,
`maxBinaryBytes`, `maxTextChars`, `maxImages`).

### `fileToStage` / `textStage`

Build chain stages for a whole-analysis scan:

```ts
function fileToStage(
  file: FileInput,
  opts?: FileInputOptions
): Promise<{ stage: ChainStage } | { error: string; reason: FileInputErrorReason }>;

function textStage(content: string, role?: string): ChainStage;
```

`fileToStage` reads a file into a stage with an auto-derived role label;
`textStage` wraps free text (e.g. a pasted summary) as a stage.

---

## Querying the taxonomy

The compiled pitfall catalog is queryable directly — useful for building UIs,
docs, or your own grounding.

```ts
function getAllRules(): readonly PitfallRule[];
function ruleCount(): number;
function getRule(id: string): PitfallRule | undefined;
function getRulesByDomain(domain: Domain): PitfallRule[];
function getRulesBySeverity(severity: Severity): PitfallRule[];
function ruleCountsByDomain(): Record<Domain, number>;
```

`Domain` and `Severity` are exported types, with the runtime arrays `DOMAINS`
and `SEVERITIES`. A `PitfallRule` carries `id`, `name`, `domain`, `severity`,
`description`, `detection_strategy`, `example_bad`, `example_good`,
`remediation`, and `references` (see [`docs/PITFALL_TAXONOMY.md`](PITFALL_TAXONOMY.md)).

```ts
import { ruleCountsByDomain } from 'datapitfalls';
console.log(ruleCountsByDomain()); // { 'Epistemic Errors': 6, ... }
```

---

## Extracting slide decks

### `extractSlides`

```ts
function extractSlides(data: Uint8Array): ExtractedSlides | { error: string };

interface ExtractedSlides {
  slides: SlideContent[];
}
```

Pulls per-slide text and embedded chart images from `.pptx` bytes, ready to pass
as a `SlidesDetectionInput`. (`fileToInput` calls this for you when given a
`.pptx` file.)

---

## Constants

```ts
const VERSION: string; // the installed package version
const TAGLINE: string;
const DEFAULT_MODEL: string; // 'claude-sonnet-4-6'
const DOMAINS: readonly Domain[]; // the eight pitfall domains
const SEVERITIES: readonly Severity[]; // 'info' | 'warning' | 'error'
```
