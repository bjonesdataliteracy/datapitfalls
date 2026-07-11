# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Overall report tier**: `reportTier(report)` (with `TIERS`, `Tier`, and
  `TIER_LABEL`, exported from the package root) rolls a report's findings up
  into one of four named tiers — `clear` ("No pitfalls detected"), `verify`
  ("Conditions to verify"), `attention` ("Needs attention"), `serious`
  ("Serious pitfalls found"). The tier is computed deterministically in code
  from each finding's nature/severity/consequence (never model-supplied, and
  deliberately coarse rather than a 0–100 score): any active error — or an
  active warning whose consequence rating says it changes the takeaway — is
  `serious`; any other active warning is `attention`; info-level active
  findings and high-confidence latent ones are `verify`; latent findings never
  push a report below `verify`, whatever their severity. It matches the default
  `formatReport` display (lower-confidence latent findings hidden as noise
  don't move the tier) and agrees with `hasBlockingFindings` at the
  `attention` boundary. Display-only for now: the CLI's `--ci` gating is
  unchanged. See [`reportTier`](docs/API.md#reporttier).
- **The tier now leads both surfaces.** `formatReport` opens with a tier
  header (`NEEDS ATTENTION — 2 detected, 1 potential · 2 warning / 1 info`)
  over a `Checked against N rules · model …` denominator line, unifying the
  clean and findings report shapes; a new `color` option (default off)
  colorizes the header with semantic ANSI colors, and the CLI passes its
  existing TTY/`NO_COLOR` detection through. `datapitfalls scan --json` now
  includes a computed `tier` field. The web app opens every result — clean or
  not — with a verdict card: the tier pill, a facts line (severity counts as
  colored dots, the rule denominator, the model), and the scan summary in one
  card; `/api/audit` responses carry server-computed `tier` and `tierLabel`
  fields. The web "Start here" slot and hidden-findings toggle now use the
  same default-visibility rule as the CLI and the tier, so a lower-confidence
  latent finding can no longer headline a report whose tier says clear.
- Dependency-free **bridge to [Semiotic](https://github.com/nteract/semiotic)**:
  `toSemioticAnnotations(report, opts?)` and `buildSemioticAnnotationBridge(report, opts?)`
  (new `src/bridges/semiotic.ts`, re-exported from the package root) convert a
  `PitfallReport` into the **Semiotic v3** annotation objects its `annotations`
  prop consumes — flat `title` (← finding `name`), `label` (← `remediation`), and
  `wrap`; a `type` from v3's taxonomy (default `'label'`, or `'text'` via
  `opts.type`); `severity` → an accessible blue/amber/red `color` (overridable via
  `opts.palette`), a `pitfall-${severity}` `className`, and an `emphasis`
  (`'primary'` for errors, else `'secondary'`); a v3 `provenance` block whose
  `stableId` (the `ruleId`) enables `anchor: 'semantic'` re-resolution; and a
  `dataPitfall` blob (`ruleId`, `domain`, `severity`, `evidence`) on each. It's the
  reciprocal of [nteract/semiotic#1030](https://github.com/nteract/semiotic/pull/1030)
  (Semiotic → datapitfalls): it lives in this repo, emits *their* shape, and
  never imports Semiotic — zero new runtime dependencies, and off the engine's
  hot path (`detectPitfalls()` does not import it). Because datapitfalls sees
  findings, not pixel coordinates, annotations are emitted **unanchored** (no
  `x`/`y`) — the host app positions them (on v3 an unanchored annotation is
  *dropped* until anchored). An optional `max` cap keeps busy charts readable; the
  full finding count survives in `meta.count`, so a cap is never silent. See
  [Bridging to Semiotic](docs/API.md#bridging-to-semiotic).

## [0.8.0] - 2026-07-09

### Added

- New Graphical Gaffes extension rule `incoherent-axis-scale` (Incoherent
  Axis Scale): flags an axis whose tick labels are self-contradictory —
  adjacent ticks repeating the same label, non-monotonic labels (a smaller
  value positioned above a larger one), or values duplicated across ticks
  that should be distinct — so no consistent scale exists and no reader can
  map a position to a value. Distinct from `truncated-y-axis` (real scale,
  non-zero base) and `unevenly-spaced-axis` (valid, ordered labels, only
  disproportionately spaced). Grounded in image scans via the Graphical
  Gaffes domain.

### Changed

- Generalized the `uneven-time-axis-spacing` rule (added in 0.7.0) to
  `unevenly-spaced-axis` (Unevenly Spaced Axis): it now covers any
  quantitative axis whose labels jump irregularly at even visual spacing
  (e.g. a height axis running 5'5", 5'6", 5'7", 5'9"), not only time. Time on
  a categorical axis remains the flagship example and the primary code
  detection target. **Rule id renamed** `uneven-time-axis-spacing` →
  `unevenly-spaced-axis`.
- `truncated-y-axis` detection now recognizes that pictorial/pictograph bars
  (icons, silhouettes, unit-shaped marks) are length-encoded and can be
  truncated, and calls out a missing or vanishing smallest mark (e.g. the
  shortest human silhouette absent entirely) as a strong truncation tell.
- `disproportionate-encoding` detection now steers toward checking for a
  truncated baseline first when marks are 2-D pictographs, ranking
  `truncated-y-axis` as the primary finding (and disproportionate encoding as
  the compounding one) when the smallest value renders at roughly zero size.

## [0.7.0] - 2026-07-07

### Added

- New Graphical Gaffes extension rule `uneven-time-axis-spacing` (Unevenly
  Spaced Time Axis): flags time plotted on a categorical axis, where unequal
  intervals get equal visual spacing and every slope is distorted (e.g. a line
  chart of survey years 1969-2020 where a ten-year gap is as wide as a
  one-year gap). Distinct from `misleading-interpolation` (fabricated
  between-sample values) and `cherry-picked-chart-window` (window choice) —
  this is about the axis encoding itself. Included in image-scan grounding
  via the Graphical Gaffes domain.

## [0.6.0] - 2026-06-12

### Added

- EXPERIMENTAL presentation variant for `detectPitfalls()` —
  `variant: 'summary'` adds a one-to-two-sentence overall summary in the
  book's guide-not-judge voice (framing pitfalls around what the work's
  audience would misperceive, optionally noting one genuine strength) and a
  per-finding `consequence` rating (changes-takeaway / weakens-support /
  polish), and an `avoided` list — up to two catalog pitfalls the work
  *visibly* avoided, evidenced by a concrete countermeasure (a guard, a
  stated caveat, a deliberate choice), catalog-validated and disjoint from
  findings, with zero allowed. Explanations are capped at one to two
  artifact-specific sentences (the rule's general description is not
  restated per finding). Off by default; not yet exposed in the CLI or web
  app. A new dev-only A/B harness (`evals/compare.mjs`) runs the same
  artifacts through the variants and writes a side-by-side report — now
  including an avg-words-per-finding column — to evaluate fixes for
  finding-overload feedback before shipping any of them. (Earlier rounds
  trialed 'verdict' naming and a separate mandatory strengths field; both
  were cut after side-by-side review.)

- The web app now runs every scan with the summary presentation and presents
  results triaged instead of as a flat list: the overall summary leads, the
  most important finding is expanded under "Start here", remaining findings
  collapse to one-line rows grouped as Detected / Potential Pitfalls (with
  lower-confidence potential ones behind a "show more" toggle, matching the
  CLI default), consequence chips ("Changes the takeaway" / "Weakens
  support" / "Polish") replace severity badges, and visibly-avoided pitfalls
  close the report as earned credit.
- CLI: `datapitfalls scan --summary` opts a scan into the summary
  presentation — the report leads with the overall summary, findings carry
  consequence ratings, and avoided pitfalls close the output.

### Changed

- Report labels reworded in the book's voice: findings group under "Detected
  Pitfalls" / "Potential Pitfalls" (instead of active/latent), with
  "Why it matters" / "Where it shows up" / "How to avoid it" field labels
  (instead of Why/Evidence/Fix). Machine-facing API fields (`nature`,
  `severity`, etc.) are unchanged.

- Public API reference ([docs/API.md](docs/API.md)) documenting the supported
  library surface — `detectPitfalls()`, input/report types, `formatReport`,
  file routing, and taxonomy queries — plus an API-stability and semver policy,
  with a "Programmatic API" section linked from the README. Completes Phase 6 of
  the [Roadmap](ROADMAP.md).

### Fixed

- `VERSION` is now read from `package.json` at runtime instead of a hardcoded
  literal, so the library and CLI always report the real published version.

## [0.5.0] - 2026-05-29

### Added

- Analysis engine and `datapitfalls scan` CLI — audits chart images (Claude Vision), code (Python / SQL / R and more), and plain-English descriptions, grounded on the pitfall catalog and returning structured findings, with a `--ci` exit code for pipelines.
- Chart and visual audits across the Graphical Gaffes and Design Dangers domains.
- Web app (`web/`, Next.js) — chart-image, written-analysis, and code modes, with drag-and-drop and clipboard paste for charts.
- Document upload in the web app — PDF read natively (prose plus charts and tables), Word `.docx`, Jupyter notebooks, and code files.
- Multi-chart audit — analyze several charts together to catch cross-chart pitfalls (inconsistent scales, inconsistent encodings, contradictory messages).
- Taxonomy expanded with domain-extension rules (75 rules across the eight pitfall domains).
- Public-launch hardening for the web app — per-IP rate limiting on the audit endpoint (HTTP 429 with `Retry-After`) and a privacy note explaining that input is sent to the Claude API to run the audit and isn't stored by the app.
- Verification kit (`npm run verify`) — runs `detectPitfalls()` once per input mode against a live key, can check a deployed `/api/audit` and the rate limiter, and ships a browser click-through checklist.
- Launch surface for the web app — a fuller landing page (whole-chain framing, links to the book and GitHub, one-click sample audits), build-time Open Graph preview card and favicon, privacy-friendly cookieless analytics, and a `web/README.md` covering env vars and pointing the public domain at the deploy.
- Published to npm as [`datapitfalls`](https://www.npmjs.com/package/datapitfalls) — `npm install datapitfalls` for the engine API, or `npx datapitfalls scan` for the CLI.
- CLI splash screen — a colored ANSI block-art banner with a Human/Agent quick-start, in the Powered By Data palette, that adapts to light or dark terminals (auto-detected, with a `--theme light|dark` flag or `DATAPITFALLS_THEME` env override). Body text uses the terminal's own foreground so it stays readable on any background.
- Slide-deck scanning (`.pptx`) — extracts each slide's text and embedded chart images and reviews the whole deck against the full catalog (CLI and web). New engine input kind `slides` and an `extractSlides()` helper.
- Shared file router in the package — `fileToInput()` / `filesToInput()` turn an uploaded or loaded file (bytes + filename + MIME) into a `DetectionInput`, covering images (one or several), PDF, `.pptx`, `.docx`, notebooks, and code/prose in one place. The CLI and the web app now both route through it, so a new input format is wired up once and every surface (and future site) gets it on a version bump.
- Whole-chain scanning (`chain` input kind, 0.5.0) — scan the steps of one analysis *together* (prep/analysis code, the chart(s), a written summary) and surface pitfalls that only emerge **across** stages: a transform that biases a later chart, a metric computed one way and described another, a chart the narrative over-claims, a caveat the conclusion drops. Adds `datapitfalls scan --chain <files…>`, a "Full analysis" mode in the web app, and `fileToStage()` / `textStage()` helpers.

### Changed

- Rebranded to a "pitfall detector" vocabulary. The public API is renamed (breaking, bumps to `0.2.0`): `analyze()` → `detectPitfalls()`, `AuditReport` → `PitfallReport`, `AnalyzeInput` → `DetectionInput`, `AnalyzeOptions` → `DetectionOptions`, `AuditUsage` → `DetectionUsage`. The CLI commands and the `Finding` shape are unchanged.

## [0.1.0] - 2026-05-24

### Added

- Initial project scaffolding and documentation (README, Contributing guide, Code of Conduct, Security policy, License).
- Pitfall taxonomy v0.1 structure, organized around the eight audit domains from _Avoiding Data Pitfalls_.
- Project roadmap outlining the path from foundation through developer tools and community ecosystem.

[Unreleased]: https://github.com/bjonesdataliteracy/datapitfalls/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/bjonesdataliteracy/datapitfalls/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/bjonesdataliteracy/datapitfalls/releases/tag/v0.6.0
[0.5.0]: https://github.com/bjonesdataliteracy/datapitfalls/compare/v0.1.0...v0.5.0
[0.1.0]: https://github.com/bjonesdataliteracy/datapitfalls/releases/tag/v0.1.0
