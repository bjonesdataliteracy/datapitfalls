// datapitfalls — analysis engine
//
// Audits a piece of data work (code, or a plain-English description) against the
// pitfall catalog by grounding Claude on the relevant rules and collecting
// structured findings via a forced tool call. Rule ids in the model's output are
// validated against the catalog, so a finding can only ever reference a real rule.

import Anthropic from '@anthropic-ai/sdk';
import { getAllRules, getRule, getRulesByDomain } from './taxonomy/index.js';
import type { Domain, PitfallRule, Severity } from './taxonomy/index.js';

/** The kind of artifact being audited. */
export type InputKind = 'code' | 'text';

export interface AnalyzeInput {
  /** The raw artifact to audit. */
  content: string;
  /** Whether `content` is source code or a plain-English analysis description. */
  kind: InputKind;
  /** Optional language hint for code (e.g. "Python", "SQL"). */
  language?: string;
  /** Optional source filename, surfaced to the model for context. */
  filename?: string;
}

export type Confidence = 'low' | 'medium' | 'high';

/** Whether a pitfall is evident from the artifact itself ("active") or is a risky
 *  pattern whose impact depends on data the auditor can't see ("latent"). */
export type FindingNature = 'active' | 'latent';

/** One detected pitfall. Catalog fields (name/domain/severity/remediation) are
 *  filled from the taxonomy, not from the model, so they're always authoritative. */
export interface Finding {
  ruleId: string;
  name: string;
  domain: Domain;
  severity: Severity;
  confidence: Confidence;
  /** "active" = evident from the artifact; "latent" = depends on unseen data. */
  nature: FindingNature;
  /** For latent findings, the data condition under which the pitfall bites. */
  condition: string;
  evidence: string;
  explanation: string;
  remediation: string;
}

export interface AuditUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

export interface AuditReport {
  findings: Finding[];
  model: string;
  rulesConsidered: number;
  usage?: AuditUsage;
}

export interface AnalyzeOptions {
  /** Model id. Defaults to ANTHROPIC_MODEL, then claude-opus-4-7. */
  model?: string;
  /** API key. Defaults to the ANTHROPIC_API_KEY environment variable. */
  apiKey?: string;
  /** Pre-constructed Anthropic client (overrides apiKey). */
  client?: Anthropic;
  /** Restrict grounding to these domains. Defaults to the whole catalog. */
  domains?: Domain[];
  /** Max output tokens. Defaults to 16000. */
  maxTokens?: number;
}

export const DEFAULT_MODEL = 'claude-opus-4-7';

const SYSTEM_INSTRUCTIONS = `You are datapitfalls, an auditor that reviews data work for known data pitfalls.

You are given an artifact — source code or a plain-English description of a data analysis — and a catalog of pitfall rules. Identify which pitfalls from the catalog the artifact actually exhibits.

You can see only the artifact, never the data it runs on. Many pitfalls are patterns whose real-world impact depends on data values you cannot inspect. Classify every finding by its nature:
- "active": the pitfall is evident from the artifact itself, regardless of the data (e.g. averaging a two-digit-year column, summing a column that includes a "Total" row, reporting a mean as the "typical" value, mismatched units in a formula). State these directly.
- "latent": the artifact uses a risky pattern, but whether it actually bites depends on data you can't see (e.g. dropna() before an aggregate only matters if nulls exist; grouping by date only drops periods if some periods have zero rows). Phrase these conditionally, do NOT assert the pitfall is definitely affecting the results, and fill in "condition" with what must be true of the data for it to occur.

Rules of engagement:
- Only report pitfalls that appear in the catalog below, and cite each by its exact \`id\`.
- Report a finding only when the artifact shows real evidence of the pitfall (active) or a genuinely risky pattern (latent). Be conservative: avoid speculation and false positives.
- For each finding, provide the rule id, confidence (low/medium/high), nature (active/latent), the specific evidence from the artifact (quote the relevant line or phrase), a concise explanation, and — for latent findings — the data condition under which it bites.
- A single artifact may exhibit several pitfalls, one, or none. If none apply, return an empty findings list.
- Do not invent rule ids. Do not report a pitfall that is not in the catalog.

Return your results by calling the report_findings tool.`;

