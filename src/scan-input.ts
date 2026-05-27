// datapitfalls — resolve `scan` file arguments into an analysis input.
//
// Mirrors the web app's file routing so the CLI and the browser agree on what a
// given file becomes: chart images (one or several, audited together), a PDF
// sent to Claude as a native document, or code/prose read as text.

import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { imageMediaTypeForExtension } from './analyze.js';
import type { AnalyzeInput, ImageSource } from './analyze.js';

const EXT_LANGUAGE: Record<string, string> = {
  '.py': 'Python',
  '.sql': 'SQL',
  '.r': 'R',
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.ipynb': 'Jupyter notebook',
};

// Extensions treated as a plain-English analysis description rather than code.
const TEXT_EXTS = new Set(['.md', '.markdown', '.txt', '.text', '.rst']);

export type ScanInput = { input: AnalyzeInput } | { error: string };

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

/** Turn one or more file paths into an analysis input, or describe what went wrong. */
export function buildScanInput(files: string[], forceText: boolean): ScanInput {
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
