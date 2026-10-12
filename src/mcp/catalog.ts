// datapitfalls — MCP content
//
// Pure functions that turn the taxonomy into the text the MCP server returns.
// Kept apart from the server wiring so they're easy to test, and importing only
// the taxonomy module so the MCP path never loads the engine or its SDKs.

import {
  DOMAINS,
  getAllRules,
  ruleCountsByDomain,
  rulesForInput,
  type Domain,
  type PitfallRule,
  type RuleInputKind,
  type Severity,
} from '../taxonomy/index.js';

export const SITE_URL = 'https://www.avoidingdatapitfalls.com';
export const BOOK_CITATION = 'Avoiding Data Pitfalls by Ben Jones (Wiley, 2020)';

/** The footer every MCP response ends with. */
export const CITATION_FOOTER = `---\nSource: ${BOOK_CITATION} · ${SITE_URL}`;

/** The input types a client can ask for a checklist for. Several are aliases. */
export const CHECKLIST_INPUT_TYPES = [
  'sql',
  'code',
  'chart',
  'image',
  'prose',
  'text',
  'dashboard',
  'document',
] as const;

export type ChecklistInputType = (typeof CHECKLIST_INPUT_TYPES)[number];

const INPUT_KIND: Record<Exclude<ChecklistInputType, 'dashboard'>, RuleInputKind> = {
  sql: 'code',
  code: 'code',
  chart: 'image',
  image: 'image',
  prose: 'text',
  text: 'text',
  document: 'document',
};

const INPUT_LABEL: Record<ChecklistInputType, string> = {
  sql: 'SQL',
  code: 'code',
  chart: 'a chart',
  image: 'a chart image',
  prose: 'written analysis',
  text: 'written analysis',
  dashboard: 'a dashboard (its SQL and its charts)',
  document: 'a report document',
};

function withFooter(text: string): string {
  return `${text.trimEnd()}\n\n${CITATION_FOOTER}\n`;
}

function clean(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** The first sentence of a rule's description, for compact listings. */
export function summarize(rule: PitfallRule): string {
  const text = clean(rule.description);
  const match = /^(.+?[.!?])(\s|$)/.exec(text);
  return match?.[1] ?? text;
}

/**
 * The rules for a checklist input type. "dashboard" is the SQL (code) rules plus
 * the chart (image) rules, de-duplicated, with the chart rules first.
 */
export function rulesForChecklist(inputType: ChecklistInputType): PitfallRule[] {
  if (inputType !== 'dashboard') return rulesForInput(INPUT_KIND[inputType]);
  const seen = new Set<string>();
  const union: PitfallRule[] = [];
  for (const rule of [...rulesForInput('image'), ...rulesForInput('code')]) {
    if (seen.has(rule.id)) continue;
    seen.add(rule.id);
    union.push(rule);
  }
  return union;
}

// --- list_pitfalls -------------------------------------------------------------

export function listPitfalls(filter: { domain?: Domain; severity?: Severity } = {}): string {
  const rules = getAllRules().filter(
    (rule) =>
      (!filter.domain || rule.domain === filter.domain) &&
      (!filter.severity || rule.severity === filter.severity)
  );
  const scope = [filter.domain, filter.severity && `severity ${filter.severity}`]
    .filter(Boolean)
    .join(', ');
  if (rules.length === 0) {
    return withFooter(`No pitfalls match ${scope}. Call list_pitfalls with no filters to see all.`);
  }
  const lines = [`# Data pitfalls${scope ? ` (${scope})` : ''}: ${rules.length} rules`, ''];
  for (const domain of DOMAINS) {
    const inDomain = rules.filter((rule) => rule.domain === domain);
    if (inDomain.length === 0) continue;
    lines.push(`## ${domain}`);
    for (const rule of inDomain) {
      lines.push(`- \`${rule.id}\` · ${rule.name} · ${rule.severity}: ${summarize(rule)}`);
    }
    lines.push('');
  }
  lines.push('Call get_pitfall with an id for the full rule.');
  return withFooter(lines.join('\n'));
}

// --- get_pitfall ---------------------------------------------------------------

/** The full rule as Markdown. */
export function formatRule(rule: PitfallRule): string {
  return withFooter(
    [
      `# ${rule.name} (\`${rule.id}\`)`,
      `Domain: ${rule.domain} · Severity: ${rule.severity}`,
      '',
      clean(rule.description),
      '',
      '## How to detect it',
      clean(rule.detection_strategy),
      '',
      '## Example of the pitfall',
      clean(rule.example_bad),
      '',
      '## Example done well',
      clean(rule.example_good),
      '',
      '## Remediation',
      clean(rule.remediation),
      '',
      '## References',
      ...rule.references.map((ref) => `- ${ref}`),
    ].join('\n')
  );
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j]!;
      prev[j] = Math.min(above + 1, prev[j - 1]! + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return prev[b.length]!;
}

/** Up to `limit` rule ids that look like what the caller meant. */
export function suggestIds(input: string, limit = 3): string[] {
  const query = input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  if (!query) return [];
  const words = query.split('-').filter((w) => w.length > 2);
  return getAllRules()
    .map((rule) => {
      const name = rule.name.toLowerCase();
      // Edit distance, discounted for ids that contain the query (or vice versa)
      // and for shared words, so "dual axis" still finds "dual-axis-...".
      let score = levenshtein(query, rule.id) / Math.max(query.length, rule.id.length);
      if (rule.id.includes(query) || query.includes(rule.id)) score -= 0.5;
      const shared = words.filter((w) => rule.id.includes(w) || name.includes(w)).length;
      if (words.length) score -= (0.4 * shared) / words.length;
      return { id: rule.id, score };
    })
    .filter((candidate) => candidate.score < 0.6)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((candidate) => candidate.id);
}

/** The text for an id that isn't in the catalog. */
export function unknownRuleMessage(id: string): string {
  const suggestions = suggestIds(id);
  const hint = suggestions.length
    ? `Did you mean ${suggestions.map((s) => `\`${s}\``).join(', ')}?`
    : 'Call list_pitfalls or search_pitfalls to find the right id.';
  return withFooter(`No pitfall has the id \`${id}\`. ${hint}`);
}

