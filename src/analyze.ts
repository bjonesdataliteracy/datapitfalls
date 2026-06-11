// datapitfalls — pitfall-detection engine
//
// Detects the data pitfalls in a piece of data work (code, or a plain-English
// description) against the pitfall catalog by grounding Claude on the relevant rules and collecting
// structured findings via a forced tool call. Rule ids in the model's output are
// validated against the catalog, so a finding can only ever reference a real rule.

import Anthropic from '@anthropic-ai/sdk';
import { getAllRules, getRule, getRulesByDomain } from './taxonomy/index.js';
import type { Domain, PitfallRule, Severity } from './taxonomy/index.js';

/** The kind of artifact being audited. */
export type InputKind = 'code' | 'text' | 'image' | 'document' | 'slides' | 'chain';

/** Image media types Claude Vision accepts (matches the SDK's base64 image source). */
export type ImageMediaType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

/** A code file or plain-English analysis description. */
export interface TextDetectionInput {
  /** Whether `content` is source code or a plain-English analysis description. */
  kind: 'code' | 'text';
  /** The raw artifact to audit. */
  content: string;
  /** Optional language hint for code (e.g. "Python", "SQL"). */
  language?: string;
  /** Optional source filename, surfaced to the model for context. */
  filename?: string;
}

/** A single chart/visualization image. */
export interface ImageSource {
  /** Base64-encoded image bytes. */
  content: string;
  /** The image's media type, used to build the Vision image block. */
  mediaType: ImageMediaType;
  /** Optional source filename, surfaced to the model for context. */
  filename?: string;
}

/** One or more chart images, audited via Claude Vision. When several are given
 *  they are audited together, so pitfalls that only emerge across charts —
 *  inconsistent scales, inconsistent encodings, contradictory messages — can be
 *  detected. */
export interface ImageDetectionInput {
  kind: 'image';
  images: ImageSource[];
}

/** A PDF report, sent to Claude as a document so it reads the prose *and* sees
 *  the charts and tables on the page. */
export interface DocumentDetectionInput {
  kind: 'document';
  /** Base64-encoded document bytes. */
  content: string;
  /** Only PDF is accepted as a native document. */
  mediaType: 'application/pdf';
  /** Optional source filename, surfaced to the model for context. */
  filename?: string;
}

/** One slide's extracted content: its text and any chart/images on it. */
export interface SlideContent {
  /** The slide's visible text (titles, bullets, labels). */
  text: string;
  /** Chart/screenshot images embedded on the slide. */
  images: ImageSource[];
}

/** A slide deck (PPTX) extracted to per-slide text and chart images, so both the
 *  written claims and the charts on each slide are reviewed. */
export interface SlidesDetectionInput {
  kind: 'slides';
  slides: SlideContent[];
  /** Optional source filename, surfaced to the model for context. */
  filename?: string;
}

/** A single, self-contained artifact — anything that can be scanned on its own. */
export type SingleArtifactInput =
  | TextDetectionInput
  | ImageDetectionInput
  | DocumentDetectionInput
  | SlidesDetectionInput;

/** One stage of an analytics workflow: an artifact plus where it sits in the chain. */
export interface ChainStage {
  /** A short label for this stage's role, e.g. "Data prep (Python)", "Chart", "Summary". */
  role: string;
  /** The artifact at this stage. */
  artifact: SingleArtifactInput;
}

/** A whole analytics workflow as an ordered set of stages (data → processing →
 *  analysis → visualization → narrative), scanned together so pitfalls that only
 *  emerge in the *relationships between* stages can be detected — a transform that
 *  biases a later chart, a metric computed one way and described another, a chart
 *  choice the narrative over-claims. */
export interface ChainDetectionInput {
  kind: 'chain';
  stages: ChainStage[];
}

export type DetectionInput = SingleArtifactInput | ChainDetectionInput;

/** Map a file extension (with leading dot, any case) to a Vision media type. */
export function imageMediaTypeForExtension(ext: string): ImageMediaType | undefined {
  switch (ext.toLowerCase()) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return undefined;
  }
}

export type Confidence = 'low' | 'medium' | 'high';

