import { NextResponse } from 'next/server';
import { detectPitfalls, fileToStage, filesToInput, textStage, reportTier, TIER_LABEL } from 'datapitfalls';
import type { ChainStage, DetectionInput, FileInput, PitfallReport } from 'datapitfalls';
import { checkRateLimit, clientKey } from './rate-limit';

// The engine and the Anthropic SDK need the Node runtime, not the edge runtime.
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_BINARY_BYTES = 16 * 1024 * 1024; // PDF / DOCX / PPTX
const MAX_TEXT_CHARS = 100_000;
const MAX_IMAGES = 8;
const MAX_CHAIN_FILES = 10;

type Parsed = { input: DetectionInput } | { error: string; status: number };

export async function POST(req: Request): Promise<NextResponse> {
  const rate = checkRateLimit(clientKey(req));
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Too many requests — please wait ${rate.retryAfterSeconds}s and try again.` },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Server is missing ANTHROPIC_API_KEY — set it to run scans.' },
      { status: 503 }
    );
  }

  const contentType = req.headers.get('content-type') ?? '';
  const parsed = contentType.includes('application/json')
    ? await parseTextInput(req)
    : await parseFileInput(req);

  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  return runAnalysis(parsed.input);
}

/** Pasted prose or code (JSON body). */
async function parseTextInput(req: Request): Promise<Parsed> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: 'Invalid JSON body.', status: 400 };
  }

  const { kind, content, language } = (body ?? {}) as {
    kind?: unknown;
    content?: unknown;
    language?: unknown;
  };

  if (kind !== 'text' && kind !== 'code') {
    return { error: 'Field "kind" must be "text" or "code".', status: 400 };
  }
  const text = typeof content === 'string' ? content : '';
  if (text.trim() === '') {
    return { error: 'There was nothing to scan (the input is empty).', status: 400 };
  }
  if (text.length > MAX_TEXT_CHARS) {
    return { error: `Input is too long (max ${MAX_TEXT_CHARS.toLocaleString()} characters).`, status: 413 };
  }
  const lang = typeof language === 'string' && language.trim() !== '' ? language.trim() : undefined;
  return { input: { kind, content: text, language: lang } };
}

/** One or more uploaded files, routed by the shared engine helper. */
async function parseFileInput(req: Request): Promise<Parsed> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { error: 'Expected a multipart form upload.', status: 400 };
  }

  const files = form.getAll('file').filter((f): f is File => f instanceof File);
  const modeHint = form.get('mode');

  if (modeHint === 'chain') {
    return parseChainInput(form, files);
  }
  if (files.length === 0) {
    return { error: 'No file was uploaded.', status: 400 };
  }

  const fallbackKind = modeHint === 'code' || modeHint === 'text' ? modeHint : undefined;

  const inputs: FileInput[] = [];
  for (const file of files) {
    inputs.push({
      bytes: new Uint8Array(await file.arrayBuffer()),
      filename: file.name,
      mimeType: file.type,
    });
  }

  const result = await filesToInput(inputs, {
    maxImageBytes: MAX_IMAGE_BYTES,
    maxBinaryBytes: MAX_BINARY_BYTES,
    maxTextChars: MAX_TEXT_CHARS,
    maxImages: MAX_IMAGES,
    fallbackKind,
  });
  if ('error' in result) {
    return { error: result.error, status: result.reason === 'too_large' ? 413 : 400 };
  }
  return result;
}

/** A whole-analysis chain: several uploaded files (each a stage) plus an optional
 *  pasted written summary, scanned together for cross-stage pitfalls. */
async function parseChainInput(form: FormData, files: File[]): Promise<Parsed> {
  if (files.length > MAX_CHAIN_FILES) {
    return { error: `Too many files (max ${MAX_CHAIN_FILES}).`, status: 413 };
  }
  const stages: ChainStage[] = [];
  for (const file of files) {
    const result = await fileToStage(
      { bytes: new Uint8Array(await file.arrayBuffer()), filename: file.name, mimeType: file.type },
      { maxImageBytes: MAX_IMAGE_BYTES, maxBinaryBytes: MAX_BINARY_BYTES, maxTextChars: MAX_TEXT_CHARS }
    );
    if ('error' in result) {
      return { error: result.error, status: result.reason === 'too_large' ? 413 : 400 };
    }
    stages.push(result.stage);
  }

  const narrative = form.get('narrative');
  if (typeof narrative === 'string' && narrative.trim() !== '') {
    if (narrative.length > MAX_TEXT_CHARS) {
      return { error: `Written summary is too long (max ${MAX_TEXT_CHARS.toLocaleString()} characters).`, status: 413 };
    }
    stages.push(textStage(narrative, 'Written summary'));
  }

  if (stages.length < 2) {
    return {
      error: 'A full-analysis scan needs at least two pieces — e.g. your prep code, a chart, and a written summary.',
      status: 400,
    };
  }
  return { input: { kind: 'chain', stages } };
}

async function runAnalysis(input: DetectionInput): Promise<NextResponse> {
  try {
    // The web app uses the summary presentation: an overall summary line,
    // per-finding consequence ratings, and visibly-avoided pitfalls.
    const report: PitfallReport = await detectPitfalls(input, { variant: 'summary' });
    // The tier is computed server-side (the engine's entry point needs Node),
    // so the client renders it without bundling engine code.
    const tier = reportTier(report);
    return NextResponse.json({ ...report, tier, tierLabel: TIER_LABEL[tier] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The scan failed unexpectedly.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
