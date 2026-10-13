'use client';

import { useState } from 'react';
import { CLI_INSTALL, MCP_URL } from '../links';
import { CodeLine } from './CopyButton';

type Tab = 'web' | 'code';

/** Setup steps for the MCP connector, for claude.ai or Claude Code. */
export function SetupTabs() {
  const [tab, setTab] = useState<Tab>('web');
  return (
    <div>
      <div className="setup-tabs" role="tablist" aria-label="Where you use Claude">
        <button
          type="button"
          role="tab"
          id="tab-web"
          aria-selected={tab === 'web'}
          aria-controls="panel-web"
          className="setup-tab"
          onClick={() => setTab('web')}
        >
          claude.ai
        </button>
        <button
          type="button"
          role="tab"
          id="tab-code"
          aria-selected={tab === 'code'}
          aria-controls="panel-code"
          className="setup-tab"
          onClick={() => setTab('code')}
        >
          Claude Code
        </button>
      </div>
      <div
        className="setup-panel"
        role="tabpanel"
        id="panel-web"
        aria-labelledby="tab-web"
        hidden={tab !== 'web'}
      >
        <ol className="steps">
          <li>
            In claude.ai, open <b>Settings → Connectors</b>, choose <b>Discover</b> and search for{' '}
            <b>Data Pitfalls</b>.
          </li>
          <li>
            Choose <b>Connect</b>. There&rsquo;s no sign-in.
          </li>
          <li>
            In any chat, ask: <i>&ldquo;Check this chart for data pitfalls.&rdquo;</i>
          </li>
        </ol>
        <div className="footnote">
          Or add it as a custom connector with this URL:
          <CodeLine text={MCP_URL} />
        </div>
      </div>
      <div
        className="setup-panel"
        role="tabpanel"
        id="panel-code"
        aria-labelledby="tab-code"
        hidden={tab !== 'code'}
      >
        <ol className="steps">
          <li>
            Run this once in your terminal:
            <CodeLine text={CLI_INSTALL} />
          </li>
          <li>
            Ask Claude Code to <i>&ldquo;review this SQL for data pitfalls&rdquo;</i>, or use the{' '}
            <code>review_for_pitfalls</code> prompt.
          </li>
        </ol>
      </div>
    </div>
  );
}
