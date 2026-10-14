import type { Metadata } from 'next';
import { DOMAINS, getRulesByDomain, ruleCount } from 'datapitfalls';
import { PrintButton } from '../components/PrintButton';
import { rulePath } from '../site';

// The printable checklist: every pitfall as a one-line check, grouped by domain.
// It is the free download behind the email signup, so it is left out of search
// results and the nav, but the page itself is open to anyone with the link.

export const metadata: Metadata = {
  title: 'The Data Pitfalls checklist',
  description: 'Every pitfall from Avoiding Data Pitfalls as a printable checklist.',
  robots: { index: false },
  alternates: { canonical: '/checklist' },
};

/** The first sentence of a rule's description, as its one-line check. */
function firstSentence(text: string): string {
  const flat = text.trim().replace(/\s+/g, ' ');
  return flat.split(/(?<=[.!?])\s/)[0] ?? flat;
}

export default function ChecklistPage() {
  return (
    <main className="checklist">
      <div className="wrap">
        <header className="checklist-head">
          <span className="eyebrow">Free checklist</span>
          <h1 className="h2">The Data Pitfalls checklist</h1>
          <p className="intro">
            All {ruleCount()} pitfalls from <em>Avoiding Data Pitfalls</em> by Ben Jones (Wiley,
            2019), one line each. Run down the list before you share a chart, a dashboard, a query
            or a report.
          </p>
          <PrintButton />
        </header>
        {DOMAINS.map((domain) => (
          <section className="checklist-domain" key={domain}>
            <h2>{domain}</h2>
            <ul>
              {getRulesByDomain(domain).map((rule) => (
                <li key={rule.id}>
                  <span className="box" aria-hidden="true" />
                  <span>
                    <a href={rulePath(domain, rule.id)}>{rule.name}</a>
                    <br />
                    {firstSentence(rule.description)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <footer className="checklist-foot">
          <p>
            © Ben Jones / Data Literacy, Inc. Licensed under CC BY-NC 4.0: free to use and share
            with credit, not to sell. Full entries at www.avoidingdatapitfalls.com/pitfalls.
          </p>
          <p>
            Want your team to catch these before they ship?{' '}
            <a href="/training">Training from Data Literacy</a>.
          </p>
        </footer>
      </div>
    </main>
  );
}
