# datapitfalls web app

The browser front end for datapitfalls — a thin Next.js app that reuses the
engine in [`../src`](../src). It audits the same inputs as the CLI (chart images,
several charts at once, PDFs, Word docs, notebooks, code files, and pasted
prose/code) through the API route at [`app/api/audit/route.ts`](app/api/audit/route.ts).

## Local development

```bash
# from the repo root
npm install
ANTHROPIC_API_KEY="sk-ant-..." npm run dev --prefix web
```

Then open http://localhost:3000.

The build is wired so the engine is compiled first: `vercel-build` runs
`npm run build` in the repo root (which produces the gitignored `dist/`) before
`next build`.

## Environment variables

| Variable                    | Required | Purpose                                                  |
| --------------------------- | -------- | -------------------------------------------------------- |
| `ANTHROPIC_API_KEY`         | yes      | Server-side key the audit route uses to call Claude.     |
| `ANTHROPIC_MODEL`           | no       | Override the model (defaults to the engine default).     |
| `RATE_LIMIT_MAX`            | no       | Max audits per window, per IP (default 8).               |
| `RATE_LIMIT_WINDOW_SECONDS` | no       | Length of the rate-limit window in seconds (default 60). |

Set these in the Vercel project (Settings → Environment Variables) and redeploy
for changes to take effect.

## Pointing avoidingdatapitfalls.com at this app

The app deploys to Vercel. To serve it from the custom domain:

1. In the Vercel project: **Settings → Domains → Add** `avoidingdatapitfalls.com`
   (and `www.avoidingdatapitfalls.com`). Vercel shows the exact DNS records to set.
2. At your DNS provider, remove the existing redirect to the company site, then
   add the records Vercel asks for — typically an `A` record for the apex
   (`avoidingdatapitfalls.com`) and a `CNAME` for `www` pointing at Vercel.
3. Pick one canonical host and let Vercel redirect the other (the app's metadata
   uses `https://www.avoidingdatapitfalls.com` as canonical).
4. Wait for DNS to propagate and Vercel to issue the TLS certificate, then load
   the domain to confirm it serves the app rather than the old redirect.

Social/preview cards and the favicon are generated at build time from
[`app/opengraph-image.tsx`](app/opengraph-image.tsx) and
[`app/icon.tsx`](app/icon.tsx) — no static assets to maintain.
