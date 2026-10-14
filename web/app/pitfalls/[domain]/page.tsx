import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DOMAINS, getRulesByDomain } from 'datapitfalls';
import type { PitfallRule } from 'datapitfalls';
import { DOMAIN_BLURBS, domainFromSlug, domainSlug } from '../../site';

// One page per domain. Each pitfall is an anchored section, so a single rule
// links as /pitfalls/<domain>#<rule-id>.

type Params = { domain: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return DOMAINS.map((d) => ({ domain: domainSlug(d) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const domain = domainFromSlug((await params).domain);
  if (!domain) return {};
  return {
    title: domain,
    description: `${DOMAIN_BLURBS[domain]} The ${domain} pitfalls from Avoiding Data Pitfalls by Ben Jones.`,
    alternates: { canonical: `/pitfalls/${domainSlug(domain)}` },
  };
}

/** The YAML text is folded prose; blank lines separate paragraphs. */
function Paras({ text }: { text: string }) {
  return (
    <>
      {text
        .trim()
        .split(/\n\s*\n/)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </>
  );
}

function Rule({ rule }: { rule: PitfallRule }) {
  return (
    <article className="rule" id={rule.id}>
      <div className="rule-meta">
        <span className={`sev sev-${rule.severity}`}>{rule.severity}</span>
        <span>{rule.id}</span>
      </div>
      <h2>
        <a href={`#${rule.id}`}>{rule.name}</a>
      </h2>
      <h3>What it is</h3>
      <Paras text={rule.description} />
      <h3>How to spot it</h3>
      <Paras text={rule.detection_strategy} />
      <div className="examples">
        <div className="example example-bad">
          <h3>Pitfall</h3>
          <Paras text={rule.example_bad} />
        </div>
        <div className="example example-good">
          <h3>Done well</h3>
          <Paras text={rule.example_good} />
        </div>
      </div>
      <h3>How to fix it</h3>
      <Paras text={rule.remediation} />
      {rule.references.filter((r) => !r.startsWith('http')).length > 0 && (
        <p className="refs">{rule.references.filter((r) => !r.startsWith('http')).join(' · ')}</p>
      )}
    </article>
  );
}

export default async function DomainPage({ params }: { params: Promise<Params> }) {
  const domain = domainFromSlug((await params).domain);
  if (!domain) notFound();
  const rules = getRulesByDomain(domain);

  return (
    <main>
      <div className="hero hero-short">
        <div className="wrap">
          <a className="pill" href="/pitfalls">
            Pitfall library <b>{rules.length}</b>
          </a>
          <h1 className="hero-title hero-title-sm">{domain.toUpperCase()}</h1>
          <p className="hero-sub">{DOMAIN_BLURBS[domain]}</p>
          <nav className="domain-nav" aria-label="Domains">
            {DOMAINS.map((d) => (
              <a
                key={d}
                href={`/pitfalls/${domainSlug(d)}`}
                aria-current={d === domain ? 'page' : undefined}
              >
                {d}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <section className="section">
        <div className="wrap library">
          <aside className="toc">
            <span className="eyebrow">In this domain</span>
            <ol>
              {rules.map((r) => (
                <li key={r.id}>
                  <a href={`#${r.id}`}>{r.name}</a>
                </li>
              ))}
            </ol>
          </aside>
          <div>
            {rules.map((r) => (
              <Rule rule={r} key={r.id} />
            ))}
            <aside className="library-cta">
              <p>
                <b>Want your team to catch these before they ship?</b> Data Literacy runs Data
                Pitfalls workshops and expert reviews.
              </p>
              <div className="btn-row">
                <a className="btn btn-primary" href="/training">
                  Train your team
                </a>
                <a className="btn btn-outline" href="/#checklist">
                  Get the free checklist
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
