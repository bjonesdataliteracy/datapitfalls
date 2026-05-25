# Roadmap

datapitfalls is being built in the open. This roadmap lays out the path from a documented foundation to a full, community-driven ecosystem for auditing data work. Each phase builds on the last.

**Legend:** ✅ Complete · 🟢 In Progress · ⚪ Planned

---

## ✅ Phase 1 — Foundation

Lay the groundwork that everything else stands on.

- [x] Repository setup and project structure
- [x] Professional documentation (README, Contributing, Code of Conduct, Security, License)
- [x] Pitfall taxonomy v0.1 — the structured, machine-readable catalog of pitfalls across all eight audit domains
- [x] Taxonomy specification and contribution format

## 🟢 Phase 2 — Chart Audit MVP _(Current)_

Ship the first thing people can actually use: a website that audits a chart image.

- [ ] Website at [avoidingdatapitfalls.com](https://www.avoidingdatapitfalls.com)
- [ ] Image upload interface
- [x] Claude Vision API analysis pipeline
- [x] Visual pitfall detection (Graphical Gaffes & Design Dangers)
- [x] Structured audit report output

## ✅ Phase 3 — Multi-Modal Analysis

Move beyond images to audit the reasoning behind the chart.

- [x] Code snippet analysis (Python / SQL / R)
- [x] Plain-English analysis description input
- [x] Expanded pitfall detection across Technical Trespasses, Mathematical Miscues, Statistical Slip-Ups, and Analytical Aberrations

## ⚪ Phase 4 — Document Analysis

Audit whole bodies of work, in context.

- [ ] Report and slide-deck upload (PDF, PPTX)
- [ ] Multi-chart audit that understands charts in relation to one another
- [ ] Full-document pitfall scanning across the entire data reasoning chain

## 🟢 Phase 5 — Developer Tools

Put datapitfalls into the workflows where data work actually happens.

- [ ] Published npm package
- [x] CLI tool (`datapitfalls scan` — code, description, and chart-image audits)
- [x] CI/CD integration to catch pitfalls before they ship (`--ci` exit code)
- [ ] Public API for tool builders

## ⚪ Phase 6 — Community & Ecosystem

Open the doors and grow.

- [ ] Community-contributed pitfall rules
- [ ] Internationalization
- [ ] Integrations with popular data tools (notebooks, BI platforms, dashboards)

---

Have an idea for the roadmap? [Open a feature request](https://github.com/bjonesdataliteracy/datapitfalls/issues/new?template=feature_request.md) — we'd love to hear it.
