# PRD 1: datapitfalls core (changes to support the family)

> Part of the datapitfalls PRD set ([index](README.md)). Related specs: [PRD 2: datapitfalls bench](https://github.com/bjonesdataliteracy/datapitfalls-bench/blob/main/docs/PRD.md) · [PRD 3: datapitfalls agent](https://github.com/bjonesdataliteracy/datapitfalls-agent/blob/main/docs/PRD.md)

## Summary

The existing package needs a small, focused release (v0.12.0) so the bench and agent can build on it: exported schemas, a transcript input mode, stable rule IDs with a taxonomy version, and a renamed CLI label.

**Problem.** Today the engine reviews one artifact at a time and returns findings shaped for people and CI. The agent needs to review whole agent sessions, cite exact events, and trust that rule IDs never shift under stored memories. The bench needs reusable scoring.

**Goals.**

- Every downstream product consumes core through documented contracts, never internals.
- Memories written today still resolve to the right rule after taxonomy updates.
- No breaking change for current CLI, library or MCP users.

**Non-goals.** No new pitfall rules in this release; no change to the review method; no web app changes beyond docs.

**Success metrics.** Bench and agent prototypes import only public exports; existing tests and evals pass unchanged; zero breaking-change reports after release.

## Requirements

P0 items (C1 to C5) shipped in v0.12.0; P1 in v0.13.0; P2 when the bench or agent needs them.

| ID | Requirement | Priority | Needed by |
| --- | --- | --- | --- |
| C1 | Publish `@datapitfalls/schemas` with JSON Schemas and types for Finding, PitfallReport, Transcript, Memory record and Trap | P0 | Bench, agent |
| C2 | Rename the CLI help label "Agent:" (for `scan --json`) to "Automation:" | P0 | Brand |
| C3 | Freeze rule IDs: add an `aliases` field to the rule schema; `getRule(id)` and MCP `get_pitfall` resolve old slugs | P0 | Agent memory |
| C4 | Expose `taxonomyVersion` in every report, in MCP server info, and as a library export | P0 | Reproducible bench runs |
| C5 | New input kind `transcript`: `datapitfalls scan --transcript session.json` reviews an agent session; each finding's `evidence` cites event indexes | P0 | Agent Debrief, bench |
| C6 | Batch API: `detectPitfalls()` accepts several artifacts with ids and returns findings keyed by artifact, sharing one rules context to cut tokens | P1 | Debrief cost |
| C7 | Structured verification hint on latent findings: optional `verification` with a plain-language check and, for SQL inputs, a suggested query | P1, experimental | Agent half-life checks |
| C8 | MCP extension point: sibling packages register extra tools on the same server (`datapitfalls mcp --with @datapitfalls/agent`) | P1 | Agent Serve |
| C9 | Export the eval scoring module (`precision`, `recall`, `F1`, calibration) as `datapitfalls/evals` | P2 | Bench |
| C10 | Add a commercial license template and FAQ to LICENSE-TAXONOMY.md covering hosted and OEM use | P1 | Hosted and OEM use |
| C11 | Add a contributor license agreement check to pull requests | P1 | Clean IP |
| C12 | ROADMAP Phase 8 "Agents and memory", linking bench and agent | P1 | Audience |

## Interfaces, milestones and open questions

New surface area stays small: one CLI flag, one input kind, two exports and one MCP option.

```bash
# Review an agent session (C5)
datapitfalls scan --transcript session.json --json

# Serve the rules plus agent memory tools (C8)
datapitfalls mcp --with @datapitfalls/agent
```

```ts
import { detectPitfalls, taxonomyVersion, getRule } from 'datapitfalls';
import type { Transcript, MemoryRecord } from '@datapitfalls/schemas';
```

| Release | Contents | Target |
| --- | --- | --- |
| v0.12.0 | C1 to C5 | Shipped Nov 2026 |
| v0.13.0 | C6, C8, C10, C11, C12 | Mid Jan 2027, before agent v0.1 |
| Later | C7, C9 | When the agent's half-life checks and the bench scoring need them |

**Open questions:**

- [ ] Does the transcript input mode belong in core, or only in the agent? Core keeps one review engine; the agent keeps core simpler.
- [ ] How should large transcripts be chunked for review without losing cross-step pitfalls that `--chain` catches today?
- [ ] Does C7 risk the engine suggesting queries it cannot run? Keep it experimental and behind a flag.
