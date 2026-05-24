# Pitfall Taxonomy Specification

The pitfall taxonomy is the heart of datapitfalls. It's a structured, machine-readable catalog of the ways data work goes wrong, organized around the seven audit domains from *Avoiding Data Pitfalls*. This document specifies the format every pitfall rule follows, so the catalog stays consistent as it grows — including through [community contributions](../CONTRIBUTING.md).

## The seven audit domains

Every pitfall rule belongs to exactly one domain:

1. **Epistemic Errors** — flaws in how we think about and come to know things
2. **Technical Trespasses** — failures in the data pipeline
3. **Mathematical Miscues** — errors in the arithmetic and quantities
4. **Statistical Slip-Ups** — mistakes in inference and sampling
5. **Analytical Aberrations** — distortions introduced during analysis
6. **Graphical Gaffes** — charts that mislead
7. **Design Dangers** — presentation that fails the audience

## Rule fields

Each pitfall rule is an object with the following fields:

| Field                | Type                              | Description                                                                 |
| -------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| `id`                 | string (kebab-case)               | Unique, stable identifier for the rule (e.g. `truncated-y-axis`).           |
| `name`               | string                            | Human-readable name (e.g. "Truncated Y-Axis").                              |
| `domain`             | enum (one of the 7 domains)       | The audit domain this pitfall belongs to.                                   |
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

Below are three fully written-out rules, one each from three different domains, to show the format in practice. Rules are authored in YAML.

### Example 1 — Graphical Gaffes

```yaml
id: truncated-y-axis
name: Truncated Y-Axis
domain: Graphical Gaffes
severity: warning
description: >
  A bar chart whose value axis does not start at zero. Because the length of a
  bar encodes its value, truncating the axis exaggerates the differences between
  bars and can make small, even trivial, differences look dramatic.
detection_strategy: >
  For chart images, inspect the value axis of bar/column charts and check whether
  the baseline is zero. For charting code, look for explicit axis limits or scale
  domains that exclude zero (e.g. matplotlib `set_ylim`, ggplot `coord_cartesian`
  / `ylim`, Vega-Lite `scale: {zero: false}`). Note: line charts and some other
  encodings may legitimately omit zero, so scope the check to length-encoded marks.
example_bad: >
  A column chart of quarterly revenue ($1.02M, $1.04M, $1.05M) with a y-axis that
  runs from $1.00M to $1.06M, making a ~3% change look like a near-tripling.
example_good: >
  The same data plotted with a y-axis starting at $0, so the bar lengths reflect
  the true proportional differences — or, if the small change is the point, shown
  as a line chart or with the percentage change called out explicitly.
remediation: >
  Start the value axis of bar/column charts at zero. If small differences are the
  story, choose an encoding (line chart, dot plot, or explicit delta) that doesn't
  rely on bar length, and label the change directly.
references:
  - "Avoiding Data Pitfalls, Ch. 6: Graphical Gaffes"
  - "https://www.avoidingdatapitfalls.com"
```

### Example 2 — Statistical Slip-Ups

```yaml
id: survivorship-bias
name: Survivorship Bias
domain: Statistical Slip-Ups
severity: error
description: >
  Drawing conclusions from only the people, items, or records that "survived" some
  selection process, while ignoring those that dropped out. Because the failures are
  invisible in the data, the survivors paint a systematically over-optimistic picture.
detection_strategy: >
  In plain-English descriptions and documents, flag analyses restricted to entities
  that "are still active," "remained," "completed," or "currently exist," especially
  when the conclusion generalizes to the original population. In code, look for filters
  that keep only currently-present records (e.g. `WHERE status = 'active'`, dropping
  churned/closed/deceased rows) before computing population-level statistics.
example_bad: >
  "We measured customer satisfaction by surveying our current subscribers and found
  92% are happy — so our product clearly delights users." (Everyone who was unhappy
  enough to cancel is excluded.)
example_good: >
  "We surveyed both current subscribers and customers who cancelled in the last year.
  Satisfaction among current subscribers is 92%, but the churned cohort tells a
  different story, and we weight both to estimate satisfaction across all customers."
remediation: >
  Identify the selection process and ask what was filtered out. Whenever possible,
  include the non-survivors, or explicitly scope claims to the surviving population
  rather than generalizing to the whole.
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
