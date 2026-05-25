// datapitfalls eval harness — pure scoring helpers (DEV ONLY, not shipped).

// Approximate API prices, $ per 1M tokens: [input, output].
const PRICES = {
  'claude-opus-4-7': [5, 25],
  'claude-opus-4-6': [5, 25],
  'claude-sonnet-4-6': [3, 15],
  'claude-haiku-4-5': [1, 5],
};

/** Approximate USD cost of one analyze() call from its usage + model. */
export function estimateCostUsd(usage, model) {
  if (!usage) return 0;
  const [pin, pout] = PRICES[model] ?? [0, 0];
  const input =
    usage.inputTokens * pin +
    usage.cacheCreationInputTokens * pin * 1.25 +
    usage.cacheReadInputTokens * pin * 0.1;
  return (input + usage.outputTokens * pout) / 1e6;
}

/**
 * Score one run of one fixture.
 *  - tp: expected rules that were found
 *  - fn: expected rules that were missed
 *  - fp: found rules that were neither expected nor in the acceptable list
 *  - natureMatch/natureTotal: of matched findings whose expected entry pins a
 *    nature (active/latent), how many the model classified correctly
 */
export function scoreRun(findings, expected, acceptable = []) {
  const found = new Map(findings.map((f) => [f.ruleId, f]));
  const okIds = new Set([...expected.map((e) => e.ruleId), ...acceptable]);

  let tp = 0;
  let fn = 0;
  let natureMatch = 0;
  let natureTotal = 0;
  for (const e of expected) {
    const hit = found.get(e.ruleId);
    if (!hit) {
      fn += 1;
      continue;
    }
    tp += 1;
    if (e.nature) {
      natureTotal += 1;
      if (hit.nature === e.nature) natureMatch += 1;
    }
  }

  let fp = 0;
  for (const f of findings) {
    if (!okIds.has(f.ruleId)) fp += 1;
  }

  return { tp, fp, fn, natureMatch, natureTotal };
}

/** Precision / recall / F1 from summed counts. Empty denominators score 1. */
export function prf(tp, fp, fn) {
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { precision, recall, f1 };
}
