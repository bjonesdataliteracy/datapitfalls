# Verification kit

A launch-readiness check: prove every input mode actually runs against a live
Anthropic API key, and that the deployed web app works in a browser. This is the
"does it work for a first visitor?" pass — separate from [`evals/`](../evals),
which grades accuracy rather than whether the thing runs.

> Heads up: the automated script calls the real API, so it costs a little money
> (a handful of audits — typically a few cents). The optional rate-limit check is
> free.

## 1. Automated checks (`npm run verify`)

Builds the engine, then runs `analyze()` once per input mode against your key.

```bash
ANTHROPIC_API_KEY="sk-ant-..." npm run verify
```

The **text** and **code** modes always run (fixtures live in `verify/fixtures/`).
**Image**, **multi-chart**, and **document** modes run only if you drop matching
files in — otherwise they're skipped with a note:

| Drop this into `verify/fixtures/`        | Unlocks                |
| ---------------------------------------- | ---------------------- |
| `chart.png` (or `.jpg/.jpeg/.gif/.webp`) | single-chart audit     |
| a second image                           | multi-chart audit      |
| `report.pdf`                             | document audit         |

A pass means the call returned a well-formed report (right `kind`, rules were
considered, findings came back as a list); for the planted-pitfall text and code
fixtures it also flags if nothing was found. Each line prints the rules found,
the model, and an approximate cost.

### Also check the deployed web app

Point `--url` at a running server (local `npm run dev` or your Vercel URL) to POST
each input to `/api/audit` and confirm the web layer returns reports:

```bash
ANTHROPIC_API_KEY="sk-ant-..." npm run verify -- --url https://your-app.vercel.app
```

### Check the rate limiter (free)

Confirms the limiter returns `429` once over the limit. It uses empty payloads
that the route rejects before any model call, so it spends nothing. Run it on its
own so the window isn't already partly used, and pass your server's
`RATE_LIMIT_MAX`:

```bash
node verify/run.mjs --url https://your-app.vercel.app --rate-check --rate-max 8
```

## 2. Browser click-through checklist

The script can't see the UI. Open the web app in a browser and walk through this
by hand — golden paths and the edges that tend to break.

**Layout & first load**
- [ ] Page loads with the masthead, the three mode tabs, and the audit form
- [ ] The privacy footer is present and readable
- [ ] Looks right on a narrow / mobile viewport (resize the window)

**Chart image mode**
- [ ] Choose a chart file → it previews → **Audit** returns findings
- [ ] Drag-and-drop a chart onto the drop zone works
- [ ] Paste a chart screenshot from the clipboard works
- [ ] Add several charts → audit returns a cross-chart result; removing a thumbnail works

**Written analysis mode**
- [ ] Paste prose → **Audit** returns findings
- [ ] Upload a `.pdf` → it audits the document; upload a `.docx` → it audits the text

**Analysis code mode**
- [ ] Paste code (optionally set a language) → **Audit** returns findings
- [ ] Upload a `.py` / `.ipynb` → it audits as code

**Findings display**
- [ ] Active vs. latent findings are split into their two sections
- [ ] Severity badges/colors render; "Why", "Evidence", "Fix" (and "Bites if" for latent) all show
- [ ] A clean input reports "No pitfalls detected" rather than erroring

**Error & limit states**
- [ ] Submitting with nothing selected shows a friendly prompt, not a crash
- [ ] An oversized or unsupported file shows a clear error message
- [ ] Hammering **Audit** past the limit surfaces the "Too many audits — wait Ns" message

Once the automated checks pass and this list is ticked, the app is ready to show
the world.
