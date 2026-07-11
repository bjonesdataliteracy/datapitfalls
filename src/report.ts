// datapitfalls — pitfall report formatting

import type { Severity } from './taxonomy/index.js';
import type { Consequence, PitfallReport, Finding } from './analyze.js';

const SEVERITY_RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
const SEVERITY_LABEL: Record<Severity, string> = {
  error: 'ERROR',
  warning: 'WARNING',
  info: 'INFO',
};

function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}

// EXPERIMENTAL — within a nature section, a consequence rating (variant runs
// only) outranks severity; without ratings this reduces to the severity sort.
const CONSEQUENCE_RANK: Record<Consequence, number> = {
  'changes-takeaway': 0,
  'weakens-support': 1,
  polish: 2,
};

function consequenceRank(f: Finding): number {
  return f.consequence ? CONSEQUENCE_RANK[f.consequence] : 3;
}

function bySeverity(a: Finding, b: Finding): number {
  return (
    consequenceRank(a) - consequenceRank(b) || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );
}

/**
 * Whether the report contains an active finding serious enough to fail CI:
 * active (evident from the artifact, not data-dependent) and severity error or
 * warning. Info-level advisories and all latent findings do not fail the build.
 */
export function hasBlockingFindings(report: PitfallReport): boolean {
  return report.findings.some((f) => f.nature === 'active' && f.severity !== 'info');
}

/** Overall report tiers, best to worst. A tier is a coarse, deterministic
 *  rollup of the findings — never a model-supplied score — so the same findings
 *  always produce the same tier, and run-to-run detection noise is absorbed by
 *  the tier boundaries instead of surfacing as false precision. */
export const TIERS = ['clear', 'verify', 'attention', 'serious'] as const;

export type Tier = (typeof TIERS)[number];

/** Human labels for each tier. The top tier is worded as a scope-limited
 *  negative ("no pitfalls detected"), not praise — a clean scan means none of
 *  the cataloged pitfalls were detected, not that the work is correct. Display
 *  it alongside `report.rulesConsidered` (e.g. "checked against 47 rules") so
 *  the claim carries its own denominator. */
export const TIER_LABEL: Record<Tier, string> = {
  clear: 'No pitfalls detected',
  verify: 'Conditions to verify',
  attention: 'Needs attention',
  serious: 'Serious pitfalls found',
};

/**
 * The overall tier for a report, from best to worst:
 *
 * - `clear` — nothing detected (or only the low-confidence latent findings the
 *   default report hides as noise).
 * - `verify` — only info-level active findings and/or high-confidence latent
 *   ones. Latent findings never push a report below this tier, whatever their
 *   severity: they are conditions to check against the data, not verdicts.
 * - `attention` — at least one active warning.
 * - `serious` — at least one active error, or an active warning rated
 *   `changes-takeaway` (the consequence rating, when present, says the flaw
 *   likely changes what a reader concludes — that outranks a warning label).
 *
 * The tier agrees with the default `formatReport` display (a finding hidden as
 * noise never affects the tier) and with CI gating: the tier is `attention` or
 * worse exactly when `hasBlockingFindings` is true.
 */
export function reportTier(report: PitfallReport): Tier {
  const active = report.findings.filter((f) => f.nature === 'active');
  if (
    active.some(
      (f) =>
        f.severity === 'error' || (f.severity === 'warning' && f.consequence === 'changes-takeaway')
    )
  ) {
    return 'serious';
  }
  if (active.some((f) => f.severity === 'warning')) return 'attention';
  const hasVisibleLatent = report.findings.some(
    (f) => f.nature === 'latent' && f.confidence === 'high'
  );
  return active.length > 0 || hasVisibleLatent ? 'verify' : 'clear';
}

// EXPERIMENTAL — human labels for the consequence rating (variant runs only).
const CONSEQUENCE_LABEL: Record<string, string> = {
  'changes-takeaway': 'changes the takeaway',
  'weakens-support': 'weakens support',
  polish: 'polish',
};

function renderFinding(finding: Finding, lines: string[]): void {
  const consequence = finding.consequence ? ` · ${CONSEQUENCE_LABEL[finding.consequence]}` : '';
  lines.push(
    `[${SEVERITY_LABEL[finding.severity]}] ${finding.name}  (${finding.domain} · ${finding.ruleId} · ${finding.confidence} confidence${consequence})`
  );
  lines.push(`  Why it matters: ${finding.explanation}`);
  if (finding.nature === 'latent' && finding.condition) {
    lines.push(`  Only a problem if: ${finding.condition}`);
  }
  if (finding.evidence) lines.push(`  Where it shows up: ${finding.evidence}`);
  lines.push(`  How to avoid it: ${finding.remediation}`);
  lines.push('');
}

