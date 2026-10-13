import { ruleCount } from 'datapitfalls';
import { SetupTabs } from './components/SetupTabs';
import { BOOK_URL, DATA_LITERACY_URL, GITHUB_URL, LAB_DETECTOR_URL } from './links';
import { domainSummaries, rulePath } from './site';

// The home page: what Data Pitfalls is, and the three ways to use it (the MCP
// for Claude, the Lab's Pitfalls Detector, and the book).

const TOOLS: Array<[string, string]> = [
  ['get_checklist', 'The rules for a chart, SQL, dashboard or report'],
  ['get_pitfall', 'One rule in full, with examples'],
  ['search_pitfalls', 'Find rules by topic'],
  ['list_pitfalls', 'All the rules, by domain'],
];

export default function Home() {
  const total = ruleCount();
  const domains = domainSummaries();
  const largest = Math.max(...domains.map((d) => d.count));

  return (
    <main>
      <div className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-vortex" src="/vortex.jpg" alt="" width={1200} height={900} />
        <div className="wrap">
          <span className="pill">
            From the book by Ben Jones <b>{total} pitfalls</b>
          </span>
          <h1 className="hero-title">
            DATA
            <br />
            PITFALLS
          </h1>
          <p className="kicker">Spot them · Name them · Fix them</p>
          <p className="lede">
            The common mistakes that mislead in charts, dashboards, SQL and reports, made by humans
            and AI alike.
          </p>
          <p className="hero-sub">
            One taxonomy of {total} pitfalls across eight domains, from{' '}
            <em>Avoiding Data Pitfalls</em> (Wiley). Read it, put it inside Claude, or run it on
            your own work in the Data Literacy Lab.
          </p>
          <div className="btn-row">
            <a className="btn btn-gold" href="#claude">
              Add Data Pitfalls to Claude
            </a>
            <a className="btn btn-ghost" href="/pitfalls">
              Browse the {total} pitfalls
            </a>
          </div>
        </div>
      </div>

      <section className="products" aria-label="Three ways to use Data Pitfalls">
        <div className="wrap">
          <div className="product-grid">
            <article className="product">
              <div className="product-top">
                <span className="eyebrow">In Claude</span>
                <span className="chip chip-free">Free</span>
              </div>
              <h3>Data Pitfalls MCP</h3>
              <p>
                Give Claude the full checklist. Ask it to review a chart, a query or a dashboard,
                and it checks the work against every rule and names each finding.
              </p>
              <ul>
                <li>Works in claude.ai and Claude Code</li>
                <li>No API key and no sign-up</li>
                <li>Open source on GitHub and npm</li>
              </ul>
              <div className="product-cta">
                <a className="btn btn-primary" href="#claude">
                  Set it up
                </a>
              </div>
            </article>
            <article className="product">
              <div className="product-top">
                <span className="eyebrow">In the Lab</span>
                <span className="chip chip-pro">Pro</span>
              </div>
              <h3>Pitfalls Detector</h3>
              <p>
                Upload a chart, a deck, code or a write-up and get a reviewer&rsquo;s report back: a
                verdict, the one thing to fix first, and what you already did well.
              </p>
              <ul>
                <li>Up to four charts checked together</li>
                <li>Sample reports on real published charts</li>
                <li>Part of the Data Literacy Lab</li>
              </ul>
              <div className="product-cta">
                <a className="btn btn-primary" href={LAB_DETECTOR_URL}>
                  Open the detector
                </a>
              </div>
            </article>
            <article className="product">
              <div className="product-top">
                <span className="eyebrow">On paper</span>
                <span className="chip chip-book">Book</span>
              </div>
              <h3>Avoiding Data Pitfalls</h3>
              <p>
                The book the rules come from: how to steer clear of common blunders when working
                with data, with the stories behind each one.
              </p>
              <ul>
                <li>Ben Jones, Wiley, 2019</li>
                <li>Seven chapters of pitfalls</li>
                <li>Paperback and ebook</li>
              </ul>
              <div className="product-cta">
                <a className="btn btn-outline" href="#book">
                  About the book
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="claude">
        <div className="wrap">
          <h2 className="h2">Put the checklist inside Claude</h2>
          <p className="intro">
            The Data Pitfalls MCP is a free connector. It doesn&rsquo;t run anything on your work or
            see your data. It hands Claude the rules, and Claude does the checking in your own chat.
          </p>
          <div className="split">
            <div>
              <SetupTabs />
              <div className="tool-grid">
                {TOOLS.map(([name, what]) => (
                  <div className="tool" key={name}>
                    <code>{name}</code>
                    <br />
                    {what}
                  </div>
                ))}
              </div>
              <p className="footnote">
                More detail in the <a href="/mcp">connector setup guide</a>. Source on{' '}
                <a href={GITHUB_URL}>GitHub</a>.
              </p>
            </div>
            <div className="chat" aria-label="Example conversation">
              <div className="chat-head">
                <span>Example in Claude</span>
                <span>Data Pitfalls</span>
              </div>
              <div className="chat-body">
                <div className="chat-user">
                  Here&rsquo;s our quarterly sales chart for the board deck. Anything misleading?
                </div>
                <div className="chat-tool">Data Pitfalls · get_checklist(chart)</div>
                <div className="chat-finding">
                  <b>Truncated Y-Axis</b>{' '}
                  <a href={rulePath('Graphical Gaffes', 'truncated-y-axis')}>truncated-y-axis</a>
                  <br />
                  The bars start at $40M, so Q4 looks three times taller than Q1 for a 12% gain.
                  Start the axis at zero, or switch to a line or dot plot.
                </div>
                <div className="chat-finding minor">
                  <b>Cherry-Picked Chart Window</b>{' '}
                  <a href={rulePath('Graphical Gaffes', 'cherry-picked-chart-window')}>
                    cherry-picked-chart-window
                  </a>
                  <br />
                  Only four quarters are shown. Add last year so the board can see whether Q4 is
                  seasonal.
                </div>
                <div className="chat-note">
                  An illustration of a review. Rules from <i>Avoiding Data Pitfalls</i> by Ben
                  Jones.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="library">
        <div className="wrap">
          <h2 className="h2">Eight domains, {total} pitfalls</h2>
          <p className="intro">
            Each pitfall has its own entry: what it is, how to spot it, an example done badly and
            done well, and how to fix it. These are the entries Claude cites when it reports a
            finding.
          </p>
          <div className="domain-grid">
            {domains.map((d) => (
              <a className="domain-card" href={`/pitfalls/${d.slug}`} key={d.slug}>
                <span className="domain-count">{d.count}</span>
                <span className="domain-name">{d.domain}</span>
                <span className="share-bar" aria-hidden="true">
                  <span style={{ width: `${(d.count / largest) * 100}%` }} />
                </span>
                <span className="domain-blurb">{d.blurb}</span>
              </a>
            ))}
          </div>
          <p className="footnote">Bar length shows each domain&rsquo;s number of pitfalls.</p>
        </div>
      </section>

      <section className="section" id="book">
        <div className="wrap book">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="cover"
            src="/book-cover.jpg"
            alt="Cover of Avoiding Data Pitfalls by Ben Jones"
            width={402}
            height={500}
          />
          <div>
            <span className="eyebrow">The book</span>
            <h2 className="h2" style={{ marginTop: 10 }}>
              Where the rules come from
            </h2>
            <p className="intro">
              Ben Jones wrote{' '}
              <em>
                Avoiding Data Pitfalls: How to Steer Clear of Common Blunders When Working with Data
                and Presenting Analysis and Visualizations
              </em>{' '}
              (Wiley, 2019). The taxonomy behind the connector and the Lab detector is built
              directly from its chapters.
            </p>
            <div className="btn-row">
              <a className="btn btn-primary" href={BOOK_URL}>
                Get the book
              </a>
              <a className="btn btn-outline" href={DATA_LITERACY_URL}>
                Training from Data Literacy
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
