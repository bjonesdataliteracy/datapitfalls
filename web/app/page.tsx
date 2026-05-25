'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { AuditReport, Finding } from 'datapitfalls';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; report: AuditReport };

export default function Home() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
    setFileName(file ? file.name : null);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('file') as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setState({ status: 'error', message: 'Choose a chart image first.' });
      return;
    }

    setState({ status: 'loading' });
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/audit', { method: 'POST', body });
      const data = (await res.json()) as AuditReport | { error: string };
      if (!res.ok) {
        const message = 'error' in data ? data.error : 'The audit failed.';
        setState({ status: 'error', message });
        return;
      }
      setState({ status: 'done', report: data as AuditReport });
    } catch {
      setState({ status: 'error', message: 'Network error — please try again.' });
    }
  }

  return (
    <main className="container">
      <header className="masthead">
        <h1>datapitfalls</h1>
        <p>Upload a chart image and Claude audits it for common data-visualization pitfalls.</p>
      </header>

      <form className="uploader" onSubmit={onSubmit}>
        <label className="filefield">
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={onFileChange}
          />
          <span>{fileName ?? 'Choose a chart image (PNG, JPEG, GIF, WebP)'}</span>
        </label>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="preview" src={preview} alt="Chart preview" />
        )}

        <button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Auditing…' : 'Audit chart'}
        </button>
      </form>

      {state.status === 'error' && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      {state.status === 'done' && <Results report={state.report} />}
    </main>
  );
}

function Results({ report }: { report: AuditReport }) {
  const active = report.findings.filter((f) => f.nature === 'active');
  const latent = report.findings.filter((f) => f.nature === 'latent');

  if (report.findings.length === 0) {
    return (
      <section className="results">
        <p className="clean">
          No pitfalls detected. Considered {report.rulesConsidered} rules · model {report.model}.
        </p>
      </section>
    );
  }

  return (
    <section className="results">
      <p className="summary">
        {report.findings.length} finding(s) — {active.length} active, {latent.length} latent · model{' '}
        {report.model}
      </p>

      {active.length > 0 && (
        <>
          <h2>Active — evident from the chart</h2>
          {active.map((f, i) => (
            <FindingCard key={`active-${i}`} finding={f} />
          ))}
        </>
      )}

      {latent.length > 0 && (
        <>
          <h2>Latent — verify against your data</h2>
          {latent.map((f, i) => (
            <FindingCard key={`latent-${i}`} finding={f} />
          ))}
        </>
      )}
    </section>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className={`finding sev-${finding.severity}`}>
      <div className="finding-head">
        <span className={`badge sev-${finding.severity}`}>{finding.severity.toUpperCase()}</span>
        <h3>{finding.name}</h3>
      </div>
      <p className="meta">
        {finding.domain} · {finding.ruleId} · {finding.confidence} confidence
      </p>
      <p>
        <strong>Why:</strong> {finding.explanation}
      </p>
      {finding.nature === 'latent' && finding.condition && (
        <p>
          <strong>Bites if:</strong> {finding.condition}
        </p>
      )}
      {finding.evidence && (
        <p>
          <strong>Evidence:</strong> {finding.evidence}
        </p>
      )}
      <p>
        <strong>Fix:</strong> {finding.remediation}
      </p>
    </article>
  );
}
