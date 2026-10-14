import type { Metadata } from 'next';
import { ruleCount } from 'datapitfalls';
import { SignupForm } from '../components/SignupForm';
import { BOOK_URL, DATA_LITERACY_URL } from '../links';

// Training and reviews from Data Literacy, built on the Data Pitfalls taxonomy.
// The inquiry form posts to /api/signup like the checklist signup.

export const metadata: Metadata = {
  title: 'Train your team',
  description:
    'Data Pitfalls workshops and expert reviews from Ben Jones and Data Literacy, built on the book Avoiding Data Pitfalls.',
  alternates: { canonical: '/training' },
};

export default function TrainingPage() {
  const total = ruleCount();
  return (
    <main>
      <div className="hero hero-short">
        <div className="wrap">
          <span className="pill">
            From Data Literacy <b>Training</b>
          </span>
          <h1 className="hero-title hero-title-sm">TRAIN YOUR TEAM</h1>
          <p className="hero-sub">
            The connector helps Claude catch pitfalls. Training helps your people stop making them.
            Learn the {total} pitfalls from the author of <em>Avoiding Data Pitfalls</em>.
          </p>
          <div className="btn-row">
            <a className="btn btn-gold" href="#contact">
              Ask about training
            </a>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="product-grid offer-grid">
            <article className="product">
              <div className="product-top">
                <span className="eyebrow">Workshop</span>
              </div>
              <h3>Data Pitfalls workshop</h3>
              <p>
                A live session, in person or online, that walks your team through the pitfalls that
                matter most for your work, with real examples and hands-on practice.
              </p>
              <ul>
                <li>Built on the book, from its author&rsquo;s company</li>
                <li>
                  Your team audits its own charts and dashboards with Claude and the connector
                </li>
                <li>Everyone leaves with the checklist and the habit</li>
              </ul>
            </article>
            <article className="product">
              <div className="product-top">
                <span className="eyebrow">Review</span>
              </div>
              <h3>Pitfall Review</h3>
              <p>
                Send us a set of your key dashboards or reports. We check each one against the
                taxonomy and deliver a written report: what to fix, how serious it is, and how to
                fix it, followed by a debrief call.
              </p>
              <ul>
                <li>A fixed scope and a fixed price</li>
                <li>AI does the first pass; an expert signs off on every finding</li>
                <li>A natural starting point for a workshop</li>
              </ul>
            </article>
            <article className="product">
              <div className="product-top">
                <span className="eyebrow">Learn more</span>
              </div>
              <h3>Data Literacy</h3>
              <p>
                Data Literacy helps people learn the language of data and AI, with courses and
                workshops for individuals and teams.
              </p>
              <ul>
                <li>
                  <a href={DATA_LITERACY_URL}>dataliteracy.com</a>
                </li>
                <li>
                  <a href={BOOK_URL}>Get the book</a>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="contact">
        <div className="wrap">
          <h2 className="h2">Ask about training</h2>
          <p className="intro">
            Tell us a little about your team and what you&rsquo;d like to improve, and Ben will get
            back to you.
          </p>
          <SignupForm kind="training" />
        </div>
      </section>
    </main>
  );
}
