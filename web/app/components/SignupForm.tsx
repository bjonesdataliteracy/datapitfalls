'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { DATA_LITERACY_URL } from '../links';

// The two lead forms: the free checklist signup and the training inquiry. Both
// post to /api/signup. The checklist link is shown whatever happens, so the
// download works even before signups are switched on.

type Kind = 'checklist' | 'training';
type State = 'idle' | 'sending' | 'done' | 'closed' | 'error';

export function SignupForm({ kind }: { kind: Kind }) {
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setState('sending');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, kind, source: window.location.pathname }),
      });
      if (res.ok) return setState('done');
      if (res.status === 503) return setState('closed');
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(body.error ?? 'Something went wrong. Please try again.');
      setState('error');
    } catch {
      setMessage('Could not reach the server. Please try again.');
      setState('error');
    }
  }

  if (kind === 'checklist' && (state === 'done' || state === 'closed')) {
    return (
      <div className="signup-done" role="status">
        <p>
          {state === 'done'
            ? 'Thanks, you’re on the list. Your checklist is ready.'
            : 'Signups open soon. In the meantime, the checklist is yours.'}
        </p>
        <a className="btn btn-gold" href="/checklist">
          Open the printable checklist
        </a>
      </div>
    );
  }

  if (kind === 'training' && state === 'done') {
    return (
      <div className="signup-done" role="status">
        <p>Thanks. Ben will be in touch about training for your team.</p>
      </div>
    );
  }

  if (kind === 'training' && state === 'closed') {
    return (
      <div className="signup-done" role="status">
        <p>
          The form isn&rsquo;t open yet. Please get in touch through{' '}
          <a href={DATA_LITERACY_URL}>dataliteracy.com</a>.
        </p>
      </div>
    );
  }

  const sending = state === 'sending';
  return (
    <form className={`signup signup-${kind}`} onSubmit={submit}>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input
        className="hp"
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {kind === 'checklist' ? (
        <div className="signup-row">
          <label className="sr-only" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            name="email"
            placeholder="you@company.com"
            required
          />
          <button className="btn btn-gold" type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Get the checklist'}
          </button>
        </div>
      ) : (
        <div className="signup-grid">
          <label>
            Name
            <input type="text" name="name" autoComplete="name" required />
          </label>
          <label>
            Work email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Company
            <input type="text" name="company" autoComplete="organization" />
          </label>
          <label>
            Team size
            <select name="teamSize" defaultValue="">
              <option value="">Choose one</option>
              <option>Under 10</option>
              <option>10 to 50</option>
              <option>50 to 200</option>
              <option>Over 200</option>
            </select>
          </label>
          <label className="signup-wide">
            What would help your team?
            <textarea name="message" rows={4} />
          </label>
          <div className="signup-wide">
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Ask about training'}
            </button>
          </div>
        </div>
      )}
      {state === 'error' && (
        <p className="signup-error" role="alert">
          {message}
        </p>
      )}
      <p className="signup-fine">
        {kind === 'checklist'
          ? 'We’ll also send occasional tips on avoiding data pitfalls from Data Literacy. Unsubscribe anytime.'
          : 'We only use this to reply to you.'}{' '}
        See the <a href="/privacy">privacy policy</a>.
      </p>
    </form>
  );
}
