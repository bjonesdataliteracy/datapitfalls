import type { Metadata } from 'next';
import styles from '../info.module.css';

// Setup and usage docs for the Data Pitfalls MCP connector. This is the
// documentation URL for the Claude connector directory listing.

const MCP_URL = 'https://www.avoidingdatapitfalls.com/api/mcp';

export const metadata: Metadata = {
  title: 'Data Pitfalls for Claude — MCP connector',
  description:
    'Connect Claude to the Avoiding Data Pitfalls taxonomy so it can check SQL, charts, dashboards and written analysis for common data pitfalls.',
  alternates: { canonical: '/mcp' },
};

const TOOLS: Array<[string, string]> = [
  [
    'get_checklist',
    'The rules that apply to a kind of work (sql, code, chart, image, prose, text, dashboard or document) as a checklist, each with what to check for and how to fix it. Optionally narrowed to some domains.',
  ],
  [
    'get_pitfall',
    'One rule in full by id: what it is, how to detect it, an example of the pitfall, an example done well, the fix and the book reference.',
  ],
  ['list_pitfalls', 'All 78 rules, optionally filtered by domain or severity.'],
  ['search_pitfalls', 'Keyword search over the rules, e.g. "dual axis" or "missing values".'],
];

export default function McpPage() {
  return (
    <main className={`container ${styles.page}`}>
      <a className={styles.back} href="/">
        ← datapitfalls
      </a>
      <h1>Data Pitfalls for Claude</h1>
      <p className={styles.lede}>
        An MCP connector that gives Claude the 78 rules from <em>Avoiding Data Pitfalls</em> by Ben
        Jones (Wiley, 2020), so it can check your SQL, charts, dashboards, written analysis and
        reports for the mistakes that mislead.
      </p>

      <h2>How it works</h2>
      <p>
        The connector serves the pitfall taxonomy and nothing else. Claude asks it for the checklist
        that fits the work in front of it, checks each item against your work itself, and reports
        what it finds with the rule ids and fixes. Your work stays in your conversation with Claude:
        the tools never receive your data, charts or queries. The connector makes no AI calls of its
        own, stores nothing, and needs no account or API key. Every tool is read-only.
      </p>

      <h2>Connect it</h2>
      <p>
        <strong>claude.ai and Claude Desktop:</strong> open Settings → Connectors → Add custom
        connector, name it Data Pitfalls, and paste this URL. No sign-in is needed.
      </p>
      <pre>
        <code>{MCP_URL}</code>
      </pre>
      <p>
        <strong>Claude Code:</strong> either use the same URL,
      </p>
      <pre>
        <code>{`claude mcp add --transport http datapitfalls ${MCP_URL}`}</code>
      </pre>
      <p>or run the server locally from npm:</p>
      <pre>
        <code>claude mcp add datapitfalls -- npx -y datapitfalls mcp</code>
      </pre>

      <h2>Use it</h2>
      <p>Ask in your own words. For example:</p>
      <ul>
        <li>&ldquo;Check this chart for data pitfalls.&rdquo; (with an image attached)</li>
        <li>&ldquo;Review this SQL query for data pitfalls before I share the numbers.&rdquo;</li>
        <li>
          &ldquo;Build me a dashboard of monthly signups, then review it for data pitfalls and fix
          what you find.&rdquo;
        </li>
        <li>
          &ldquo;What does the truncated y-axis pitfall look like, and how do I avoid it?&rdquo;
        </li>
      </ul>
      <p>
        Claude reports each finding as active (evident in the work) or latent (depends on data it
        can&rsquo;t see), rates how much it matters, quotes the evidence and gives the fix. A clean
        review means none of the cataloged pitfalls were found, not that the work is correct.
      </p>
      <p>
        There is also a <code>review_for_pitfalls</code> prompt, and each rule is available as a
        resource at <code>datapitfalls://rules/&#123;id&#125;</code>.
      </p>

      <h2>Tools</h2>
      <table>
        <tbody>
          {TOOLS.map(([name, what]) => (
            <tr key={name}>
              <td>
                <code>{name}</code>
              </td>
              <td>{what}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Privacy and support</h2>
      <p>
        See the <a href="/privacy">privacy policy</a>. For questions and problems, open an issue on{' '}
        <a href="https://github.com/bjonesdataliteracy/datapitfalls/issues" rel="noreferrer">
          GitHub
        </a>
        . The connector is open source:{' '}
        <a href="https://github.com/bjonesdataliteracy/datapitfalls" rel="noreferrer">
          bjonesdataliteracy/datapitfalls
        </a>
        .
      </p>
    </main>
  );
}
