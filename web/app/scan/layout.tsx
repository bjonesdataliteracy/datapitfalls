import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Quick scan',
  description:
    'Scan a chart, written analysis, slide deck, analysis code or document for common data pitfalls.',
  alternates: { canonical: '/scan' },
};

export default function ScanLayout({ children }: { children: ReactNode }) {
  return children;
}
