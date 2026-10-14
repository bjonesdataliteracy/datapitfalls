// datapitfalls — the review method the MCP server hands to the client's Claude
//
// The engine (src/analyze.ts) enforces its method with a tuned system prompt, a
// structured report_findings tool and code that filters and labels the results
// (src/report.ts). The MCP server can't do any of that: the client's Claude does
// the review. So this module writes the same method out as instructions, and
// get_checklist returns them with the rules, because a tool result is the one
// thing every MCP client reliably shows Claude (prompts only run when a person
// picks one).
//
// The wording follows the engine's prompts and report.ts. The engine's prompts
// are left as they are (they're tuned against the eval harness); test/mcp.test.mjs
// checks that the terms and labels here still match the engine's.

import type { ChecklistInputType } from './catalog.js';

/** The engine's consequence ratings (Consequence in src/analyze.ts). */
export const CONSEQUENCES = ['changes-takeaway', 'weakens-support', 'polish'] as const;

/** The engine's overall labels, worst first (TIER_LABEL in src/report.ts). */
export const OVERALL_LABELS = {
  serious: 'Serious pitfalls found',
  attention: 'Needs attention',
  verify: 'Conditions to verify',
  clear: 'No pitfalls detected',
} as const;

const MULTI_CHART: readonly ChecklistInputType[] = ['chart', 'image', 'dashboard', 'document'];
const MULTI_STAGE: readonly ChecklistInputType[] = ['dashboard', 'document'];

/** How to work through the checklist: printed above the rules. */
export function reviewMethod(inputType: ChecklistInputType): string {
  const lines = [
    '## How to review',
    '',
    "You can see the work but not the data behind it, so many pitfalls are patterns whose impact depends on values you can't inspect. Work through every item below against the actual work and decide, for each one, whether the pitfall is:",
    '- **active**: evident from the work itself, whatever the data (e.g. a truncated bar-chart baseline, a mean called the "typical" value, a sum that includes a Total row). State these directly.',
    "- **latent**: a risky pattern whose impact depends on data you can't see (e.g. dropping nulls before an aggregate only matters if nulls exist). Phrase it conditionally, don't assert it is distorting the results, and name the data condition under which it bites.",
    '- **avoided**: the work has a concrete countermeasure you can point to (a guard or assertion, a stated caveat, a deliberate encoding or method choice), for a pitfall this kind of work commonly falls into. If falling in would have been unusual, it is not an avoidance.',
    '- **not applicable**: anything else. Most items will be.',
    '',
    'Be conservative: report a finding only with real evidence (active) or a genuinely risky pattern (latent). A short list of real findings beats a long list of speculative ones.',
    '',
    'For each finding, also judge:',
    '- **Confidence**: low, medium or high. Report every active finding, but only high-confidence latent ones; say how many lower-confidence latent ones you held back, so the user can ask for them.',
    '- **Consequence**: how much it matters to what a reader would conclude. For a latent finding, rate it as if its condition holds.',
    '  - **changes-takeaway**: fixing it (or its condition holding) would likely change the conclusion itself (e.g. an unweighted average of rates, a partial final period read as a decline).',
    '  - **weakens-support**: the conclusion may stand but is less well supported than presented (e.g. reported counts treated as real-world incidence, a possibly biased subset).',
    '  - **polish**: clearer or better crafted, same message (e.g. a clearer label, a better chart type for the same story).',
    '  - Most findings are not changes-takeaway. If you rate more than two that way, re-check that each one really overturns the conclusion on its own.',
  ];
  if (MULTI_CHART.includes(inputType)) {
    lines.push(
      '',
      'When there are several charts, also check for pitfalls that only show up across them: inconsistent axis scales, ranges or units that break comparison; the same color, shape or size meaning different things from one chart to the next; charts whose messages contradict each other. Name the charts involved.'
    );
  }
  if (MULTI_STAGE.includes(inputType)) {
    lines.push(
      '',
      'Treat the work as stages of one analysis (e.g. the query, the chart, the written takeaway), and look hardest at pitfalls that only appear between stages: a filter, dropped null, join or recode early on that biases a later chart or claim; a metric computed one way and described another (a mean called "typical"); a chart choice (truncated axis, cherry-picked window) that later text over-claims; a caveat or exclusion in one stage that a later conclusion ignores. In the evidence, trace how it flows from one stage to the next.'
    );
  }
  return lines.join('\n');
}

/** How to write up the review: printed below the rules. */
export function reportMethod(ruleCount: number): string {
  return [
    '## How to report',
    '',
    'Open with an overall label, using the most serious that applies (findings you held back never count):',
    `- **${OVERALL_LABELS.serious}**: at least one active finding of error severity, or an active warning rated changes-takeaway.`,
    `- **${OVERALL_LABELS.attention}**: at least one active warning.`,
    `- **${OVERALL_LABELS.verify}**: only info-severity active findings and/or high-confidence latent ones. Latent findings never go past this label: they are conditions to check against the data, not verdicts.`,
    `- **${OVERALL_LABELS.clear}**: nothing found. Say it was checked against ${ruleCount} rules: a clean review means none of these pitfalls were found, not that the work is correct.`,
    '',
    "Then one or two sentences on the overall state of the work: lead with whether it is fundamentally sound, then the single most important thing to address. If the key flaw is active, say it holds whatever the data; if every finding is latent, say plainly that nothing is evidently wrong and frame them as conditions to verify. Keep it proportionate: don't catastrophize minor issues, and don't soften a conclusion-changing flaw.",
    '',
    'Then the findings, most consequential first (changes-takeaway, then weakens-support, then polish; error before warning before info), active before latent. For each:',
    '- **Rule**: name and id (e.g. Truncated Y-Axis, `truncated-y-axis`), domain and severity',
    '- **Nature**: active, or latent with its condition · **Confidence** · **Consequence**',
    '- **Evidence**: quote the line or phrase, or name the chart element (axis, legend, mark, label)',
    "- **Why it matters**: one or two sentences specific to this work, about what its audience would misperceive or wrongly conclude. Don't restate the rule's general description.",
    '- **Fix**: the remediation, applied to this work',
    '',
    'Then **Avoided**: up to two pitfalls the work visibly avoided, with the evidence, and never one you also reported as a finding. Zero is common and fine.',
    '',
    "Voice: write as a friendly, experienced guide, not a judge, in plain words. These pitfalls catch experienced practitioners every day, so never scold, but never soften the substance either: if a conclusion doesn't hold, say so plainly.",
    '',
    'Close by citing the book and site in the footer below.',
  ].join('\n');
}
