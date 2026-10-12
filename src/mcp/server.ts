// datapitfalls — MCP server
//
// Serves the Avoiding Data Pitfalls taxonomy over the Model Context Protocol so
// Claude, in whatever client the user has, can check data work against the
// rules itself. Read-only: no network access, no Anthropic API calls, no key.
//
// Only the taxonomy is imported here — never src/index.ts — so the engine and
// its SDKs (@anthropic-ai/sdk, mammoth, fflate) are never loaded on this path.
//
// Tool layout: the four tools below are the stable, keyless surface. A later
// engine-backed tool (e.g. `scan_with_engine`, calling detectPitfalls with a
// key) can be registered alongside them without changing any of them.

import { createRequire } from 'node:module';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DOMAINS, SEVERITIES, getAllRules, getRule } from '../taxonomy/index.js';
import {
  BOOK_CITATION,
  CHECKLIST_INPUT_TYPES,
  SITE_URL,
  buildChecklist,
  domainsOverview,
  formatRule,
  listPitfalls,
  searchPitfalls,
  summarize,
  unknownRuleMessage,
  type ChecklistInputType,
} from './catalog.js';

const pkg = createRequire(import.meta.url)('../../package.json') as { version: string };

export const SERVER_NAME = 'datapitfalls';

const INSTRUCTIONS = `This server holds the Avoiding Data Pitfalls taxonomy: ${getAllRules().length} rules for common mistakes in data work, from ${BOOK_CITATION} (${SITE_URL}). It does not run checks itself: you do the checking, using its rules.

When asked to check a SQL query, chart, dashboard, analysis write-up or report for data pitfalls (or after building one), call get_checklist for that kind of work, check every item against the actual work, and report findings with their rule ids. Use get_pitfall for a rule's examples and search_pitfalls to find rules by topic. Cite the book and site when you report.`;

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

function text(body: string, isError = false) {
  return { content: [{ type: 'text' as const, text: body }], ...(isError ? { isError } : {}) };
}

const domainSchema = z.enum(DOMAINS);

/** Build a datapitfalls MCP server with its tools, prompt and resources registered. */
export function createDataPitfallsServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, title: 'Data Pitfalls', version: pkg.version },
    { instructions: INSTRUCTIONS }
  );

  server.registerTool(
    'list_pitfalls',
    {
      title: 'List data pitfalls',
      description:
        'List the Avoiding Data Pitfalls rules: id, name, domain, severity and a one-line summary, grouped by domain. ' +
        'Optionally filter by domain or severity. Use it to browse the taxonomy or find rule ids; ' +
        'to review a piece of work, call get_checklist instead.',
      inputSchema: {
        domain: domainSchema.optional().describe('Only rules in this domain.'),
        severity: z.enum(SEVERITIES).optional().describe('Only rules with this severity.'),
      },
      annotations: { title: 'List data pitfalls', ...READ_ONLY },
    },
    async ({ domain, severity }) => text(listPitfalls({ domain, severity }))
  );

  server.registerTool(
    'get_pitfall',
    {
      title: 'Get a data pitfall',
      description:
        'Get one Avoiding Data Pitfalls rule in full by id: what it is, how to detect it, an example of the pitfall, ' +
        'an example done well, how to fix it, and the book reference. Use it to explain a finding or to see examples.',
      inputSchema: {
        id: z.string().min(1).describe('The rule id, e.g. "truncated-y-axis".'),
      },
      annotations: { title: 'Get a data pitfall', ...READ_ONLY },
    },
    async ({ id }) => {
      const rule = getRule(id.trim());
      return rule ? text(formatRule(rule)) : text(unknownRuleMessage(id), true);
    }
  );

  server.registerTool(
    'get_checklist',
    {
      title: 'Get a data pitfalls checklist',
      description:
        'Call this before reviewing any data work for data pitfalls: a SQL query, code, a chart, a dashboard, ' +
        'a written analysis or a report document. Returns the Avoiding Data Pitfalls rules that apply to that kind of ' +
        'work as a checklist, each with what to check for and how to fix it. After building a dashboard, call it with ' +
        'inputType "dashboard" and check every chart\'s SQL and design against it, then fix what you find. ' +
        'Uses the same rule selection as the datapitfalls engine.',
      inputSchema: {
        inputType: z
          .enum(CHECKLIST_INPUT_TYPES)
          .describe(
            'The kind of work: "sql" or "code"; "chart" or "image"; "prose" or "text"; "dashboard" ' +
              '(SQL rules plus chart rules); or "document" (a report mixing prose, tables and charts).'
          ),
        focus: z.array(domainSchema).optional().describe('Narrow the checklist to these domains.'),
      },
      annotations: { title: 'Get a data pitfalls checklist', ...READ_ONLY },
    },
    async ({ inputType, focus }) => {
      const result = buildChecklist(inputType, focus);
      return text(result.text, result.count === 0);
    }
  );

  server.registerTool(
    'search_pitfalls',
    {
      title: 'Search data pitfalls',
      description:
        'Keyword search over the Avoiding Data Pitfalls rules (name, description and how to detect them). ' +
        'Use it to find the rule for a specific concern, e.g. "percent change", "missing values", "dual axis".',
      inputSchema: {
        query: z.string().describe('One or more keywords.'),
      },
      annotations: { title: 'Search data pitfalls', ...READ_ONLY },
    },
    async ({ query }) => {
      if (!query.trim()) return text('Give search_pitfalls at least one keyword.', true);
      return text(searchPitfalls(query));
    }
  );

  server.registerPrompt(
    'review_for_pitfalls',
    {
      title: 'Review for data pitfalls',
      description:
        'Review a piece of data work (SQL, chart, dashboard, prose or document) against the Avoiding Data Pitfalls rules.',
      argsSchema: {
        inputType: z
          .enum(CHECKLIST_INPUT_TYPES)
          .describe(
            'The kind of work: sql, code, chart, image, prose, text, dashboard or document.'
          ),
        artifact: z
          .string()
          .optional()
          .describe(
            'The work to review (or leave empty to review what is already in the conversation).'
          ),
      },
    },
    ({ inputType, artifact }) => ({
      messages: [
        {
          role: 'user' as const,
          content: { type: 'text' as const, text: reviewPrompt(inputType, artifact) },
        },
      ],
    })
  );

  server.registerResource(
    'pitfall',
    new ResourceTemplate('datapitfalls://rules/{id}', {
      list: async () => ({
        resources: getAllRules().map((rule) => ({
          uri: `datapitfalls://rules/${rule.id}`,
          name: rule.id,
          title: rule.name,
          description: summarize(rule),
          mimeType: 'text/markdown',
        })),
      }),
      complete: {
        id: (value) =>
          getAllRules()
            .map((rule) => rule.id)
            .filter((id) => id.startsWith(value)),
      },
    }),
    {
      title: 'Data pitfall rule',
      description: 'One Avoiding Data Pitfalls rule in full, as Markdown.',
      mimeType: 'text/markdown',
    },
    async (uri, { id }) => {
      const ruleId = Array.isArray(id) ? id[0] : id;
      const rule = ruleId ? getRule(ruleId) : undefined;
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: rule ? formatRule(rule) : unknownRuleMessage(ruleId ?? ''),
          },
        ],
      };
    }
  );

  server.registerResource(
    'domains',
    'datapitfalls://domains',
    {
      title: 'Data pitfall domains',
      description: 'The eight Avoiding Data Pitfalls domains with their rule counts.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: 'text/markdown', text: domainsOverview() }],
    })
  );

  return server;
}

