import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import {
  BOOK_URL,
  DATA_LITERACY_URL,
  GITHUB_URL,
  LAB_DETECTOR_URL,
  NPM_URL,
  SITE_URL,
} from './links';

const TITLE = 'Data Pitfalls: the mistakes that mislead in data work';
const DESCRIPTION =
  'The 78 pitfalls from the book Avoiding Data Pitfalls by Ben Jones. Add them to Claude with the free Data Pitfalls MCP, check your work with the Pitfalls Detector in the Data Literacy Lab, or browse the library.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s · Data Pitfalls' },
  description: DESCRIPTION,
  applicationName: 'Data Pitfalls',
  keywords: [
    'data pitfalls',
    'avoiding data pitfalls',
    'data visualization',
    'data literacy',
    'MCP',
    'Claude connector',
    'Ben Jones',
  ],
  authors: [{ name: 'Ben Jones', url: DATA_LITERACY_URL }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Data Pitfalls',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FONTS =
  'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Viga&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <SiteNav />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}

function SiteNav() {
  return (
    <header className="site-nav">
      <div className="wrap">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Data Pitfalls
        </a>
        <nav className="nav-links" aria-label="Main">
          <a href="/#claude">For Claude</a>
          <a href="/pitfalls">Pitfall library</a>
          <a href="/#book">The book</a>
          <a href={LAB_DETECTOR_URL}>Pitfalls Detector</a>
        </nav>
        <span className="nav-spacer" />
        <a className="btn btn-primary btn-sm" href="/#claude">
          Add to Claude
        </a>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div>
          <a href={DATA_LITERACY_URL} aria-label="Data Literacy">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="foot-logo"
              src="/data-literacy-logo-white.png"
              alt="Data Literacy: learn the language of data and AI"
              width={200}
              height={32}
            />
          </a>
          <p>
            Data Pitfalls is by Ben Jones, author of <em>Avoiding Data Pitfalls</em> and founder of
            Data Literacy, Inc.
          </p>
        </div>
        <div>
          <h4>Use it</h4>
          <a href="/#claude">Add to Claude</a>
          <a href={LAB_DETECTOR_URL}>Pitfalls Detector</a>
          <a href="/pitfalls">Pitfall library</a>
        </div>
        <div>
          <h4>Learn</h4>
          <a href={BOOK_URL}>Buy the book</a>
          <a href={DATA_LITERACY_URL}>Data Literacy</a>
          <a href="/mcp">Connector setup guide</a>
        </div>
        <div>
          <h4>Open source</h4>
          <a href={GITHUB_URL}>GitHub</a>
          <a href={NPM_URL}>npm package</a>
          <a href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