/** EXPERIMENTAL — presentation variants for A/B comparison (see evals/compare.mjs).
 *  'baseline' is the shipped behavior. 'summary' adds a one-to-two-sentence overall
 *  summary (which may naturally mention one genuine strength), a per-finding
 *  consequence rating, and book-voice/audience-framing instructions for the
 *  generated prose. (Earlier rounds trialed 'verdict' naming and a separate
 *  mandatory strengths field; both were cut — "verdict" read as courtroom language,
 *  and the strengths slot duplicated, contradicted, or padded.) */
export type PresentationVariant = 'baseline' | 'summary';

/** EXPERIMENTAL — how much a finding matters to the artifact's message:
 *  fixing it would change what a reader concludes ('changes-takeaway'), the
 *  conclusion may stand but is less supported than presented ('weakens-support'),
 *  or it improves clarity/craft without changing the message ('polish'). */
export type Consequence = 'changes-takeaway' | 'weakens-support' | 'polish';

/** Whether a pitfall is evident from the artifact itself ("active") or is a risky
 *  pattern whose impact depends on data the detector can't see ("latent"). */
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
  /** EXPERIMENTAL — present only when a non-baseline variant is selected. */
  consequence?: Consequence;
}

/** EXPERIMENTAL — a pitfall the work visibly avoided ('summary' variant only).
 *  Counts only when the artifact contains a concrete countermeasure (a guard, a
 *  stated caveat, a deliberate choice); catalog-validated like findings, and never
 *  a rule that is also reported as a finding. */
export interface AvoidedPitfall {
  ruleId: string;
  name: string;
  domain: Domain;
  /** The specific guard, caveat, or choice in the artifact that constitutes the avoidance. */
  evidence: string;
  explanation: string;
}

export interface DetectionUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

export interface PitfallReport {
  findings: Finding[];
  /** The kind of artifact that was scanned, for report phrasing. */
  kind: InputKind;
  model: string;
  rulesConsidered: number;
  usage?: DetectionUsage;
  /** EXPERIMENTAL — one-to-two-sentence overall assessment ('summary' variant only). */
  summary?: string;
  /** EXPERIMENTAL — up to two pitfalls the work visibly avoided ('summary' variant
   *  only; possibly empty — zero evidenced avoidances is common and fine). */
  avoided?: AvoidedPitfall[];
}

export interface DetectionOptions {
  /** Model id. Defaults to ANTHROPIC_MODEL, then claude-sonnet-4-6. */
  model?: string;
  /** API key. Defaults to the ANTHROPIC_API_KEY environment variable. */
  apiKey?: string;
  /** Pre-constructed Anthropic client (overrides apiKey). */
  client?: Anthropic;
  /** Restrict grounding to these domains. Defaults to the whole catalog. */
  domains?: Domain[];
  /** Max output tokens. Defaults to 16000. */
  maxTokens?: number;
  /** EXPERIMENTAL — presentation variant to A/B test. Defaults to 'baseline'
   *  (the shipped behavior). See evals/compare.mjs. */
  variant?: PresentationVariant;
}

// claude-sonnet-4-6 is the default: in the eval harness it had the highest active
// precision and best calibration of the three models, at ~half the cost of Opus 4.7
// (Opus, --thorough; Haiku 4.5, --fast).
export const DEFAULT_MODEL = 'claude-sonnet-4-6';

const SYSTEM_INSTRUCTIONS = `You are datapitfalls, a pitfall detector that reviews data work for known data pitfalls.

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

const IMAGE_SYSTEM_INSTRUCTIONS = `You are datapitfalls, a pitfall detector that reviews data visualizations for known data pitfalls.

You are shown one or more chart images — and a catalog of pitfall rules. Identify which pitfalls from the catalog the charts actually exhibit.

