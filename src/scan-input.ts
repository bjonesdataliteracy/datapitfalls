// datapitfalls — resolve `scan` file arguments into a DetectionInput.
//
// Reads the files off disk, then defers all routing (chart images, PDF, deck,
// docx, notebook, code/prose) to the shared `filesToInput` helper, so the CLI
// and any web app agree on what a given file becomes.

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { filesToInput } from './file-input.js';
import type { FileInput, FileInputResult } from './file-input.js';

export type ScanInput = FileInputResult;

/** Turn one or more file paths into a DetectionInput, or describe what went wrong. */
export async function buildScanInput(files: string[], forceText: boolean): Promise<ScanInput> {
  const inputs: FileInput[] = [];
  for (const file of files) {
    try {
      inputs.push({ bytes: readFileSync(file), filename: basename(file) });
    } catch {
      return { error: `Could not read file: ${file}`, reason: 'unreadable' };
    }
  }
  // An unrecognised extension is read as code on the CLI (matching prior behaviour).
  return filesToInput(inputs, { forceText, fallbackKind: 'code' });
}
