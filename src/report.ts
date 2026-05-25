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

/** Render an audit report as plain text for the terminal. */
export function formatReport(report: AuditReport): string {
  if (report.findings.length === 0) {
    return `No pitfalls detected (considered ${report.rulesConsidered} rules, model ${report.model}).`;
  }

  const active = report.findings.filter((f) => f.nature === 'active').sort(bySeverity);
  const latent = report.findings.filter((f) => f.nature === 'latent').sort(bySeverity);
  const counts = countBySeverity(report.findings);

  const lines: string[] = [
    `${report.findings.length} pitfall(s) found — ${active.length} active, ${latent.length} latent (data-dependent) · ` +
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

  return lines.join('\n').trimEnd();
}