You can see only the charts, never the underlying data or how they were made. Many pitfalls are patterns whose real-world impact depends on values you cannot inspect. Classify every finding by its nature:
- "active": the pitfall is evident from the image itself, regardless of the data (e.g. a bar chart with a truncated/non-zero baseline, a dual y-axis, a 3D or exploded pie, an inverted or non-linear axis, a distorting aspect ratio, area/bubble sizing by radius instead of area, a rainbow/red-green color scale, missing axis labels or units, an overcrowded or spaghetti chart). State these directly.
- "latent": the chart makes a choice that is only sometimes misleading, and whether it bites depends on data or context you can't see (e.g. a particular bin width, a chosen time window or axis range, an aggregation that may hide variation). Phrase these conditionally, do NOT assert the pitfall is definitely distorting the message, and fill in "condition" with what must be true for it to occur.

Rules of engagement:
- Only report pitfalls that appear in the catalog below, and cite each by its exact \`id\`.
- Report a finding only when the chart shows real evidence of the pitfall (active) or a genuinely risky choice (latent). Be conservative: avoid speculation and false positives.
- For each finding, provide the rule id, confidence (low/medium/high), nature (active/latent), the specific visual evidence (name the element you see — the axis, legend, mark, or label), a concise explanation, and — for latent findings — the data condition under which it bites.
- When several charts are shown together, also check for pitfalls that only emerge across them — inconsistent axis scales/ranges/units that break comparison, the same color/shape/size meaning different things from one chart to the next, or charts whose messages contradict one another — and name the charts involved in the evidence.
- A chart may exhibit several pitfalls, one, or none. If none apply, return an empty findings list.
- Do not invent rule ids. Do not report a pitfall that is not in the catalog.

Return your results by calling the report_findings tool.`;

const DOCUMENT_SYSTEM_INSTRUCTIONS = `You are datapitfalls, a pitfall detector that reviews data work for known data pitfalls.

You are given a report document — which may mix written analysis, tables, and charts — and a catalog of pitfall rules. Review the whole document: the reasoning and claims in the prose, and any charts or tables it contains. Identify which pitfalls from the catalog the document actually exhibits.

You can see the document but not the underlying data or the code that produced it. Many pitfalls are patterns whose real-world impact depends on values you cannot inspect. Classify every finding by its nature:
- "active": the pitfall is evident from the document itself, regardless of the unseen data (e.g. a chart with a truncated baseline, a mean reported as the "typical" value, a claim that confuses correlation with causation). State these directly.
- "latent": the document describes a choice that is only sometimes misleading, and whether it bites depends on data or context you can't see. Phrase these conditionally, do NOT assert the pitfall is definitely present, and fill in "condition" with what must be true for it to occur.

Rules of engagement:
- Only report pitfalls that appear in the catalog below, and cite each by its exact \`id\`.
- Report a finding only when the document shows real evidence of the pitfall (active) or a genuinely risky choice (latent). Be conservative: avoid speculation and false positives.
- For each finding, provide the rule id, confidence (low/medium/high), nature (active/latent), the specific evidence (quote the sentence, name the chart element, or cite the figure/section), a concise explanation, and — for latent findings — the data condition under which it bites.
- A single document may exhibit several pitfalls, one, or none. If none apply, return an empty findings list.
- Do not invent rule ids. Do not report a pitfall that is not in the catalog.

Return your results by calling the report_findings tool.`;

