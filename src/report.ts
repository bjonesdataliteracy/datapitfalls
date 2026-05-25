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

/** Render an audit report as plain text for the terminal. */
export function formatReport(report: AuditReport): string {
  if (report.findings.length === 0) {
    return `No pitfalls detected (considered ${report.rulesConsidered} rules, model ${report.model}).`;
  }

  const sorted = [...report.findings].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );
  const counts = countBySeverity(sorted);

  const lines: string[] = [
    `${report.findings.length} pitfall(s) found — ${counts.error} error, ${counts.warning} warning, ${counts.info} info (model ${report.model}):`,
    '',
  ];

  for (const finding of sorted) {
    lines.push(
      `[${SEVERITY_LABEL[finding.severity]}] ${finding.name}  (${finding.domain} · ${finding.ruleId} · ${finding.confidence} confidence)`
    );
    lines.push(`  Why: ${finding.explanation}`);
    if (finding.evidence) lines.push(`  Evidence: ${finding.evidence}`);
    lines.push(`  Fix: ${finding.remediation}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