export interface ReportFormatOptions {
  /** Show every finding, including lower-confidence latent ones. Default false. */
  showAll?: boolean;
  /** Colorize the report header with ANSI escapes — the tier in its semantic
   *  color, the checked-against line dimmed. The caller owns TTY/NO_COLOR
   *  detection; default false so piped and captured output stays plain. */
  color?: boolean;
}

// Semantic ANSI colors for the tier line (standard 16-color codes, so they
// respect the user's terminal palette): green / cyan / yellow / red.
const TIER_SGR: Record<Tier, string> = {
  clear: '32',
  verify: '36',
  attention: '33',
  serious: '31',
};

function sgr(code: string, s: string, on: boolean): string {
  return on ? `\x1b[${code}m${s}\x1b[0m` : s;
}

/**
 * Render a pitfall report as plain text for the terminal.
 *
 * By default this shows all detected (active) pitfalls plus only high-confidence
 * potential (latent) ones — latent findings fire on almost any real code, so the
 * lower-confidence ones are hidden as noise unless `showAll` is set.
 */
export function formatReport(report: PitfallReport, options: ReportFormatOptions = {}): string {
  const showAll = options.showAll ?? false;
  const color = options.color ?? false;

  const active = report.findings.filter((f) => f.nature === 'active').sort(bySeverity);
  const allLatent = report.findings.filter((f) => f.nature === 'latent').sort(bySeverity);
  const latent = showAll ? allLatent : allLatent.filter((f) => f.confidence === 'high');
  const hiddenLatent = allLatent.length - latent.length;

  // The tier leads the report as its headline verdict; the checked-against line
  // carries the denominator that keeps a clean scan honest.
  const tier = reportTier(report);
  const tierText = sgr(`1;${TIER_SGR[tier]}`, TIER_LABEL[tier].toUpperCase(), color);
  const checkedAgainst = `checked against ${report.rulesConsidered} rules · model ${report.model}`;

  const avoidedBlock: string[] = [];
  if (report.avoided && report.avoided.length > 0) {
    avoidedBlock.push('Pitfalls avoided — countermeasures visible in the work:');
    for (const a of report.avoided) {
      avoidedBlock.push(`  ✓ ${a.name} (${a.ruleId}): ${a.explanation}`);
      if (a.evidence) avoidedBlock.push(`    Seen in: ${a.evidence}`);
    }
  }

  if (active.length === 0 && latent.length === 0) {
    const lines = [`${tierText} — ${sgr('2', checkedAgainst, color)}`];
    if (hiddenLatent > 0) {
      lines.push(
        `(${hiddenLatent} lower-confidence potential pitfall(s) hidden — use --all to show.)`
      );
    }
    if (report.summary) lines.push('', `Summary: ${report.summary}`);
    if (avoidedBlock.length > 0) lines.push('', ...avoidedBlock);
    return lines.join('\n');
  }

  const counts = countBySeverity([...active, ...latent]);
  const severityParts = (['error', 'warning', 'info'] as const)
    .filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${s}`)
    .join(' / ');
  const lines: string[] = [
    `${tierText} — ${active.length} detected, ${latent.length} potential · ${severityParts}`,
    sgr('2', `Checked against ${report.rulesConsidered} rules · model ${report.model}`, color),
    '',
  ];
  // EXPERIMENTAL — the summary follows the header when a variant produced one,
  // and visibly-avoided pitfalls close the report.
  if (report.summary) lines.push(`Summary: ${report.summary}`, '');

  if (active.length > 0) {
    const source =
      report.kind === 'image'
        ? 'chart'
        : report.kind === 'document'
          ? 'document'
          : report.kind === 'slides'
            ? 'slide deck'
            : 'code/description';
    lines.push(`Detected Pitfalls — evident from the ${source}:`);
    lines.push('');
    for (const finding of active) renderFinding(finding, lines);
  }

  if (latent.length > 0) {
    lines.push('Potential Pitfalls — verify these against your data:');
    lines.push('');
    for (const finding of latent) renderFinding(finding, lines);
  }

  if (hiddenLatent > 0) {
    lines.push(
      `(${hiddenLatent} lower-confidence potential pitfall(s) hidden — use --all to show.)`
    );
  }

  if (avoidedBlock.length > 0) {
    if (lines[lines.length - 1] !== '') lines.push('');
    lines.push(...avoidedBlock);
  }

  return lines.join('\n').trimEnd();
}
