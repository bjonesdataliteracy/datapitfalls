import { clientKey, createRateLimiter } from '../audit/rate-limit';
import { SITE_URL } from '../../links';
import { addContact, sendEmail } from './resend';

// Email signups (the free checklist) and training inquiries from the site, both
// handled through Data Literacy's Resend account. The site keeps nothing itself.
//
// - Checklist: the address is added to the RESEND_SEGMENT_ID segment, and, when
//   RESEND_FROM is set, gets a welcome email with the checklist link.
// - Training: the inquiry is emailed from RESEND_FROM to TRAINING_NOTIFY_EMAIL,
//   with reply-to set to the visitor. It is not added to the mailing list.
//
// When the settings a form needs are missing, the route answers 503 and the
// form says signups aren't open yet, so nothing is lost silently.

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

  const env = process.env;
  const ready =
    kind === 'checklist'
      ? env.RESEND_API_KEY && env.RESEND_SEGMENT_ID
      : env.RESEND_API_KEY && env.RESEND_FROM && env.TRAINING_NOTIFY_EMAIL;
  if (!ready) return error("Signups aren't open yet.", 503);

  const name = field(body.name, 100);
  try {
    if (kind === 'checklist') {
      await addContact(email, env.RESEND_SEGMENT_ID!, name);
      if (env.RESEND_FROM) {
        // The signup has succeeded; a failed welcome email is only logged.
        await sendEmail(welcomeEmail(email)).catch((err) =>
          console.error('signup: welcome email failed:', err instanceof Error ? err.message : err)
        );
      }
    } else {
      await sendEmail(
        inquiryEmail(env.TRAINING_NOTIFY_EMAIL!, {
          email,
          name,
          company: field(body.company, 150),
          teamSize: field(body.teamSize, 40),
          message: field(body.message, 2000),
          source: field(body.source, 200),
        })
      );
    }
  } catch (err) {
    console.error('signup: Resend call failed:', err instanceof Error ? err.message : err);
    return error('Something went wrong on our side. Please try again later.', 502);
  }

  return Response.json({ ok: true });
}

const CHECKLIST_URL = `${SITE_URL}/checklist`;

function welcomeEmail(to: string) {
  return {
    to,
    subject: 'Your Data Pitfalls checklist',
    text: [
      'Thanks for signing up.',
      '',
      `Here is your printable checklist of every pitfall from Avoiding Data Pitfalls: ${CHECKLIST_URL}`,
      '',
      'Open it and choose "Print or save as PDF" to keep a copy.',
      '',
      'Ben Jones, Data Literacy',
    ].join('\n'),
  };
}

function inquiryEmail(
  to: string,
  f: Record<'email' | 'name' | 'company' | 'teamSize' | 'message' | 'source', string | undefined>
) {
  const lines = [
    `Name: ${f.name ?? '-'}`,
    `Email: ${f.email}`,
    `Company: ${f.company ?? '-'}`,
    `Team size: ${f.teamSize ?? '-'}`,
    `Page: ${f.source ?? '-'}`,
    '',
    f.message ?? '(no message)',
  ];
  return {
    to,
    subject: `Training inquiry from ${f.name ?? f.email}${f.company ? ` (${f.company})` : ''}`,
    text: lines.join('\n'),
    replyTo: f.email,
  };
}
