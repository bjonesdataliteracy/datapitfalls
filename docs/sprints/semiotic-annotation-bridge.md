# Sprint: Semiotic Annotation Bridge (Idea 1)

**Status:** Planned
**Branch:** `claude/semiotic-annotation-bridge` (off an up-to-date `main`)
**Owner:** TBD
**Related:** [nteract/semiotic#1030](https://github.com/nteract/semiotic/pull/1030) — the Semiotic → datapitfalls bridge this one mirrors.

> **Note (post-review):** the emitted shape sketched below targeted Semiotic **v1**
> (react-annotation "note" specs). Per review, the shipped bridge emits Semiotic
> **v3**'s native shape — flat `title`/`label`/`wrap`, a `type` from v3's taxonomy,
> `emphasis`, and a `provenance` block. See
> [docs/API.md → Bridging to Semiotic](../API.md#bridging-to-semiotic) for the
> current, authoritative shape.

---

## Why

Semiotic PR #1030 added a **dependency-free bridge from Semiotic → datapitfalls**: it
serializes a chart (config, JSX, grounding, diagnostics, a11y audit, optional render
image) into a `ChainDetectionInput` our engine can scan. It lives *in their repo*,
emits *our* shape, and never imports us.

This sprint returns the favor with the **structural mirror**: a dependency-free bridge
**from datapitfalls → Semiotic** that lives *in our repo*, emits *their* shape, and
never imports Semiotic. It converts a `PitfallReport` into an array of
[`react-annotation`](https://github.com/susielu/react-annotation) specs — the plain
objects Semiotic's `annotations` prop consumes — so the very chart that got audited can
**render its own warnings**.

Round trip: *Semiotic chart → datapitfalls scan → findings → annotations back onto the
Semiotic chart.*

## Goal

Ship `toSemioticAnnotations(report)` (plus a typed `buildSemioticAnnotationBridge` entry
that mirrors their `build*` + `to*` pairing): given a `PitfallReport`, return a plain,
JSON-serializable array of Semiotic annotation objects. Zero new runtime dependencies.

## Design

**Location:** new module `src/bridges/semiotic.ts` (new `src/bridges/` folder). Keep it
off the engine's hot path — `detectPitfalls()` must not import it. Re-export from
`src/index.ts` so it's part of the public API.

**Public surface (proposed):**

```ts
/** One Semiotic/react-annotation "note" spec, plus a datapitfalls provenance blob. */
export interface SemioticAnnotation {
  type: 'note';
  note: { title: string; label: string; wrap: number };
  /** Provenance so the host app can filter, style, or anchor by rule. */
  dataPitfall: { ruleId: string; domain: Domain; severity: Severity; evidence: string };
  color: string;
  className: string;
  disable: string[];
}

export interface SemioticAnnotationOptions {
  /** Override the severity → color map. */
  palette?: Record<Severity, string>;
  /** Cap emitted annotations (charts get noisy). Default: no cap. */
  max?: number;
  /** Text-wrap width in px passed through to react-annotation. Default: 240. */
  wrap?: number;
}

export function toSemioticAnnotations(
  report: PitfallReport,
  opts?: SemioticAnnotationOptions,
): SemioticAnnotation[];

/** Mirror of Semiotic's build* + to* pairing; returns { annotations, meta }. */
export function buildSemioticAnnotationBridge(
  report: PitfallReport,
  opts?: SemioticAnnotationOptions,
): { annotations: SemioticAnnotation[]; meta: { count: number; kind: InputKind } };
```

**Mapping, per `Finding`:**

| Finding field | Annotation field |
|---|---|
| `name` | `note.title` |
| `remediation` | `note.label` (the actionable fix, shown on the chart) |
| `severity` | `color` via palette; `className = pitfall-${severity}` |
| `ruleId`, `domain`, `severity`, `evidence` | `dataPitfall` provenance blob |

**Default palette** (`info | warning | error`): pick an accessible 3-stop ramp
(e.g. blue / amber / red); document the exact hexes and make them overridable.

## The honest seam (must be documented)

datapitfalls sees findings, **not pixel coordinates**. So the bridge emits
*unanchored* annotations (`disable: ['connector']`, no `x`/`y`/data accessor). The host
Semiotic app is responsible for positioning them — anchoring to a mark, or rendering
them as a stacked margin/legend list. Call this out in the README and the doc page,
exactly as #1030 was explicit about "dependency-free input." Do **not** invent
coordinates.

## Scope

**In:** the module, types, palette + options, `src/index.ts` re-export, unit tests, a
`docs/API.md` section, a short README mention, a CHANGELOG entry, a ROADMAP checkbox.

**Out:** actually rendering in Semiotic (we can't from here); Ideas 2 & 3; a web-app UI;
any coordinate/anchoring logic.

## Test plan (`src/bridges/semiotic.test.ts`)

- Empty report → `[]`.
- Each finding maps 1:1 (title/label/provenance) and preserves order.
- Severity → color/className is correct; custom `palette` overrides.
- `max` truncates and (per our "no silent caps" habit) the truncation is observable via
  `meta.count` vs `annotations.length`.
- Output is JSON round-trippable (`JSON.parse(JSON.stringify(...))` equal) — proves
  "dependency-free / serializable."
- No import of Semiotic anywhere in the module (guard test or lint check).

## Acceptance criteria

- [ ] `toSemioticAnnotations` + `buildSemioticAnnotationBridge` exported from the package root.
- [ ] Zero new runtime dependencies; module imports only local types.
- [ ] The gate is green: `npm run build && npm run validate && npm test && npm run lint`.
- [ ] `docs/API.md`, `README.md`, `CHANGELOG.md`, `ROADMAP.md` updated.
- [ ] The "honest seam" (no coordinates) is documented.
- [ ] PR opened to `main` referencing #1030 as the reciprocal bridge.

## Notes for the implementer

- Follow #1030's packaging: typed `build*` + `to*` pair, docs page, unit tests asserting
  the emitted shape.
- Reuse existing types (`PitfallReport`, `Finding`, `Domain`, `Severity`, `InputKind`)
  from `src/analyze.ts` / `src/taxonomy/`. Do not redefine them.
- Verification honesty: you can prove build/types/tests and JSON-serializability. You
  **cannot** prove it renders in a live Semiotic chart from a cloud session — say so.
