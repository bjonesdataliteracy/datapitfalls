# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Analysis engine and `datapitfalls scan` CLI — audits chart images (Claude Vision), code (Python / SQL / R and more), and plain-English descriptions, grounded on the pitfall catalog and returning structured findings, with a `--ci` exit code for pipelines.
- Chart and visual audits across the Graphical Gaffes and Design Dangers domains.
- Web app (`web/`, Next.js) — chart-image, written-analysis, and code modes, with drag-and-drop and clipboard paste for charts.
- Document upload in the web app — PDF read natively (prose plus charts and tables), Word `.docx`, Jupyter notebooks, and code files.
- Multi-chart audit — analyze several charts together to catch cross-chart pitfalls (inconsistent scales, inconsistent encodings, contradictory messages).
- Taxonomy expanded with domain-extension rules (75 rules across the eight audit domains).

See the [Roadmap](ROADMAP.md) for what's coming next.

## [0.1.0] - 2026-05-24

### Added

- Initial project scaffolding and documentation (README, Contributing guide, Code of Conduct, Security policy, License).
- Pitfall taxonomy v0.1 structure, organized around the eight audit domains from _Avoiding Data Pitfalls_.
- Project roadmap outlining the path from foundation through developer tools and community ecosystem.

[Unreleased]: https://github.com/bjonesdataliteracy/datapitfalls/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/bjonesdataliteracy/datapitfalls/releases/tag/v0.1.0
