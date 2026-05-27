# Pitfall Taxonomy Specification

The pitfall taxonomy is the heart of datapitfalls. It's a structured, machine-readable catalog of the ways data work goes wrong, organized around the eight pitfall domains from *Avoiding Data Pitfalls*. This document specifies the format every pitfall rule follows, so the catalog stays consistent as it grows — including through [community contributions](../CONTRIBUTING.md).

## The eight pitfall domains

Every pitfall rule belongs to exactly one domain:

1. **Epistemic Errors** — flaws in how we think about and come to know things
2. **Technical Trespasses** — failures in the data pipeline
3. **Mathematical Miscues** — errors in the arithmetic and quantities
4. **Statistical Slip-Ups** — mistakes in inference and sampling
5. **Analytical Aberrations** — distortions introduced during analysis
6. **Graphical Gaffes** — charts that mislead
7. **Design Dangers** — presentation that fails the audience
8. **Biased Baseline** — whose voices and contributions are represented, and whose are missing

## Rule fields

Each pitfall rule is an object with the following fields:

| Field                | Type                              | Description                                                                 |
| -------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| `id`                 | string (kebab-case)               | Unique, stable identifier for the rule (e.g. `truncated-y-axis`).           |
| `name`               | string                            | Human-readable name (e.g. "Truncated Y-Axis").                              |
| `domain`             | enum (one of the 8 domains)       | The pitfall domain this pitfall belongs to.                                   |
| `severity`           | enum (`info` / `warning` / `error`) | Default severity when this pitfall is detected.                           |
| `description`        | string                            | What the pitfall is and why it misleads.                                    |
| `detection_strategy` | string                            | How the tool should look for this pitfall across the relevant input modes.  |
| `example_bad`        | string                            | A concrete example exhibiting the pitfall.                                  |
| `example_good`       | string                            | A corrected version that avoids it.                                         |
| `remediation`        | string                            | Actionable guidance for fixing it.                                          |
| `references`         | list of strings                   | Sources: book sections, articles, citations.                                |

### Severity guidance

- **`info`** — Worth noting, but not necessarily an error. Context-dependent.
- **`warning`** — Likely a problem; a human should review it.
- **`error`** — Clearly misleading or incorrect.

## Example rules

