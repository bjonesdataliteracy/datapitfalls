import { NextResponse } from 'next/server';
import { analyze, imageMediaTypeForExtension } from 'datapitfalls';
import type { AnalyzeInput, AuditReport, ImageMediaType } from 'datapitfalls';

// The engine and the Anthropic SDK need the Node runtime, not the edge runtime.
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 100_000;
const ALLOWED_IMAGE_TYPES: ImageMediaType[] = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Server is missing ANTHROPIC_API_KEY — set it to run audits.' },
      { status: 503 }
    );
  }

  const contentType = req.headers.get('content-type') ?? '';
  const parsed = contentType.includes('application/json')
    ? await parseTextInput(req)
    : await parseImageInput(req);

  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  return runAnalysis(parsed.input);
}

type Parsed = { input: AnalyzeInput } | { error: string; status: number };

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
  if (typeof content !== 'string' || content.trim() === '') {
    return { error: 'Paste something to audit first.', status: 400 };
  }
  if (content.length > MAX_TEXT_CHARS) {
    return { error: `Input is too long (max ${MAX_TEXT_CHARS.toLocaleString()} characters).`, status: 413 };
  }

  return {
    input: {
      kind,
      content,
      language: typeof language === 'string' && language.trim() !== '' ? language.trim() : undefined,
    },
  };
}

async function parseImageInput(req: Request): Promise<Parsed> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { error: 'Expected a multipart form upload.', status: 400 };
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return { error: 'No chart image was uploaded.', status: 400 };
  }

  // Prefer the browser-supplied MIME type (set on paste/drop too); fall back to the
  // filename extension for uploads that arrive without a type.
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  const mediaType =
    (ALLOWED_IMAGE_TYPES as string[]).includes(file.type)
      ? (file.type as ImageMediaType)
      : imageMediaTypeForExtension(ext);
  if (!mediaType) {
    return {
      error: `Unsupported image type "${file.type || ext || file.name}". Use PNG, JPEG, GIF, or WebP.`,
      status: 400,
    };
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength === 0) {
    return { error: 'The uploaded file is empty.', status: 400 };
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return { error: 'Image is too large (max 8 MB).', status: 413 };
  }

  return {
    input: {
      kind: 'image',
      content: Buffer.from(bytes).toString('base64'),
      mediaType,
      filename: file.name || undefined,
    },
  };
}

async function runAnalysis(input: AnalyzeInput): Promise<NextResponse> {
  try {
    const report: AuditReport = await analyze(input);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The audit failed unexpectedly.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
