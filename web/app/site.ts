import { DOMAINS, ruleCountsByDomain } from 'datapitfalls';
import type { Domain } from 'datapitfalls';

// Taxonomy helpers for the server-rendered library pages.

/** URL slug for a domain: "Statistical Slip-Ups" → "statistical-slip-ups". */
export function domainSlug(domain: Domain): string {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function domainFromSlug(slug: string): Domain | undefined {
  return DOMAINS.find((d) => domainSlug(d) === slug);
}

/** Link to one rule: its anchor on its domain's library page. */
export function rulePath(domain: Domain, id: string): string {
  return `/pitfalls/${domainSlug(domain)}#${id}`;
}

export function domainSummaries() {
  const counts = ruleCountsByDomain();
  return DOMAINS.map((domain) => ({
    domain,
    slug: domainSlug(domain),
    count: counts[domain],
    blurb: DOMAIN_BLURBS[domain],
  }));
}

/** One-line description of each domain, for the library index. */
export const DOMAIN_BLURBS: Record<Domain, string> = {
  'Epistemic Errors':
    'How we think about data: mistaking the record for reality, and claiming more than it can show.',
  'Technical Trespasses':
    'Joins, nulls, types and encodings that quietly corrupt the data before analysis starts.',
  'Mathematical Miscues':
    'Arithmetic that goes wrong: unweighted rates, mixed units, percent versus percentage points.',
  'Statistical Slip-Ups':
    'Misreading samples, averages and significance, from survivorship bias to Simpson’s paradox.',
  'Analytical Aberrations':
    'Reasoning errors: correlation read as causation, extrapolating too far, gaming a metric.',
  'Graphical Gaffes':
    'Charts that distort: truncated axes, dual axes, 3D, and the wrong chart for the message.',
  'Design Dangers':
    'Design choices that confuse or exclude: unsafe color, low contrast, unclear interactions.',
  'Biased Baseline':
    'Whose voice is missing from the data, and how that silence shapes the conclusions.',
};
