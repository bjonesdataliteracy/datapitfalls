// GENERATED FILE — do not edit by hand.
// Source of truth: the per-rule YAML files in src/taxonomy/.
// Regenerate with: npm run build:taxonomy

import type { PitfallRule } from "./types.js";

export const rules: PitfallRule[] = [
  {
    "id": "data-reality-gap",
    "name": "Mistaking Data for Reality",
    "domain": "Epistemic Errors",
    "severity": "warning",
    "description": "Data is never the phenomenon itself — it is a record collected about the phenomenon through a fallible chain of observing, reporting, and recording. The pitfall is forgetting this gap and treating the data as a perfect mirror of reality, so conclusions are stated about the world (\"crime fell,\" \"this is where meteorites strike\") when the data only supports claims about what was measured and recorded. The gap always exists; the only question is how large it is.\n",
    "detection_strategy": "Flag language that equates a measured or reported quantity with the underlying real-world phenomenon — e.g. \"crime dropped\" instead of \"reported crime dropped,\" or a map of recorded events described as where the events actually occur. Look for counts, maps, or totals presented as complete coverage when they in fact reflect observation/reporting coverage (events are only in the data if someone saw, reported, and faithfully recorded them). Watch for claims that omit who collected the data and how, and for cumulative figures that behave oddly (e.g. counts that can be revised downward) because records are provisional.\n",
    "example_bad": "\"This map of every recorded meteorite impact shows meteorites overwhelmingly strike land near populated regions, not open ocean.\" The data reflects where strikes were observed and recorded — near developed, populated areas — not where meteorites are actually more likely to fall.\n",
    "example_good": "\"This map shows where meteorite strikes have been observed and recorded since antiquity. The concentration over populated regions reflects reporting coverage, not a real tendency for meteorites to avoid the oceans, so we can't read it as a true strike-density map.\"\n",
    "remediation": "Name the measurement process before drawing conclusions: who collected the data, how, and what it could miss. Phrase findings as statements about the recorded data (\"reported crime,\" \"counter counts,\" \"recorded strikes\") rather than the phenomenon, and explicitly account for the gap when generalizing. Visualizing the data and investigating outliers, shifts, and trends often surfaces where the gap is hiding.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 1A: The Data-Reality Gap",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "human-keyed-rounding",
    "name": "Rounding Fingerprints in Human-Keyed Data",
    "domain": "Epistemic Errors",
    "severity": "warning",
    "description": "Values recorded by humans tend to be rounded, fudged, or guesstimated, so they cluster at \"round\" numbers — multiples of 5 or 10, times reported at the top of the hour or at :05. Treating such data as precise, or reading meaning into the clustering itself, mistakes a fingerprint of the data-entry process for a real pattern in the phenomenon. The same variable measured by an instrument rather than a person typically shows no such heaping.\n",
    "detection_strategy": "Inspect distributions at fine resolution for \"heaping\": conspicuous spikes at values divisible by 5 or 10, time values piling up at :00/:05/:15/:30, or a last-digit distribution that is far from uniform. A histogram that looks smooth at a coarse bin size (e.g. 10) can reveal heaping when re-binned at size 1. Flag any analysis that depends on a precision the human-entry process cannot support, or that interprets the spikes at round values as a real signal.\n",
    "example_bad": "\"Roster weights cluster sharply at 200, 210, and 220 lbs, so teams must set training targets at those round weights.\" The clustering is rounding by whoever keyed the roster — a 1-lb histogram shows roughly three in four listed weights are divisible by 5.\n",
    "example_good": "\"Roster weights show heavy heaping at multiples of 5 and 10 — a fingerprint of human-entered rounding — so we treat them as approximate. By contrast, the precisely measured Combine weights show a near-uniform last-digit distribution, which is what an instrument-based measurement looks like.\"\n",
    "remediation": "Re-examine the distribution at fine resolution (last-digit analysis or 1-unit bins) to expose heaping before trusting precision. Treat heaped values as approximate, avoid over-interpreting spikes at round numbers, and prefer instrument-measured data when the level of precision actually matters to the conclusion.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 1B: All Too Human Data",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "inductive-overreach",
    "name": "Inductive Leap from Sample to Universal",
    "domain": "Epistemic Errors",
    "severity": "warning",
    "description": "Generalizing from specific observations in the data — singular statements about what was measured, when, and where — to a universal claim about what is always true, without acknowledging the inductive leap. No quantity of confirming observations proves a universal statement, so treating \"it happened in this data\" as \"it holds in general\" overreaches beyond the time, place, and conditions the data actually covers. A common tell is a verb-tense shift from the past (\"crossed\") to the present or future (\"cross,\" \"will cross\").\n",
    "detection_strategy": "Look for claims that slide from past-tense, scoped observations to present- or future-tense universal generalizations — \"X crossed the bridge in April\" becoming \"X bikes cross the bridge,\" or \"this fund outperformed last year\" becoming \"this fund is the best investment going forward.\" Flag conclusions that extend a finding beyond the sampled time, place, or population, and any \"past performance predicts future results\" reasoning.\n",
    "example_bad": "\"Eastbound bike crossings exceeded westbound in April 2014, so more cyclists cross the bridge heading east.\" A single month of recorded counts is generalized into an always-true claim — and later data shows westbound is typically higher.\n",
    "example_good": "\"Eastbound crossings exceeded westbound in April 2014. That suggests a testable hypothesis — eastbound is usually higher — which I checked against other months and found false: westbound is typically higher, with a summer peak.\"\n",
    "remediation": "Keep singular (observed) and universal (general) statements distinct. State findings in the past tense, scoped to the data at hand. When you do generalize, frame it as an explicit, falsifiable hypothesis and test it against additional data rather than assuming the pattern holds beyond what you measured.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 1D: The Black Swan Pitfall",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "measurement-system-drift",
    "name": "Trends Driven by a Changing Measurement System",
    "domain": "Epistemic Errors",
    "severity": "warning",
    "description": "A time series shows an apparent trend that is partly or wholly an artifact of changes in how the phenomenon was measured — instrumentation sensitivity, coverage, reporting requirements, or definitions — rather than a real change in the phenomenon. Because the data-reality gap itself shrinks or grows over the period, comparisons across time are not apples-to-apples, and a rise in the data can simply mean we got better at detecting or recording.\n",
    "detection_strategy": "Examine long time series of counts or rates that span known changes in instrumentation, coverage, reporting rules, or definitions. Be suspicious when a rising trend is concentrated in the hardest-to-detect cases (small events, borderline diagnoses, minor incidents) and coincides with technological or procedural improvements. Flag any claim that reads a long-run trend as real change without controlling for, or even mentioning, detection capability.\n",
    "example_bad": "\"Recorded magnitude-6.0+ earthquakes have climbed steadily since 1900, so the planet is becoming far more seismically active.\" The increase is concentrated in the smallest, hardest-to-detect band and tracks the expansion of seismic instrumentation, not necessarily any real rise in seismic activity.\n",
    "example_good": "\"Recorded magnitude-6.0+ earthquakes have risen since 1900, but the increase is concentrated in the 6.0–6.9 band and coincides with major improvements in seismograph coverage. We therefore cannot conclude that actual seismic activity increased; the trend may largely reflect better detection.\"\n",
    "remediation": "Before reading a time trend as real, ask whether the measurement system changed over the period. Hold the method constant by restricting to a consistently measured subset (e.g. only the largest earthquakes, which were always detectable), annotate known instrumentation or definition changes on the chart, and scope claims to \"recorded\" counts when detection capability cannot be held constant.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 1A: The Data-Reality Gap (earthquake example)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "rater-inconsistency",
    "name": "Treating Subjective Ratings as Objective Measures",
    "domain": "Epistemic Errors",
    "severity": "warning",
    "description": "Human ratings and categorizations carry measurement noise: different raters disagree (reproducibility), and even the same rater can score an identical item differently on a repeat viewing (repeatability), swayed by context and the order in which items appear. Treating subjective ratings as if they were precise, objective measurements reads real signal into what is partly rater variability.\n",
    "detection_strategy": "Flag analyses that lean on subjective human ratings or labels — ripeness, quality, sentiment, severity, star ratings — as though they were exact, repeatable measurements. Be suspicious of single-rater labels with no measure of inter-rater agreement, of small rating differences treated as meaningful, and of rating scales whose categories are vague or undefined. Watch for ignored order or context effects, where the same item is scored differently depending on what preceded it.\n",
    "example_bad": "\"Our panel rated version B a 3.8 and version A a 3.6, so B is the better design.\" A 0.2 gap on a subjective scale can easily be rater noise; the same panelists often score an identical item differently when it appears in a different position in the sequence.\n",
    "example_good": "\"Version B averaged 3.8 versus A's 3.6, but inter-rater spread was wide and a hidden duplicate item was scored differently by a third of the panel. We treat the gap as within noise and collect more ratings before concluding B is better.\"\n",
    "remediation": "Quantify rating reliability before trusting it: use multiple raters and report inter-rater agreement, embed repeated or duplicate items to measure intra-rater consistency, define each rating category operationally, and randomize presentation order to limit context effects. Treat small differences on noisy scales as inconclusive.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 1C: Inconsistent Ratings",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "unfalsifiable-claim",
    "name": "Unfalsifiable Hypothesis (the God Pitfall)",
    "domain": "Epistemic Errors",
    "severity": "warning",
    "description": "Working with a hypothesis that no possible observation could disprove — either because it is framed as a basic existential or untestable claim, or because the analyst shields it from disconfirmation by only ever seeking supporting evidence. A claim that cannot be proven wrong cannot be tested, so corroboration of it teaches us nothing. Genuine progress comes from honest attempts to falsify a claim, not from accumulating evidence that flatters it.\n",
    "detection_strategy": "Flag conclusions for which no described observation would count as disconfirming, hypotheses stated so vaguely that any result appears to fit, and analyses that gather only confirming cases while never looking for the data that could refute the claim. Watch for existential framings (\"X exists somewhere\") presented as data-supported conclusions, and for post-hoc reasoning that explains away every contradicting result.\n",
    "example_bad": "\"Our redesign improves engagement.\" When metrics fall, the team says the benefit is long-term; when they rise, it is taken as proof. No conceivable outcome could ever count against the claim, so the data can never test it.\n",
    "example_good": "\"Our redesign will raise 30-day retention by at least 2 points. If retention is flat or lower in the A/B test, we will treat the hypothesis as disproven and roll the change back.\" The disconfirming result is defined in advance.\n",
    "remediation": "State hypotheses so that a specific, observable result would falsify them, and name that disconfirming result up front. Actively seek the evidence that could prove you wrong rather than only the evidence that confirms you, and treat a failed prediction as a valuable correction rather than a threat to defend against.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 1E: Falsifiability and the God Pitfall",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "categorical-value-fragmentation",
    "name": "Fragmented Categorical Values",
    "domain": "Technical Trespasses",
    "severity": "warning",
    "description": "A single real-world category is split across many surface forms — misspellings, abbreviations, punctuation, and inconsistent capitalization (\"Chevrolet\" / \"Chevy\" / \"Cheverolet\", \"Gray\" / \"Grey\" / \"grey\") — so grouping or counting the raw field scatters one category across dozens of values. Counts are understated, rankings shuffle, and the true leader can stay hidden until the variants are merged. The tell is a distinct-value count far larger than the domain could plausibly contain.\n",
    "detection_strategy": "Flag group-by, counting, or ranking over a free-text categorical field with high cardinality relative to the real number of categories, a long tail of low-frequency values, and near-duplicate strings (small edit distance, case-only differences, trailing whitespace). In code, look for `value_counts()`, `GROUP BY make`, or `COUNT(*)` on a raw text column with no preceding normalization (`.str.lower().str.strip()`, fuzzy clustering, or a lookup table). Be suspicious when the distinct-value count is implausible for the domain (e.g. hundreds of \"vehicle makes\").\n",
    "example_bad": "`SELECT make, COUNT(*) FROM tows GROUP BY make ORDER BY COUNT(*) DESC` is run over a field with 899 distinct values including \"Chevy\", \"Cheverolet\", \"Chevolet\", \"MAZDA\", and \"Mazada\". Honda and Ford appear far smaller than they really are, and Volkswagen — spelled 36 different ways — never reaches the top 25.\n",
    "example_good": "The field is normalized first (trim, lowercase, then cluster near-duplicates with a fingerprint/Levenshtein method and apply a human-reviewed mapping table), so the 899 forms collapse to ~336 real makes before counting. After merging, Honda and Ford rise materially (+46% and +36%) and Volkswagen lands at 11th — a corrected ranking the raw counts had hidden.\n",
    "remediation": "Normalize categorical text before any group-by: standardize case and whitespace, then consolidate variants with clustering (OpenRefine fingerprint, Levenshtein) plus a human-reviewed mapping. Re-check the distinct-value count against a plausible domain size, and keep the mapping as an auditable artifact rather than editing values in place.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 2A: The Dirty Data Pitfall",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "character-encoding-corruption",
    "name": "Character Encoding Corruption (Mojibake)",
    "domain": "Technical Trespasses",
    "severity": "error",
    "description": "Text is read with the wrong character encoding — typically a UTF-8 file decoded as Latin-1/Windows-1252 or vice versa — so multi-byte characters turn into garbled sequences (\"café\" → \"cafÃ©\", \"naïve\" → \"naÃ¯ve\"). The corruption is silent: the pipeline runs without error, but accented names, currency symbols, and non-Latin scripts are mangled, which breaks joins on text keys and misrepresents the data. This is not described in the book; it extends the domain's pipeline-failure theme.\n",
    "detection_strategy": "Flag file reads with no explicit encoding (`open()` / `pd.read_csv` defaulting to the platform locale), and scan string columns for tell-tale mojibake — sequences like \"Ã©\", \"Ã¼\", \"â€™\", \"Ã±\", or literal replacement characters (U+FFFD \"�\"). Watch for a byte-order mark (BOM) leaking into the first column name, text keys that fail to join despite looking similar, and double-encoded UTF-8. In data review, scan distinct values of name/address/label fields for accented-gibberish patterns.\n",
    "example_bad": "A UTF-8 export of customer names is read with `pd.read_csv('names.csv', encoding='latin-1')`. \"José\" becomes \"JosÃ©\" and \"Łukasz\" is mangled; a later join to an orders table on the (correctly encoded) name key drops every customer with an accented name.\n",
    "example_good": "The file is read with its actual encoding declared — `pd.read_csv('names.csv', encoding='utf-8')` (using `utf-8-sig` if a BOM is present) — so \"José\" and \"Łukasz\" survive intact. Encoding is fixed and verified at ingestion, and text is Unicode-normalized (e.g. NFC) before being used as a join key.\n",
    "remediation": "Always specify the encoding when reading and writing text; detect it explicitly (e.g. with chardet) rather than trusting platform defaults, and standardize on UTF-8 end to end. Handle BOMs (`utf-8-sig`), normalize Unicode before comparing or joining on text, and add a check that scans for mojibake markers so corruption fails loudly at ingestion rather than surfacing downstream.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 2: Technical Trespasses (domain extension — not a specific sub-pitfall example in the book)",
      "Joel Spolsky (2003), 'The Absolute Minimum Every Software Developer Absolutely, Positively Must Know About Unicode and Character Sets (No Excuses!)'",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "join-fan-out",
    "name": "Join Fan-Out (Row Multiplication)",
    "domain": "Technical Trespasses",
    "severity": "warning",
    "description": "A join is performed on a key that is non-unique on one or both sides, so each row matches multiple partners and the result set multiplies. Aggregates computed afterward (`SUM`, `COUNT`, `AVG`) then double-count the duplicated rows and inflate totals — a \"fan trap.\" The row count silently grows instead of shrinking, the mirror image of a key-mismatch drop. This extends the book's join discussion, which covers non-matching keys but not row-multiplying duplicate keys.\n",
    "detection_strategy": "In code, flag joins where the key is not known to be unique on at least one side — `pd.merge` with no cardinality check, a SQL `JOIN` to a table with duplicate keys, followed by `SUM`/`COUNT` over the result. Look for missing uniqueness assertions (`validate='one_to_many'` in pandas, primary-key or `DISTINCT` checks), a post-join row count larger than the driving table, and aggregates that drift upward once a join is added. Be suspicious of joining two fact-grain tables directly.\n",
    "example_bad": "An `orders` table (one row per order) is joined to `shipments` on `order_id`, but orders with multiple partial shipments now appear several times. `SELECT SUM(order_total) FROM orders JOIN shipments USING (order_id)` counts each multi-shipment order's total once per shipment, overstating revenue.\n",
    "example_good": "The grain is reconciled before aggregating: either aggregate `shipments` to one row per `order_id` first, or sum `order_total` from `orders` alone and attach shipment facts separately. The merge runs with an explicit cardinality check (`pd.merge(..., validate='one_to_many')`) and the post-join row count is compared to the driving table, so unexpected multiplication fails loudly.\n",
    "remediation": "Establish the grain (the unit one row represents) of each input and the intended grain of the output before joining. Assert key uniqueness on the side that should be unique, aggregate the many-side to the target grain before joining, and compare row counts before and after. Treat any unexplained increase in row count as a fan-out until proven otherwise.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 2: Technical Trespasses (domain extension — not a specific sub-pitfall example in the book)",
      "Ralph Kimball & Margy Ross, The Data Warehouse Toolkit (3rd ed., Wiley, 2013) — join grain and many-to-many fan traps",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "join-key-mismatch-row-loss",
    "name": "Join Key Mismatch Drops Rows",
    "domain": "Technical Trespasses",
    "severity": "warning",
    "description": "Two datasets are joined on a key whose values are represented differently across sources — spelling, punctuation, word order, abbreviations, or an entity present in one source and absent from the other (\"St. Kitts & Nevis\" vs \"St. Kitts and Nevis\", \"Hong Kong\" vs \"Hong Kong SAR, China\"). An inner join silently drops every unmatched row; a left or outer join keeps the rows but leaves nulls in the joined columns. Either way records vanish or go blank with no error, and downstream totals, rates, and rankings are computed on an incomplete table.\n",
    "detection_strategy": "In code, flag joins, merges, and lookups on free-text or name keys with no normalization beforehand — `JOIN ... ON a.country = b.country`, `pd.merge(how='inner')`, Excel `VLOOKUP` — together with the absence of any match-rate or coverage check. Look for missing before/after row-count comparisons, no anti-join to enumerate non-matching keys, and aggregates run straight off the joined table. In prose, flag combining two sources \"by name\" with no mention of how unmatched names were handled.\n",
    "example_bad": "Website traffic (180 country names from Google Analytics) is inner-joined to World Bank population on the country name. 34 of the GA countries have no exact match (\"Bahamas\" vs \"Bahamas, The\"; Taiwan absent entirely), so they silently drop out — and 3 of the top 25 countries by \"views per 1,000 people\" disappear from the result with no warning.\n",
    "example_good": "Before joining, the analyst compares the key sets both ways (a Venn / anti-join), finds the 34 non-matching names, normalizes or maps them to a common standard (and adds Taiwan's population by hand), then joins and verifies the post-join row count and match rate. The corrected join retains every intended country and the ranking is complete.\n",
    "remediation": "Treat the join key as data to be cleaned: normalize representations (case, punctuation, known aliases) or map to a stable code (e.g. an ISO country code) rather than a display name. Inspect the non-matching rows with an anti-join, compare row counts before and after the join, and report the match rate so silent drops and null fills surface before you analyze the merged table.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 2B: Bad Blends and Joins",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "overloaded-missing-sentinels",
    "name": "Ambiguous Missing-Value Encodings",
    "domain": "Technical Trespasses",
    "severity": "warning",
    "description": "A single field encodes \"missing\" in several incompatible ways — an empty string, a literal \"?\" or \"Unknown\", and out-of-range numeric sentinels like 0, -1, or 99 — and these are then conflated, counted as real categories, or fed into arithmetic. Different reasons for absence (not asked, asked-but-unknown, not applicable) get merged into one bucket, and numeric sentinels silently distort sums, means, and extremes.\n",
    "detection_strategy": "Flag fields that mix blanks with placeholder tokens (\"?\", \"N/A\", \"Unknown\", \"none\") or that contain suspicious numeric sentinels (0, -1, 999, 99) inside an otherwise continuous range. In code, look for these values passing through with no explicit `na_values=[...]` mapping, sentinel tokens surviving into `value_counts()` / `GROUP BY`, or numeric sentinels included in `AVG` / `SUM` / `MIN`. Watch for two different missing markers folded into one, or a placeholder ranked as though it were a real category.\n",
    "example_bad": "A `color` field holds real colors plus blanks and a separate \"?\" entry, and a `year` field uses 0 for unknown. The pipeline reads blank and \"?\" as the same \"missing\" bucket (losing the distinction between left-blank and recorded-as-unknown) and leaves the 0s in, so `MIN(year)` returns 0 and the average is dragged toward zero.\n",
    "example_good": "The loader declares the sentinels explicitly (`pd.read_csv(..., na_values=['', '?', 'Unknown', '0'])`) and keeps semantically different kinds of missing in distinct flags where the difference matters (blank = not recorded vs \"?\" = recorded-as-unknown). Numeric sentinels are converted to null before any arithmetic, so aggregates ignore them instead of treating 0 as a real year.\n",
    "remediation": "Inventory every value that means \"missing\" in each field and map them to true nulls at load time, while preserving meaningful distinctions between kinds of missingness in separate indicators. Never leave numeric sentinels (0, -1, 999) in a column you will sum, average, or take extremes of, and confirm placeholders don't survive into category counts.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 2A: The Dirty Data Pitfall",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "silent-null-drop",
    "name": "Silently Dropping Null Records",
    "domain": "Technical Trespasses",
    "severity": "warning",
    "description": "Records with null or blank values in a field are filtered out — explicitly, or by a function that skips them by default — before computing a proportion, rate, or average, and the result is then read as representative of the whole. This silently assumes the missing records share the distribution of the observed ones. When missingness is not random (e.g. one source or site logs the field and another does not), the surviving subset is biased and the headline numbers are wrong.\n",
    "detection_strategy": "In code, flag null filtering ahead of an aggregate that gets generalized — `dropna()`, `WHERE x IS NOT NULL`, `df[df.x.notnull()]`, `COUNT(x)` standing in for `COUNT(*)`, or reliance on functions that skip nulls (`mean()` with default `skipna=True`, SQL `AVG`) — especially when the null share is large. Check whether the analysis ever quantifies the missing fraction or tests whether missingness correlates with another field (source, site, date). In prose, flag \"we excluded the blank/unknown rows\" with no argument that they were missing at random.\n",
    "example_bad": "28.5% of vehicle-color records are null. The analyst runs `df.dropna(subset=['color'])` and reports the color breakdown of the remainder as the demand mix — not realizing almost all the nulls come from a single tow yard, so the surviving rows over-represent the other yard and skew every color's share.\n",
    "example_good": "The analyst first measures the null rate and cross-tabs missingness against source, finding the nulls are concentrated at one yard (missing-not-at-random). They scope the analysis to the relevant yard (where only 0.8% is null), state that assumption explicitly, and report coverage (\"we have color for 97.3% of records at this yard\") instead of silently dropping a quarter of the data.\n",
    "remediation": "Before dropping nulls, quantify how much is missing and test whether missingness is associated with source, time, or group. If it is not random, don't filter blindly — segment, impute with a stated model, or scope and caveat the claim to the population actually observed. Always report the share excluded and the assumption that justifies excluding it.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 2A: The Dirty Data Pitfall",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "silent-type-coercion",
    "name": "Silent Type Coercion",
    "domain": "Technical Trespasses",
    "severity": "warning",
    "description": "A value's data type is implicitly converted on load or during processing, changing its meaning without raising an error — leading zeros stripped when an identifier is read as an integer (ZIP \"02134\" → 2134), numeric-looking strings auto-cast, dates or booleans inferred from ambiguous text, or large IDs losing precision as floats. The data looks fine until a join, sort, or format silently breaks. The book's two-digit-year case is one instance; this generalizes the failure mode to any implicit coercion.\n",
    "detection_strategy": "Flag readers and casts that infer types implicitly — `pd.read_csv` without `dtype`/`converters`, spreadsheet import with auto-detection, bare `int()`/ `float()` over identifier columns. Look for code that treats codes/IDs (ZIP, FIPS, SKU, phone, account or order numbers) as numeric, joins or comparisons that fail because one side became numeric, and large integer IDs stored as float. In data, watch for identifier columns missing leading zeros or collapsed to a uniform numeric width.\n",
    "example_bad": "A CSV of addresses is loaded with `pd.read_csv('addresses.csv')`. Pandas infers the `zip` column as int64, so \"02134\" becomes 2134 and every New England ZIP loses its leading zero. A later join to a ZIP reference table on the string key silently matches nothing for those rows.\n",
    "example_good": "Identifier columns are read as strings with explicit types — `pd.read_csv('addresses.csv', dtype={'zip': str})` (or `converters`) — so \"02134\" stays \"02134\". Columns that are codes, not quantities, are typed as text up front, and the join key's type is asserted equal on both sides before merging.\n",
    "remediation": "Declare types explicitly at every boundary instead of relying on inference. Treat identifiers (ZIP, FIPS, SKU, phone, account, order IDs) as strings, never numbers; pin dtypes on import; and verify that join keys share a type before merging. Validate that identifier widths and leading zeros survive the round trip.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 2: Technical Trespasses (domain extension — generalizes the two-digit-year example in Pitfall 2A)",
      "Ziemann, Eren & El-Osta (2016), 'Gene name errors are widespread in the scientific literature,' Genome Biology 17:177 — spreadsheet auto-coercion of identifiers",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "two-digit-year-ambiguity",
    "name": "Ambiguous Two-Digit Year Parsing",
    "domain": "Technical Trespasses",
    "severity": "warning",
    "description": "Two-digit year values (or other truncated date encodings) are stored without century information, then parsed or aggregated as though they were complete, so the century is guessed wrong or the raw 0–99 codes are treated as real years. Averaging such a column can yield an impossible result — a mean \"vehicle year\" of 23 — and naive parsing maps \"11\" to the year 11 or splits a single model year across two centuries. The fingerprint is a year field whose values live in 0–99, often in two disconnected clusters.\n",
    "detection_strategy": "In code, flag date/year handling that depends on two-digit years without an explicit century-window rule — `%y` format strings, or hand-rolled arithmetic that adds 1900/2000 — and aggregations (`mean`/`min`/`max`/`AVG`) taken over a year column whose values fall in 0–99. In data, look for a \"year\" field ranging over 0–99, or mixing 0–99 with 1900–2099, and histograms with two separated groups (e.g. 0–17 and 82–99). In plain-English descriptions, watch for averages or trends over dates whose source format is two-digit and therefore ambiguous.\n",
    "example_bad": "A `Year` column holds values like 99, 91, 4, and 11 (keyed variously as \"'11\", \"11\", \"4\"). The analyst computes `df['Year'].mean()` and reports a typical towed-vehicle year of 23 — a meaningless figure, because the two-digit codes were averaged as raw integers instead of being resolved to 1999, 1991, 2004, and 2011.\n",
    "example_good": "The two-digit codes are mapped to full years with an explicit, documented century window justified by the data's known span (00–17 → 2000–2017, 18–99 → 1918–1999), e.g. `year = 2000 + yy if yy <= 17 else 1900 + yy`. The corrected column now averages to a sensible ~2005, and the windowing rule is recorded alongside the data so it can be reviewed.\n",
    "remediation": "Never average, sort, or threshold a two-digit year as a raw integer. Resolve the century explicitly with a window rule grounded in the data's real range, parse with full-year formats (`%Y`) at the source where possible, and validate the output range so impossible future years or pre-automobile years are caught. Document the disambiguation so the transformation is reproducible.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 2A: The Dirty Data Pitfall",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "divide-by-tiny-denominator",
    "name": "Division by Zero or Tiny Denominator",
    "domain": "Mathematical Miscues",
    "severity": "warning",
    "description": "A rate, ratio, or percent change is computed with a denominator that is zero or very small, producing an undefined result (division by zero → infinity/NaN) or an unstable, explosive value that swamps comparisons and rankings. Per-capita rates for tiny populations, percent changes off a near-zero base, and ratios over sparse counts all blow up and dominate \"top N\" lists with statistical noise. It extends the domain's rate-and-ratio theme but is not a specific example in the book.\n",
    "detection_strategy": "In code, flag division that forms a rate/ratio without guarding the denominator — no zero check, no minimum-sample threshold — especially `(new - old) / old` percent changes and per-unit rates over small counts. Look for resulting inf/NaN values, or rankings topped by units with tiny denominators. In data, check the distribution of denominators for zeros and a long thin tail of very small values.\n",
    "example_bad": "\"Percent change in incidents\" is computed per site as `(this_year - last_year) / last_year`. A site that went from 1 incident to 4 shows +300% and tops the \"fastest-growing\" list, while a site that went 0 → 5 yields a divide-by-zero (inf) — all driven by tiny baselines rather than meaningful trends.\n",
    "example_good": "Denominators are guarded and thresholded: sites below a minimum baseline are excluded or flagged, zero denominators are handled explicitly, and rates over small counts are shown with their uncertainty (or smoothed) — so the ranking reflects real movement rather than small-denominator noise.\n",
    "remediation": "Guard every denominator before dividing: handle zero explicitly, set a minimum-sample threshold for rates, and treat percent changes off a tiny base with caution. Report or smooth the uncertainty of rates built on small counts so noisy values don't dominate comparisons.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3: Mathematical Miscues (domain extension — not a specific sub-pitfall example in the book)",
      "Gelman & Price (1999), 'All maps of parameter estimates are misleading,' Statistics in Medicine 18 — instability of rates with small denominators",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "dropped-missing-categories",
    "name": "Dropped Missing Categories",
    "domain": "Mathematical Miscues",
    "severity": "warning",
    "description": "A category or period with no records — a true zero — is silently omitted from a chart or table instead of being shown as zero. On an ordinal/categorical axis the empty period simply doesn't appear (the gap is invisible and the slopes around it are distorted); switched to a continuous axis, a line is interpolated straight across the gap, implying nonzero values that never existed. Either way the absence is hidden. This is context-dependent: for events that legitimately occur only every few years, omitting or zero-filling can both be acceptable if chosen deliberately.\n",
    "detection_strategy": "In code, flag series built from present records only (`value_counts`, `GROUP BY year`) and plotted without reindexing onto the complete domain of periods/categories — no `reindex`/`asfreq`/calendar spine, no explicit zero-fill. Look for ordinal date axes that can skip values, or continuous axes that connect across gaps. In data, check whether the sequence of periods has holes (e.g. missing years) the visualization never surfaces.\n",
    "example_bad": "A timeline of Edgar Allan Poe's works by year is built only from years with at least one work, so 1826, 1828, and 1830 — years he published nothing — vanish from the axis entirely. The \"fewest works\" years look like 1824/1825, and a continuous-axis version even implies ~6–11 works in the missing years.\n",
    "example_good": "The series is reindexed onto every year from 1824 to 1849 with missing years filled at zero and shown explicitly (as discrete bars or points at zero), so the three nonproductive years are visible and the productivity pattern reads correctly — unless the domain is one where gaps are expected, in which case the handling is chosen deliberately and noted.\n",
    "remediation": "Decide explicitly how missing categories should render rather than accepting the software default. For dense series, reindex onto the full domain and show true zeros; for intermittent events, state that gaps are expected. Never let a continuous axis interpolate across a period that had no data.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3B: Missing Values",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "embedded-total-rows",
    "name": "Embedded Total Rows",
    "domain": "Mathematical Miscues",
    "severity": "warning",
    "description": "A data set contains pre-aggregated subtotal or \"Total\" rows mixed in with the detail rows — a \"Total\" sex alongside Male and Female, or a state-level row alongside its counties. Summing the measure naively then counts those records twice (or more), inflating the total by a factor of two, four, or worse. The duplication is silent because the total rows look like ordinary records.\n",
    "detection_strategy": "In code, flag `SUM`/`COUNT` over a measure without first excluding aggregate rows — no `WHERE sex <> 'Total'`, no filter on a subtotal flag. In data, look for a categorical field containing a catch-all level (\"Total\", \"All\", \"Both\", or a state name standing in for \"all counties\") whose value equals the sum of the others, or a grand total that is a clean multiple (2x, 4x) of the plausible figure. Be suspicious when one category alone accounts for ~50% of a total.\n",
    "example_bad": "California infectious-disease records include a \"Total\" row (Male + Female) for every county-year-disease and a \"California\" county row summing all counties. `SUM(Count)` returns 15,002,836 — double-counted by sex and again by county, four times the true ~3.74 million.\n",
    "example_good": "Aggregate rows are identified and excluded before summing — `WHERE Sex <> 'Total' AND County <> 'California'` — or the detail grain is selected explicitly, yielding the correct ~3.74 million. The total rows are kept only as a cross-check, never added to the detail.\n",
    "remediation": "Inspect categorical fields for subtotal/total levels before aggregating, and filter them out (or select only the base grain). Sanity-check grand totals against an independent estimate, and treat any category that equals the sum of its siblings — or a total that is a clean multiple of the expected value — as an embedded-total red flag.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3C: Tripping on Totals",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "floating-point-accumulation",
    "name": "Floating-Point Accumulation Error",
    "domain": "Mathematical Miscues",
    "severity": "warning",
    "description": "Repeated floating-point arithmetic accumulates small representation errors, so sums of many values, running totals, or money stored as binary floating point drift from the exact result, and exact-equality comparisons (`==`) between computed floats fail unexpectedly. Individually tiny, the errors can matter for currency, reconciliations, or any value compared for exact equality. It extends the domain's calculation-error theme but is not a specific example in the book.\n",
    "detection_strategy": "In code, flag money or high-precision quantities stored as float/double rather than decimal or integer minor-units, summation over many floats where an exact total is required, and `==`/`!=` comparisons between computed floating-point values instead of a tolerance. Look for totals that fail to reconcile by a fraction of a cent, or conditionals that hinge on exact float equality.\n",
    "example_bad": "A ledger stores amounts as 64-bit floats and checks `if balance == 0.0` after summing thousands of transactions; accumulated rounding leaves balance at 1e-11, the check fails, and a \"non-zero balance\" alert fires on an account that is actually settled.\n",
    "example_good": "Money is stored as integer cents or a Decimal type, sums are taken in that exact representation, and comparisons use a tolerance (`abs(balance) < 0.005`) rather than exact equality — so the settled account reconciles to zero.\n",
    "remediation": "Use a decimal or integer (minor-unit) representation for money and other exact quantities, not binary floating point. When floats are unavoidable, compare with an explicit tolerance rather than `==`, and be mindful of error accumulation in long summations.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3: Mathematical Miscues (domain extension — not a specific sub-pitfall example in the book)",
      "David Goldberg (1991), 'What Every Computer Scientist Should Know About Floating-Point Arithmetic,' ACM Computing Surveys 23(1)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "integer-division-truncation",
    "name": "Integer Division Truncation",
    "domain": "Mathematical Miscues",
    "severity": "warning",
    "description": "Two integer values are divided and the result is silently truncated (floored) to an integer instead of yielding the true fractional quotient, so a rate or ratio that should be, say, 0.3 comes back as 0. This is common wherever `/` on two integers means integer division (SQL, C, Java, Go, Python 2) and whenever a proportion is built from two integer count columns. The error is silent — no exception, just a wrong (often zero) number. It extends the domain's calculation-error theme but is not a specific example in the book.\n",
    "detection_strategy": "In code, flag division where both operands are integer-typed and a fractional result is expected — `count_a / count_b` over int columns in SQL, `int / int` in C/Java/Go, `/` in Python 2, or integer pandas Series divided to form a rate. Look for rates/proportions that come out as 0, 1, or suspiciously round integers, and for a missing cast before division. Be suspicious of a \"percentage\" column whose values are only ever 0 or 100.\n",
    "example_bad": "In SQL, `SELECT successes / attempts AS rate FROM trials` with both columns integer-typed returns 0 for every row that has fewer successes than attempts (3 / 10 → 0), so every conversion rate reads as 0%.\n",
    "example_good": "At least one operand is cast to a floating/decimal type before dividing — `successes * 1.0 / attempts` or `CAST(successes AS FLOAT) / attempts` (Python 3's `/` already does true division) — so 3 / 10 correctly returns 0.3.\n",
    "remediation": "Ensure at least one operand is a real/float/decimal type before dividing when a fractional result is intended, and cast explicitly rather than relying on the language default. Validate that computed rates fall across a plausible continuous range instead of collapsing to 0 or 1.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3: Mathematical Miscues (domain extension — not a specific sub-pitfall example in the book)",
      "Python PEP 238 — Changing the Division Operator (true division vs floor division)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "log-scale-averaging",
    "name": "Misreading a Log-Scale Average",
    "domain": "Mathematical Miscues",
    "severity": "warning",
    "description": "Values measured on a logarithmic (or otherwise nonlinear) scale — pH, decibels, earthquake magnitude, star magnitude, log-returns — are averaged arithmetically and the result is read as the average of the underlying physical quantity. The calculation is valid, but the arithmetic mean of log-scale values equals the log of the geometric mean of the original quantity, not the mean of that quantity. Conflating the two answers a different question than intended and can mislead badly, because a one-unit step on the scale is a multiplicative (often 10x or ~32x) step in the quantity. This extends the domain's aggregation theme but is not a specific sub-pitfall example in the book.\n",
    "detection_strategy": "In code and prose, flag an arithmetic mean or sum over a column known to be on a log or nonlinear scale — earthquake `mag`/Richter, `pH`, decibel/`dB`, log-returns, star magnitudes — especially when the result is described as the \"average\" magnitude/level/acidity or used as a stand-in for the physical quantity. Be suspicious of `mean()`/`AVG()` on such fields with no note that it reflects a geometric mean of the underlying quantity, and of summing log-scale values.\n",
    "example_bad": "An analysis reports `avg_magnitude = df[\"mag\"].mean()` as the \"average earthquake,\" implying typical energy release — but magnitude is logarithmic (an M6 releases ~32x the energy of an M5), so the arithmetic mean of magnitudes does not represent average energy at all.\n",
    "example_good": "The analyst is explicit about which question is being answered: report the mean magnitude as a summary of the magnitude scale itself (equivalently, the geometric mean of energy), or — to summarize the physical quantity — convert magnitudes to energy, average in energy units, and convert back. The scale and its meaning are stated.\n",
    "remediation": "Decide whether you want the average of the scale or the average of the underlying quantity. For the physical quantity, transform to linear units (energy, concentration, intensity, dollars), average there, then transform back if needed. When you do average on the log scale, label it as such — it is the geometric mean of the quantity, not its arithmetic mean.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3: Mathematical Miscues (domain extension — not a specific sub-pitfall example in the book)",
      "Limpert, Stahel & Abbt (2001), 'Log-normal Distributions across the Sciences,' BioScience 51(5) — the geometric mean and log-scale data",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "mismatched-units",
    "name": "Mismatched Units of Measure",
    "domain": "Mathematical Miscues",
    "severity": "error",
    "description": "Values expressed in different units of measure are combined, compared, or fed into a calculation without converting to a common unit. Because the numbers look interchangeable, the mismatch is silent — until the result is off by a constant factor or worse. Currency, metric vs imperial, temperature scales, magnitude suffixes (K/M/B), angle units, coordinate formats, and calendar-vs-business days are all common offenders.\n",
    "detection_strategy": "In code, flag arithmetic or comparisons that combine fields of plausibly different units with no conversion step — summing amounts that may be different currencies, mixing meters and feet, adding values where some are in thousands/millions, comparing °C to °F, or aggregating a quantity column that has a companion unit-of-measure (\"UoM\") field that is never branched on. In data/prose, watch for a measure whose magnitude or metadata implies mixed units, or calculations performed without consulting each field's documented unit.\n",
    "example_bad": "A spacecraft pipeline reads thruster impulse produced in pound-force seconds (lbf-s) and uses it directly where Newton-seconds (N-s) are expected; since 1 lbf ≈ 4.45 N, the trajectory is off by ~4.45x — the Mars Climate Orbiter failure mode. More mundanely, a `revenue` column that mixes USD and EUR rows is summed into a single grand total.\n",
    "example_good": "Units are confirmed from the metadata and normalized before any math — converting lbf-s to N-s (or all revenue to a single currency) up front. Mixed-unit fields are converted via their accompanying UoM column (IF/THEN per unit) into a common unit before aggregation, and the unit is documented.\n",
    "remediation": "Consult the metadata for every field's unit of measure before calculating; if it is missing, demand it. Convert all values to a common unit before combining them, handle mixed-unit fields by branching on their UoM column, and validate results against expected magnitudes so an order-of-magnitude unit error surfaces immediately.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3E: Unmatching Units",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "partial-period-aggregation",
    "name": "Partial-Period Aggregation",
    "domain": "Mathematical Miscues",
    "severity": "warning",
    "description": "A time series is aggregated into buckets (year, month, week) where the first or — more often — the most recent bucket covers only part of its period, because the data was extracted mid-period. Plotted or trended as if complete, the partial bucket looks like a sudden drop (or the first bucket like a slow start), and viewers infer a real decline that is purely an artifact of where the data ends.\n",
    "detection_strategy": "In code, flag time aggregations (`resample`, `GROUP BY date_trunc`, pivot by period) and trend lines that include the edge buckets without checking the data's actual min/max timestamp against the bucket boundary — i.e. no comparison of `max(date)` to the end of its period. In data, look for a final period whose total falls far below the prior trend, or whose record count is a fraction of a full period. In prose, watch for decline/trend claims about \"the latest year/month\" with no note of whether that period is complete.\n",
    "example_bad": "An extract of FAA wildlife-strike reports runs through July 31, 2017. Counting strikes per year and plotting the timeline shows a steep drop in 2017, and the analyst speculates about new airport technology — when in fact 2017 simply holds about half a year of records.\n",
    "example_good": "The analyst first checks the data's date range (earliest Jan 1 2000, latest Jul 31 2017), recognizes 2017 is partial, and either excludes the incomplete period, annotates it clearly (\"2017 partial — through Jul 31\"), or annualizes it before comparing — so no false decline is read into the trend.\n",
    "remediation": "Before trending aggregated periods, explore the contours of the data: record the minimum and maximum timestamp and compare them to the bucket boundaries. Drop, flag, or pro-rate any partial leading/trailing bucket, and never compare a partial period head-to-head with complete ones.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3A: Aggravating Aggregations",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "percentage-point-vs-percent-change",
    "name": "Percentage Points vs Percent Change",
    "domain": "Mathematical Miscues",
    "severity": "warning",
    "description": "A change between two percentages is described using the wrong kind of difference — reporting the absolute change in percentage points as a relative percent change, or vice versa. A move from 10% to 12% is +2 percentage points but +20% in relative terms; conflating the two overstates or understates the change by a large factor and misleads the reader. It extends the domain's rate-and-percent theme but is not a specific example in the book.\n",
    "detection_strategy": "In code and prose, flag a difference taken between two values that are themselves percentages and then labeled ambiguously as \"%\" — `new_pct - old_pct` reported as a \"percent increase,\" or a relative change `(new - old) / old` reported as \"percentage points.\" Look for change figures derived from rate/percentage columns without specifying which kind of change is meant. In prose, watch for \"rose by X%\" where X is actually a difference in points.\n",
    "example_bad": "An approval rating goes from 40% to 44%. The report says approval \"rose 4%,\" implying a small relative bump, when it actually rose 4 percentage points — a 10% relative increase. The reader can't tell which is meant, and the two differ materially.\n",
    "example_good": "The change is stated unambiguously — \"approval rose 4 percentage points (from 40% to 44%), a 10% relative increase\" — distinguishing the absolute point change from the relative percent change so neither is misread.\n",
    "remediation": "Decide whether you mean an absolute change (percentage points) or a relative change (percent), compute it accordingly, and label it explicitly. Never write \"%\" for a difference between two percentages when you mean percentage points.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3: Mathematical Miscues (domain extension — not a specific sub-pitfall example in the book)",
      "Darrell Huff, How to Lie with Statistics (Norton, 1954) — the misuse of percentages",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "uneven-aggregation-coverage",
    "name": "Uneven Aggregation Coverage",
    "domain": "Mathematical Miscues",
    "severity": "warning",
    "description": "Records are grouped into categories that are then compared, but the categories aggregate different amounts of underlying data, so the comparison is not apples-to-apples. The classic case: rolling several years of data up by calendar month, where some months happen to include one more year of observations than others — making those months look artificially higher and shuffling the ranking of the \"biggest\" categories.\n",
    "detection_strategy": "In code, flag cross-category aggregations (`GROUP BY month`, `GROUP BY weekday`, category totals) that pool multiple periods without normalizing for how many sub-periods each category actually contains — no count of contributing years/periods per bucket, no per-period average. In data, look for category buckets backed by unequal numbers of records or unequal time spans. Be suspicious when ranking categories by a raw total that secretly depends on uneven coverage.\n",
    "example_bad": "Eighteen years of wildlife-strike data (ending Jul 31, 2017) are summed by calendar month. January–July each pool 18 years while August–December pool only 17, so July tops the chart — but after dropping the partial 2017, August is actually the true peak month.\n",
    "example_good": "The analyst equalizes coverage before comparing — restricting to complete years, or averaging strikes per month-year rather than summing raw totals — so each month reflects the same number of contributing periods and the ranking (August highest) is accurate.\n",
    "remediation": "When comparing aggregated categories, verify each bucket draws on the same number of underlying periods/records. Normalize to a per-period rate or average, or trim the data to a span with equal coverage, before ranking or comparing category totals.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3A: Aggravating Aggregations",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "unweighted-rate-average",
    "name": "Unweighted Average of Rates",
    "domain": "Mathematical Miscues",
    "severity": "error",
    "description": "Rates, ratios, or percentages computed over groups with different denominators are combined by summing them or taking a simple (unweighted) arithmetic mean, as if the groups were equal in size. Because each percentage is a quotient over a different base, the only correct aggregate recombines the underlying numerators and denominators — a population-weighted figure. The naive mean over- or under-states the true overall rate, sometimes dramatically.\n",
    "detection_strategy": "In code, flag `mean()`/`AVG()` or `SUM()` taken over a column that is itself a rate/ratio/percentage (values bounded 0–100 or 0–1; names like pct/rate/share/ ratio) when group sizes differ and the denominators aren't carried along. Look for region/segment roll-ups of a percentage with no weighting term, and percentages being added together. In prose, watch for \"the average of the rates\" or summed percents.\n",
    "example_bad": "North America's urban-population percentage is computed as the simple mean of the United States, Canada, and Bermuda values ((82.06 + 81.41 + 100.00) / 3 ≈ 87.93%), giving tiny Bermuda the same weight as the U.S. — or, worse, the three are summed to 263.80%.\n",
    "example_good": "The regional figure is rebuilt from the components: estimate each country's urban population (percent × total population), sum those numerators, and divide by the summed populations — yielding ≈81.81%, very close to the U.S. value because the U.S. dominates the region's population.\n",
    "remediation": "Never average or sum rates directly across unequal groups. Carry the numerator and denominator through the aggregation and recompute the rate at the target level (a weighted average using each group's denominator as the weight). If the denominators aren't available, obtain them — the rate alone cannot be aggregated.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 3D: Preposterous Percents",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "mean-mistaken-for-typical",
    "name": "Mean Mistaken for Typical",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "A measure of central tendency — usually the mean — is reported as the \"typical\" value with no regard for the shape of the distribution. For skewed, multimodal, or heavy-tailed (power-law) data the mean can be unrepresentative of most records: it is pulled toward a long tail, lands in a gap between subgroups, or sits above the majority. Audiences then assume a randomly chosen record is close to the mean when it usually isn't.\n",
    "detection_strategy": "In code and prose, flag a mean (or \"average\") reported as typical/representative with no check of distribution shape — no median/mode beside it, no histogram/quantiles/skewness, no spread. Be suspicious when the mean is quoted for income/salary/wealth/followers/sales (commonly power-law), when the maximum is many times the mean, or when the standard deviation approaches or exceeds the mean. In data, compare mean against median (a large gap implies skew) and look for more than one mode.\n",
    "example_bad": "\"The average NFL player makes $1.5M per year\" is presented as the typical salary, but salary is power-law: 76.6% of players earn below the mean and one quarterback's cap hit (≈$24M) is 16x the average, so \"$1.5M\" describes almost no one.\n",
    "example_good": "The figure is reported with its distribution: \"median ≈$0.9M; 77% earn below the $1.5M mean, which is inflated by a few very high earners,\" ideally with a histogram — so readers see the skew instead of assuming a typical ≈$1.5M player.\n",
    "remediation": "Before calling any average \"typical,\" inspect the distribution's shape. Report the median (and the mode where relevant) alongside the mean, show the spread or a histogram, and for skewed/multimodal/heavy-tailed data lead with the median or describe the distribution rather than a single central value.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4A: Descriptive Debacles",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "multiple-comparisons",
    "name": "Uncorrected Multiple Comparisons",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "Many statistical comparisons are run across many variables or subgroups, and the few that come back \"significant\" are reported while the rest are ignored — with no correction for the number of tests and no replication. With dozens of tests some will cross p < 0.05 by chance alone, so cherry-picking the low p-values manufactures false discoveries (p-hacking).\n",
    "detection_strategy": "In code, flag loops or batches that compute p-values across many columns, subgroups, or model specifications, then filter to the significant ones, with no multiple-comparison correction (Bonferroni, Benjamini-Hochberg/FDR) and no holdout/replication. In prose, watch for a single surprising significant result drawn from a large exploratory search (\"we tested everything and found X correlates with Y\"). Be suspicious when significance is reported without stating how many comparisons were made.\n",
    "example_bad": "An analyst computes correlations between an outcome and 40 candidate variables, finds two with p < 0.05, and publishes those as discoveries — never mentioning the 38 other tests, or that about two false positives are expected by chance at that threshold.\n",
    "example_good": "The analyst pre-registers the key hypotheses or applies a multiple-comparison correction (e.g. Benjamini-Hochberg) across all 40 tests, reports how many comparisons were made, and treats surprising findings as hypotheses to confirm on fresh data before claiming them.\n",
    "remediation": "Account for the number of comparisons: correct p-values (Bonferroni or FDR), pre-register primary hypotheses, and report every test run, not just the significant ones. Treat findings from large exploratory searches as provisional until replicated on independent data.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4B: Inferential Infernos",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "nonresponse-bias",
    "name": "Nonresponse Bias",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "Conclusions are drawn from the subset of a sample that actually responded (or could be reached), as if it represented the whole target population. When non-responders differ systematically from responders, the results are biased — often badly — no matter how large the responding set. This extends the domain's sampling theme; the chapter gestures at survey nonresponse but doesn't formally cover this bias.\n",
    "detection_strategy": "In code and prose, flag survey/poll/feedback conclusions generalized to a population without reporting the response rate or comparing responders to non-responders — no mention of who didn't answer, no weighting or adjustment. Be suspicious of customer-satisfaction, NPS, or opinion results with low or unstated response rates, and of treating \"everyone who replied\" as \"everyone.\"\n",
    "example_bad": "A company emails a satisfaction survey, 8% reply, 92% of those are happy, and it announces \"92% of customers are satisfied\" — even though dissatisfied customers may have already churned or ignored the email, so the responders skew positive.\n",
    "example_good": "The company reports the response rate, compares responders to the full customer base on known attributes, weights or adjusts for the difference (or follows up with a sample of non-responders), and frames the result as \"92% of the 8% who responded,\" caveating the generalization.\n",
    "remediation": "Always report the response rate and consider how non-responders might differ from responders. Compare responders to the known population, weight or adjust for nonresponse, follow up with a subsample of non-responders, and scope claims to what the responding sample can actually support.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4: Statistical Slip-Ups (domain extension — not a specific sub-pitfall example in the book)",
      "Literary Digest 1936 U.S. presidential poll (nonresponse and frame bias); Groves et al., Survey Methodology (2nd ed., Wiley, 2009)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "normality-assumption-unchecked",
    "name": "Unchecked Normality Assumption",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "Tools that assume a normal (Gaussian) distribution — the standard deviation as the headline measure of spread, the 68–95–99.7 rule, Z-scores, control/spec limits, Six Sigma capability — are applied to data that isn't normal. For skewed or power-law data the SD can exceed the mean and \"σ from the mean\" becomes meaningless, badly mis-estimating how often extreme values occur.\n",
    "detection_strategy": "In code, flag use of `std()`, Z-scores, ±kσ thresholds, normal-based control/spec limits, or `scipy.stats.norm` probabilities with no normality check (histogram, Q-Q plot, skewness/kurtosis, Shapiro-Wilk). Be suspicious when SD ≥ mean, when the measure is a known power-law quantity (income, sales, followers, file sizes), or when outliers far exceed what a normal model predicts. In prose, watch for \"within N standard deviations\" claims about non-normal data.\n",
    "example_bad": "Analysts summarize NFL salary as mean ± SD and reason in σ, but the SD ($2.25M) is larger than the mean ($1.49M) and the top earner sits >10σ out — the height equivalent of 8'4\". A normal model calls that impossible, yet there he is: the data is power-law, not Gaussian.\n",
    "example_good": "The distribution is checked first (histogram/Q-Q plot); recognizing it is power-law, the analysts describe it with quantiles, a log scale, or tail statistics (Pareto share) instead of mean ± SD, and avoid Z-score/σ claims that assume normality.\n",
    "remediation": "Verify the distribution before applying normal-theory tools. Use a histogram or Q-Q plot and a normality test; for non-normal data prefer robust or quantile summaries, log transforms, or distribution-appropriate models, and don't quote σ-based probabilities (68-95-99.7, Z-scores, Six Sigma) for data that isn't normal.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4A: Descriptive Debacles",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "omitted-uncertainty",
    "name": "Omitted Uncertainty",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "Point estimates — rates, proportions, averages, rankings — are presented with no expression of uncertainty (confidence interval, error bar, margin of error), so readers treat noisy estimates as exact. Without uncertainty, small-sample estimates look as solid as large-sample ones, and differences that fall well within the margin of error are read as real.\n",
    "detection_strategy": "In code, flag charts and tables of estimated rates or means built without confidence intervals or error bars — bar charts of proportions with no CI, rankings with no margin, `mean()` reported with no interval — especially when per-cell sample sizes are small or vary widely. In prose, watch for precise-sounding rates or \"best/worst\" rankings with no margin of error and no mention of sample size.\n",
    "example_bad": "Mislabeling rates per city are plotted as plain bars and used to crown the \"best\" and \"worst\" cities, even though several rest on a dozen or fewer samples per category — so differences that sit within the binomial confidence interval are presented as a definitive ranking.\n",
    "example_good": "Each rate is shown with its binomial confidence interval (error bars), cells with too few samples to support an estimate are dropped or flagged, and only differences whose intervals separate are described as real — so the chart distinguishes signal from noise.\n",
    "remediation": "Attach uncertainty to every estimate: confidence intervals or error bars on rates and means, margins of error on rankings. Suppress or caveat estimates from samples too small to support them, and call a difference real only when its intervals don't overlap (or a proper test confirms it).\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4C: Slippery Sampling",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "p-value-misinterpretation",
    "name": "P-Value Misinterpretation",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "The p-value is misread as something it isn't — most commonly as the probability that the null hypothesis is true (or false), or a low p taken as proof of an effect and a high p as proof of no effect. A p-value is only the probability of observing data at least as extreme as seen, assuming the null is true; it proves nothing, and treating it as proof invites Type 1 (false-positive) and Type 2 (false-negative) errors.\n",
    "detection_strategy": "In code and prose, flag statements that a low p \"proves\" the effect, that the null is \"X% likely to be true,\" that a high p means \"no effect, proven,\" or any binary significant/not-significant verdict with no effect size, confidence interval, or power consideration. Watch for `p < 0.05` used as a yes/no proof gate, and \"no difference\" concluded from an underpowered test.\n",
    "example_bad": "An experiment returns p = 0.03 and the analyst declares \"proven: the null is false and there's only a 3% chance we're wrong,\" then runs around waving the printout — conflating the p-value with the probability that the null is true.\n",
    "example_good": "The result is stated carefully: \"assuming no real effect, data this extreme would occur about 3% of the time; together with the effect size and CI this is suggestive but not proof,\" and replication or further evidence is sought rather than treating a single p-value as definitive.\n",
    "remediation": "Interpret a p-value as evidence about the data under the null, never as the probability the hypothesis is true or as proof. Always pair it with the effect size and a confidence interval, consider statistical power before reading a high p as \"no effect,\" and seek replication rather than a single significant/not-significant verdict.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4B: Inferential Infernos",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "regression-to-the-mean",
    "name": "Regression to the Mean",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "Extreme measurements tend to be followed by less extreme ones simply because of chance variation, not because of any intervention. When the highest- or lowest-scoring units are selected and then re-measured (or \"treated\"), their movement toward the average is mistaken for a real effect of the selection or treatment. This extends the domain's sampling-variance theme but is a distinct named phenomenon not covered in the book.\n",
    "detection_strategy": "In code and prose, flag before/after comparisons where units were chosen because they were extreme (worst-performing schools, top salespeople, sickest patients) and their later move toward average is credited to an intervention, with no control group. Be suspicious of \"the bottom group improved after we acted\" or \"the top group declined\" claims, and of selecting on the same noisy metric used to judge the outcome.\n",
    "example_bad": "The worst-performing 10% of stores are given a new training program; next quarter their sales rise and the program is declared a success — but the worst performers were partly unlucky and would have drifted back toward average anyway, with or without training.\n",
    "example_good": "The evaluation uses a randomized control group (some low performers get the program, some don't), or models the expected regression, so the program's effect is measured against what would have happened by chance alone — separating real impact from regression to the mean.\n",
    "remediation": "When units are selected for being extreme, expect regression toward the mean on re-measurement and don't credit it to an intervention. Use a control group or a proper baseline model, and avoid selecting and evaluating on the same noisy measure.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4: Statistical Slip-Ups (domain extension — not a specific sub-pitfall example in the book)",
      "Galton, F. (1886), 'Regression Towards Mediocrity in Hereditary Stature,' J. Anthropological Institute; Kahneman, Thinking, Fast and Slow (2011)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "simpsons-paradox",
    "name": "Simpson's Paradox",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "A trend or comparison that holds in aggregate reverses (or vanishes) when the data is split by a lurking third variable. Because group sizes and composition differ, the pooled numbers can favor one side while every subgroup favors the other. Reporting only the aggregate — or only the subgroups — without checking the other view can flip the conclusion entirely. This extends the domain's composition-confound theme but is a distinct named phenomenon not covered in the book.\n",
    "detection_strategy": "In code and prose, flag aggregate comparisons of rates/proportions across two groups where a confounding category is present but not examined — a pooled `GROUP BY` with no breakdown by the lurking variable, especially with unequal composition within it. Be suspicious when one group is weighted differently across subgroups, or when an aggregate result contradicts intuition. Check both the pooled and the subgroup-level comparison; a reversal between them is the signature.\n",
    "example_bad": "A hospital reports a higher overall death rate than a rival and is judged worse — but it treats far more severe cases. Within every severity tier its death rate is lower; the aggregate reverses only because its case mix is sicker, so the pooled comparison condemns the better hospital.\n",
    "example_good": "The analyst compares the two hospitals within each severity tier (stratifying on the confounder), finds the larger hospital does better in every tier, and reports the stratified result — or a case-mix-adjusted rate — rather than the misleading pooled number.\n",
    "remediation": "When comparing aggregate rates across groups, check whether a confounding variable differs in composition between them, and compare within strata as well as in aggregate. If the two views disagree, prefer the stratified or covariate-adjusted comparison and report the confounder explicitly.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4: Statistical Slip-Ups (domain extension — not a specific sub-pitfall example in the book)",
      "Simpson, E.H. (1951), 'The Interpretation of Interaction in Contingency Tables,' J. Royal Statistical Society B; Bickel et al. (1975), UC Berkeley admissions, Science",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "small-sample-extremes",
    "name": "Small-Sample Extremes",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "Statistics computed from small samples vary far more than those from large samples (the variance of the mean grows as the sample shrinks), so small groups disproportionately occupy the extremes of any ranking, map, or top/bottom-N list. Mistaking this sampling noise for a real signal leads to spurious explanations of why small units are \"best\" or \"worst.\"\n",
    "detection_strategy": "In code and prose, flag rankings, choropleth maps, or top/bottom lists of a rate/average where the units have widely varying sample sizes and no adjustment is made — no minimum-sample filter, no shrinkage/empirical-Bayes smoothing, no funnel plot. Be suspicious when the extreme units are the smallest ones, when both the highest and the lowest are small groups, or when a rate rests on a handful of events. A funnel-shaped scatter of rate versus sample size confirms it.\n",
    "example_bad": "U.S. counties are ranked by kidney-cancer rate, and the highest- and lowest-rate counties are both small rural ones — prompting contradictory theories (clean rural living vs rural poverty) when in fact tiny populations (sometimes ≤4 cases/year) simply produce volatile rates that swing to both extremes.\n",
    "example_good": "The analyst plots rate against population (revealing the telltale funnel), applies a minimum-sample threshold or shrinks small-county rates toward the overall mean (empirical Bayes), and treats extreme values from tiny samples as likely noise rather than signal before theorizing.\n",
    "remediation": "Account for sample size whenever comparing rates across units: visualize rate versus sample size (a funnel plot), set a minimum-sample threshold, or use shrinkage/empirical-Bayes estimates that pull small-sample rates toward the overall average. Before explaining why a small unit is extreme, first rule out chance.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4D: Insensitivity to Sample Size",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "statistical-vs-practical-significance",
    "name": "Statistical vs Practical Significance",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "A result is statistically significant (low p-value) but the effect is too small to matter, and the significance is reported as if it were importance. With a large enough sample even a trivial difference becomes statistically significant, so a tiny effect can be dressed up as a meaningful finding whenever the magnitude is ignored.\n",
    "detection_strategy": "In code and prose, flag significance claims that omit the effect size and its real-world units — a p-value reported with no mean difference, no confidence interval on the magnitude, no comparison to a meaningful threshold. Be especially suspicious with very large samples (where almost anything is significant) and when the headline is \"statistically significant\" rather than \"large enough to act on.\"\n",
    "example_bad": "A clinical trial with thousands of patients reports p < 0.0001 for the drug's effect on lifespan and trumpets a breakthrough — but the actual difference is about two days of additional life, far too small to matter clinically.\n",
    "example_good": "The report leads with the effect size and its confidence interval (\"≈2 days, 95% CI 1–3 days\") and judges it against a clinically meaningful threshold, concluding the effect is statistically detectable but not practically important — keeping significance and importance distinct.\n",
    "remediation": "Always report and lead with the effect size (in meaningful units) and its confidence interval, not just the p-value. Decide in advance what magnitude would be practically important, and interpret statistical significance — especially in large samples — separately from real-world significance.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4B: Inferential Infernos",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "survivorship-bias",
    "name": "Survivorship Bias",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "Conclusions are drawn only from the people, items, or records that \"survived\" some selection process, while those that dropped out are invisible and ignored. Because the failures are missing from the data, the survivors paint a systematically over-optimistic or distorted picture. This extends the domain's sampling/selection theme; it is a classic bias not formally named as a sub-pitfall in the book.\n",
    "detection_strategy": "In code and prose, flag analyses restricted to entities still present — \"current\" customers, \"active\" accounts, funds \"still operating,\" products \"still on the market,\" planes that \"returned\" — then generalized to the original population with no accounting for those that exited. Be suspicious of filters that keep only surviving/active/completed records before computing population-level statistics, and of success studies that sample only successes.\n",
    "example_bad": "Engineers propose reinforcing returning WWII aircraft where they show the most bullet holes, concluding those areas need armor — but the planes hit elsewhere didn't return at all. The holes in survivors mark where a plane can be hit and still make it back, so the unhit areas are the ones that actually need protecting.\n",
    "example_good": "The analysis explicitly accounts for the non-survivors — modeling where downed planes were likely hit, or including churned/closed/failed cases alongside the survivors — so conclusions reflect the full population (armor the areas the survivors were not hit) rather than the survivors alone.\n",
    "remediation": "Identify the selection process and ask what was filtered out before the data reached you. Include the non-survivors where possible, or explicitly scope claims to the surviving subpopulation, and never generalize from survivors to the whole without accounting for what's missing.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4: Statistical Slip-Ups (domain extension — not a specific sub-pitfall example in the book)",
      "Abraham Wald, Statistical Research Group (1943), analysis of armor placement on returning WWII aircraft",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "unrepresentative-sample-comparison",
    "name": "Unrepresentative Sample Comparison",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "Aggregate rates or averages are compared across groups whose samples were collected without a consistent (stratified) plan, so the groups differ in composition as well as in the factor of interest. The comparison is then confounded by the mix of subcategories rather than reflecting a true difference — an apples-to-oranges comparison disguised as apples-to-apples.\n",
    "detection_strategy": "In code and prose, flag city/region/segment comparisons of an overall rate where the underlying samples have different compositions (different mix of outlet types, demographics, product lines) and no stratification or standardization is applied. Look for pooled rates compared directly without breaking down by the confounding subcategory, and for sampling that wasn't designed to be representative. Compare each group's subcategory mix; large differences signal the trap.\n",
    "example_bad": "Overall fish-mislabeling rates are compared across cities to rank \"best and worst,\" but the sample mix differs sharply — sushi (mislabeled >73%) was 16% of Seattle's samples versus 35% of Southern California's, and Boston sampled no sushi at all — so the ranking mostly reflects how much sushi each city sampled, not how honest its sellers are.\n",
    "example_good": "The analyst compares like with like — grocery-to-grocery, sushi-to-sushi — or standardizes each city to a common subcategory mix, and reports only the comparisons the sampling supports, acknowledging that the unstratified overall rates aren't a fair city-to-city comparison.\n",
    "remediation": "Compare groups within consistent strata, or directly standardize/weight them to a common composition before comparing aggregate rates. Inspect each group's subcategory mix for imbalance, prefer a stratified sampling plan up front, and draw only the comparisons the sampling design actually supports.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4C: Slippery Sampling",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "untested-significance-claim",
    "name": "Untested Significance Claim",
    "domain": "Statistical Slip-Ups",
    "severity": "warning",
    "description": "A difference between groups (in means, rates, conversion, and the like) is declared real or meaningful purely because the observed numbers differ, with no test of whether the gap could arise from chance given the sample sizes and variation. Random samples differ even when the underlying groups don't, so an untested difference may be nothing but noise.\n",
    "detection_strategy": "In code and prose, flag conclusions that \"group A beats B\" or \"the treatment worked\" drawn straight from a difference in sample means or rates with no hypothesis test, confidence interval, or uncertainty estimate — no t-test/ANOVA/chi-square/CI anywhere. Be suspicious of A/B results, before/after comparisons, or leaderboard rankings reported as decisive from raw point estimates alone, especially with small or unstated sample sizes.\n",
    "example_bad": "A qualification run shows the new component's parts averaging 2% higher on a test than the old, and the team concludes the change \"improved performance\" — without testing whether a 2% gap is within the normal run-to-run variation for that sample size.\n",
    "example_good": "The team runs an appropriate hypothesis test (or computes confidence intervals) accounting for sample size and variability, and claims a real effect only if the difference is unlikely under chance — otherwise reporting \"no significant difference detected,\" with the observed effect and its uncertainty.\n",
    "remediation": "Don't infer a real difference from raw numbers alone. Quantify uncertainty — run a suitable significance test or compute confidence intervals that account for sample size and variation — and report the effect with its uncertainty rather than treating any gap as decisive.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 4B: Inferential Infernos",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "confounding-variable",
    "name": "Uncontrolled Confounding Variable",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "A comparison or model attributes an effect to one variable while ignoring a lurking third variable that influences both the supposed cause and the outcome. The uncontrolled confounder produces a real but non-causal association, so the conclusion — and any action based on it — is wrong. Closely related to Simpson's paradox, where a confounder can even reverse the apparent direction of an effect. This extends the domain's analysis-distortion theme but is not a specific sub-pitfall in the book.\n",
    "detection_strategy": "In code and prose, flag group comparisons or regressions that estimate an effect with no adjustment for obvious confounders — observational comparisons of outcomes between groups that differ in other ways, a regression of Y on X omitting variables known to affect both, no randomization and no covariate control. Be suspicious when the groups being compared aren't otherwise comparable, or when a plausible common cause goes unmentioned.\n",
    "example_bad": "A study reports that coffee drinkers have higher rates of a disease and implies coffee is harmful — but coffee drinkers also smoke more, and smoking (the confounder) drives the disease; with smoking uncontrolled, coffee takes the blame.\n",
    "example_good": "The analysis controls for the confounder — stratifying or adjusting for smoking, or randomizing — and finds the coffee association largely disappears, so it reports the adjusted effect and names the confounder rather than the naive association.\n",
    "remediation": "Identify plausible common causes before drawing conclusions, and control for them by randomization, stratification, matching, or regression adjustment. Compare only groups that are otherwise comparable, report which confounders were accounted for, and treat unadjusted observational effects as provisional.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5: Analytical Aberrations (domain extension — not a specific sub-pitfall example in the book)",
      "Judea Pearl, Causality (2nd ed., Cambridge University Press, 2009); R.A. Fisher, The Design of Experiments (1935)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "correlation-implies-causation",
    "name": "Correlation Implies Causation",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "A causal claim is drawn from a merely correlational observation — \"X is associated with Y, therefore X causes Y\" — when the association could instead be coincidence, reverse causation (Y drives X), or a confounding third variable driving both. Acting on the supposed cause then fails, because the real mechanism was never established. This extends the domain's analysis-distortion theme but is not a specific sub-pitfall in the book.\n",
    "detection_strategy": "In code and prose, flag causal language (\"drives,\" \"leads to,\" \"because of,\" \"boosts,\" \"improves\") attached to evidence that is only observational/correlational — a correlation coefficient, a regression slope, a before/after with no control — and no experiment, no adjustment for confounders, and no consideration of reverse causation. Be suspicious of recommendations to change X in order to move Y based solely on their historical correlation.\n",
    "example_bad": "An analysis finds that customers who use feature X churn less and concludes \"feature X reduces churn, so push everyone to use it\" — but already-engaged customers (who were never going to churn) are simply the ones who try feature X, so the arrow may run the other way.\n",
    "example_good": "The team treats the correlation as a hypothesis and tests it causally — a randomized experiment (some users prompted to use X, some not), or at minimum controlling for engagement and considering reverse causation — before claiming X reduces churn or acting on it.\n",
    "remediation": "Don't infer causation from correlation. Establish cause with a randomized experiment where feasible; otherwise control for plausible confounders, weigh reverse causation and coincidence, and use causal-inference methods. State clearly when a relationship is only associational and shouldn't drive interventions.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5: Analytical Aberrations (domain extension — not a specific sub-pitfall example in the book)",
      "Judea Pearl, Causality: Models, Reasoning, and Inference (2nd ed., Cambridge University Press, 2009)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "goodharts-law",
    "name": "Goodhart's Law (Metric Gaming)",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "When a measure becomes a target, it ceases to be a good measure. Once people are rewarded or judged by a metric, they optimize the metric itself — often at the expense of the underlying goal it was meant to proxy — so the metric stops reflecting reality and starts incentivizing gaming. This extends the metric-gaming caution in Pitfall 5E (Moronic Measures), which the book raises but does not develop as its own pitfall.\n",
    "detection_strategy": "In code and prose, flag a single metric used as a hard target or incentive (bonuses, rankings, OKRs, a model's objective) with no guard against gaming — no paired or counter-metric, no check that the proxy still tracks the true outcome once people optimize it. Be suspicious when a metric improves sharply while the real goal doesn't, when behavior visibly reshapes around the measure, or when one easily-influenced number drives rewards.\n",
    "example_bad": "A support team is targeted purely on \"tickets closed per day\"; agents start closing tickets prematurely and splitting issues to pad the count, so the metric soars while actual customer resolution worsens — the measure, now a target, no longer measures support quality.\n",
    "example_good": "Performance is judged on a balanced set including an outcome metric (issues resolved and staying resolved, customer satisfaction) alongside activity, with counter-metrics that catch gaming, and the metrics are revisited as behavior adapts — so no single number can be gamed at the goal's expense.\n",
    "remediation": "Don't manage by a single proxy target. Pair each metric with a counter-metric, anchor incentives to outcome measures rather than easily-gamed activity, monitor whether the proxy still correlates with the true goal once it's targeted, and revise metrics as people adapt to them.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5E: Moronic Measures (domain extension — generalizes the metric-gaming caution in the book)",
      "Goodhart, C.A.E. (1975); Marilyn Strathern (1997), 'Improving ratings: audit in the British University system,' European Review",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "intuition-analysis-false-dichotomy",
    "name": "Intuition/Analysis False Dichotomy",
    "domain": "Analytical Aberrations",
    "severity": "info",
    "description": "Intuition and analytics are treated as mutually exclusive — either human judgment is discarded wholesale in favor of \"letting the data or algorithm decide,\" or data is dismissed in favor of gut feeling. In reality the two are complementary: human intuition decides which questions matter, what the numbers mean, where to look next, when to stop, and how to communicate, while analysis supplies and quantifies the evidence. Abdicating that judgment to an algorithm (or ignoring evidence entirely) degrades decisions.\n",
    "detection_strategy": "This pitfall lives mostly in process descriptions and framing rather than code or data. In prose, flag claims that analytics \"replaces\" intuition, that one should \"collect everything and let the algorithm decide what's important,\" or conversely that data is irrelevant next to experience. Be suspicious of pipelines that surface patterns with no human step to judge which are meaningful, of metric/feature selection driven purely by an algorithm with no domain rationale, and of decisions presented as \"the data says so\" with no interpretive judgment.\n",
    "example_bad": "A team adopts an auto-ML tool and declares \"we used to use intuition, now we use analytics,\" feeding in every available variable and acting on whatever the algorithm flags as correlated — with no domain expert asking whether those patterns are useful or merely spurious.\n",
    "example_good": "The team uses domain intuition to frame the questions worth asking and to vet which discovered patterns are meaningful, then lets the analysis supply and quantify the evidence — combining the two (\"intuition guides the analysis, analysis checks the intuition\") rather than replacing one with the other.\n",
    "remediation": "Treat intuition and analysis as complementary. Keep a human-judgment step in the loop to choose which questions and metrics matter, to interpret results, and to separate useful patterns from noise — and use data to test and refine intuition rather than to abolish it. Document the domain rationale behind what's measured and acted on.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5A: The Intuition/Analysis False Dichotomy",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "misleading-interpolation",
    "name": "Misleading Interpolation",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "Sparse data points are connected (or averaged) with straight lines, implying a smooth path between them and fabricating intermediate values that were never measured. A low sampling rate — or a two-point slopegraph — can hide dramatic real variation that occurred between the sampled moments, telling a true-but-woefully- incomplete story.\n",
    "detection_strategy": "In code and charts, flag visualizations or analyses that connect widely spaced samples as if continuous — a slopegraph or line between just two time points, a series plotted at coarse aggregation (yearly) when finer data exists, linear interpolation/resampling that invents between-sample values. In prose, watch for \"increased from A to B\" conclusions over a long span with no look at what happened in between. Ask whether the sampling rate is fine enough to capture the variation of interest.\n",
    "example_bad": "A slopegraph connects each country's life expectancy in 1960 to its value in 2015, concluding \"all countries increased\" — hiding that Cambodia's fell below 20 in 1977-78, Iraq's stagnated after the mid-1990s, and Iceland's was far noisier than Canada's.\n",
    "example_good": "The full annual series is plotted between the endpoints, revealing the wars, stagnations, and year-to-year noise the two-point view erased — and the sampling rate is chosen fine enough to capture the variation that matters before drawing conclusions.\n",
    "remediation": "Choose a sampling/aggregation rate fine enough to capture the variation relevant to the question, and don't treat lines between sparse points as real data. Before concluding from endpoints, inspect the intermediate values, and be explicit that interpolated points are fabricated, not measured.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5C: Ill-Advised Interpolations",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "misleading-performance-metric",
    "name": "Misleading Performance Metric",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "Performance is judged by a metric that doesn't actually capture the outcome that matters — typically an activity metric (how much someone did something) or an opinion metric (how others rated them) standing in for an output metric (what they actually achieved). A weak or absent link between the proxy and true impact produces unfair or backwards rankings, and measuring the wrong thing pushes people to game it.\n",
    "detection_strategy": "In code and prose, flag rankings or evaluations built on a proxy metric without checking how well it correlates with the outcome of interest — activity counts (calls made, miles run, lines of code) or rating scores used as the headline measure of performance, with no output/impact metric alongside. Be suspicious when the \"worst\" by the metric is plainly excellent on results, when the metric's correlation with true impact is weak, or when a single easily-gamed number drives incentives.\n",
    "example_bad": "A player is labeled the \"slowest\" and ranked dead last by average speed — an activity metric — even though he leads the league in Player Impact Estimate (output); average speed correlates barely at all with impact (R²=0.056), so the metric ranks one of the best players worst.\n",
    "example_good": "Players are evaluated primarily on an output/impact metric (e.g. PIE), with activity metrics like average speed treated as secondary context (useful for recovery or pacing, not for ranking contribution) — and any proxy is validated against the outcome it's meant to represent before being used to judge.\n",
    "remediation": "Measure the outcome that actually matters: prefer output/results metrics over activity or opinion proxies, and validate that any proxy correlates with true impact before ranking on it. Pair metrics so a single number can't be gamed, get stakeholder buy-in, and don't judge performance by a metric just because it's easy to collect.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5E: Moronic Measures",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "overfit-model-extrapolation",
    "name": "Overfit Model Extrapolation",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "Among several candidate models, the one with the best in-sample fit (highest R², lowest training error) is selected and used to predict, regardless of whether its form makes sense. A flexible model — a high-order polynomial, say — can hug the training points almost perfectly yet behave absurdly just outside them, producing nonsensical forecasts.\n",
    "detection_strategy": "In code, flag model selection by training fit alone (picking the max-R²/min-MSE option among polynomial degrees or flexible fits) with no held-out validation, cross-validation, or complexity penalty, followed by prediction outside the data. Be suspicious of a suspiciously high R² (0.999+) from a high-degree polynomial, and of forecasts that swing wildly or go impossible just beyond the training range. In prose, watch for \"we chose the model with the closest fit.\"\n",
    "example_bad": "A polynomial fit to China's 1960–1972 life expectancy reaches R²=0.9999 and is chosen for its fit, but extrapolating it sends predicted life expectancy crashing to zero and then negative within about fifteen years — an absurd forecast from a model picked purely on in-sample closeness.\n",
    "example_good": "Candidate models are compared on held-out or cross-validated error (not training fit), penalized for complexity, and judged on whether their shape is theoretically sensible — so a simpler, well-behaved model is preferred over a polynomial that overfits and explodes out-of-sample.\n",
    "remediation": "Never select a predictive model on in-sample fit alone. Use cross-validation or a holdout set, penalize complexity (AIC/BIC, regularization), prefer the simplest model consistent with the data and theory, and reject any model whose extrapolations are implausible no matter how high its R².\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5B: Exuberant Extrapolations",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "spurious-correlation",
    "name": "Spurious Correlation",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "Two variables correlate strongly by coincidence rather than any real relationship — common when both simply trend over time, or when a strong correlation is cherry-picked from many candidate pairs. Treating such a coincidence as meaningful invents relationships that don't exist and won't hold up. This extends the domain's analysis-distortion theme but is not a specific sub-pitfall in the book.\n",
    "detection_strategy": "In code and prose, flag strong correlations reported between variables with no plausible mechanism — especially two time series that both trend (up or down) over the same period, or a high-correlation pair surfaced from a large search of many variables. Be suspicious of correlations presented without de-trending, without a mechanism, or without out-of-sample confirmation. Watch for \"r = 0.99 between [unrelated things].\"\n",
    "example_bad": "An analyst notices that US cheese consumption and a particular cause of death both rose over a decade, reports their 0.95 correlation as a finding, and speculates about a link — when both merely trended upward over time with no real connection.\n",
    "example_good": "The analyst de-trends or differences the series before correlating, requires a plausible mechanism, and confirms any candidate relationship on independent data — recognizing that two trending series will correlate by construction and that one strong pair out of many is expected by chance.\n",
    "remediation": "Treat a bare correlation as weak evidence. De-trend time series before correlating, demand a plausible mechanism, correct for how many pairs were examined, and confirm on out-of-sample data. A coincidental correlation with no mechanism and no replication is not a finding.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5: Analytical Aberrations (domain extension — not a specific sub-pitfall example in the book)",
      "Yule, G.U. (1926), 'Why Do We Sometimes Get Nonsense-Correlations between Time-Series?', J. Royal Statistical Society; Tyler Vigen, Spurious Correlations (Hachette, 2015)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "trend-extrapolation-beyond-range",
    "name": "Trend Extrapolation Beyond the Data",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "A trend fitted to historical data is projected beyond the observed range as if it would continue unchanged, ignoring saturation points, natural ceilings, asymptotes, and regime changes. A high in-sample fit (R² near 1, a tiny p-value) says nothing about behavior outside the data, so a confident-looking line can produce impossible forecasts.\n",
    "detection_strategy": "In code, flag predictions made from a fitted model (linear or otherwise) at x-values well outside the training range — `model.predict` on far-future or extreme inputs, trendlines extended past the last data point — with no saturation term, no domain bound, and no uncertainty band that widens with distance. In prose, watch for \"at this rate, by [future year]...\" claims and forecasts justified solely by a high R². Sanity-check whether the extrapolated value is even possible.\n",
    "example_bad": "A 1960–1980 linear fit of Korean life expectancy (R²>0.95) is extended to predict 96 years by 2015 and ~170 years by 2100 — ignoring that lifespan approaches a ceiling, and that North Korea's actually fell about 5 years in the 1990s.\n",
    "example_good": "The forecast respects domain limits (a saturating/logistic curve toward a plausible asymptote), is restricted to a near horizon, and is shown with an uncertainty band that widens the farther it extends — and the analyst notes that a high historical R² doesn't guarantee the trend continues.\n",
    "remediation": "Don't project a trend past the data without justification. Bound forecasts by domain knowledge (ceilings, saturation), prefer models that capture the expected nonlinearity, widen uncertainty with extrapolation distance, and treat in-sample fit as no evidence of out-of-sample behavior. Validate extrapolations against plausibility.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5B: Exuberant Extrapolations",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "unvalidated-clustering",
    "name": "Unvalidated Clustering",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "An unsupervised clustering (k-means, hierarchical, and the like) is run and its output is treated as real, meaningful structure — often with interpretive labels — without validating that the clusters reflect genuine groups rather than an arbitrary partition the algorithm always produces. k-means will split any data into k blobs; the number of clusters and the feature scaling are analyst choices, so a different k or scaling yields different \"groups.\" Naming and reasoning about unvalidated clusters imposes a story the data may not support. This extends the domain's analysis-distortion theme but is not a specific sub-pitfall example in the book.\n",
    "detection_strategy": "In code and prose, flag clustering (`KMeans`, `AgglomerativeClustering`, DBSCAN, etc.) whose results are interpreted, labeled, or acted on with no validation step — no silhouette/Davies-Bouldin score, no stability check across seeds or k, no comparison to domain-known groups, and a k chosen by eyeballing an elbow. Be suspicious of hard-coded human-readable names assigned to numeric cluster labels, and of cluster summaries presented as discovered \"types\" without caveat.\n",
    "example_bad": "k-means with a hand-picked `k=5` (chosen by glancing at an elbow plot) is run on scaled features, and clusters 0–4 are hard-coded to names like \"Western Pacific Shallow\" — presenting an arbitrary partition as established seismic zones, with no silhouette score, stability check, or domain validation.\n",
    "example_good": "The analyst validates before interpreting: checks cluster quality (e.g. silhouette), tests stability across seeds and several values of k, and compares the result to known domain structure — then labels and reasons about clusters only to the extent the validation supports, framing them as provisional rather than definitive types.\n",
    "remediation": "Treat clusters as hypotheses, not findings, until validated. Justify the number of clusters with more than an eyeballed elbow (silhouette, gap statistic, stability across seeds/k), check sensitivity to feature scaling, and compare to external or domain-known groupings. Don't assign authoritative labels to clusters you haven't shown to be real and stable.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5: Analytical Aberrations (domain extension — not a specific sub-pitfall example in the book)",
      "Rousseeuw (1987), 'Silhouettes: a graphical aid to the interpretation and validation of cluster analysis,' J. Computational and Applied Mathematics 20",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "wishful-baseline-forecast",
    "name": "Wishful Baseline Forecast",
    "domain": "Analytical Aberrations",
    "severity": "warning",
    "description": "Forecasts default to a comfortable, \"return to normal\" baseline regardless of the current trajectory or the variable's known volatility — predicting a steady reversion to a typical level and never anticipating downturns or cycles. Such forecasts say more about what the forecaster hopes (or wants to communicate) than about likely outcomes, and they reliably miss turning points.\n",
    "detection_strategy": "In code and data, flag forecasts that flatten to a constant baseline across the whole horizon for a variable known to be cyclical or volatile (unemployment, markets, demand), repeated forecasts that all converge to the same \"normal\" value regardless of starting conditions, and the absence of scenario/downside modeling. In prose, watch for predictions of \"a return to typical levels\" with no mechanism, and forecasts that never call a decline.\n",
    "example_bad": "Each year the OMB forecasts unemployment returning to ~5% within a couple of years no matter the current rate — so the FY2008 forecast shows a smooth glide to 5% just before the 2009 spike, as do forecasts across every administration. The \"return to normal\" is assumed, not derived.\n",
    "example_good": "The forecast models the variable's cyclicality and uncertainty, presents scenarios (including downturns) with probabilities or bands instead of a single reassuring line, and is honest when the realistic outlook isn't a clean reversion to a comfortable baseline.\n",
    "remediation": "Build forecasts from the variable's actual dynamics (cyclicality, volatility, mean-reversion speed) rather than defaulting to a comfortable baseline. Present uncertainty bands and downside scenarios, back-test the forecasting approach against history, and be wary when every forecast conveniently predicts a return to normal.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 5D: Funky Forecasts",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "3d-chart-distortion",
    "name": "3D Chart Distortion",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "A chart adds a third dimension or perspective effect — 3D pie, 3D bars, tilted/extruded views — that distorts the very encodings the reader must judge. Perspective foreshortening changes apparent sizes, near slices/bars look bigger than far ones, and occlusion hides data behind other marks — all for decoration that adds no information. This extends the domain's encoding-distortion theme but is not a specific sub-pitfall in the book.\n",
    "detection_strategy": "In code and charts, flag 3D or perspective chart options — 3D pie/bar/area in spreadsheet tools, `projection='3d'` used purely for a 2D relationship, extrusion/bevel/shadow effects — where the third dimension encodes nothing. Be suspicious when foreground marks look larger than equal background ones, when slices/bars are occluded, or when a rotation angle changes which value looks biggest.\n",
    "example_bad": "A 3D pie chart tilts the disc so the front slice looks substantially larger than an equal-sized slice at the back, and a deep bevel makes precise comparison impossible — the perspective changes the apparent shares even though the underlying numbers are identical.\n",
    "example_good": "The data is shown in a flat 2D chart (a plain pie/bar, or better a bar chart for precise comparison) where each mark's size encodes its value honestly, with no perspective, extrusion, or occlusion distorting the comparison.\n",
    "remediation": "Drop gratuitous 3D and perspective effects; use flat 2D encodings so size and length map directly to value. Reserve a true third spatial dimension only for data that genuinely has three continuous dimensions, and never tilt or extrude a chart for decoration.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6: Graphical Gaffes (domain extension — not a specific sub-pitfall example in the book)",
      "Edward Tufte, The Visual Display of Quantitative Information (2nd ed., Graphics Press, 2001) — the lie factor",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "chart-omits-key-context",
    "name": "Chart Omits Key Context",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "A chart is accurate as far as it goes but omits something more important — a \"sin of omission.\" A static snapshot can be technically true yet miss the real story (a category's share is growing over time), and presenting data without its known caveats and exclusions (reported vs actual, excluded categories) leaves the audience with a false sense of completeness.\n",
    "detection_strategy": "In prose and charts, flag a single snapshot used to make a point that a time trend or breakdown would materially change (a share shown as static when it's rising), and charts presented without the data's documented caveats — exclusions, \"reported not actual,\" definition or coverage changes over time. Be suspicious when the most important fact about the data isn't shown, or when known disclaimers are left off the visual.\n",
    "example_bad": "A pie chart shows theft as ~half of reported crimes (2010–2017) and stops there — omitting that theft's share climbed from 45% in 2010 to over 55% by 2017, the more important story, and omitting that the data is reported (not actual) crime with whole categories excluded.\n",
    "example_good": "Alongside the share snapshot, a timeline shows theft's growing proportion over the period, and the data's caveats (reported-not-actual, excluded crime categories, possible reporting-policy changes) are stated on or near the chart — so the audience gets the fuller, fairer picture.\n",
    "remediation": "Ask what the most important fact about the data is and make sure the visual conveys it, not just a true-but-incomplete snapshot; add the trend or breakdown that changes the interpretation. Always present the data's known caveats and exclusions with the chart rather than omitting them.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6A: Challenging Charts",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "chart-type-dogmatism",
    "name": "Chart Type Dogmatism",
    "domain": "Graphical Gaffes",
    "severity": "info",
    "description": "Chart types are judged by blanket rules — \"pie charts are bad,\" \"word clouds are evil\" — and banished from consideration, rather than evaluated by fit to the objective, audience, and context. Eliminating options up front shrinks the solution space and can rule out the choice that would actually work best for a given task.\n",
    "detection_strategy": "This is mostly a mindset/process pitfall, visible in prose and review comments. Flag absolute claims that a chart type \"never works\" or \"should never be used,\" critiques of a visualization made without knowing its objective/audience/context, and style guides that ban chart types outright. Be suspicious of dismissals based on chart type alone rather than on whether it serves the specific task.\n",
    "example_bad": "A reviewer dismisses a word cloud as \"always wrong\" — but in the scenario (flashing the handful of most common, absurd passwords to a large room, including the back rows) the word cloud conveys the gist at a glance better than a bar chart that shows only 17 of 100 and needs scrolling.\n",
    "example_good": "The chart type is judged on fit to the task: the word cloud is accepted for the at-a-glance-gist scenario where precise comparison isn't needed, while a bar chart is chosen when precise magnitude matters — keeping all types in the toolkit and selecting by context.\n",
    "remediation": "Treat chart types as a toolkit, not a list of sanctioned and forbidden options. Judge a visualization by how well it serves its objective, audience, and context, keep less-common types available for the cases where they fit, and avoid blanket \"good/bad\" verdicts when critiquing others' work.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6B: Data Dogmatism",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "chart-type-message-mismatch",
    "name": "Chart Type Message Mismatch",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "The chart type doesn't support the comparison the message requires. Part-to-whole points (a few categories make up three-quarters of the total) read clearly from a pie or treemap that forms a single cohesive whole, but get lost in separated bars or bubbles; conversely, treating a set as a \"whole\" when it isn't (heavy data caveats) makes a part-to-whole chart misleading.\n",
    "detection_strategy": "In prose and charts, flag a mismatch between the claim and the encoding — a part-to-whole message shown with separated marks (bars, packed bubbles) that don't convey a unified whole, or a part-to-whole chart (pie/treemap) used when the data isn't a legitimate complete whole. Be suspicious when the audience can't see the stated relationship at a glance because the mark arrangement doesn't match the comparison.\n",
    "example_bad": "To show that theft, burglary, and assault together are three of every four reported crimes, an analyst uses a bar chart and a packed bubble chart — but the separated marks don't form a cohesive whole, so the 75% share doesn't pop the way it does in a pie or treemap.\n",
    "example_good": "The part-to-whole point is shown with a pie or treemap whose three highlighted segments visibly reach ~75% of the whole — and only if the data is a legitimate whole; if heavy caveats mean it isn't, a non-part-to-whole encoding (like a bar chart) is used and the caveats are stated.\n",
    "remediation": "Match the encoding to the comparison: use a unified part-to-whole form (pie, treemap, stacked bar) for share-of-total messages, and separated marks for part-to-part. First confirm the data is a legitimate whole; if it isn't, avoid part-to-whole encodings or disclose what's excluded.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6A: Challenging Charts",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "cherry-picked-chart-window",
    "name": "Cherry-Picked Chart Window",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "A chart shows a narrow slice of the data — a short time window or restricted range — that creates an impression the full data would contradict or reverse. Whether by oversight or intent, presenting the slice as the story leaves the audience with a conclusion the broader context doesn't support.\n",
    "detection_strategy": "In code and charts, flag time series or ranges filtered to a sub-window (a recent N weeks, a clipped axis domain) presented as a trend, with no view of or reference to the longer history. Be suspicious when the chosen window's slope or message reverses if extended, when start/end points look hand-picked, or when no rationale is given for the range. Compare the windowed view against the full series.\n",
    "example_bad": "A 40-week window of reported narcotics cases trends sharply upward and is used to claim narcotics crime is rising — but the full 8-year series shows that window was a local bump within an overall decline, so the chart leaves the opposite of the true impression.\n",
    "example_good": "The trend is shown over the full available period (with the window of interest highlighted if needed), so the audience sees the recent movement in the context of the long-run trend and isn't misled by a cherry-picked slice.\n",
    "remediation": "Show data over a range justified by the question, and check whether the message survives when the window is extended. Disclose why a particular window was chosen, highlight rather than crop the broader context, and stay alert that a short slice can reverse a long-run trend.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6A: Challenging Charts",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "dual-axis-distortion",
    "name": "Dual-Axis Distortion",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "A chart plots two series against two independent y-axes with different scales, so their apparent relationship — crossovers, which line is \"higher,\" how closely they track — is an artifact of the arbitrarily chosen scales rather than the data. By sliding the two axes, almost any visual correlation or dominance can be manufactured. This extends the domain's encoding-distortion theme but is not a specific sub-pitfall in the book.\n",
    "detection_strategy": "In code and charts, flag dual-axis (secondary-axis) plots — `twinx()` in matplotlib, a secondary axis in Excel/Tableau, two `y`/`y2` encodings — especially where the two scales are set independently with no principled alignment, where series in different units are overlaid to suggest they move together, or where a crossover point carries the message. Be suspicious when shifting either axis would change the apparent story.\n",
    "example_bad": "A chart overlays revenue (left axis) and complaints (right axis) on independent scales chosen so the two lines cross dramatically mid-year, implying complaints \"overtook\" revenue — but the crossover is purely a function of where each axis was set, not a real relationship.\n",
    "example_good": "The relationship is shown without scale trickery — indexing both series to a common base (e.g. % change from the start), using small multiples, or plotting one against the other in a scatterplot — so any co-movement reflects the data. If a dual axis is unavoidable, the scales are aligned on a principled basis and labeled clearly.\n",
    "remediation": "Avoid dual axes when the message is about how two series relate; prefer indexing to a common baseline, small multiples, or a scatterplot. If a secondary axis is truly necessary, fix the scales on a principled, disclosed basis and don't let arbitrary scaling manufacture crossovers or co-movement.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6: Graphical Gaffes (domain extension — not a specific sub-pitfall example in the book)",
      "Alberto Cairo, How Charts Lie (Norton, 2019) — dual axes and scale manipulation",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "eda-noise-mistaken-for-signal",
    "name": "EDA Noise Mistaken for Signal",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "During fast exploratory analysis, a pattern is taken as real without pausing to check whether it's signal or noise. Dragging a trendline onto a series and declaring it \"rising\" can mislead when a method that accounts for variation (such as a control chart) shows the movement is within normal noise.\n",
    "detection_strategy": "In code and prose, flag conclusions drawn from a quick visual impression — a fitted trendline, an eyeballed slope — with no test that the variation exceeds noise (control chart, control limits, significance test). Be suspicious of rapid \"explore many charts, publish the striking one\" workflows, of trend claims over series with large month-to-month variation, and of no run/limit analysis before asserting a change.\n",
    "example_bad": "An analyst drags a trendline over monthly reported thefts, sees it slope upward, and concludes theft is rising every month — but an individuals control chart shows 35 straight months of statistical noise since early 2015, with no significant change.\n",
    "example_good": "Before claiming a trend, the analyst views the series on a control chart (or runs a signal-vs-noise test), distinguishing genuine signals (runs, shifts, points beyond the limits) from noise — and tempers the \"rising\" claim to what the data actually supports.\n",
    "remediation": "Slow down in exploration: before treating a visual pattern as real, check it against a method that separates signal from noise (control chart, run rules, significance test). Don't publish the first striking chart; confirm the pattern exceeds normal variation.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6A: Challenging Charts",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "insufficient-precision-comparison",
    "name": "Insufficient Precision for Comparison",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "A chart is asked to convey a fine distinction (one value just edges out another) using an encoding that can't show it precisely. Encodings without a common baseline — pies, bubbles, treemaps, disconnected marks — let the audience see \"roughly equal\" but not which is larger, so the intended point doesn't land without labels.\n",
    "detection_strategy": "In prose and charts, flag a claim about a small or close difference paired with an encoding that lacks a shared baseline or precise scale (area/angle encodings, packed bubbles, side-by-side pies) and no data labels. Be suspicious when the message hinges on which of two near-equal values is larger but the chart can only show approximate magnitude. Length on a common baseline (bars) or explicit labels are needed for precise comparison.\n",
    "example_bad": "To show that assault just barely outpaced narcotics from 2010–2017, the analyst uses pies, bubbles, and treemaps — none of which share a baseline — so the audience can see the two are close but cannot tell which is larger without labels.\n",
    "example_good": "A bar chart with a common baseline (optionally with value labels and gridlines) is used, so the slightly longer assault bar makes the precise comparison immediately clear — the encoding affords the precision the message requires.\n",
    "remediation": "When the message depends on a precise or close comparison, use a position/length encoding with a common baseline (bar chart), and add data labels or gridlines if even finer precision is needed. Reserve area/angle encodings for cases where approximate magnitude is enough.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6A: Challenging Charts",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "optimize-satisfice-false-dichotomy",
    "name": "Optimize/Satisfice False Dichotomy",
    "domain": "Graphical Gaffes",
    "severity": "info",
    "description": "Visualization choice is framed as either finding the one \"best\" chart or settling for any \"good enough\" one — and success is often judged on comprehensibility alone. In reality both optimizing and satisficing have their place depending on tractability, available information, and time, and a visualization's payoff includes more than comprehension: attention, impact, aesthetics, memorability, and resulting behavior.\n",
    "detection_strategy": "This is a mindset/process pitfall, visible in prose and review. Flag claims that there is exactly one correct visualization, or that \"good enough\" is never acceptable, and evaluations that score a visualization solely on comprehension/precision while ignoring whether it drew attention, was remembered, or drove action. Be suspicious of a single-criterion payoff function and of demands for optimization when time or information don't allow it.\n",
    "example_bad": "A critic insists the only valid measure of a chart is how precisely the audience can read the values, and rejects a more memorable, attention-grabbing design that was \"good enough\" on comprehension and far better on impact — even though the goal was to get a busy board to care and act.\n",
    "example_good": "The team weighs the payoff across the factors that matter for the goal (comprehension plus attention, impact, aesthetics, memorability, behavior), optimizes when the problem is tractable and time allows, and otherwise satisfices to a stated acceptability threshold — acknowledging both approaches are legitimate.\n",
    "remediation": "Don't treat optimize versus satisfice as either/or, and don't judge visualizations on comprehensibility alone. Define the payoff factors that matter for the specific goal and audience, optimize when tractable and time permits, satisfice to an explicit threshold otherwise, and accept that more than one design can be fit for purpose.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6C: The Optimize/Satisfice False Dichotomy",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "overloaded-confusing-chart",
    "name": "Overloaded Confusing Chart",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "A chart crams in so much that the audience can't extract the intended message — too many overlapping series (\"spaghetti\"), a color palette recycled across more categories than it has colors, and the series of interest left in a low-salience default. The viewer doesn't walk away with the wrong idea; they walk away with no idea, and give up.\n",
    "detection_strategy": "In code and charts, flag many overlapping series in one view (a dozen-plus lines), categorical color scales applied to more categories than the palette has distinct colors (so hues repeat), the key series left a default low-contrast color, and charts that require interaction (hover/click) to read in a static context. Be suspicious of legends longer than the palette and of no visual hierarchy distinguishing the focus series.\n",
    "example_bad": "A line chart shows 24 crime categories at once; the 20-color palette recycles hues so two lines share a color, the \"shoplifting\" series of interest is a faint default beige lost in the tangle, and you must hover to tell which line is which.\n",
    "example_good": "The focus series (shoplifting) is given a bold, unique color while the rest are de-emphasized with transparency or gray, the number of fully-colored series is kept within the palette, and the chart reads clearly in static form without requiring interaction.\n",
    "remediation": "Reduce what's in the view and build a visual hierarchy: emphasize the focus series with a distinct color, mute or aggregate the rest, and keep the number of distinctly-colored categories within the palette's size. Ensure the chart conveys its point statically, without relying on hover or click.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6A: Challenging Charts",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "rainbow-color-scale",
    "name": "Rainbow Color Scale",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "A rainbow (jet) color scale is used to encode an ordered, continuous variable. Because the rainbow's perceived brightness isn't monotonic and its hue bands aren't evenly spaced, it introduces false boundaries where colors change sharply, hides real gradients where they don't, and misranks values — and it's largely unreadable for colorblind viewers. A perceptually uniform scale represents the data far more faithfully. This extends the domain's encoding theme but is not a specific sub-pitfall in the book.\n",
    "detection_strategy": "In code and charts, flag sequential/continuous data encoded with a rainbow/jet palette — `cmap='jet'`/`'rainbow'`/`'hsv'` in matplotlib, default rainbow ramps in older tools, multi-hue spectral scales used for magnitude. Be suspicious of heatmaps, choropleths, and contour plots that show sharp color bands not present in the data, and of palettes that aren't colorblind-safe. Continuous magnitude should use a perceptually uniform or single-hue sequential scale.\n",
    "example_bad": "A heatmap of temperature uses the jet rainbow scale; viewers perceive a hard boundary at the green-to-yellow transition that isn't in the data and miss the real gradient in the blue region, while red-green colorblind readers can't order the colors at all.\n",
    "example_good": "The same heatmap uses a perceptually uniform sequential scale (e.g. viridis), so equal steps in value look like equal steps in color, no false boundaries appear, the gradient is visible throughout, and the palette stays legible to colorblind viewers.\n",
    "remediation": "Encode ordered/continuous data with a perceptually uniform or single-hue sequential scale (viridis, cividis, ColorBrewer sequential), and reserve hue for categorical distinctions. Check palettes for colorblind safety, and avoid rainbow/jet ramps for magnitude.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6: Graphical Gaffes (domain extension — not a specific sub-pitfall example in the book)",
      "Borland & Taylor (2007), 'Rainbow Color Map (Still) Considered Harmful,' IEEE Computer Graphics & Applications 27(2)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "task-mismatched-visualization",
    "name": "Task-Mismatched Visualization",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "A chart is technically fine but doesn't help the user accomplish their actual task, because the wrong variable is mapped to an axis (or the wrong encoding/aggregation is chosen) for the question at hand. The chart-type debate misses the point; what matters is whether the user can get their job done with the view.\n",
    "detection_strategy": "In prose, specs, and code, flag visualizations built without a clear statement of the user's task and the question it must answer — dashboards reused for a purpose they weren't designed for, an axis showing distance when the task needs time, summaries at the wrong grain. Be suspicious when no one has defined user, task, data, and performance requirements, or when answering the real question requires mental math the chart should have done.\n",
    "example_bad": "A hiker needs to know how long it takes to reach a summit, but the fitness dashboard plots elevation against distance with no time axis — so \"two hours to the top\" can't be read off directly, and pace varies up versus down, defeating back-of-envelope estimates.\n",
    "example_good": "A chart is added with time on the x-axis (altitude or cumulative distance on the y-axis), making the ascent time directly readable — the encoding is chosen to fit the specific question rather than defaulting to whatever the tool produced.\n",
    "remediation": "Start from the user and their task: define who will use the view, what question it must answer, the relevant data, and the performance needs, then choose the encoding (especially which variable goes on each axis) that lets them read the answer directly. Validate the chart against real usage, not a chart-chooser checklist.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6A: Challenging Charts",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "truncated-y-axis",
    "name": "Truncated Y-Axis",
    "domain": "Graphical Gaffes",
    "severity": "warning",
    "description": "A bar or column chart's value axis doesn't start at zero, so the bar lengths no longer encode the values proportionally. Because length is the visual encoding, a truncated baseline exaggerates the differences between bars and can make a small change look dramatic. Line charts and some non-length encodings may legitimately omit zero, so the problem is specific to length-encoded marks. The book mentions axis truncation only in passing; this captures it as a standalone rule.\n",
    "detection_strategy": "In code and charts, flag bar/column/area charts whose value axis starts above zero — explicit axis limits or scale domains excluding zero (matplotlib `set_ylim`, ggplot `coord_cartesian`/`ylim`, Vega-Lite `scale: {zero: false}`, an Excel minimum bound). Be suspicious of bar charts where a tiny percentage change fills most of the plot, and of a y-axis minimum set just below the smallest value. Scope the check to length-encoded marks, not line/dot charts where omitting zero can be fine.\n",
    "example_bad": "A column chart of quarterly revenue ($1.02M, $1.04M, $1.05M) with a y-axis running $1.00M–$1.06M makes a ~3% change look like a near-tripling, because the truncated baseline stretches tiny differences across the whole plot.\n",
    "example_good": "The same bars are drawn with the value axis starting at zero, so their lengths reflect the true proportional differences — or, if the small change is the real story, it's shown with a line chart, a dot plot, or an explicit percentage-change label that doesn't rely on bar length.\n",
    "remediation": "Start the value axis at zero for bar/column/area charts so length encodes value honestly. If small differences are the point, switch to an encoding that doesn't rely on length (line, dot plot, or a stated delta) rather than truncating the baseline of bars.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 6: Graphical Gaffes (domain extension — the chapter mentions y-axis truncation only in passing, not as a sub-pitfall)",
      "Darrell Huff, How to Lie with Statistics (Norton, 1954); Alberto Cairo, How Charts Lie (Norton, 2019)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "colorblind-unsafe-palette",
    "name": "Colorblind-Unsafe Palette",
    "domain": "Design Dangers",
    "severity": "warning",
    "description": "A color encoding relies on hue distinctions that color-vision-deficient viewers can't perceive — most notoriously red-green, which is indistinguishable to the most common forms of colorblindness (roughly 1 in 12 men). The encoding works for some of the audience and silently fails for the rest, who can't read the chart's meaning at all.\n",
    "detection_strategy": "In code and charts, flag palettes that distinguish categories or good/bad by red versus green, or other hue pairs that collapse under common color-vision deficiencies, with no redundant cue (shape, position, label, lightness). Be suspicious of traffic-light (red/amber/green) status encodings, diverging red-green scales, and any palette not checked against a colorblind simulator. Color should not be the sole channel carrying meaning.\n",
    "example_bad": "A status dashboard marks accounts \"red\" for at-risk and \"green\" for healthy with no other cue, so a red-green colorblind manager sees two near-identical muddy tones and cannot tell which accounts need attention.\n",
    "example_good": "The encoding uses a colorblind-safe palette (e.g. blue/orange) and adds a redundant channel — an icon, label, or position — so the at-risk/healthy distinction is legible to everyone, and the palette is verified with a colorblind simulator.\n",
    "remediation": "Choose colorblind-safe palettes (avoid red-green for meaningful distinctions), and never let color be the only channel carrying information — add shape, text, position, or lightness as a redundant cue. Test palettes with a color-vision- deficiency simulator before shipping.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 7A: Confusing Colors",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "design-induced-user-error",
    "name": "Design-Induced User Error",
    "domain": "Design Dangers",
    "severity": "warning",
    "description": "When users misread or misuse a visualization, the design blames the user instead of treating the error as a design flaw to fix. People make slips (meaning one thing, doing another) and mistakes (the wrong goal or plan); a visualization that lets or induces these errors is badly designed. If someone draws a wrong conclusion from your chart, that's at least as much your problem as theirs.\n",
    "detection_strategy": "In process and prose, flag visualizations shipped with no usability testing — no watching real users interact, no iteration on observed errors — and a posture of explaining away user confusion (\"they should've known better\") rather than redesigning. In UI, be suspicious of designs that make wrong actions easy (mis-tappable adjacent controls, misleading default filters) or invite misinterpretation, with no guardrails.\n",
    "example_bad": "Users keep filtering a dashboard to a subset that introduces selection bias and reach wrong conclusions; the designer dismisses it as user error and adds an instruction, rather than recognizing the design induced the mistake and changing it.\n",
    "example_good": "The team watches real users interact, writes down every slip and mistake instead of blaming the tester, and iterates the design to prevent those errors — assuming that if one tester erred, many real users will, and the only chance to fix it is to prevent it.\n",
    "remediation": "Treat user errors as design defects: build, test with real users, watch where they slip or misinterpret, and iterate to prevent it rather than explaining it away. Design out easy wrong actions and misleading defaults, and remember you won't be there to correct users later.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 7C: Usability Uh-Ohs",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "inaccessible-contrast",
    "name": "Inaccessible Contrast",
    "domain": "Design Dangers",
    "severity": "warning",
    "description": "Text or marks are rendered with too little contrast against their background — light gray on white, thin colored text, faint labels — so they're hard or impossible to read for users with low vision, on poor displays, or in bright light. The chart may look sleek to the designer but excludes part of the audience. This extends the domain's accessibility theme but is not a specific sub-pitfall example in the book.\n",
    "detection_strategy": "In code, charts, and CSS, flag foreground/background color pairs whose contrast ratio falls below accessibility thresholds (WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text and meaningful graphics), light-gray-on-white body text, thin or low-weight colored text, and axis labels/annotations in faint tones. Be suspicious of palettes chosen for looks with no contrast check, and of color on small text. Verify ratios with a contrast checker.\n",
    "example_bad": "A dashboard renders axis labels and footnotes in #BBBBBB light gray on a white background (about a 1.9:1 contrast ratio), so low-vision users and anyone on a glary laptop screen outdoors simply can't read the numbers.\n",
    "example_good": "The same labels are darkened to meet at least WCAG AA (4.5:1 for normal text) — e.g. dark gray on white — and contrast is verified with a checker, so the text is legible across vision levels, displays, and lighting.\n",
    "remediation": "Check every text/background and meaningful mark/background pair against WCAG contrast minimums (4.5:1 normal text, 3:1 large text and graphical objects), and darken or adjust until they pass. Don't trade legibility for a low-contrast aesthetic; verify with a contrast tool.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 7: Design Dangers (domain extension — not a specific sub-pitfall example in the book)",
      "W3C Web Content Accessibility Guidelines (WCAG) 2.1, Success Criterion 1.4.3 Contrast (Minimum)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "inconsistent-color-encoding",
    "name": "Inconsistent Color Encoding",
    "domain": "Design Dangers",
    "severity": "warning",
    "description": "Across a multi-view dashboard, the same color (or the same hue at a given saturation) is used to mean different things — encoding one variable in one chart and an unrelated variable in another, or serving as two separate sequential scales for different measures. Viewers infer a connection between marks that share a color when none exists, or read the wrong legend, and are misled.\n",
    "detection_strategy": "In code and charts, flag dashboards where a color palette or hue is reused across views that encode different fields — the same categorical colors applied to two different dimensions, or two sequential legends built on the same hue for different measures/aggregations. Be suspicious when two charts sit side by side with overlapping colors that mean different things, when there are multiple color legends, or when color is applied redundantly (a bar chart already encoding magnitude by length also colored by the same measure).\n",
    "example_bad": "A marathon dashboard places a finish-time histogram next to a finisher-origin treemap that share a palette, so the same red encodes both \"Chicago/Portland\" and \"4–5 hour finishers\" — implying a link that doesn't exist; elsewhere one turquoise sequential scale means county road-miles in a map and road-type miles in a bar chart at once.\n",
    "example_good": "Each variable gets its own distinct, non-overlapping color treatment (or the conflicting charts are separated), and redundant color is removed — e.g. the bar chart, which already encodes magnitude by length, drops its color scale so the dashboard's one sequential hue means only one thing.\n",
    "remediation": "Make every color mean exactly one thing across the whole dashboard. Don't reuse a hue or palette for unrelated variables or as two different scales; remove redundant color encodings, and if two charts genuinely need different color meanings, separate them or use clearly distinct schemes.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 7A: Confusing Colors",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "inconsistent-formatting",
    "name": "Inconsistent Formatting",
    "domain": "Design Dangers",
    "severity": "warning",
    "description": "Numbers, dates, units, labels, and styling are formatted inconsistently across a chart or dashboard — mixed date formats, varying decimal places, currency sometimes shown and sometimes not, different capitalization or terminology for the same thing. The inconsistency forces the reader to constantly re-orient, erodes trust, and invites misreading. This extends the domain's clarity theme but is not a specific sub-pitfall example in the book.\n",
    "detection_strategy": "In code and charts, flag the same quantity formatted differently across views (decimal places, thousands separators, units, currency symbols, percent vs proportion), mixed date formats (MM/DD/YY vs DD-Mon-YYYY), inconsistent capitalization or naming for the same field/category, and ad-hoc per-chart styling instead of a shared format. Be suspicious when no formatting standard is applied across a dashboard.\n",
    "example_bad": "One panel shows revenue as \"$1.2M,\" another as \"1200000,\" and a third as \"1,200 (k)\"; dates appear as \"01/02/25\" in one chart and \"2 Jan 2025\" in another, and the same category is \"N. America\" here and \"North America\" there — the reader must keep re-deciphering.\n",
    "example_good": "A single formatting standard is applied throughout — consistent units and decimal places for each measure, one date format, one name per category, shared number/currency formatting — so values are directly comparable at a glance and nothing has to be re-interpreted.\n",
    "remediation": "Define and apply consistent formatting across the whole deliverable: one date format, fixed decimal places and units per measure, consistent currency/percent display, and one canonical label per field or category. Centralize formatting rather than styling each chart ad hoc.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 7: Design Dangers (domain extension — not a specific sub-pitfall example in the book)",
      "Jakob Nielsen (1994), '10 Usability Heuristics for User Interface Design' — consistency and standards",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "mobile-responsiveness-neglect",
    "name": "Mobile Responsiveness Neglect",
    "domain": "Design Dangers",
    "severity": "warning",
    "description": "A visualization or dashboard is designed only for a large desktop screen and breaks on the small screens where much of the audience actually views it — tiny unreadable labels, controls that fall off-screen or can't be tapped, horizontal scrolling, a dense multi-panel layout crammed onto a phone. Richness that worked on a monitor becomes a confusing, unusable experience on mobile. This extends the chapter's mobile-interaction discussion but isn't developed as its own sub-pitfall.\n",
    "detection_strategy": "In code and UI, flag fixed-width dashboards and charts with no responsive layout, no breakpoints, tap targets too small for a finger, text sized for desktop only, and dense multi-panel views never tested at phone width. Be suspicious of visualizations published to a broad web audience with no mobile rendering check, and of interactions (hover-only tooltips) that don't work on touch.\n",
    "example_bad": "A four-panel interactive dashboard built at 1400px renders on a phone as a sliver of unreadable text, with hover-only tooltips that touch can't trigger and filters pushed off the edge — most of the mobile audience can't use it at all.\n",
    "example_good": "The visualization adapts to screen size — reflowing or simplifying panels for small screens, sizing text and tap targets for touch, and replacing hover-only interactions with tap-friendly ones — so it stays usable from phone to desktop, and it's tested at multiple widths.\n",
    "remediation": "Design and test for the screens the audience actually uses: add responsive breakpoints, size text and tap targets for touch, ensure controls and tooltips work without a mouse, and simplify or reflow dense layouts for small screens rather than shrinking them. Verify on real devices.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 7C: Usability Uh-Ohs (domain extension — generalizes the mobile-interaction discussion in the book)",
      "Ethan Marcotte, Responsive Web Design (A Book Apart, 2011)",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "omitted-aesthetic-opportunity",
    "name": "Omitted Aesthetic Opportunity",
    "domain": "Design Dangers",
    "severity": "info",
    "description": "A chart is clear and correct but purely utilitarian, missing the chance to engage the audience and evoke the subject — a \"sin of omission\" on the aesthetic side. Because cognition and emotion are linked, an unengaging visual can fail to capture attention or stick in memory even when it's accurate. The flip side matters too: aesthetic flourishes must not be added at the expense of clarity, and some audiences and contexts don't want them.\n",
    "detection_strategy": "This is a mostly aspirational, context-dependent pitfall, visible in design review. In prose and charts, consider whether a visualization meant to engage a broad or public audience does anything to draw attention, fit its subject, or be memorable, or whether it's a default-styled chart where engagement is a stated goal. Conversely, flag decorative elements that reduce clarity or could mislead. Weigh the audience: utilitarian operational reports may rightly want no flourish.\n",
    "example_bad": "A timeline of Edgar Allan Poe's works is a plain bright-blue column chart — accurate, but evoking nothing of his moody, haunting subject matter, missing an easy chance to engage readers who would connect with the topic.\n",
    "example_good": "The same data is rendered to fit the subject — columns stacked downward in blood-red with the author's public-domain portrait and signature filling a natural gap — adding engagement and meaning without distorting the values, while staying ready to drop the flourish for audiences that don't want it.\n",
    "remediation": "For visualizations meant to engage, ask what aesthetic choices would draw attention and fit the subject, and use them where they add (not subtract) meaning. Guard the clarity/aesthetics trade-off: test flourishes with real audience members, and omit them for contexts or audiences that prefer plain, utilitarian visuals.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 7B: Omitted Opportunities",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "too-many-color-encodings",
    "name": "Too Many Color Encodings",
    "domain": "Design Dangers",
    "severity": "warning",
    "description": "A single dashboard carries multiple independent color schemes at once — several legends, conflicting red-green scales, categorical hues layered on top of sequential ones — so the viewer has to keep track of what color means in each view and quickly loses the thread. More color schemes mean more cognitive load and more chances to misread.\n",
    "detection_strategy": "In code and charts, flag dashboards with multiple distinct color legends/encodings — two or more sequential scales, a categorical scheme plus a diverging one, the same red-green applied to different measures, color piled onto views that don't need it. Be suspicious when stakeholders have asked for \"everything in one view,\" when no single variable is clearly the focus of color, and when removing a color encoding would lose no information.\n",
    "example_bad": "A sales dashboard uses two separate red-green profit scales with different extremes, then red and green again for two regions in a scatterplot, and a blue bar chart whose blue matches a third region — several color systems competing in one view, none clearly primary.\n",
    "example_good": "The dashboard is limited to a single color encoding, assigned to the one variable most tied to the user's primary task (e.g. Region for a regional sales review); other measures are shown without color or moved to a separate view, so color carries one clear meaning.\n",
    "remediation": "Aim for one color encoding per dashboard, given to the variable most central to the user's task. Drop or relocate competing schemes, show secondary measures without color (or in a separate view), and resist cramming every possible measure into one over-colored view.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 7A: Confusing Colors",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "unclear-interaction-affordances",
    "name": "Unclear Interaction Affordances",
    "domain": "Design Dangers",
    "severity": "warning",
    "description": "An interactive visualization doesn't make it discoverable what actions are possible or understandable what the controls and marks mean, and its controls aren't naturally mapped to the views they affect. Users can't tell what they can do or how, so the interactivity goes unused or is used wrongly — like a stovetop whose knobs don't line up with its burners.\n",
    "detection_strategy": "In code and UI, flag interactive dashboards where filters/controls (dropdowns, sliders, legends, buttons) are placed far from or in a different spatial arrangement than the views they control, where it isn't visually obvious a mark is clickable/filterable, or where controls lack clear signifiers/labels. Be suspicious of default control placement (all on the right) when multiple views need different controls, and of interactions a first-time user couldn't discover unaided.\n",
    "example_bad": "A four-panel dashboard puts all its filters in a single column on the right, so it's unclear which filter drives which panel — a user changes a control expecting panel A to update, but panel C changes instead, mirroring a stovetop with knobs in a row over a 2x2 burner grid.\n",
    "example_good": "Controls are mapped to the views they affect — mounted on or beside each panel, or arranged in the same spatial layout as the panels — with clear labels and signifiers, so it's obvious what each control does and how to use it.\n",
    "remediation": "Make interactivity discoverable and understandable: place each control on or adjacent to the view it affects (or mirror the views' spatial layout), label controls clearly, and signal which marks are interactive. Invest the effort to make complex interactions obvious.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 7C: Usability Uh-Ohs",
      "https://www.avoidingdatapitfalls.com"
    ]
  },
  {
    "id": "the-unheard-voice",
    "name": "The Unheard Voice",
    "domain": "Biased Baseline",
    "severity": "info",
    "description": "Whose voices, sources, and contributions are represented in the data work — and whose are missing — goes unexamined, so perspectives that have historically been undervalued or ignored are left out, and their contributions are under-credited or misattributed. The result is a biased baseline: the data, sources, examples, and narrative over-represent dominant groups and quietly erase others.\n",
    "detection_strategy": "In prose, sources, and data, flag a body of work whose cited sources, quoted experts, examples, or training data draw from a narrow, non-representative set of voices (e.g. all-male quote lists, single-demographic expert panels), contributions attributed to a later or better-known figure while the originator is omitted, and datasets or samples that exclude or undercount historically marginalized groups. Be suspicious when no one has asked whose perspective is missing or who deserves credit.\n",
    "example_bad": "A book's nine chapter epigraphs are all quotes from men, with not one woman — and its discussion of the box plot credits only Tukey, omitting Mary Eleanor Spear, whose 1952 \"range-bar\" was its precursor.\n",
    "example_good": "The author audits representation before publishing — deliberately sourcing quotes and examples from a diverse range of voices and crediting originators like Spear alongside Tukey — so the work reflects contributions in proportion to their value, not the demographic of the contributor.\n",
    "remediation": "Deliberately check whose voices and contributions are represented and whose are missing before finalizing data work. Seek out and amplify historically undervalued or ignored voices in your sources, examples, and data; credit originators accurately; and treat representation as a question to ask explicitly, not assume.\n",
    "references": [
      "Avoiding Data Pitfalls (Wiley, 2020), Pitfall 8A: The Unheard Voice",
      "https://www.avoidingdatapitfalls.com"
    ]
  }
];