/** The review method behind the review_for_pitfalls prompt. It mirrors the
 *  engine's report shape (src/analyze.ts, src/report.ts) so a later
 *  engine-backed tool reads like the same product. */
export function reviewPrompt(inputType: ChecklistInputType, artifact?: string): string {
  const subject = artifact?.trim()
    ? `the ${inputType} below`
    : `the ${inputType} work in this conversation`;
  const lines = [
    `Review ${subject} for data pitfalls, using the Avoiding Data Pitfalls taxonomy.`,
    '',
    '## Method',
    `1. Call get_checklist with inputType "${inputType}" and work through every item against the actual work.`,
    '2. Report a finding only when the work shows real evidence of the pitfall. Be conservative: avoid speculation and false positives.',
    '3. Classify each finding:',
    '   - **active**: evident from the work itself.',
    "   - **latent**: a risky pattern whose impact depends on data you can't see (e.g. a filter that only matters if nulls exist). Phrase it conditionally and state the data condition under which it bites.",
    '4. Rate how much each finding matters: **changes-takeaway** (fixing it would likely change the conclusion), **weakens-support** (the conclusion may stand but is less supported than presented) or **polish** (clearer or better crafted, same message). Most findings are not changes-takeaway.',
    '5. Note up to two pitfalls the work visibly avoided, only where it has a concrete countermeasure you can cite (a guard, a stated caveat, a deliberate choice). Zero is common and fine.',
    '',
    '## Report',
    'Start with one or two sentences on the overall state of the work: lead with whether it is fundamentally sound, then the single most important thing to address. If every finding is latent, say plainly that nothing is evidently wrong and frame them as conditions to verify.',
    '',
    'Then list findings, most consequential first, active before latent. For each:',
    '- **Rule**: name and id (e.g. Truncated Y-Axis, `truncated-y-axis`), domain and severity',
    '- **Nature**: active or latent (with the condition, if latent) · **Consequence**: changes-takeaway, weakens-support or polish',
    '- **Evidence**: quote the line or phrase, or name the chart element (axis, legend, mark, label)',
    '- **Why it matters**: one or two sentences',
    '- **Fix**: the remediation, applied to this work',
    '',
    'Then **Avoided** (if any), with the evidence. If nothing was found, say "No pitfalls detected", along with how many rules you checked against: a clean review means none of the cataloged pitfalls were found, not that the work is correct.',
    '',
    `Close by citing ${BOOK_CITATION} and ${SITE_URL}.`,
  ];
  if (artifact?.trim()) lines.push('', '## The work', '', artifact.trim());
  return lines.join('\n');
}
