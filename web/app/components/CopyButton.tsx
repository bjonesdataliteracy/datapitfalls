'use client';

import { useState } from 'react';

/** A small "Copy" button for a command or URL shown next to it. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard refused: the text is still selectable next to the button.
    }
  }
  return (
    <button type="button" className="copy-btn" onClick={copy} aria-label={`Copy ${text}`}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function CodeLine({ text }: { text: string }) {
  return (
    <div className="codeline">
      <code>{text}</code>
      <CopyButton text={text} />
    </div>
  );
}
