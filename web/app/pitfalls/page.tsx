import type { Metadata } from 'next';
import { getRulesByDomain, ruleCount } from 'datapitfalls';
import { domainSummaries, rulePath } from '../site';

export const metadata: Metadata = {
  title: 'Pitfall library',
  description:
    'All the pitfalls from Avoiding Data Pitfalls by Ben Jones, in eight domains, each with how to spot it and how to fix it.',
  alternates: { canonical: '/pitfalls' },
};

export default function PitfallsIndex() {
  const total = ruleCount();
  return (
    <main>
      <div className="hero hero-short">
        <div className="wrap">
          <span className="pill">
            Avoiding Data Pitfalls <b>{total} rules</b>
          </span>
          <h1 className="hero-title hero-title-sm">PITFALL LIBRARY</h1>
          <p className="hero-sub">
            Every pitfall in the taxonomy, grouped into the book&rsquo;s eight domains. Pick a
            domain to read what each pitfall is, how to spot it and how to fix it.
          </p>
        </div>
      </div>
      <section className="section">
        <div className="wrap">
          <div className="domain-grid" style={{ marginTop: 0 }}>
            {domainSummaries().map((d) => (
              <div className="domain-card" key={d.slug}>
                <span className="domain-count">{d.count}</span>
                <a className="domain-name" href={`/pitfalls/${d.slug}`}>
                  {d.domain}
                </a>
                <span className="domain-blurb">{d.blurb}</span>
                <ul className="rule-list">
                  {getRulesByDomain(d.domain).map((r) => (
                    <li key={r.id}>
                      <a href={rulePath(d.domain, r.id)}>{r.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