// --- get_checklist -------------------------------------------------------------

export interface ChecklistResult {
  text: string;
  /** How many rules the checklist holds (0 when focus removed them all). */
  count: number;
}

export function buildChecklist(
  inputType: ChecklistInputType,
  focus?: readonly Domain[]
): ChecklistResult {
  const all = rulesForChecklist(inputType);
  const rules = focus?.length ? all.filter((rule) => focus.includes(rule.domain)) : all;
  if (rules.length === 0) {
    const covered = DOMAINS.filter((domain) => all.some((rule) => rule.domain === domain));
    return {
      count: 0,
      text: withFooter(
        `None of the ${inputType} rules are in ${focus!.join(', ')}. ` +
          `The ${inputType} checklist covers: ${covered.join(', ')}.`
      ),
    };
  }

  // Group by domain, keeping the rule order inside each group. For dashboards
  // the chart domains come first, because that's the order the rules arrive in.
  const domainOrder: Domain[] = [];
  for (const rule of rules) if (!domainOrder.includes(rule.domain)) domainOrder.push(rule.domain);

  const lines = [
    `# Data pitfalls checklist for ${INPUT_LABEL[inputType]}: ${rules.length} rules`,
    '',
    'Work through every item against the actual work. For each one, decide whether the pitfall is',
    'active (evident from the work itself), latent (a risky pattern whose impact depends on data you',
    "can't see; name the condition under which it bites), avoided (the work has a concrete",
    "countermeasure you can point to), or not applicable. Report findings with the rule id. Don't",
    'stretch: a short list of real findings beats a long list of speculative ones.',
  ];
  let n = 0;
  for (const domain of domainOrder) {
    lines.push('', `## ${domain}`);
    for (const rule of rules.filter((r) => r.domain === domain)) {
      n += 1;
      lines.push(
        '',
        `${n}. **${rule.name}** (\`${rule.id}\`, ${rule.severity})`,
        `   - Check for: ${clean(rule.detection_strategy)}`,
        `   - Fix: ${clean(rule.remediation)}`
      );
    }
  }
  lines.push('', 'Call get_pitfall with an id for examples and the book reference.');
  return { count: rules.length, text: withFooter(lines.join('\n')) };
}

// --- search_pitfalls -----------------------------------------------------------

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was']);

export interface SearchHit {
  rule: PitfallRule;
  score: number;
}

/** Keyword search over id, name, description and detection strategy. */
export function searchRules(query: string, limit = 10): SearchHit[] {
  const terms = [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    ),
  ];
  if (terms.length === 0) return [];
  return getAllRules()
    .map((rule) => {
      const title = `${rule.id} ${rule.name}`.toLowerCase();
      const body = `${rule.description} ${rule.detection_strategy}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += 3;
        if (body.includes(term)) score += 1;
      }
      return { rule, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function searchPitfalls(query: string): string {
  const hits = searchRules(query);
  if (hits.length === 0) {
    return withFooter(
      `No pitfalls matched "${query.trim()}". Try a broader keyword, or call list_pitfalls to browse.`
    );
  }
  const lines = [`# Pitfalls matching "${query.trim()}": ${hits.length}`, ''];
  for (const { rule } of hits) {
    lines.push(
      `- \`${rule.id}\` · ${rule.name} (${rule.domain}, ${rule.severity}): ${summarize(rule)}`
    );
  }
  lines.push('', 'Call get_pitfall with an id for the full rule.');
  return withFooter(lines.join('\n'));
}

// --- resources -----------------------------------------------------------------

export function domainsOverview(): string {
  const counts = ruleCountsByDomain();
  const lines = [
    `# The ${DOMAINS.length} data pitfall domains (${getAllRules().length} rules)`,
    '',
  ];
  for (const domain of DOMAINS) lines.push(`- ${domain}: ${counts[domain]} rules`);
  lines.push('', 'Call list_pitfalls with a domain to see its rules.');
  return withFooter(lines.join('\n'));
}
