'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import type { AuditReport, Finding } from 'datapitfalls';

type Mode = 'image' | 'text' | 'code';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; report: AuditReport };

const MODES: { id: Mode; label: string }[] = [
  { id: 'image', label: 'Chart image' },
  { id: 'text', label: 'Written analysis' },
  { id: 'code', label: 'Analysis code' },
];

const UPLOAD_ACCEPT: Record<Exclude<Mode, 'image'>, string> = {
  text: '.pdf,.docx,.txt,.md,.markdown,.rst,application/pdf',
  code: '.py,.ipynb,.r,.sql,.js,.mjs,.jsx,.ts,.tsx,.java,.scala,.go,.rb,.jl,.m,.sas,.do,.cpp,.c,.cs,.php,.kt,.rs,.txt',
};

const UPLOAD_HINT: Record<Exclude<Mode, 'image'>, string> = {
  text: '.pdf, .docx, .txt, .md',
  code: '.py, .ipynb, .sql, .r, .js …',
};

export default function Home() {
  const [mode, setMode] = useState<Mode>('image');
  const [state, setState] = useState<State>({ status: 'idle' });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [text, setText] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  const selectImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setMode('image');
  }, []);

  // Paste a chart screenshot from anywhere on the page.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file) {
        e.preventDefault();
        selectImage(file);
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [selectImage]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function changeMode(m: Mode) {
    setMode(m);
    setDocFile(null);
    setState({ status: 'idle' });
  }

  function onImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectImage(file);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectImage(file);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    let request: RequestInit;
    if (mode === 'image') {
      if (!imageFile) {
        setState({ status: 'error', message: 'Choose, drop, or paste a chart image first.' });
        return;
      }
      request = { method: 'POST', body: fileBody(imageFile, 'image') };
    } else if (docFile) {
      request = { method: 'POST', body: fileBody(docFile, mode) };
    } else {
      const content = mode === 'code' ? code : text;
      if (content.trim() === '') {
        setState({ status: 'error', message: 'Paste something — or upload a file — to audit first.' });
        return;
      }
      request = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: mode, content, language: mode === 'code' ? language : undefined }),
      };
    }

    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/audit', request);
      const data = (await res.json()) as AuditReport | { error: string };
      if (!res.ok) {
        setState({ status: 'error', message: 'error' in data ? data.error : 'The audit failed.' });
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
        <p>Audit a chart image, a written analysis, or analysis code for common data pitfalls.</p>
      </header>

      <div className="modes" role="tablist" aria-label="What to audit">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={mode === m.id ? 'mode active' : 'mode'}
            onClick={() => changeMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form className="uploader" onSubmit={onSubmit}>
        {mode === 'image' && (
          <>
            <label
              className={dragging ? 'filefield dragging' : 'filefield'}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={onImageChange} />
              <span>{imageFile?.name ?? 'Choose, drop, or paste a chart image (PNG, JPEG, GIF, WebP)'}</span>
            </label>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="preview" src={preview} alt="Chart preview" />
            )}
          </>
        )}

        {mode !== 'image' && (
          <>
            {mode === 'code' && (
              <input
                className="language"
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Language (optional, e.g. Python, SQL, R)"
                disabled={docFile !== null}
              />
            )}
            <textarea
              className={mode === 'code' ? 'editor mono' : 'editor'}
              value={mode === 'code' ? code : text}
              onChange={(e) => (mode === 'code' ? setCode(e.target.value) : setText(e.target.value))}
              placeholder={
                mode === 'code'
                  ? 'Paste the analysis code to audit…'
                  : 'Paste a written description of your analysis, claim, or chart…'
              }
              rows={mode === 'code' ? 14 : 10}
              spellCheck={mode === 'code' ? false : undefined}
              disabled={docFile !== null}
            />
            <div className="uploadrow">
              <label className="uploadbtn">
                <input
                  type="file"
                  accept={UPLOAD_ACCEPT[mode]}
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                />
                Upload a file
              </label>
              {docFile ? (
                <span className="filename">
                  Auditing {docFile.name}
                  <button type="button" className="clearfile" onClick={() => setDocFile(null)} aria-label="Remove file">
                    ×
                  </button>
                </span>
              ) : (
                <span className="filehint">or upload {UPLOAD_HINT[mode]}</span>
              )}
            </div>
          </>
        )}

        <button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Auditing…' : 'Audit'}
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

function fileBody(file: File, mode: Mode): FormData {
  const body = new FormData();
  body.append('file', file);
  body.append('mode', mode);
  return body;
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
          <h2>Active — evident from the artifact</h2>
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
