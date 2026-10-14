import { clientKey, createRateLimiter } from '../audit/rate-limit';

// Email signups (the free checklist) and training inquiries from the site.
//
// The site keeps no list of its own: each valid submission is forwarded as JSON
// to SIGNUP_WEBHOOK_URL, which can be any tool that accepts a webhook (a Zapier
// or Make "catch hook" that adds the contact to Mailchimp, HubSpot, Resend, a
// spreadsheet, and so on). With no webhook set, the route answers 503 and the
// form says signups aren't open yet; nothing is stored or lost silently.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const checkRateLimit = createRateLimiter({
  windowSeconds: Number(process.env.SIGNUP_RATE_LIMIT_WINDOW_SECONDS) || 60,
  max: Number(process.env.SIGNUP_RATE_LIMIT_MAX) || 5,
});

const KINDS = ['checklist', 'training'] as const;
type Kind = (typeof KINDS)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim a form field to a string of at most `max` characters, or undefined. */
function field(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  return v ? v.slice(0, max) : undefined;
}

function error(message: string, status: number, headers?: HeadersInit): Response {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(req: Request): Promise<Response> {
  const rate = checkRateLimit(clientKey(req));
  if (!rate.ok) {
    return error(`Too many requests. Please wait ${rate.retryAfterSeconds}s and try again.`, 429, {
      'Retry-After': String(rate.retryAfterSeconds),
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return error('Expected a JSON body.', 400);
  }

  // Honeypot: a field people never see. Bots that fill it get a quiet success.
  if (field(body.website, 200)) return Response.json({ ok: true });

  const kind = body.kind as Kind;
  if (!KINDS.includes(kind)) return error('Unknown form.', 400);

  const email = field(body.email, 254)?.toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return error('Please enter a valid email address.', 400);

  const webhook = process.env.SIGNUP_WEBHOOK_URL;
  if (!webhook) return error("Signups aren't open yet.", 503);

  const payload = {
    kind,
    email,
    name: field(body.name, 100),
    company: field(body.company, 150),
    teamSize: field(body.teamSize, 40),
    message: field(body.message, 2000),
    source: field(body.source, 200),
    submittedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`webhook answered ${res.status}`);
  } catch (err) {
    console.error('signup: forwarding failed:', err instanceof Error ? err.message : err);
    return error('Something went wrong on our side. Please try again later.', 502);
  }

  return Response.json({ ok: true });
}