const CHAIN_SYSTEM_INSTRUCTIONS = `You are datapitfalls, a pitfall detector that reviews a complete analytics workflow for known data pitfalls.

You are given one piece of data work as an ordered sequence of stages — the steps of a single analysis, which may mix source code, chart images, and written analysis (for example: data preparation code → an analysis script → a chart → a written summary). You are also given a catalog of pitfall rules. Identify which pitfalls from the catalog the work actually exhibits.

Review each stage for its own pitfalls, and — most importantly — look for pitfalls that only emerge in the *relationships between* stages, because these are invisible when any single stage is viewed alone:
- a data transformation in an early stage (a filter, a dropped-null, a join, a recoding) that biases what a later chart or claim shows;
- a metric computed one way in code but described differently in prose (e.g. a mean computed in code and called the "typical" value in the summary);
- a chart choice (a truncated axis, a cherry-picked window) that a later narrative then over-claims or treats as fact;
- a caveat, exclusion, or assumption introduced in one stage that a downstream conclusion ignores.

You can see only the artifacts, never the underlying data. Classify every finding by its nature:
- "active": evident from the artifacts themselves, regardless of the unseen data. State these directly.
- "latent": a risky pattern whose real-world impact depends on data you cannot see. Phrase these conditionally, do NOT assert the pitfall is definitely biting, and fill in "condition" with what must be true of the data for it to occur.

Rules of engagement:
- Only report pitfalls that appear in the catalog below, and cite each by its exact \`id\`.
- Report a finding only when the work shows real evidence of the pitfall (active) or a genuinely risky pattern (latent). Be conservative: avoid speculation and false positives.
- For each finding, provide the rule id, confidence (low/medium/high), nature (active/latent), the specific evidence, a concise explanation, and — for latent findings — the data condition under which it bites.
- In each finding's evidence, name the stage(s) involved (e.g. "Stage 1"); for a cross-stage pitfall, trace how it flows from one stage to the next (e.g. "Stage 1 drops nulls → Stage 3 chart → Stage 4 claim").
- The workflow may exhibit several pitfalls, one, or none. If none apply, return an empty findings list.
- Do not invent rule ids. Do not report a pitfall that is not in the catalog.

Return your results by calling the report_findings tool.`;

