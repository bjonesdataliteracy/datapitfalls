'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import type { PitfallReport, Finding } from 'datapitfalls';

type Mode = 'image' | 'text' | 'code';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; report: PitfallReport };

const MODES: { id: Mode; label: string }[] = [
  { id: 'image', label: 'Chart image' },
  { id: 'text', label: 'Written analysis' },
  { id: 'code', label: 'Analysis code' },
];

const UPLOAD_ACCEPT: Record<Exclude<Mode, 'image'>, string> = {
  text: '.pdf,.docx,.pptx,.txt,.md,.markdown,.rst,application/pdf',
  code: '.py,.ipynb,.r,.sql,.js,.mjs,.jsx,.ts,.tsx,.java,.scala,.go,.rb,.jl,.m,.sas,.do,.cpp,.c,.cs,.php,.kt,.rs,.txt',
};

const UPLOAD_HINT: Record<Exclude<Mode, 'image'>, string> = {
  text: '.pdf, .docx, .pptx, .txt, .md',
  code: '.py, .ipynb, .sql, .r, .js …',
};

// Planted-pitfall examples so a first-time visitor can run a real audit with one
// click. The text sample hides survivorship bias and a mean-as-typical claim;
// the code sample hides a silent null drop, an inner-join row loss, and the same
// mean-as-typical reporting.
const SAMPLES = {
  text:
    'We measured the average customer lifetime value by taking every customer who is ' +
    'still active today and averaging how much each has spent. The mean came out to ' +
    '$4,200, so we are telling the board the typical customer is worth about $4,200. ' +
    'We left out the customers who churned, because their records were incomplete.',
  code: `import pandas as pd

orders = pd.read_csv("orders.csv")
users = pd.read_csv("users.csv")

# Drop any rows with missing values before aggregating.
orders = orders.dropna()

# Attach each order to its user.
df = orders.merge(users, on="user_id")  # inner join: users with no orders disappear

# Report the average order amount as the "typical" customer spend.
typical_spend = df["amount"].mean()
print(f"Typical customer spend: \${typical_spend:.2f}")`,
};

export default function Home() {
  const [mode, setMode] = useState<Mode>('image');
  const [state, setState] = useState<State>({ status: 'idle' });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const [text, setText] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  const addImages = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    setImageFiles((prev) => [...prev, ...images]);
    setPreviews((prev) => [...prev, ...images.map((f) => URL.createObjectURL(f))]);
    setMode('image');
  }, []);

  function removeImage(index: number) {
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Paste chart screenshots from anywhere on the page.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const images = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
      if (images.length > 0) {
        e.preventDefault();
        addImages(images);
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addImages]);

  // Revoke any outstanding object URLs when the page unmounts.
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = previews;
  useEffect(() => () => previewsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  function changeMode(m: Mode) {
    setMode(m);
    setDocFile(null);
    setState({ status: 'idle' });
  }

  function loadSample() {
    setDocFile(null);
    if (mode === 'code') {
      setLanguage('Python');
      setCode(SAMPLES.code);
    } else {
      setText(SAMPLES.text);
    }
  }

  function onImageChange(e: ChangeEvent<HTMLInputElement>) {
    addImages(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    addImages(Array.from(e.dataTransfer.files ?? []));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    let request: RequestInit;
    if (mode === 'image') {
      if (imageFiles.length === 0) {
        setState({ status: 'error', message: 'Choose, drop, or paste a chart image first.' });
        return;
      }
      const body = new FormData();
      imageFiles.forEach((file) => body.append('file', file));
      body.append('mode', 'image');
      request = { method: 'POST', body };
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
      const data = (await res.json()) as PitfallReport | { error: string };
      if (!res.ok) {
        setState({ status: 'error', message: 'error' in data ? data.error : 'The scan failed.' });
        return;
      }
      setState({ status: 'done', report: data as PitfallReport });
    } catch {
      setState({ status: 'error', message: 'Network error — please try again.' });
    }
  }

  return (
    <main className="container">
      <header className="masthead">
        <h1>datapitfalls</h1>
        <p className="tagline">
          Check the data work of humans and AI alike — a chart (or several at once), a written
          analysis, analysis code, or a whole document — for the common pitfalls that mislead.
        </p>
        <p className="subtag">
          Grounded in the taxonomy from{' '}
          <a href="https://www.avoidingdatapitfalls.com" target="_blank" rel="noreferrer">
            <em>Avoiding Data Pitfalls</em>
          </a>
          , across all eight pitfall domains.{' '}
          <a href="https://github.com/bjonesdataliteracy/datapitfalls" target="_blank" rel="noreferrer">
            Open source on GitHub
          </a>
          .
        </p>
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
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={onImageChange}
              />
              <span>
                {imageFiles.length === 0
                  ? 'Choose, drop, or paste chart images (PNG, JPEG, GIF, WebP) — add several to compare them'
                  : `${imageFiles.length} chart${imageFiles.length > 1 ? 's' : ''} selected — add more, or audit them together`}
              </span>
            </label>
            {previews.length > 0 && (
              <div className="previews">
                {previews.map((url, i) => (
                  <div className="thumb" key={url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Chart ${i + 1} preview`} />
                    <button
                      type="button"
                      className="thumb-remove"
                      onClick={() => removeImage(i)}
                      aria-label={`Remove chart ${i + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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
              <button type="button" className="linklike" onClick={loadSample}>
                Try a sample
              </button>
            </div>
          </>
        )}

        <button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Detecting…' : 'Detect pitfalls'}
        </button>
      </form>

      {state.status === 'error' && (
        <p className="error" role="alert">
          {state.message}
        </p>
      )}
      {state.status === 'done' && <Results report={state.report} />}

      <footer className="sitefoot">
        <p className="privacy">
          Your input is sent to Anthropic&rsquo;s Claude API to run the audit and isn&rsquo;t stored
          by this app — please don&rsquo;t upload confidential or personal data. To prevent abuse,
          audits are rate-limited per visitor, and we use privacy-friendly, cookieless analytics (no
          personal data).
        </p>
        <p className="credits">
          Created by{' '}
          <a href="https://dataliteracy.com" target="_blank" rel="noreferrer">
            Ben Jones
          </a>
          , author of <em>Avoiding Data Pitfalls</em>. Built with{' '}
          <a href="https://www.anthropic.com/" target="_blank" rel="noreferrer">
            Claude
          </a>
          .{' '}
          <a href="https://github.com/bjonesdataliteracy/datapitfalls" target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
          .
        </p>
      </footer>
    </main>
  );
}

function fileBody(file: File, mode: Mode): FormData {
  const body = new FormData();
  body.append('file', file);
  body.append('mode', mode);
  return body;
}

function Results({ report }: { report: PitfallReport }) {
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
