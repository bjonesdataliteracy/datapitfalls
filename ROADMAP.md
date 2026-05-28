# Roadmap

datapitfalls is being built in the open. This roadmap reflects how the tool is actually coming together — the detection engine first, then the surfaces and distribution around it — on the path from a documented foundation to a full, community-driven ecosystem for detecting pitfalls in data work. Each phase builds on the last.

**Legend:** ✅ Complete · 🟢 In Progress · ⚪ Planned

---

## ✅ Phase 1 — Foundation

Lay the groundwork that everything else stands on.

- [x] Repository setup and project structure
- [x] Professional documentation (README, Contributing, Code of Conduct, Security, License)
- [x] Pitfall taxonomy v0.1 — the structured, machine-readable catalog of pitfalls across all eight pitfall domains
- [x] Taxonomy specification and contribution format

## ✅ Phase 2 — Analysis Engine & CLI

Build the core detector: ground Claude on the pitfall catalog and return structured findings from the command line.

- [x] Claude API analysis pipeline grounded on the pitfall catalog
- [x] Code snippet analysis (Python / SQL / R)
- [x] Plain-English analysis description input
- [x] Pitfall detection across Technical Trespasses, Mathematical Miscues, Statistical Slip-Ups, and Analytical Aberrations
- [x] Structured pitfall report output
- [x] `datapitfalls scan` command-line tool
- [x] CI integration to catch pitfalls before they ship (`--ci` exit code)

## ✅ Phase 3 — Chart & Visual Detection

Teach the detector to see, so it can review the chart itself.

- [x] Claude Vision API analysis pipeline
- [x] Visual pitfall detection (Graphical Gaffes & Design Dangers)
- [x] Chart-image scanning from the CLI

## ✅ Phase 4 — Web Experience

Put the detector on the web so anyone can use it without a terminal.

- [x] Web detector app (Next.js in `web/`) — chart-image, written-analysis, and code modes
- [x] Drag-and-drop and clipboard paste for chart images
- [x] Public-launch hardening — per-IP rate limiting on the scan endpoint and a privacy note
- [x] Public site live at [avoidingdatapitfalls.com](https://www.avoidingdatapitfalls.com)

## ✅ Phase 5 — Document Analysis

Detect pitfalls across whole bodies of work, in context.

- [x] Report upload (web app) — PDF read natively (charts and all), Word `.docx`, Jupyter notebooks, and code files
- [x] Multi-chart detection that understands charts in relation to one another
- [x] Slide-deck upload (PPTX) — per-slide text and chart images
- [x] Whole-chain scanning — submit the steps of one analysis (code, charts, prose) together and detect pitfalls that only emerge across stages (CLI `--chain`, web "Full analysis" mode)

## 🟢 Phase 6 — Distribution & Public API _(Current)_

Make datapitfalls easy to install and build on.

- [x] Published npm package — [`datapitfalls`](https://www.npmjs.com/package/datapitfalls) (`npm install datapitfalls`)
- [ ] Public API for tool builders

## ⚪ Phase 7 — Community & Ecosystem

Open the doors and grow.

- [ ] Community-contributed pitfall rules
- [ ] Internationalization
- [ ] Integrations with popular data tools (notebooks, BI platforms, dashboards)

---

Have an idea for the roadmap? [Open a feature request](https://github.com/bjonesdataliteracy/datapitfalls/issues/new?template=feature_request.md) — we'd love to hear it.
