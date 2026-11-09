// datapitfalls — analytics-agent session transcripts.
//
// A transcript is the record of one session between a person and an AI
// analytics agent: the questions, the agent's queries and results, the charts
// and claims it produced, and any corrections. The engine reviews a transcript
// the way it reviews a chain: for pitfalls in each step and across steps, citing
// the events involved. The shape mirrors the Transcript contract in
// @datapitfalls/schemas (packages/schemas); keep the two in sync.

/** Agents whose sessions the transcript format describes. */
export const TRANSCRIPT_AGENTS = ['hex', 'claude', 'claude-code', 'generic'] as const;
export type TranscriptAgent = (typeof TRANSCRIPT_AGENTS)[number];

/** Who produced an event. */
export const TRANSCRIPT_ROLES = ['user', 'agent', 'tool'] as const;
export type TranscriptRole = (typeof TRANSCRIPT_ROLES)[number];

/** What kind of step an event is. */
export const TRANSCRIPT_EVENT_TYPES = [
  'message',
  'query',
  'result',
  'chart',
  'correction',
] as const;
export type TranscriptEventType = (typeof TRANSCRIPT_EVENT_TYPES)[number];

/** One step of a session. */
export interface TranscriptEvent {
  role: TranscriptRole;
  type: TranscriptEventType;
  /** The message text, a result preview, a chart description, etc. */
  content: string;
  /** The query text, for `query` events. */
  sql?: string;
  /** ISO 8601 timestamp, when known. */
  at?: string;
}

/** Counts of signals that the user doubted or corrected the agent. */
export interface TranscriptSignals {
  user_doubt?: number;
  rerun?: number;
  correction?: number;
}

/** One analytics-agent session. */
export interface Transcript {
  session_id: string;
  agent: TranscriptAgent;
  /** ISO 8601 timestamp of the session start. */
  started_at: string;
  events: TranscriptEvent[];
  signals?: TranscriptSignals;
}

/** Longest event text sent to the model; longer content is cut with a note. */
export const MAX_EVENT_CHARS = 4000;

const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Check that a parsed JSON value is a well-formed transcript. Returns the
 * transcript, or an error naming the first problem found.
 */
export function parseTranscript(value: unknown): { transcript: Transcript } | { error: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: 'A transcript must be a JSON object.' };
  }
  const raw = value as Record<string, unknown>;
  if (!isString(raw.session_id) || raw.session_id.trim() === '') {
    return { error: 'Transcript is missing "session_id".' };
  }
  if (!isString(raw.agent) || !(TRANSCRIPT_AGENTS as readonly string[]).includes(raw.agent)) {
    return { error: `Transcript "agent" must be one of: ${TRANSCRIPT_AGENTS.join(', ')}.` };
  }
  if (!isString(raw.started_at)) {
    return { error: 'Transcript is missing "started_at".' };
  }
  if (!Array.isArray(raw.events) || raw.events.length === 0) {
    return { error: 'Transcript needs a non-empty "events" array.' };
  }
  const events: TranscriptEvent[] = [];
  for (const [i, item] of raw.events.entries()) {
    if (typeof item !== 'object' || item === null) return { error: `Event ${i} is not an object.` };
    const event = item as Record<string, unknown>;
    if (!isString(event.role) || !(TRANSCRIPT_ROLES as readonly string[]).includes(event.role)) {
      return { error: `Event ${i}: "role" must be one of: ${TRANSCRIPT_ROLES.join(', ')}.` };
    }
    if (
      !isString(event.type) ||
      !(TRANSCRIPT_EVENT_TYPES as readonly string[]).includes(event.type)
    ) {
      return { error: `Event ${i}: "type" must be one of: ${TRANSCRIPT_EVENT_TYPES.join(', ')}.` };
    }
    if (!isString(event.content)) return { error: `Event ${i} is missing "content".` };
    if (event.sql !== undefined && !isString(event.sql))
      return { error: `Event ${i}: "sql" must be a string.` };
    if (event.at !== undefined && !isString(event.at))
      return { error: `Event ${i}: "at" must be a string.` };
    events.push({
      role: event.role as TranscriptRole,
      type: event.type as TranscriptEventType,
      content: event.content,
      ...(isString(event.sql) ? { sql: event.sql } : {}),
      ...(isString(event.at) ? { at: event.at } : {}),
    });
  }
  let signals: TranscriptSignals | undefined;
  if (raw.signals !== undefined) {
    if (typeof raw.signals !== 'object' || raw.signals === null)
      return { error: '"signals" must be an object.' };
    const s = raw.signals as Record<string, unknown>;
    signals = {};
    for (const key of ['user_doubt', 'rerun', 'correction'] as const) {
      if (s[key] === undefined) continue;
      if (typeof s[key] !== 'number' || !Number.isInteger(s[key]) || (s[key] as number) < 0) {
        return { error: `signals.${key} must be a non-negative integer.` };
      }
      signals[key] = s[key] as number;
    }
  }
  return {
    transcript: {
      session_id: raw.session_id,
      agent: raw.agent as TranscriptAgent,
      started_at: raw.started_at,
      events,
      ...(signals ? { signals } : {}),
    },
  };
}

function clip(text: string): string {
  if (text.length <= MAX_EVENT_CHARS) return text;
  return `${text.slice(0, MAX_EVENT_CHARS)}\n[… ${text.length - MAX_EVENT_CHARS} more characters cut]`;
}

/**
 * Lay a transcript out as text, one numbered block per event. Event numbers
 * are the zero-based positions in `events`, which findings cite as "[event N]".
 */
export function renderTranscript(transcript: Transcript): string {
  const lines = [
    `Session ${transcript.session_id} · agent: ${transcript.agent} · started ${transcript.started_at}`,
  ];
  const s = transcript.signals;
  if (s) {
    lines.push(
      `Signals: user doubt ${s.user_doubt ?? 0}, reruns ${s.rerun ?? 0}, corrections ${s.correction ?? 0}`
    );
  }
  transcript.events.forEach((event, i) => {
    lines.push('', `[event ${i}] ${event.role} · ${event.type}${event.at ? ` · ${event.at}` : ''}`);
    if (event.sql) lines.push('SQL:', clip(event.sql));
    if (event.content) lines.push(clip(event.content));
  });
  return lines.join('\n');
}

/**
 * The event numbers a piece of text cites as "[event N]" (or "events N, M"),
 * in order of first mention, keeping only numbers that exist in a transcript
 * with `eventCount` events.
 */
export function extractEventRefs(text: string, eventCount: number): number[] {
  const refs: number[] = [];
  const add = (n: number) => {
    if (Number.isInteger(n) && n >= 0 && n < eventCount && !refs.includes(n)) refs.push(n);
  };
  for (const match of text.matchAll(/\bevents?\s+((?:\d+(?:\s*(?:,|and|&|-|–|to)\s*)?)+)/gi)) {
    const list = match[1] ?? '';
    const range = list.match(/^(\d+)\s*(?:-|–|to)\s*(\d+)/);
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      for (let n = from; n <= Math.min(to, from + 50); n++) add(n);
      continue;
    }
    for (const n of list.match(/\d+/g) ?? []) add(Number(n));
  }
  return refs;
}