const REPORT_TOOL: Anthropic.Tool = {
  name: 'report_findings',
  description: 'Report the data pitfalls found in the audited artifact.',
  input_schema: {
    type: 'object',
    properties: {
      findings: {
        type: 'array',
        description: 'Every pitfall found. Empty if none apply.',
        items: {
          type: 'object',
          properties: {
            rule_id: {
              type: 'string',
              description: 'The exact id of a rule from the catalog.',
            },
            confidence: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'How confident you are that this pitfall is present.',
            },
            nature: {
              type: 'string',
              enum: ['active', 'latent'],
              description:
                '"active" if the pitfall is evident from the artifact itself; "latent" if it is a risky pattern whose impact depends on data you cannot see.',
            },
            condition: {
              type: 'string',
              description:
                'For latent findings, the data condition under which the pitfall actually occurs (e.g. "the latitude/longitude columns contain nulls"). Leave empty for active findings.',
            },
            evidence: {
              type: 'string',
              description:
                'The specific line, phrase, or aspect of the artifact that triggers this pitfall.',
            },
            explanation: {
              type: 'string',
              description: 'A concise explanation of why this pitfall applies to this artifact.',
            },
          },
          required: ['rule_id', 'confidence', 'nature', 'evidence', 'explanation'],
        },
      },
    },
    required: ['findings'],
  },
};

function serializeRules(rules: readonly PitfallRule[]): string {
  return rules
    .map(
      (rule) =>
        `- id: ${rule.id}\n` +
        `  name: ${rule.name}\n` +
        `  domain: ${rule.domain}\n` +
        `  severity: ${rule.severity}\n` +
        `  description: ${rule.description.trim()}\n` +
        `  detection: ${rule.detection_strategy.trim()}`
    )
    .join('\n');
}

function describeInput(input: AnalyzeInput): string {
  if (input.kind === 'code') {
    const lang = input.language ? ` (${input.language})` : '';
    const file = input.filename ? ` from ${input.filename}` : '';
    return `code${lang}${file}`;
  }
  return 'plain-English analysis description';
}

function normalizeConfidence(value: unknown): Confidence {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

function normalizeNature(value: unknown): FindingNature {
  return value === 'latent' ? 'latent' : 'active';
}

function extractFindings(message: Anthropic.Message): Finding[] {
  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === REPORT_TOOL.name
  );
  if (!toolUse) return [];

  const input = toolUse.input as { findings?: unknown };
  if (!input || !Array.isArray(input.findings)) return [];

  const findings: Finding[] = [];
  for (const item of input.findings) {
    if (typeof item !== 'object' || item === null) continue;
    const raw = item as Record<string, unknown>;
    const ruleId = typeof raw.rule_id === 'string' ? raw.rule_id : undefined;
    if (!ruleId) continue;

    // Guardrail: only keep findings that reference a real catalog rule, and take
    // the authoritative name/domain/severity/remediation from the catalog.
    const rule = getRule(ruleId);
    if (!rule) continue;

    findings.push({
      ruleId: rule.id,
      name: rule.name,
      domain: rule.domain,
      severity: rule.severity,
      confidence: normalizeConfidence(raw.confidence),
      nature: normalizeNature(raw.nature),
      condition: typeof raw.condition === 'string' ? raw.condition : '',
      evidence: typeof raw.evidence === 'string' ? raw.evidence : '',
      explanation: typeof raw.explanation === 'string' ? raw.explanation : '',
      remediation: rule.remediation.trim(),
    });
  }
  return findings;
}

/**
 * Audit an artifact against the pitfall catalog.
 *
 * Requires an Anthropic API key (via options.apiKey, options.client, or the
 * ANTHROPIC_API_KEY environment variable).
 */
export async function analyze(
  input: AnalyzeInput,
  options: AnalyzeOptions = {}
): Promise<AuditReport> {
  const rules = options.domains
    ? options.domains.flatMap((domain) => getRulesByDomain(domain))
    : [...getAllRules()];

  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? 16000;
  const client = options.client ?? new Anthropic(options.apiKey ? { apiKey: options.apiKey } : {});

  const taxonomyBlock = `# Pitfall catalog (${rules.length} rules)\n\n${serializeRules(rules)}`;

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: [
      { type: 'text', text: SYSTEM_INSTRUCTIONS },
      // The catalog is identical across requests — cache it so repeated audits
      // only pay full price for the (small) per-request artifact.
      { type: 'text', text: taxonomyBlock, cache_control: { type: 'ephemeral' } },
    ],
    tools: [REPORT_TOOL],
    tool_choice: { type: 'tool', name: REPORT_TOOL.name },
    messages: [
      {
        role: 'user',
        content:
          `Audit the following ${describeInput(input)} for data pitfalls from the catalog.\n\n` +
          `<artifact>\n${input.content}\n</artifact>`,
      },
    ],
  });

  return {
    findings: extractFindings(message),
    model,
    rulesConsidered: rules.length,
    usage: message.usage
      ? {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          cacheReadInputTokens: message.usage.cache_read_input_tokens ?? 0,
          cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? 0,
        }
      : undefined,
  };
}
