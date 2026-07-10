// datapitfalls — main entry point

/**
 * datapitfalls detects common pitfalls in data work across the entire data
 * reasoning chain. This is the library entry point and the supported public
 * API — see docs/API.md for the stable surface and the API-stability policy.
 */

import { createRequire } from 'node:module';

// Read the version from package.json at runtime so it can never drift from the
// published package. A static `import` would break `rootDir: src`, so we use a
// runtime require, which also resolves correctly from dist/ in the npm tarball
// (dist/index.js → ../package.json).
const pkg = createRequire(import.meta.url)('../package.json') as { version: string };

/** The installed datapitfalls version (read from package.json). */
export const VERSION: string = pkg.version;

export const TAGLINE = 'Helping you steer clear of common blunders when working with data.';

// The pitfall taxonomy: types and queries over the compiled rule catalog.
export * from './taxonomy/index.js';

// The analysis engine and report formatting.
export * from './analyze.js';
export * from './report.js';

// PowerPoint (.pptx) extraction.
export * from './pptx.js';

// Shared file routing: turn an uploaded/loaded file into a DetectionInput.
export * from './file-input.js';

// Bridges to other tools. Dependency-free, off the engine's hot path.
export * from './bridges/semiotic.js';
