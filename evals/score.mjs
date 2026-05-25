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
 * Score one run of one fixture, treating active and latent findings differently.
 *
 * Active findings are the tool's headline claims and are scored strictly for
 * precision. Latent findings are "things to verify against your data" — they fire
 * on almost any real code, so they are reported as volume rather than penalizing
 * precision.
 *
 *  - tp/fn: expected rules found / missed (any nature) — the recall side
 *  - natureMatch/natureTotal: of caught expected rules whose spec pins a nature,
 *    how many the model classified correctly (calibration)
 *  - activeOn/activeOff: active findings that are on the expected+acceptable list
 *    vs off it (off = an active false positive)
 *  - latentOn/latentOff: same split for latent findings (off = latent noise)
 */
export function scoreRun(findings, expected, acceptable = []) {
  const okIds = new Set([...expected.map((e) => e.ruleId), ...acceptable]);
  const found = new Map(findings.map((f) => [f.ruleId, f]));

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

  let activeOn = 0;
  let activeOff = 0;
  let latentOn = 0;
  let latentOff = 0;
  for (const f of findings) {
    const onList = okIds.has(f.ruleId);
    if (f.nature === 'latent') {
      if (onList) latentOn += 1;
      else latentOff += 1;
    } else {
      if (onList) activeOn += 1;
      else activeOff += 1;
    }
  }

  return { tp, fn, natureMatch, natureTotal, activeOn, activeOff, latentOn, latentOff };
}

/** A ratio that defaults to 1 when the denominator is zero (nothing to get wrong). */
export function ratio(numerator, denominator) {
  return denominator === 0 ? 1 : numerator / denominator;
}
