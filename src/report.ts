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
    lines.push(`  Bites if: ${finding.condition}`);
  }
  if (finding.evidence) lines.push(`  Where it shows up: ${finding.evidence}`);
  lines.push(`  How to avoid it: ${finding.remediation}`);
  lines.push('');
}

export interface ReportFormatOptions {
  /** Show every finding, including lower-confidence latent ones. Default false. */
  showAll?: boolean;
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

  const active = report.findings.filter((f) => f.nature === 'active').sort(bySeverity);
  const allLatent = report.findings.filter((f) => f.nature === 'latent').sort(bySeverity);
  const latent = showAll ? allLatent : allLatent.filter((f) => f.confidence === 'high');
  const hiddenLatent = allLatent.length - latent.length;

  // EXPERIMENTAL — the summary leads the report when a variant produced one,
  // and visibly-avoided pitfalls close it.
  const preamble: string[] = [];
  if (report.summary) preamble.push(`Summary: ${report.summary}`, '');
  const avoidedBlock: string[] = [];
  if (report.avoided && report.avoided.length > 0) {
    avoidedBlock.push('Pitfalls avoided — countermeasures visible in the work:');
    for (const a of report.avoided) {
      avoidedBlock.push(`  ✓ ${a.name} (${a.ruleId}): ${a.explanation}`);
      if (a.evidence) avoidedBlock.push(`    Seen in: ${a.evidence}`);
    }
  }

  if (active.length === 0 && latent.length === 0) {
    const base =
      hiddenLatent > 0
        ? `No pitfalls detected — ${hiddenLatent} lower-confidence potential pitfall(s) hidden (use --all to show).`
        : 'No pitfalls detected.';
    const closing = avoidedBlock.length > 0 ? ['', ...avoidedBlock] : [];
    return [
      ...preamble,
      `${base} Considered ${report.rulesConsidered} rules, model ${report.model}.`,
      ...closing,
    ].join('\n');
  }

  const counts = countBySeverity([...active, ...latent]);
  const lines: string[] = [
    ...preamble,
    `${active.length + latent.length} pitfall(s) shown — ${active.length} detected, ${latent.length} potential · ` +
      `${counts.error} error / ${counts.warning} warning / ${counts.info} info (model ${report.model}):`,
    '',
  ];

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
    lines.push(`(${hiddenLatent} lower-confidence potential pitfall(s) hidden — use --all to show.)`);
  }

  if (avoidedBlock.length > 0) {
    if (lines[lines.length - 1] !== '') lines.push('');
    lines.push(...avoidedBlock);
  }

  return lines.join('\n').trimEnd();
}
