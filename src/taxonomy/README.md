# Pitfall Taxonomy

This directory contains the **pitfall taxonomy** — the structured, machine-readable catalog of data pitfalls organized by pitfall domain.

Each pitfall is described as a rule with a defined shape (`id`, `name`, `domain`, `severity`, `description`, `detection_strategy`, `example_bad`, `example_good`, `remediation`, `references`). datapitfalls uses these rules to ground its analysis: when you scan a chart, snippet, description, or document, the relevant rules are retrieved and passed to the Claude API alongside your input.

For the rule format and worked examples, see [docs/PITFALL_TAXONOMY.md](../../docs/PITFALL_TAXONOMY.md). For the overall plan, see [ROADMAP.md](../../ROADMAP.md).

## License

The taxonomy (the rule files here and their text) is licensed under [CC BY-NC 4.0](../../LICENSE-TAXONOMY.md), separately from the MIT-licensed code. Using the rules at work is free; selling them or building them into a paid product or course needs a license from Data Literacy.