const REPORT_TOOL: Anthropic.Tool = {
  name: 'report_findings',
  description: 'Report the data pitfalls found in the artifact.',
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

// EXPERIMENTAL — appended to the kind-specific system instructions for the
// 'summary' variant. Note: changing the instructions block changes the
// prompt-cache prefix, so each variant warms its own cache entry.
const SUMMARY_ADDENDUM = `

Additional reporting requirements:
- Provide a "summary": at most two sentences giving the author the overall state of this work. Lead with whether the work is fundamentally sound, then name the single most important thing to address, if any. Distinguish what is evident from what is conditional: if the key flaw is active, say it holds regardless of the unseen data; if every finding is latent, say plainly that nothing is evidently wrong and frame the findings as conditions to verify, not problems. Keep it proportionate: do not catastrophize work with only minor issues, and do not soften work with a conclusion-changing flaw. (It may nod to a notable avoided pitfall in passing, but the "avoided" list is its home.)
- Report "avoided": up to two pitfalls from the catalog that this work VISIBLY avoided. An avoidance counts only when the artifact contains a concrete countermeasure you can cite as evidence — a guard or assertion, a stated caveat, a deliberate encoding or method choice — and only for a pitfall that commonly bites this kind of work. Never list a rule you also report as a finding. Zero avoidances is common and fine; an empty list is better than a stretch.
- Rate each finding's "consequence" — how much it matters to what a reader would conclude. For latent findings, rate the consequence assuming the stated condition actually holds. Reserve "changes-takeaway" for findings whose fix (or whose condition biting) would likely change the conclusion itself (e.g. an unweighted average of rates, a partial final period read as a decline). Use "weakens-support" when the conclusion may stand but is less well supported than presented (e.g. reported counts treated as real-world incidence, a possibly biased subset). Use "polish" when fixing it improves clarity or craft without changing the message (e.g. a clearer label, a better chart type for the same story). Most findings are not "changes-takeaway"; if you rate more than two findings that way, re-check that each one really overturns the conclusion on its own.
- Voice: write the summary and every explanation as a friendly, experienced guide rather than a judge, in plain words. Frame each pitfall around what the work's audience would misperceive or wrongly conclude (e.g. "readers will take 5.0 as the typical energy release"), not around what the author did wrong. These pitfalls catch experienced practitioners every day, so never scold — but never soften the substance either: if a conclusion does not hold, say so plainly.
- Be concise: each finding's explanation is one or two sentences covering only what is specific to THIS artifact — where the pitfall shows up and what the audience would wrongly conclude. Do not restate the rule's general description (the reader has it alongside your finding), do not repeat the quoted evidence in prose, and do not let "condition" restate the explanation — it states only the data condition itself.`;

function variantAddendum(variant: PresentationVariant): string {
  return variant === 'summary' ? SUMMARY_ADDENDUM : '';
}

// EXPERIMENTAL — the report tool with the variant's extra fields. Baseline
// returns REPORT_TOOL untouched so the shipped request is byte-identical.
function buildReportTool(variant: PresentationVariant): Anthropic.Tool {
  if (variant === 'baseline') return REPORT_TOOL;
  const tool = structuredClone(REPORT_TOOL);
  const schema = tool.input_schema as unknown as {
    properties: Record<string, unknown>;
    required: string[];
  };
  const findingSchema = (
    schema.properties.findings as {
      items: { properties: Record<string, unknown>; required: string[] };
    }
  ).items;
  findingSchema.properties.consequence = {
    type: 'string',
    enum: ['changes-takeaway', 'weakens-support', 'polish'],
    description:
      'How much this finding matters to the message: "changes-takeaway" if fixing it would likely change what a reader concludes, "weakens-support" if the conclusion may stand but is less supported than presented, "polish" if it improves clarity or craft without changing the message.',
  };
  findingSchema.required.push('consequence');
  schema.properties.summary = {
    type: 'string',
    description:
      'At most two sentences giving the author the overall state of the work: whether it is fundamentally sound, and the single most important thing to address, if any.',
  };
  schema.required.push('summary');
  schema.properties.avoided = {
    type: 'array',
    description:
      'Up to two pitfalls from the catalog that the work VISIBLY avoided — only with concrete evidence of a countermeasure, never a rule also reported as a finding. Empty if none; zero is common.',
    items: {
      type: 'object',
      properties: {
        rule_id: {
          type: 'string',
          description: 'The exact id of a rule from the catalog.',
        },
        evidence: {
          type: 'string',
          description:
            'The specific guard, caveat, or choice in the artifact that constitutes the avoidance.',
        },
        explanation: {
          type: 'string',
          description: 'One sentence on why this matters — what usually goes wrong without it.',
        },
      },
      required: ['rule_id', 'evidence', 'explanation'],
    },
  };
  schema.required.push('avoided');
  return tool;
}

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

function describeInput(input: TextDetectionInput): string {
  if (input.kind === 'code') {
    const lang = input.language ? ` (${input.language})` : '';
    const file = input.filename ? ` from ${input.filename}` : '';
    return `code${lang}${file}`;
  }
  return 'plain-English analysis description';
}

// Images default to the two visual domains plus the cross-cutting epistemic rule
// that charts most often trip (treating the chart as reality). options.domains
// overrides this; non-image inputs default to the whole catalog.
const IMAGE_DEFAULT_DOMAINS: Domain[] = ['Graphical Gaffes', 'Design Dangers'];
const IMAGE_EXTRA_RULE_ID = 'data-reality-gap';

function selectRules(input: DetectionInput, domains?: Domain[]): PitfallRule[] {
  if (domains) return domains.flatMap((domain) => getRulesByDomain(domain));
  if (input.kind === 'image') {
    const rules = IMAGE_DEFAULT_DOMAINS.flatMap((domain) => getRulesByDomain(domain));
    const extra = getRule(IMAGE_EXTRA_RULE_ID);
    return extra ? [...rules, extra] : rules;
  }
  return [...getAllRules()];
}

// The content blocks for a single artifact, without any call-to-action — used to
// lay out each stage of a chain. (The standalone single-artifact branches below
// keep their own tuned framing.)
function rawArtifactBlocks(input: SingleArtifactInput): Anthropic.ContentBlockParam[] {
  if (input.kind === 'image') {
    const multiple = input.images.length > 1;
    const blocks: Anthropic.ContentBlockParam[] = [];
    input.images.forEach((img, i) => {
      if (multiple) {
        const where = img.filename ? ` — ${img.filename}` : '';
        blocks.push({ type: 'text', text: `Chart ${i + 1}${where}:` });
      }
      blocks.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.content } });
    });
    return blocks;
  }
  if (input.kind === 'document') {
    return [{ type: 'document', source: { type: 'base64', media_type: input.mediaType, data: input.content } }];
  }
  if (input.kind === 'slides') {
    const blocks: Anthropic.ContentBlockParam[] = [];
    input.slides.forEach((slide, i) => {
      const text = slide.text.trim();
      blocks.push({ type: 'text', text: `Slide ${i + 1}:${text ? `\n${text}` : ' (no text)'}` });
      for (const img of slide.images) {
        blocks.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.content } });
      }
    });
    return blocks;
  }
  return [{ type: 'text', text: `<artifact>\n${input.content}\n</artifact>` }];
}

