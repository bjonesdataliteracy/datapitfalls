# datapitfalls web app

The browser front end for datapitfalls — a thin Next.js app that reuses the
engine in [`../src`](../src). It detects pitfalls in the same inputs as the CLI (chart images,
several charts at once, PDFs, Word docs, slide decks, notebooks, code files, pasted
prose/code, and whole analysis chains — code, charts, and prose scanned together) through the
API route at [`app/api/audit/route.ts`](app/api/audit/route.ts).

Pages:

- `/` (`app/page.tsx`): the home page for Data Pitfalls (the MCP, the Lab's
  Pitfalls Detector, and the book). Shared nav and footer live in `app/layout.tsx`;
  links are in `app/links.ts`.
- `/pitfalls` and `/pitfalls/<domain>`: the pitfall library, generated from the
  taxonomy at build time. Each rule is an anchor: `/pitfalls/<domain>#<rule-id>`.
- `/scan` (`app/scan/`): the free scanner, with its own scoped styles.
- `/checklist`: the printable checklist of every pitfall, the free download behind
  the email signup (not indexed by search engines).
- `/training`: Data Pitfalls workshops and reviews from Data Literacy, with an
  inquiry form.
- `/api/signup`: receives the checklist signup and training form and forwards
  each submission to `SIGNUP_WEBHOOK_URL` (see below).
- `/api/mcp`: the Data Pitfalls MCP server for claude.ai custom connectors.

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

| Variable                           | Required | Purpose                                                  |
| ---------------------------------- | -------- | -------------------------------------------------------- |
| `ANTHROPIC_API_KEY`                | yes      | Server-side key the scan route uses to call Claude.      |
| `ANTHROPIC_MODEL`                  | no       | Override the model (defaults to the engine default).     |
| `RATE_LIMIT_MAX`                   | no       | Max scans per window, per IP (default 8).                |
| `RATE_LIMIT_WINDOW_SECONDS`        | no       | Length of the rate-limit window in seconds (default 60). |
| `MCP_RATE_LIMIT_MAX`               | no       | Max MCP requests per window, per IP (default 300).       |
| `MCP_RATE_LIMIT_WINDOW_SECONDS`    | no       | MCP rate-limit window in seconds (default 60).           |
| `SIGNUP_WEBHOOK_URL`               | no       | Where signups and training inquiries are sent (below).   |
| `SIGNUP_RATE_LIMIT_MAX`            | no       | Max form submissions per window, per IP (default 5).     |
| `SIGNUP_RATE_LIMIT_WINDOW_SECONDS` | no       | Form rate-limit window in seconds (default 60).          |

Set these in the Vercel project (Settings → Environment Variables) and redeploy
for changes to take effect.

## Email signups and training inquiries

The site keeps no mailing list of its own. `/api/signup` checks each submission
and sends it as a JSON `POST` to `SIGNUP_WEBHOOK_URL`. Point that at any tool that
accepts a webhook, for example a Zapier or Make "catch hook" that adds the person
to Mailchimp, HubSpot, Resend or a spreadsheet and sends the welcome email. The
JSON looks like:

```json
{
  "kind": "checklist",
  "email": "pat@example.com",
  "name": "Pat",
  "company": "Example Co",
  "teamSize": "10 to 50",
  "message": "…",
  "source": "/",
  "submittedAt": "2026-10-14T12:00:00.000Z"
}
```

`kind` is `checklist` for the free checklist signup and `training` for the
training form; the other fields appear only when filled in. Until
`SIGNUP_WEBHOOK_URL` is set the route answers 503: the checklist form still hands
over the checklist link, and the training form points people to dataliteracy.com.

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
