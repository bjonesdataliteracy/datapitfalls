# Roadmap

datapitfalls is being built in the open. This roadmap reflects how the tool is actually coming together — the auditing engine first, then the surfaces and distribution around it — on the path from a documented foundation to a full, community-driven ecosystem for auditing data work. Each phase builds on the last.

**Legend:** ✅ Complete · 🟢 In Progress · ⚪ Planned

---

## ✅ Phase 1 — Foundation

Lay the groundwork that everything else stands on.

- [x] Repository setup and project structure
- [x] Professional documentation (README, Contributing, Code of Conduct, Security, License)
- [x] Pitfall taxonomy v0.1 — the structured, machine-readable catalog of pitfalls across all eight audit domains
- [x] Taxonomy specification and contribution format

## ✅ Phase 2 — Analysis Engine & CLI

Build the core auditor: ground Claude on the pitfall catalog and return structured findings from the command line.

- [x] Claude API analysis pipeline grounded on the pitfall catalog
- [x] Code snippet analysis (Python / SQL / R)
- [x] Plain-English analysis description input
- [x] Pitfall detection across Technical Trespasses, Mathematical Miscues, Statistical Slip-Ups, and Analytical Aberrations
- [x] Structured audit report output
- [x] `datapitfalls scan` command-line tool
- [x] CI integration to catch pitfalls before they ship (`--ci` exit code)

## ✅ Phase 3 — Chart & Visual Audits

Teach the auditor to see, so it can review the chart itself.

- [x] Claude Vision API analysis pipeline
- [x] Visual pitfall detection (Graphical Gaffes & Design Dangers)
- [x] Chart-image scanning from the CLI

## 🟢 Phase 4 — Web Experience _(Current)_

Put the auditor on the web so anyone can use it without a terminal.

- [x] Image upload interface (Next.js app in `web/` — upload a chart, audit it via the engine)
- [ ] Website deployed at [avoidingdatapitfalls.com](https://www.avoidingdatapitfalls.com)

## ⚪ Phase 5 — Document Analysis

Audit whole bodies of work, in context.

- [ ] Report and slide-deck upload (PDF, PPTX)
- [ ] Multi-chart audit that understands charts in relation to one another
- [ ] Full-document pitfall scanning across the entire data reasoning chain

## ⚪ Phase 6 — Distribution & Public API

Make datapitfalls easy to install and build on.

- [ ] Published npm package
- [ ] Public API for tool builders

## ⚪ Phase 7 — Community & Ecosystem

Open the doors and grow.

- [ ] Community-contributed pitfall rules
- [ ] Internationalization
- [ ] Integrations with popular data tools (notebooks, BI platforms, dashboards)

---

Have an idea for the roadmap? [Open a feature request](https://github.com/bjonesdataliteracy/datapitfalls/issues/new?template=feature_request.md) — we'd love to hear it.