function buildUserContent(input: DetectionInput): Anthropic.MessageParam['content'] {
  if (input.kind === 'chain') {
    const content: Anthropic.ContentBlockParam[] = [
      {
        type: 'text',
        text:
          `You are given one analysis as an ordered sequence of ${input.stages.length} stages, below. ` +
          `Review each stage for its own pitfalls, and — most importantly — for pitfalls that only emerge ` +
          `across stages: a transformation that biases a later chart or claim, a metric computed one way ` +
          `and described another, a chart choice the narrative over-claims, or a caveat a conclusion ` +
          `ignores. In each finding's evidence name the stage(s) involved (e.g. "Stage 1") and, for a ` +
          `cross-stage pitfall, trace how it flows from one stage to the next. Report all pitfalls via the ` +
          `report_findings tool.`,
      },
    ];
    input.stages.forEach((stage, i) => {
      content.push({ type: 'text', text: `=== Stage ${i + 1} — ${stage.role} ===` });
      content.push(...rawArtifactBlocks(stage.artifact));
    });
    return content;
  }
  if (input.kind === 'image') {
    const images = input.images;
    const multiple = images.length > 1;
    const content: Anthropic.ContentBlockParam[] = [];
    images.forEach((img, i) => {
      if (multiple) {
        const where = img.filename ? ` — ${img.filename}` : '';
        content.push({ type: 'text', text: `Chart ${i + 1}${where}:` });
      }
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.content },
      });
    });
    content.push({
      type: 'text',
      text: multiple
        ? `These ${images.length} charts are part of one set (e.g. a dashboard or small multiples). ` +
          `Review each chart for its own pitfalls, and also check for pitfalls that only emerge across ` +
          `them — inconsistent axis scales/ranges/units that break comparison, the same color/shape/size ` +
          `meaning different things from one chart to the next, or charts whose messages contradict one ` +
          `another. In each finding's evidence, name which chart(s) it refers to (e.g. "Chart 2"). ` +
          `Report the pitfalls via the report_findings tool.`
        : `You are shown a chart image${images[0]?.filename ? ` (${images[0].filename})` : ''}. ` +
          `Identify the data pitfalls from the catalog that are evident in it, and report them via ` +
          `the report_findings tool.`,
    });
    return content;
  }
  if (input.kind === 'document') {
    const where = input.filename ? ` (${input.filename})` : '';
    return [
      {
        type: 'document',
        source: { type: 'base64', media_type: input.mediaType, data: input.content },
      },
      {
        type: 'text',
        text:
          `You are given a report document${where}. Review both its written analysis and any ` +
          `charts or tables it contains for data pitfalls from the catalog, and report them ` +
          `via the report_findings tool.`,
      },
    ];
  }
  if (input.kind === 'slides') {
    const where = input.filename ? ` (${input.filename})` : '';
    const content: Anthropic.ContentBlockParam[] = [
      {
        type: 'text',
        text:
          `You are given the contents of a slide deck${where}, slide by slide — the text on each ` +
          `slide and any charts or images it contains. Review the whole deck for data pitfalls from ` +
          `the catalog: the claims in the slide text and the charts themselves. In each finding's ` +
          `evidence, name the slide it refers to (e.g. "Slide 3"). Report them via the report_findings tool.`,
      },
    ];
    input.slides.forEach((slide, i) => {
      const text = slide.text.trim();
      content.push({ type: 'text', text: `--- Slide ${i + 1} ---${text ? `\n${text}` : ' (no text)'}` });
      for (const img of slide.images) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.content },
        });
      }
    });
    return content;
  }
  return (
    `Review the following ${describeInput(input)} for data pitfalls from the catalog.\n\n` +
    `<artifact>\n${input.content}\n</artifact>`
  );
}

