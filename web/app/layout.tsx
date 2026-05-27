import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';

const SITE_URL = 'https://www.avoidingdatapitfalls.com';
const TITLE = 'datapitfalls — audit your data work for common pitfalls';
const DESCRIPTION =
  'Audit charts, code, written analysis, and documents for common data pitfalls — from how a question is framed to the final chart. Powered by Claude, grounded in the taxonomy from the book Avoiding Data Pitfalls.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'datapitfalls',
  keywords: [
    'data pitfalls',
    'data visualization',
    'chart audit',
    'data literacy',
    'data quality',
    'avoiding data pitfalls',
  ],
  authors: [{ name: 'Ben Jones', url: 'https://dataliteracy.com' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'datapitfalls',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
