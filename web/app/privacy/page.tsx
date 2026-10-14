import type { Metadata } from 'next';
import styles from '../info.module.css';

// Privacy policy for the datapitfalls web app and the Data Pitfalls MCP
// connector. This is the privacy policy URL for the Claude connector directory
// listing. Keep it in step with what the code actually does.

export const metadata: Metadata = {
  title: 'Privacy policy — datapitfalls',
  description:
    'What the datapitfalls web app and the Data Pitfalls MCP connector collect and keep.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className={`container ${styles.page}`}>
      <a className={styles.back} href="/">
        ← datapitfalls
      </a>
      <h1>Privacy policy</h1>
      <p className={styles.lede}>
        This covers the datapitfalls web app at www.avoidingdatapitfalls.com and the Data Pitfalls
        MCP connector at www.avoidingdatapitfalls.com/api/mcp. In short: the connector and the
        scanner don&rsquo;t ask who you are and don&rsquo;t store what you send. The only personal
        data we collect is what you choose to give in the checklist signup or the training form.
      </p>

      <h2>The MCP connector</h2>
      <p>
        The connector serves the Avoiding Data Pitfalls taxonomy to Claude. It has no accounts and
        no sign-in.
      </p>
      <ul>
        <li>
          <strong>What it receives:</strong> the tool requests Claude makes, such as a rule id, a
          search keyword, or the kind of work to get a checklist for. The work you ask Claude to
          review stays in your conversation with Claude and is not sent to the connector. The one
          exception is the optional <code>review_for_pitfalls</code> prompt: if you pass it text,
          that text is sent to the connector, placed into the prompt, and returned to Claude in the
          same request.
        </li>
        <li>
          <strong>What it keeps:</strong> nothing. The connector has no database and does not log
          request contents. Each request is handled on its own and then discarded.
        </li>
        <li>
          <strong>Rate limiting:</strong> to prevent abuse, the server counts requests per IP
          address in memory for about a minute. These counts are not written anywhere.
        </li>
        <li>
          <strong>No AI calls:</strong> the connector makes no calls to Anthropic or any other AI
          service.
        </li>
      </ul>

      <h2>The web app</h2>
      <ul>
        <li>
          <strong>What you submit:</strong> the charts, text, code or documents you scan are sent to
          Anthropic&rsquo;s Claude API to run the audit and are not stored by this app. Anthropic
          handles API data under its{' '}
          <a href="https://www.anthropic.com/legal/privacy" rel="noreferrer">
            privacy policy
          </a>
          . Please don&rsquo;t upload confidential or personal data.
        </li>
        <li>
          <strong>Rate limiting:</strong> scans are limited per IP address, counted in memory for
          about a minute and not stored.
        </li>
        <li>
          <strong>Analytics:</strong> we use Vercel Web Analytics, which is cookieless and does not
          collect personal data, to count page views.
        </li>
      </ul>

      <h2>Checklist signup and training inquiries</h2>
      <ul>
        <li>
          <strong>What we collect:</strong> your email address when you sign up for the free
          checklist, and, if you use the training form, the name, company, team size and message you
          enter.
        </li>
        <li>
          <strong>Why:</strong> to send you the checklist and occasional emails about avoiding data
          pitfalls from Data Literacy, Inc., or to reply to your training inquiry. You can
          unsubscribe from any email at any time.
        </li>
        <li>
          <strong>Where it goes:</strong> this site doesn&rsquo;t keep it. Checklist signups are
          added to Data Literacy&rsquo;s mailing list in{' '}
          <a href="https://resend.com/legal/privacy-policy" rel="noreferrer">
            Resend
          </a>
          , the email service we use, and kept there until you unsubscribe or ask us to delete them.
          Training inquiries are sent to Data Literacy by email through Resend.
        </li>
        <li>
          <strong>Your choices:</strong> to see, correct or delete your details, contact Ben Jones
          through dataliteracy.com (below).
        </li>
      </ul>

      <h2>Hosting and third parties</h2>
      <p>
        The site and connector run on Vercel. Like any web host, Vercel processes standard request
        information such as IP addresses to deliver and protect the service, and keeps short-lived
        operational logs under its own{' '}
        <a href="https://vercel.com/legal/privacy-policy" rel="noreferrer">
          privacy policy
        </a>
        . Signup and training details are handled by Resend, our email service, as described above.
        We don&rsquo;t sell or share data with anyone else.
      </p>

      <h2>Retention</h2>
      <p>
        We keep no copies of what you send to the web app or the connector. Signup and inquiry
        details are kept by Data Literacy until you unsubscribe or ask us to delete them. Rate-limit
        counts last about a minute. Hosting logs are kept by Vercel for its standard retention
        period.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or your data: open an issue on{' '}
        <a href="https://github.com/bjonesdataliteracy/datapitfalls/issues" rel="noreferrer">
          GitHub
        </a>{' '}
        or contact Ben Jones through{' '}
        <a href="https://dataliteracy.com" rel="noreferrer">
          dataliteracy.com
        </a>
        .
      </p>

      <p className={styles.updated}>Last updated October 14, 2026.</p>
    </main>
  );
}
