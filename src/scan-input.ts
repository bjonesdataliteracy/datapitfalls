// datapitfalls — resolve `scan` file arguments into an analysis input.
//
// Mirrors the web app's file routing so the CLI and the browser agree on what a
// given file becomes: chart images (one or several, audited together), a PDF
// sent to Claude as a native document, or code/prose read as text.

import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { imageMediaTypeForExtension } from './analyze.js';
import { extractSlides } from './pptx.js';
import type { DetectionInput, ImageSource } from './analyze.js';

const EXT_LANGUAGE: Record<string, string> = {
  '.py': 'Python',
  '.sql': 'SQL',
  '.r': 'R',
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
};

// Extensions treated as a plain-English analysis description rather than code.
const TEXT_EXTS = new Set(['.md', '.markdown', '.txt', '.text', '.rst']);

export type ScanInput = { input: DetectionInput } | { error: string };

function readImageSource(file: string): { image: ImageSource } | { error: string } {
  const mediaType = imageMediaTypeForExtension(extname(file).toLowerCase());
  if (!mediaType) {
    return { error: `Not a supported image: ${file} (use PNG, JPEG, GIF, or WebP).` };
  }
  try {
    return {
      image: { content: readFileSync(file).toString('base64'), mediaType, filename: basename(file) },
    };
  } catch {
    return { error: `Could not read file: ${file}` };
  }
}

function capitalize(value: string): string {
  return value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** A Jupyter notebook → its code cells, joined into one script. */
function notebookToInput(file: string): ScanInput {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    return { error: `Could not read file: ${file}` };
  }
  let nb: {
    cells?: { cell_type?: string; source?: string | string[] }[];
    metadata?: { kernelspec?: { language?: string }; language_info?: { name?: string } };
  };
  try {
    nb = JSON.parse(raw);
  } catch {
    return { error: `Could not parse that notebook (.ipynb): ${file}` };
  }
  const language = nb.metadata?.kernelspec?.language ?? nb.metadata?.language_info?.name ?? 'Python';
  const code = (nb.cells ?? [])
    .filter((cell) => cell.cell_type === 'code')
    .map((cell) => (Array.isArray(cell.source) ? cell.source.join('') : (cell.source ?? '')))
    .join('\n\n')
    .trim();
  if (code === '') return { error: `No code cells found in ${file}.` };
  return { input: { kind: 'code', content: code, language: capitalize(language), filename: basename(file) } };
}

/** A Word document → its text, audited as prose. */
async function docxToInput(file: string): Promise<ScanInput> {
  let buffer: Buffer;
  try {
    buffer = readFileSync(file);
  } catch {
    return { error: `Could not read file: ${file}` };
  }
  try {
    const mammoth = (await import('mammoth')).default;
    const { value } = await mammoth.extractRawText({ buffer });
    if (value.trim() === '') return { error: `No readable text found in ${file}.` };
    return { input: { kind: 'text', content: value, filename: basename(file) } };
  } catch {
    return { error: `Could not read that Word document: ${file}` };
  }
}

/** A PowerPoint deck → its slides (text + chart images). */
function pptxToInput(file: string): ScanInput {
  let buffer: Buffer;
  try {
    buffer = readFileSync(file);
  } catch {
    return { error: `Could not read file: ${file}` };
  }
  const result = extractSlides(buffer);
  if ('error' in result) return result;
  if (result.slides.length === 0) return { error: `No slides found in ${file}.` };
  return { input: { kind: 'slides', slides: result.slides, filename: basename(file) } };
}

/** Turn one or more file paths into an analysis input, or describe what went wrong. */
export async function buildScanInput(files: string[], forceText: boolean): Promise<ScanInput> {
  // Several files: audit them together as a set of chart images.
  if (files.length > 1) {
    if (forceText) {
      return {
        error: '--text audits a single description; pass one file, or several chart images without --text.',
      };
    }
    const images: ImageSource[] = [];
    for (const file of files) {
      const result = readImageSource(file);
      if ('error' in result) return result;
      images.push(result.image);
    }
    return { input: { kind: 'image', images } };
  }

  const file = files[0];
  if (file === undefined) return { error: 'No file given.' };
  const ext = extname(file).toLowerCase();

  if (!forceText) {
    // Chart image → Vision.
    if (imageMediaTypeForExtension(ext)) {
      const result = readImageSource(file);
      return 'error' in result ? result : { input: { kind: 'image', images: [result.image] } };
    }
    // PDF → native document (Claude reads the prose and sees the charts/tables).
    if (ext === '.pdf') {
      try {
        return {
          input: {
            kind: 'document',
            content: readFileSync(file).toString('base64'),
            mediaType: 'application/pdf',
            filename: basename(file),
          },
        };
      } catch {
        return { error: `Could not read file: ${file}` };
      }
    }
    // Word document → extract text, audit as prose.
    if (ext === '.docx') return docxToInput(file);
    // PowerPoint deck → per-slide text + chart images.
    if (ext === '.pptx') return pptxToInput(file);
    // Jupyter notebook → audit its extracted code cells.
    if (ext === '.ipynb') return notebookToInput(file);
  }

  // Code or plain-English text.
  let content: string;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return { error: `Could not read file: ${file}` };
  }
  const kind = forceText || TEXT_EXTS.has(ext) ? 'text' : 'code';
  const language = kind === 'code' ? EXT_LANGUAGE[ext] : undefined;
  return { input: { kind, content, language, filename: basename(file) } };
}
