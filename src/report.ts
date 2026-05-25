// datapitfalls — audit report formatting

import type { Severity } from './taxonomy/index.js';
import type { AuditReport, Finding } from './analyze.js';

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

function bySeverity(a: Finding, b: Finding): number {
  return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
}

/**
 * Whether the report contains an active finding serious enough to fail CI:
 * active (evident from the artifact, not data-dependent) and severity error or
 * warning. Info-level advisories and all latent findings do not fail the build.
 */
export function hasBlockingFindings(report: AuditReport): boolean {
  return report.findings.some((f) => f.nature === 'active' && f.severity !== 'info');
}

function renderFinding(finding: Finding, lines: string[]): void {
  lines.push(
    `[${SEVERITY_LABEL[finding.severity]}] ${finding.name}  (${finding.domain} · ${finding.ruleId} · ${finding.confidence} confidence)`
  );
  lines.push(`  Why: ${finding.explanation}`);
  if (finding.nature === 'latent' && finding.condition) {
    lines.push(`  Bites if: ${finding.condition}`);
  }
  if (finding.evidence) lines.push(`  Evidence: ${finding.evidence}`);
  lines.push(`  Fix: ${finding.remediation}`);
  lines.push('');
}

export interface ReportFormatOptions {
  /** Show every finding, including lower-confidence latent ones. Default false. */
  showAll?: boolean;
}

/**
 * Render an audit report as plain text for the terminal.
 *
 * By default this shows all active findings plus only high-confidence latent
 * findings — latent findings fire on almost any real code, so the lower-confidence
 * ones are hidden as noise unless `showAll` is set.
 */
export function formatReport(report: AuditReport, options: ReportFormatOptions = {}): string {
  const showAll = options.showAll ?? false;

  const active = report.findings.filter((f) => f.nature === 'active').sort(bySeverity);
  const allLatent = report.findings.filter((f) => f.nature === 'latent').sort(bySeverity);
  const latent = showAll ? allLatent : allLatent.filter((f) => f.confidence === 'high');
  const hiddenLatent = allLatent.length - latent.length;

  if (active.length === 0 && latent.length === 0) {
    const base =
      hiddenLatent > 0
        ? `No active pitfalls detected — ${hiddenLatent} lower-confidence latent note(s) hidden (use --all to show).`
        : 'No pitfalls detected.';
    return `${base} Considered ${report.rulesConsidered} rules, model ${report.model}.`;
  }

  const counts = countBySeverity([...active, ...latent]);
  const lines: string[] = [
    `${active.length + latent.length} pitfall(s) shown — ${active.length} active, ${latent.length} latent · ` +
      `${counts.error} error / ${counts.warning} warning / ${counts.info} info (model ${report.model}):`,
    '',
  ];

  if (active.length > 0) {
    lines.push('Active — evident from the code/description:');
    lines.push('');
    for (const finding of active) renderFinding(finding, lines);
  }

  if (latent.length > 0) {
    lines.push('Latent — risky patterns to verify against your data:');
    lines.push('');
    for (const finding of latent) renderFinding(finding, lines);
  }

  if (hiddenLatent > 0) {
    lines.push(`(${hiddenLatent} lower-confidence latent finding(s) hidden — use --all to show.)`);
  }

  return lines.join('\n').trimEnd();
}
