# Architecture

This document describes how datapitfalls is designed to work. It's a living document — the system is being built phase by phase (see [ROADMAP.md](../ROADMAP.md)), so treat this as the intended design rather than a description of fully shipped code.

## The core idea

datapitfalls takes some piece of data work — a chart, a code snippet, a plain-English description, or a whole document — and returns a structured audit of the pitfalls it contains. The key insight is that good auditing requires *grounding*: rather than asking an AI model to free-associate about what might be wrong, datapitfalls retrieves the relevant pitfall rules from a curated taxonomy and asks the model to reason over the input **in light of those rules** and the knowledge from *Avoiding Data Pitfalls*.

## Data flow

```
   ┌────────────────────┐
   │   INPUT MODES      │
   │                    │
   │  • Chart image     │
   │  • Code (py/sql/r) │
   │  • Plain-English   │
   │  • Document (pdf)  │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐      The input is normalized and classified so we
   │  INPUT PROCESSING  │      know which kinds of pitfalls are even possible
   │  normalize +       │      (a SQL snippet can't have a truncated axis; an
   │  classify          │      image can't have a join explosion).
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐      Relevant rules are pulled from the taxonomy
   │  TAXONOMY LOOKUP   │      across the eight audit domains. In later phases
   │  retrieve relevant │      this is backed by a vector search over the book's
   │  pitfall rules     │      knowledge (Pinecone) for richer grounding.
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐      The input + the retrieved rules + the book
   │  CLAUDE API        │      knowledge are sent to Claude (Vision for images).
   │  grounded analysis │      Claude identifies which pitfalls are present and
   │                    │      explains its reasoning.
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐      A structured, prioritized report: each finding
   │  AUDIT REPORT      │      names the pitfall, its domain and severity, why
   │  structured output │      it matters, and how to remediate it.
   └────────────────────┘
```

## Components

### 1. Input processing
Accepts the four input modes, normalizes them into a common internal representation, and classifies the input so the system knows which audit domains are applicable. Images are prepared for Claude Vision — one chart or several at once, so cross-chart pitfalls can be caught — and PDFs are sent to Claude as native documents, so it reads the prose and sees the charts and tables in place rather than relying on extracted text.

### 2. Pitfall taxonomy
The curated catalog of pitfall rules, organized by the eight audit domains from the book. Each rule is a structured object (see [PITFALL_TAXONOMY.md](PITFALL_TAXONOMY.md)). The taxonomy is the project's center of gravity — it's what makes the audits specific and grounded rather than generic.

### 3. Taxonomy lookup / retrieval
Selects the rules relevant to a given input. In early phases this is a straightforward filter by input type and domain. In later phases (see Roadmap Phase 2+), this is augmented by semantic retrieval over a vectorized representation of the book's content, so the most contextually relevant guidance surfaces for each audit.

### 4. Claude API analysis
The reasoning engine. datapitfalls sends the input together with the retrieved rules and book knowledge to the Claude API — using Claude's vision capabilities for chart images — and asks it to identify present pitfalls with justifications. Grounding the model in the taxonomy keeps findings accurate and explainable.

### 5. Audit report
The output. A structured report listing each detected pitfall with its domain, severity (`info` / `warning` / `error`), an explanation of why it matters, and concrete remediation guidance. The same structure powers the website UI, the CLI output, and the programmatic API.

## Planned tech stack

| Concern                | Technology                          |
| ---------------------- | ----------------------------------- |
| Language               | TypeScript                          |
| Runtime                | Node.js (>= 18)                     |
| AI analysis            | Claude API (Anthropic), incl. Vision |
| Website                | Next.js (hosted at avoidingdatapitfalls.com) |
| Knowledge vectorization| Pinecone (book content embeddings)  |
| Tooling                | ESLint, Prettier, tsc               |

## Design principles

- **Grounded, not guessing.** Every finding traces back to a named pitfall in the taxonomy.
- **Explainable.** An audit that says "this is wrong" without saying *why* doesn't teach anything. Every finding explains itself.
- **Whole-chain.** We audit the reasoning, not just the rendering. The most damaging pitfalls live upstream of the chart.
- **Extensible.** The taxonomy is designed to grow through community contributions (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