Below are three fully written-out rules, one each from three different domains, to show the format in practice. Rules are authored in YAML. (These are illustrative samples for format only — they aren't necessarily part of the catalog; see `src/taxonomy/` for the live rules.)

### Example 1 — Graphical Gaffes

```yaml
id: unsorted-bar-categories
name: Unsorted Bar Categories
domain: Graphical Gaffes
severity: warning
description: >
  A bar chart whose categories are left in an arbitrary order (often alphabetical or
  source order) when the message is about magnitude. Ranking by value would let the
  reader compare and spot the largest and smallest at a glance; an arbitrary order
  forces them to hunt across the chart and obscures the pattern.
detection_strategy: >
  In charts and charting code, flag categorical bar/column charts sorted
  alphabetically or by an incidental key rather than by the value being compared,
  especially when the point is "which is biggest/smallest." Note exceptions: an
  inherent order (months, age bands, Likert scales) should be preserved, so scope the
  check to nominal categories where rank is the message.
example_bad: >
  A bar chart of sales by product category listed alphabetically, so the reader has to
  scan all twelve bars to find the top seller and can't see the ranking at a glance.
example_good: >
  The same bars sorted descending by sales, so the largest category comes first and
  the ranking is immediately readable — unless the categories have an inherent order
  worth preserving.
remediation: >
  Sort bars by the value being compared (usually descending) when rank or magnitude is
  the message; preserve a natural order only when one exists (time, ordinal scales).
  Make the ordering intentional rather than an incidental default.
references:
  - "Avoiding Data Pitfalls, Ch. 6: Graphical Gaffes"
  - "https://www.avoidingdatapitfalls.com"
```

### Example 2 — Statistical Slip-Ups

```yaml
id: base-rate-neglect
name: Base Rate Neglect
domain: Statistical Slip-Ups
severity: warning
description: >
  Judging how likely something is from specific evidence while ignoring the underlying
  base rate (prior probability). When a condition is rare, even a fairly accurate test
  produces mostly false positives, so a "positive" result is far less conclusive than
  it seems.
detection_strategy: >
  In prose and code, flag probability or risk claims that use only a test's accuracy
  (sensitivity/specificity, hit rate) without the prevalence of the condition — a
  "positive result means X% chance" statement with no prior, or a classifier judged on
  raw accuracy over a highly imbalanced class. Be suspicious when a rare event is
  treated as likely on the strength of a single indicator.
example_bad: >
  "This screening test is 99% accurate and you tested positive, so you almost certainly
  have the disease" — for a disease that affects 1 in 10,000, most positives are false,
  so the real chance is well under 1%.
example_good: >
  The claim combines the test's accuracy with the base rate (via Bayes' rule),
  reporting that a positive result raises the probability to roughly 1% and
  recommending a confirmatory test — rather than treating the positive as near-certain.
remediation: >
  Always bring in the base rate (prevalence/prior) when interpreting a test or
  indicator, and combine it with accuracy using Bayes' rule. For imbalanced
  classification, judge models on precision and recall, not raw accuracy.
references:
  - "Avoiding Data Pitfalls, Ch. 4: Statistical Slip-Ups"
  - "https://www.avoidingdatapitfalls.com"
```

### Example 3 — Epistemic Errors

```yaml
id: precision-accuracy-confusion
name: Confusing Precision with Accuracy
domain: Epistemic Errors
severity: warning
description: >
  Treating a precisely stated number as though it were an accurate one. Precision is
  about the granularity of a figure (how many decimal places); accuracy is about how
  close it is to the truth. Reporting many significant figures can project false
  confidence in a measurement that is, in fact, highly uncertain.
detection_strategy: >
  Flag figures reported with far more significant digits than the underlying method
  could justify — e.g. survey-based estimates given to several decimals, model outputs
  presented without uncertainty ranges, or derived values whose precision exceeds that
  of their inputs. Look for absent confidence intervals, error bars, or margins of error.
example_bad: >
  "Based on our sample of 200 respondents, the average household spends $1,247.38
  per year on coffee." (The two-decimal precision implies a certainty the sample
  size cannot support.)
example_good: >
  "Based on our sample of 200 respondents, the average household spends roughly
  $1,250 per year on coffee (95% CI: $1,100–$1,400)." (Precision is matched to the
  uncertainty, and the range is stated.)
remediation: >
  Match the precision of a reported figure to the accuracy your method can support.
  Round to a justifiable number of significant figures and report uncertainty
  (confidence intervals, margins of error, error bars) alongside point estimates.
references:
  - "Avoiding Data Pitfalls, Ch. 1: Epistemic Errors"
  - "https://www.avoidingdatapitfalls.com"
```

## Adding a new rule

1. Confirm the pitfall isn't already covered.
2. Pick the single best-fitting domain.
3. Fill in every field above — especially a clear `detection_strategy` and a matched `example_bad` / `example_good` pair.
4. Open a [New pitfall rule](https://github.com/bjonesdataliteracy/datapitfalls/issues/new?template=new_pitfall_rule.md) issue to discuss it, then submit a PR.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full workflow.

## Domain extensions

Most rules are grounded in a specific example or sub-pitfall from *Avoiding Data Pitfalls*, and their first `references` entry cites that section directly (e.g. `Pitfall 2A: The Dirty Data Pitfall`). Some pitfalls clearly belong to a domain's theme but are **not** described in the book — for example, join fan-out (row multiplication) or character-encoding corruption both fit Technical Trespasses but appear nowhere in that chapter. These are captured as **domain extensions** so the catalog can cover real pipeline failures without overstating what the book says.

Extension rules follow two conventions:

1. **Location** — they live in an `extensions/` subdirectory of their domain, e.g. `src/taxonomy/technical-trespasses/extensions/`. They are otherwise ordinary rules: same fields, same schema, same validation, and `id` must still match the filename.
2. **Attribution** — their first `references` entry is a domain-level attribution that explicitly marks the rule as an extension rather than a specific book example, and is followed by at least one authoritative external source:

   ```yaml
   references:
     - "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 2: Technical Trespasses (domain extension — not a specific sub-pitfall example in the book)"
     - "Ralph Kimball & Margy Ross, The Data Warehouse Toolkit (3rd ed., Wiley, 2013) — join grain and many-to-many fan traps"
     - "https://www.avoidingdatapitfalls.com"
   ```

   A rule that generalizes a book example (rather than introducing a wholly new one) should say so instead — e.g. `(domain extension — generalizes the two-digit-year example in Pitfall 2A)`.

This keeps the book-grounded rules faithful to the source while letting the taxonomy grow to match real-world data work.
