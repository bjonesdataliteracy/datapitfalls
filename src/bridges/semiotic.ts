// datapitfalls → Semiotic annotation bridge
//
// A dependency-free bridge that turns a PitfallReport into the plain objects
// Semiotic's `annotations` prop consumes (react-annotation "note" specs), so the
// very chart that got audited can render its own warnings. This is the
// structural mirror of nteract/semiotic#1030, which bridges the other direction
// (Semiotic → datapitfalls): that one lives in their repo, emits our shape, and
// never imports us; this one lives in our repo, emits their shape, and never
// imports Semiotic.
//
// Honest seam: datapitfalls sees findings, not pixel coordinates. So every
// annotation is emitted UNANCHORED — `disable: ['connector']`, no `x`/`y`/data
// accessor. The host Semiotic app is responsible for positioning them (anchoring
// to a mark, or rendering them as a stacked margin/legend list). We do not
// invent coordinates.
//
// This module imports only local types and has ZERO runtime dependencies. It is
// deliberately off the engine's hot path — detectPitfalls() must never import it.

import type { Finding, InputKind, PitfallReport } from '../analyze.js';
import type { Domain, Severity } from '../taxonomy/index.js';

/**
 * One Semiotic / react-annotation "note" spec, plus a datapitfalls provenance
 * blob. This is a plain, JSON-serializable object; drop an array of them into a
 * Semiotic frame's `annotations` prop.
 */
export interface SemioticAnnotation {
  /** react-annotation type. Always `'note'` for a pitfall warning. */
  type: 'note';
  /** The note's rendered content. `title` is the pitfall, `label` the fix. */
  note: { title: string; label: string; wrap: number };
  /** Provenance so the host app can filter, style, or anchor by rule. */
  dataPitfall: { ruleId: string; domain: Domain; severity: Severity; evidence: string };
  /** Stroke/fill colour, resolved from the severity palette. */
  color: string;
  /** CSS hook: `pitfall-${severity}` (e.g. `pitfall-error`). */
  className: string;
  /** react-annotation feature toggles. Always includes `'connector'` because we
   *  have no coordinates to draw a connector to (the honest seam). */
  disable: string[];
}

export interface SemioticAnnotationOptions {
  /** Override the severity → colour map. Merged over the defaults. */
  palette?: Partial<Record<Severity, string>>;
  /** Cap emitted annotations (charts get noisy). Default: no cap. The full
   *  finding count is still reported via `meta.count`, so a cap is never silent. */
  max?: number;
  /** Text-wrap width in px passed through to react-annotation. Default: 240. */
  wrap?: number;
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

/** Convert one finding into an unanchored Semiotic annotation spec. */
function findingToAnnotation(
  finding: Finding,
  palette: Record<Severity, string>,
  wrap: number
): SemioticAnnotation {
  return {
    type: 'note',
    note: {
      title: finding.name,
      label: finding.remediation,
      wrap,
    },
    dataPitfall: {
      ruleId: finding.ruleId,
      domain: finding.domain,
      severity: finding.severity,
      evidence: finding.evidence,
    },
    color: palette[finding.severity],
    className: `pitfall-${finding.severity}`,
    // No coordinates → no connector to draw. The host app positions the note.
    disable: ['connector'],
  };
}

/**
 * Convert a PitfallReport into an array of Semiotic annotation specs — the plain
 * objects a Semiotic frame's `annotations` prop consumes. Findings map 1:1 and
 * in order; `opts.max` caps the array (see {@link buildSemioticAnnotationBridge}
 * to observe truncation via `meta.count`).
 */
export function toSemioticAnnotations(
  report: PitfallReport,
  opts: SemioticAnnotationOptions = {}
): SemioticAnnotation[] {
  const palette = { ...DEFAULT_SEMIOTIC_PALETTE, ...opts.palette };
  const wrap = opts.wrap ?? DEFAULT_WRAP;
  const findings =
    opts.max !== undefined ? report.findings.slice(0, Math.max(0, opts.max)) : report.findings;
  return findings.map((finding) => findingToAnnotation(finding, palette, wrap));
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
