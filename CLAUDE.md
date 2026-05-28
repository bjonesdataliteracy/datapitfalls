# CLAUDE.md

Guidance for Claude Code working in this repo. This is a **living document** — it
reflects how we work *today*, not a permanent contract. The whole experience keeps
improving; update or trim this file as the project and tooling evolve, and don't
treat anything here as sacred.

## What this is

datapitfalls detects data pitfalls in data work (charts, code, prose, documents) against
a taxonomy of data pitfalls, powered by the Claude API. Three parts:

- **Engine** (`src/`) — `detectPitfalls()` scans code, text, one or several chart images
  (cross-chart detection), and PDFs (native document). The taxonomy lives as YAML in
  `src/taxonomy/<domain>/` (with `extensions/` subfolders); `npm run build`
  regenerates `src/taxonomy/data.ts` and `npm run validate` checks the rules.
- **CLI** — `datapitfalls scan`; file routing in `src/scan-input.ts`.
- **Web app** (`web/`, Next.js, an npm workspace) — the same inputs in the browser;
  API route at `web/app/api/audit/route.ts`. Deployed on Vercel with a server-side
  `ANTHROPIC_API_KEY`.

## Branch naming

Web sessions are auto-assigned a random branch like `claude/adoring-ritchie-t2wkV`.
Prefer a descriptive name instead:

- Rename the assigned branch locally before pushing —
  `git branch -m claude/<short-topic>` (e.g. `claude/rate-limiting`) — or, for work
  that should start from a clean `main`, create `claude/<short-topic>` off
  `origin/main` directly.
- Push **only** the descriptive branch and open the PR from it.
- **Never push the random slug.** It only lives in the ephemeral container, so if
  it's never pushed, no empty branches accumulate on `origin`. (The repo also
  auto-deletes merged head branches, but renaming keeps the branch name tidy during
  the PR's life, not just after merge.)

This is standing permission to push to a self-named `claude/<topic>` branch.

## Workflow

- Branch off an up-to-date `main` (confirm it's synced with `origin/main` first).
- Commit with clear messages; open a PR to `main`; merge when green.
- Keep the docs (README, ROADMAP, CHANGELOG, `docs/`) in sync with what actually ships.
- Keep the web layer thin — reuse the engine rather than reimplementing its logic.

## The gate (run before committing code)

```
npm run build && npm run validate && npm test && npm run lint
```

For web changes also run `cd web && npm run build`. (Docs-only changes don't need
the code gate.)

## Gotchas

- The engine's `dist/` is gitignored; the web build runs a `vercel-build` script that
  builds the engine first.
- Image scans ground only on Graphical Gaffes + Design Dangers + the
  `data-reality-gap` rule.

## Verification honesty

A cloud session typically has no live Anthropic API key and no browser. Don't claim a
real scan or the web UI "works" if you couldn't actually run it — say what you
verified (build, types, tests) and clearly flag what you couldn't.
