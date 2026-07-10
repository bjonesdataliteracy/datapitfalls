// datapitfalls → Semiotic annotation bridge
//
// A dependency-free bridge that turns a PitfallReport into the plain objects
// Semiotic's `annotations` prop consumes, so the very chart that got audited can
// render its own warnings. This is the structural mirror of nteract/semiotic#1030,
// which bridges the other direction (Semiotic → datapitfalls): that one lives in
// their repo, emits our shape, and never imports us; this one lives in our repo,
// emits their shape, and never imports Semiotic.
//
// Target shape: Semiotic v3's NATIVE annotation object — flat `title`/`label`/
// `wrap`, a `type` from v3's taxonomy (default `'label'`), an `emphasis`, and a
// v3 `provenance` block. (Semiotic v1 consumed react-annotation "note" specs —
// `type: 'note'` with a nested `note: { title, label }`. v3 retired react-annotation
// and reads those fields FLAT; it silently renders the old nested shape as nothing.)
//
// Honest seam: datapitfalls sees findings, NOT pixel coordinates. So every
// annotation is emitted UNANCHORED — no `x`/`y`, no data accessor. On v3 this is a
// hard requirement, not a nicety: an annotation whose coordinates can't be resolved
// is DROPPED, not floated. The host positions them — anchor each to a mark (add
// `x`/`y` or an accessor), render them as a stacked margin/legend list, or let v3
// re-resolve position via `anchor: 'semantic'` keyed on `provenance.stableId` (the
// ruleId). We never invent coordinates.
//
// This module imports only local types and has ZERO runtime dependencies. It is
// deliberately off the engine's hot path — detectPitfalls() must never import it.

import type { Finding, InputKind, PitfallReport } from '../analyze.js';
import type { Domain, Severity } from '../taxonomy/index.js';

/**
 * A v3 annotation type. `'label'` draws a titled callout (with a connector once
 * the host anchors it); `'text'` is a connector-less note. Both read the same
 * flat `title`/`label`/`wrap` fields.
 */
export type SemioticAnnotationType = 'label' | 'text';

/**
 * One Semiotic v3 annotation spec, plus a datapitfalls provenance blob. This is a
 * plain, JSON-serializable object; drop an array of them into a Semiotic frame's
 * `annotations` prop. Fields are FLAT — v3 reads `title`/`label`/`wrap` directly
 * on the annotation (the v1 `note: { ... }` nesting is gone).
 */
export interface SemioticAnnotation {
  /** A type from v3's annotation taxonomy. Default `'label'`. */
  type: SemioticAnnotationType;
  /** The pitfall name. v3 reads this flat (was `note.title` in v1). */
  title: string;
  /** The remediation — the actionable fix shown on the chart. Flat (was
   *  `note.label` in v1). */
  label: string;
  /** Text-wrap width in px, passed through to v3. Default 240. */
  wrap: number;
  /** Stroke/fill colour, resolved from the severity palette. */
  color: string;
  /** CSS hook: `pitfall-${severity}` (e.g. `pitfall-error`). */
  className: string;
  /** v3 visual emphasis: `'primary'` for errors, `'secondary'` otherwise. */
  emphasis: 'primary' | 'secondary';
  /** v3's native provenance block. `stableId` (the ruleId) lets v3 re-resolve an
   *  unanchored annotation's position via `anchor: 'semantic'`. */
  provenance: {
    author: 'datapitfalls';
    authorKind: 'watcher';
    source: 'computed';
    basis: 'llm-inference';
    stableId: string;
  };
  /** datapitfalls provenance so the host can filter, style, or anchor by rule. */
  dataPitfall: { ruleId: string; domain: Domain; severity: Severity; evidence: string };
}

export interface SemioticAnnotationOptions {
  /** Override the severity → colour map. Merged over the defaults. */
  palette?: Partial<Record<Severity, string>>;
  /** Cap emitted annotations (charts get noisy). Default: no cap. The full
   *  finding count is still reported via `meta.count`, so a cap is never silent. */
  max?: number;
  /** Text-wrap width in px passed through to v3. Default: 240. */
  wrap?: number;
  /** v3 annotation type to emit. Default `'label'`; use `'text'` for
   *  connector-less notes. */
  type?: SemioticAnnotationType;
}

/** Metadata about a bridge conversion. `count` is the number of findings in the
 *  report *before* any `max` cap, so `count > annotations.length` reveals a
 *  truncation — the cap is never silent. */
export interface SemioticAnnotationBridge {
  annotations: SemioticAnnotation[];
  meta: { count: number; kind: InputKind };
}

/** Default severity → colour ramp: an accessible blue / amber / red 3-stop
 *  (Tailwind's blue-600 / amber-600 / red-600). Override via `opts.palette`. */
export const DEFAULT_SEMIOTIC_PALETTE: Record<Severity, string> = {
  info: '#2563eb',
  warning: '#d97706',
  error: '#dc2626',
};

const DEFAULT_WRAP = 240;

/** Convert one finding into an unanchored Semiotic v3 annotation spec. */
function findingToAnnotation(
  finding: Finding,
  palette: Record<Severity, string>,
  wrap: number,
  type: SemioticAnnotationType
): SemioticAnnotation {
  return {
    type,
    // Flat fields — v3 reads these directly (no `note: { ... }` wrapper).
    title: finding.name,
    label: finding.remediation,
    wrap,
    color: palette[finding.severity],
    className: `pitfall-${finding.severity}`,
    emphasis: finding.severity === 'error' ? 'primary' : 'secondary',
    provenance: {
      author: 'datapitfalls',
      authorKind: 'watcher',
      source: 'computed',
      basis: 'llm-inference',
      stableId: finding.ruleId,
    },
    dataPitfall: {
      ruleId: finding.ruleId,
      domain: finding.domain,
      severity: finding.severity,
      evidence: finding.evidence,
    },
    // No coordinates → the host anchors (or v3 drops it). See the honest seam above.
  };
}

/**
 * Convert a PitfallReport into an array of Semiotic v3 annotation specs — the
 * plain objects a Semiotic frame's `annotations` prop consumes. Findings map 1:1
 * and in order; `opts.max` caps the array (see {@link buildSemioticAnnotationBridge}
 * to observe truncation via `meta.count`).
 */
export function toSemioticAnnotations(
  report: PitfallReport,
  opts: SemioticAnnotationOptions = {}
): SemioticAnnotation[] {
  const palette = { ...DEFAULT_SEMIOTIC_PALETTE, ...opts.palette };
  const wrap = opts.wrap ?? DEFAULT_WRAP;
  const type = opts.type ?? 'label';
  const findings =
    opts.max !== undefined ? report.findings.slice(0, Math.max(0, opts.max)) : report.findings;
  return findings.map((finding) => findingToAnnotation(finding, palette, wrap, type));
}

/**
 * Mirror of Semiotic's `build*` + `to*` pairing (see nteract/semiotic#1030):
 * returns the annotations alongside `meta`. `meta.count` is the full finding
 * count *before* any `max` cap, so a cap is observable (`meta.count` vs
 * `annotations.length`) and never silent.
 */
export function buildSemioticAnnotationBridge(
  report: PitfallReport,
  opts: SemioticAnnotationOptions = {}
): SemioticAnnotationBridge {
  return {
    annotations: toSemioticAnnotations(report, opts),
    meta: { count: report.findings.length, kind: report.kind },
  };
}
