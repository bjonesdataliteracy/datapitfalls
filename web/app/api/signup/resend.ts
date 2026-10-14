// A minimal client for the two Resend API calls the signup route makes: adding
// a contact to a segment, and sending an email. Plain fetch, so the web app
// takes no SDK dependency. Paths and fields follow the official resend SDK.

const API = process.env.RESEND_API_BASE || 'https://api.resend.com';

async function call(path: string, body?: unknown): Promise<Response> {
  return fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
}

async function fail(what: string, res: Response): Promise<never> {
  const detail = (await res.text().catch(() => '')).slice(0, 300);
  throw new Error(`${what} answered ${res.status}: ${detail}`);
}

/**
 * Add a subscriber to a segment. A new address is created with the segment; an
 * address Resend already has is added to the segment instead.
 */
export async function addContact(email: string, segmentId: string, firstName?: string) {
  const created = await call('/contacts', {
    email,
    first_name: firstName,
    unsubscribed: false,
    segments: [{ id: segmentId }],
  });
  if (created.ok) return;
  const added = await call(
    `/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(segmentId)}`
  );
  if (!added.ok) await fail('Resend contacts', created);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  const res = await call('/emails', {
    from: process.env.RESEND_FROM,
    to: [opts.to],
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    reply_to: opts.replyTo,
  });
  if (!res.ok) await fail('Resend emails', res);
}
