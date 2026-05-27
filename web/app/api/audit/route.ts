import { NextResponse } from 'next/server';
import { analyze, imageMediaTypeForExtension } from 'datapitfalls';
import type { AnalyzeInput, AuditReport, ImageMediaType, ImageSource } from 'datapitfalls';

// The engine and the Anthropic SDK need the Node runtime, not the edge runtime.
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 8;
const MAX_BINARY_BYTES = 16 * 1024 * 1024; // PDF / DOCX
const MAX_TEXT_CHARS = 100_000;
const ALLOWED_IMAGE_TYPES: ImageMediaType[] = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const EXT_LANGUAGE: Record<string, string> = {
  '.py': 'Python',
  '.r': 'R',
  '.sql': 'SQL',
  '.js': 'JavaScript',
  '.mjs': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.java': 'Java',
  '.scala': 'Scala',
  '.go': 'Go',
  '.rb': 'Ruby',
  '.jl': 'Julia',
  '.m': 'MATLAB',
  '.sas': 'SAS',
  '.do': 'Stata',
  '.cpp': 'C++',
  '.c': 'C',
  '.cs': 'C#',
  '.php': 'PHP',
  '.kt': 'Kotlin',
  '.rs': 'Rust',
};
const TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.rst']);

type Parsed = { input: AnalyzeInput } | { error: string; status: number };

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
  const lang = typeof language === 'string' && language.trim() !== '' ? language.trim() : undefined;
  return makeTextInput(kind, typeof content === 'string' ? content : '', lang);
}

/** One or more uploaded files. Several files are only accepted when they are all
 *  chart images, which are then audited together for cross-chart pitfalls. */
async function parseFileInput(req: Request): Promise<Parsed> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { error: 'Expected a multipart form upload.', status: 400 };
  }

  const files = form.getAll('file').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return { error: 'No file was uploaded.', status: 400 };
  }
  if (files.length > 1) {
    return parseMultipleImages(files);
  }

  const modeHint = form.get('mode');
  return parseSingleFile(files[0], typeof modeHint === 'string' ? modeHint : null);
}

/** Several chart images, audited together. All must be images. */
async function parseMultipleImages(files: File[]): Promise<Parsed> {
  if (files.length > MAX_IMAGES) {
    return { error: `Too many images (max ${MAX_IMAGES}).`, status: 413 };
  }
  const images: ImageSource[] = [];
  for (const file of files) {
    const result = await toImageSource(file);
    if ('error' in result) return result;
    images.push(result.image);
  }
  return { input: { kind: 'image', images } };
}

/** Read one file as a chart image, or explain why it isn't usable as one. */
async function toImageSource(
  file: File
): Promise<{ image: ImageSource } | { error: string; status: number }> {
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  const mediaType = (ALLOWED_IMAGE_TYPES as string[]).includes(file.type)
    ? (file.type as ImageMediaType)
    : imageMediaTypeForExtension(ext);
  if (!mediaType) {
    return {
      error: `"${file.name || 'file'}" isn't a supported image — upload PNG, JPEG, GIF, or WebP charts (other file types one at a time).`,
      status: 400,
    };
  }
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength === 0) return { error: `"${file.name || 'file'}" is empty.`, status: 400 };
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return { error: `"${file.name || 'file'}" is too large (max 8 MB each).`, status: 413 };
  }
  return { image: { content: toBase64(bytes), mediaType, filename: file.name || undefined } };
}

/** A single uploaded file of any supported type. */
async function parseSingleFile(file: File, modeHint: string | null): Promise<Parsed> {
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  const type = file.type;

  // Image → Vision.
  if ((ALLOWED_IMAGE_TYPES as string[]).includes(type) || imageMediaTypeForExtension(ext)) {
    const result = await toImageSource(file);
    if ('error' in result) return result;
    return { input: { kind: 'image', images: [result.image] } };
  }

  // PDF → native document (Claude reads the prose and sees the charts/tables).
  if (type === 'application/pdf' || ext === '.pdf') {
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength === 0) return { error: 'The uploaded PDF is empty.', status: 400 };
    if (bytes.byteLength > MAX_BINARY_BYTES) return { error: 'PDF is too large (max 16 MB).', status: 413 };
    return {
      input: {
        kind: 'document',
        content: toBase64(bytes),
        mediaType: 'application/pdf',
        filename: file.name || undefined,
      },
    };
  }

  // Word document → extract text, audit as prose.
  if (ext === '.docx' || type === DOCX_MIME) {
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_BINARY_BYTES) return { error: 'Document is too large (max 16 MB).', status: 413 };
    try {
      const mammoth = (await import('mammoth')).default;
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      return makeTextInput('text', value, undefined, file.name);
    } catch {
      return { error: 'Could not read that Word document.', status: 400 };
    }
  }

  // Jupyter notebook → pull out the code cells.
  if (ext === '.ipynb') {
    try {
      return notebookToCodeInput(await file.text(), file.name);
    } catch {
      return { error: 'Could not parse that notebook (.ipynb).', status: 400 };
    }
  }

  // Recognised code file → code.
  if (ext in EXT_LANGUAGE) {
    return makeTextInput('code', await file.text(), EXT_LANGUAGE[ext], file.name);
  }

  // Plain-text document → prose.
  if (TEXT_EXTS.has(ext)) {
    return makeTextInput('text', await file.text(), undefined, file.name);
  }

  // Unknown extension: fall back to the active mode, reading the bytes as text.
  if (modeHint === 'code' || modeHint === 'text') {
    return makeTextInput(modeHint, await file.text(), undefined, file.name);
  }

  return { error: `Unsupported file type "${ext || type || file.name}".`, status: 400 };
}

function notebookToCodeInput(raw: string, filename: string): Parsed {
  const nb = JSON.parse(raw) as {
    cells?: { cell_type?: string; source?: string | string[] }[];
    metadata?: { kernelspec?: { language?: string }; language_info?: { name?: string } };
  };
  const language = nb.metadata?.kernelspec?.language ?? nb.metadata?.language_info?.name ?? 'Python';
  const code = (nb.cells ?? [])
    .filter((c) => c.cell_type === 'code')
    .map((c) => (Array.isArray(c.source) ? c.source.join('') : (c.source ?? '')))
    .join('\n\n');
  return makeTextInput('code', code, capitalize(language), filename);
}

function makeTextInput(
  kind: 'text' | 'code',
  content: string,
  language: string | undefined,
  filename?: string
): Parsed {
  if (content.trim() === '') {
    return { error: 'There was nothing to audit (the input is empty).', status: 400 };
  }
  if (content.length > MAX_TEXT_CHARS) {
    return { error: `Input is too long (max ${MAX_TEXT_CHARS.toLocaleString()} characters).`, status: 413 };
  }
  return { input: { kind, content, language, filename: filename || undefined } };
}

function toBase64(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString('base64');
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
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
