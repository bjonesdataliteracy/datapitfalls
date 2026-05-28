// datapitfalls — turn an uploaded/loaded file into a DetectionInput.
//
// One decision tree, shared by every consumer (the CLI, and any web app), so a
// new input format is wired up once here rather than re-implemented per surface.
// This is the *mechanism* (what kind of artifact is this, and how is it
// extracted); size caps and rate limiting are *policy* and stay in the caller —
// pass caps via FileInputOptions and the caller maps the error reason to its own
// response (e.g. an HTTP status).

import { imageMediaTypeForExtension } from './analyze.js';
import { extractSlides } from './pptx.js';
import type { ChainStage, ImageMediaType, ImageSource, SingleArtifactInput } from './analyze.js';

/** Raw file bytes plus the little metadata we route on. */
export interface FileInput {
  bytes: Uint8Array;
  /** Original filename (used for extension routing and surfaced to the model). */
  filename: string;
  /** Optional MIME type (e.g. from a browser upload), checked before the extension. */
  mimeType?: string;
}

export type FileInputErrorReason = 'empty' | 'too_large' | 'unsupported' | 'unreadable';

export type FileInputResult =
  | { input: SingleArtifactInput }
  | { error: string; reason: FileInputErrorReason };

export interface FileInputOptions {
  /** Treat a single file as plain prose, skipping code/format detection. */
  forceText?: boolean;
  /** For an unrecognised extension, read the bytes as this kind instead of erroring. */
  fallbackKind?: 'text' | 'code';
  /** Caps; omit any to leave that dimension unbounded. */
  maxImageBytes?: number;
  maxBinaryBytes?: number;
  maxTextChars?: number;
  maxImages?: number;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const TEXT_EXTS = new Set(['.txt', '.text', '.md', '.markdown', '.rst']);

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

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

function labelOf(file: FileInput): string {
  return file.filename || 'file';
}

function megabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function decodeUtf8(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('utf8');
}

function capitalize(value: string): string {
  return value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function imageMediaTypeFor(file: FileInput): ImageMediaType | undefined {
  if (file.mimeType && ALLOWED_IMAGE_TYPES.includes(file.mimeType)) {
    return file.mimeType as ImageMediaType;
  }
  return imageMediaTypeForExtension(extOf(file.filename));
}

/** Read one file as a chart image, or explain why it can't be used as one. */
export function fileToImageSource(
  file: FileInput,
  maxBytes?: number
): { image: ImageSource } | { error: string; reason: FileInputErrorReason } {
  const mediaType = imageMediaTypeFor(file);
  if (!mediaType) {
    return {
      error: `"${labelOf(file)}" isn't a supported image — use PNG, JPEG, GIF, or WebP.`,
      reason: 'unsupported',
    };
  }
  if (file.bytes.byteLength === 0) {
    return { error: `"${labelOf(file)}" is empty.`, reason: 'empty' };
  }
  if (maxBytes !== undefined && file.bytes.byteLength > maxBytes) {
    return { error: `"${labelOf(file)}" is too large (max ${megabytes(maxBytes)} each).`, reason: 'too_large' };
  }
  return { image: { content: toBase64(file.bytes), mediaType, filename: file.filename || undefined } };
}

function makeText(
  kind: 'text' | 'code',
  content: string,
  language: string | undefined,
  filename: string,
  opts: FileInputOptions
): FileInputResult {
  if (content.trim() === '') {
    return { error: 'There was nothing to scan (the input is empty).', reason: 'empty' };
  }
  if (opts.maxTextChars !== undefined && content.length > opts.maxTextChars) {
    return {
      error: `Input is too long (max ${opts.maxTextChars.toLocaleString()} characters).`,
      reason: 'too_large',
    };
  }
  return { input: { kind, content, language, filename: filename || undefined } };
}

function notebookToInput(raw: string, filename: string, opts: FileInputOptions): FileInputResult {
  let nb: {
    cells?: { cell_type?: string; source?: string | string[] }[];
    metadata?: { kernelspec?: { language?: string }; language_info?: { name?: string } };
  };
  try {
    nb = JSON.parse(raw);
  } catch {
    return { error: 'Could not parse that notebook (.ipynb).', reason: 'unreadable' };
  }
  const language = nb.metadata?.kernelspec?.language ?? nb.metadata?.language_info?.name ?? 'Python';
  const code = (nb.cells ?? [])
    .filter((cell) => cell.cell_type === 'code')
    .map((cell) => (Array.isArray(cell.source) ? cell.source.join('') : (cell.source ?? '')))
    .join('\n\n')
    .trim();
  if (code === '') return { error: 'No code cells found in that notebook.', reason: 'empty' };
  return makeText('code', code, capitalize(language), filename, opts);
}

/** Route a single file to the DetectionInput it should become. */
export async function fileToInput(file: FileInput, opts: FileInputOptions = {}): Promise<FileInputResult> {
  const ext = extOf(file.filename);
  const type = file.mimeType ?? '';

  if (!opts.forceText) {
    // Chart image → Vision.
    if (imageMediaTypeFor(file)) {
      const result = fileToImageSource(file, opts.maxImageBytes);
      return 'error' in result ? result : { input: { kind: 'image', images: [result.image] } };
    }

    // PDF → native document (Claude reads the prose and sees the charts/tables).
    if (type === PDF_MIME || ext === '.pdf') {
      if (file.bytes.byteLength === 0) return { error: 'The uploaded PDF is empty.', reason: 'empty' };
      if (opts.maxBinaryBytes !== undefined && file.bytes.byteLength > opts.maxBinaryBytes) {
        return { error: `PDF is too large (max ${megabytes(opts.maxBinaryBytes)}).`, reason: 'too_large' };
      }
      return {
        input: {
          kind: 'document',
          content: toBase64(file.bytes),
          mediaType: 'application/pdf',
          filename: file.filename || undefined,
        },
      };
    }

    // Word document → extract text, scan as prose.
    if (ext === '.docx' || type === DOCX_MIME) {
      if (opts.maxBinaryBytes !== undefined && file.bytes.byteLength > opts.maxBinaryBytes) {
        return { error: `Document is too large (max ${megabytes(opts.maxBinaryBytes)}).`, reason: 'too_large' };
      }
      let value: string;
      try {
        const mammoth = (await import('mammoth')).default;
        ({ value } = await mammoth.extractRawText({ buffer: Buffer.from(file.bytes) }));
      } catch {
        return { error: 'Could not read that Word document.', reason: 'unreadable' };
      }
      return makeText('text', value, undefined, file.filename, opts);
    }

    // PowerPoint deck → per-slide text + chart images.
    if (ext === '.pptx' || type === PPTX_MIME) {
      if (file.bytes.byteLength === 0) return { error: 'The uploaded deck is empty.', reason: 'empty' };
      if (opts.maxBinaryBytes !== undefined && file.bytes.byteLength > opts.maxBinaryBytes) {
        return { error: `Deck is too large (max ${megabytes(opts.maxBinaryBytes)}).`, reason: 'too_large' };
      }
      const result = extractSlides(file.bytes);
      if ('error' in result) return { error: result.error, reason: 'unreadable' };
      if (result.slides.length === 0) return { error: 'No slides found in that deck.', reason: 'unsupported' };
      return { input: { kind: 'slides', slides: result.slides, filename: file.filename || undefined } };
    }

    // Jupyter notebook → its extracted code cells.
    if (ext === '.ipynb') {
      return notebookToInput(decodeUtf8(file.bytes), file.filename, opts);
    }

    // Recognised code file → code.
    if (ext in EXT_LANGUAGE) {
      return makeText('code', decodeUtf8(file.bytes), EXT_LANGUAGE[ext], file.filename, opts);
    }

    // Plain-text document → prose.
    if (TEXT_EXTS.has(ext)) {
      return makeText('text', decodeUtf8(file.bytes), undefined, file.filename, opts);
    }
  }

  // Forced prose, or an unknown extension we read as the caller's active mode.
  if (opts.forceText) {
    return makeText('text', decodeUtf8(file.bytes), undefined, file.filename, opts);
  }
  if (opts.fallbackKind) {
    const language = opts.fallbackKind === 'code' ? EXT_LANGUAGE[ext] : undefined;
    return makeText(opts.fallbackKind, decodeUtf8(file.bytes), language, file.filename, opts);
  }
  return { error: `Unsupported file type "${ext || type || file.filename}".`, reason: 'unsupported' };
}

/** Route one or more files. Several files are only accepted when they are all
 *  chart images, which are then scanned together for cross-chart pitfalls. */
export async function filesToInput(
  files: FileInput[],
  opts: FileInputOptions = {}
): Promise<FileInputResult> {
  if (files.length === 0) return { error: 'No file was provided.', reason: 'unsupported' };

  if (files.length > 1) {
    if (opts.forceText) {
      return {
        error: 'Plain-text mode takes a single file; pass one file, or several chart images.',
        reason: 'unsupported',
      };
    }
    if (opts.maxImages !== undefined && files.length > opts.maxImages) {
      return { error: `Too many images (max ${opts.maxImages}).`, reason: 'too_large' };
    }
    const images: ImageSource[] = [];
    for (const file of files) {
      const result = fileToImageSource(file, opts.maxImageBytes);
      if ('error' in result) return result;
      images.push(result.image);
    }
    return { input: { kind: 'image', images } };
  }

  const first = files[0];
  if (!first) return { error: 'No file was provided.', reason: 'unsupported' };
  return fileToInput(first, opts);
}

function roleFor(input: SingleArtifactInput, filename: string): string {
  const where = filename ? `: ${filename}` : '';
  switch (input.kind) {
    case 'code':
      return `Code${input.language ? ` (${input.language})` : ''}${where}`;
    case 'image':
      return `${input.images.length > 1 ? 'Charts' : 'Chart'}${where}`;
    case 'document':
      return `Document${where}`;
    case 'slides':
      return `Slide deck${where}`;
    case 'text':
      return `Written analysis${where}`;
  }
}

/** Read one file into a chain stage — its artifact plus an auto-derived role label. */
export async function fileToStage(
  file: FileInput,
  opts: FileInputOptions = {}
): Promise<{ stage: ChainStage } | { error: string; reason: FileInputErrorReason }> {
  const result = await fileToInput(file, { fallbackKind: 'code', ...opts });
  if ('error' in result) return result;
  return { stage: { role: roleFor(result.input, file.filename), artifact: result.input } };
}

/** A free-text chain stage (e.g. a pasted written summary or key claim). */
export function textStage(content: string, role = 'Written analysis'): ChainStage {
  return { role, artifact: { kind: 'text', content } };
}