function normalizeConfidence(value: unknown): Confidence {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

function normalizeNature(value: unknown): FindingNature {
  return value === 'latent' ? 'latent' : 'active';
}

function normalizeConsequence(value: unknown): Consequence | undefined {
  return value === 'changes-takeaway' || value === 'weakens-support' || value === 'polish'
    ? value
    : undefined;
}

/** The raw input of the report_findings tool call, or undefined if absent. */
function findToolInput(message: Anthropic.Message): Record<string, unknown> | undefined {
  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === REPORT_TOOL.name
  );
  if (!toolUse || typeof toolUse.input !== 'object' || toolUse.input === null) return undefined;
  return toolUse.input as Record<string, unknown>;
}

/** A trimmed, non-empty string from the tool input, or undefined. */
function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function extractFindings(input: Record<string, unknown> | undefined): Finding[] {
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
      consequence: normalizeConsequence(raw.consequence),
    });
  }
  return findings;
}

// EXPERIMENTAL — validate the model's avoided list: real catalog rules only,
// never a rule that is also a finding, at most two.
function extractAvoided(
  input: Record<string, unknown> | undefined,
  findings: Finding[]
): AvoidedPitfall[] {
  if (!input || !Array.isArray(input.avoided)) return [];
  const reported = new Set(findings.map((f) => f.ruleId));
  const avoided: AvoidedPitfall[] = [];
  for (const item of input.avoided) {
    if (avoided.length >= 2) break;
    if (typeof item !== 'object' || item === null) continue;
    const raw = item as Record<string, unknown>;
    const ruleId = typeof raw.rule_id === 'string' ? raw.rule_id : undefined;
    if (!ruleId) continue;
    const rule = getRule(ruleId);
    if (!rule || reported.has(rule.id)) continue;
    avoided.push({
      ruleId: rule.id,
      name: rule.name,
      domain: rule.domain,
      evidence: typeof raw.evidence === 'string' ? raw.evidence : '',
      explanation: typeof raw.explanation === 'string' ? raw.explanation : '',
    });
  }
  return avoided;
}

/**
 * Detect the data pitfalls an artifact exhibits, against the pitfall catalog.
 *
 * Requires an Anthropic API key (via options.apiKey, options.client, or the
 * ANTHROPIC_API_KEY environment variable).
 */
export async function detectPitfalls(
  input: DetectionInput,
  options: DetectionOptions = {}
): Promise<PitfallReport> {
  const rules = selectRules(input, options.domains);

  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? 16000;
  const variant = options.variant ?? 'baseline';
  const client = options.client ?? new Anthropic(options.apiKey ? { apiKey: options.apiKey } : {});

  const instructions =
    input.kind === 'image'
      ? IMAGE_SYSTEM_INSTRUCTIONS
      : input.kind === 'chain'
        ? CHAIN_SYSTEM_INSTRUCTIONS
        : input.kind === 'document' || input.kind === 'slides'
          ? DOCUMENT_SYSTEM_INSTRUCTIONS
          : SYSTEM_INSTRUCTIONS;
  const taxonomyBlock = `# Pitfall catalog (${rules.length} rules)\n\n${serializeRules(rules)}`;
  const reportTool = buildReportTool(variant);

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: [
      { type: 'text', text: instructions + variantAddendum(variant) },
      // The catalog is identical across requests of the same kind — cache it so
      // repeated audits only pay full price for the (small) per-request artifact.
      { type: 'text', text: taxonomyBlock, cache_control: { type: 'ephemeral' } },
    ],
    tools: [reportTool],
    tool_choice: { type: 'tool', name: reportTool.name },
    messages: [{ role: 'user', content: buildUserContent(input) }],
  });

  const toolInput = findToolInput(message);
  const findings = extractFindings(toolInput);

  return {
    findings,
    kind: input.kind,
    model,
    rulesConsidered: rules.length,
    summary: variant === 'summary' ? nonEmptyString(toolInput?.summary) : undefined,
    avoided: variant === 'summary' ? extractAvoided(toolInput, findings) : undefined,
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
