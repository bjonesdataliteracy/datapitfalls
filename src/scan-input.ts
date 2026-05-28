// datapitfalls — resolve `scan` file arguments into a DetectionInput.
//
// Reads the files off disk, then defers all routing (chart images, PDF, deck,
// docx, notebook, code/prose) to the shared `filesToInput` helper, so the CLI
// and any web app agree on what a given file becomes.

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileToStage, filesToInput } from './file-input.js';
import type { FileInput, FileInputResult } from './file-input.js';
import type { ChainDetectionInput, ChainStage } from './analyze.js';

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

/** Turn several file paths into one whole-analysis chain (each file a stage). */
export async function buildChainInput(
  files: string[]
): Promise<{ input: ChainDetectionInput } | { error: string }> {
  if (files.length < 2) {
    return {
      error: 'A chain scan needs at least two files — e.g. the prep code, a chart, and the written summary.',
    };
  }
  const stages: ChainStage[] = [];
  for (const file of files) {
    let bytes: Buffer;
    try {
      bytes = readFileSync(file);
    } catch {
      return { error: `Could not read file: ${file}` };
    }
    const result = await fileToStage({ bytes, filename: basename(file) });
    if ('error' in result) return { error: result.error };
    stages.push(result.stage);
  }
  return { input: { kind: 'chain', stages } };
}
