# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/bjonesdataliteracy/datapitfalls/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/bjonesdataliteracy/datapitfalls/compare/v0.1.0...v0.5.0
[0.1.0]: https://github.com/bjonesdataliteracy/datapitfalls/releases/tag/v0.1.0
