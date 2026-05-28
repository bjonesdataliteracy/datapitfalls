// datapitfalls — main entry point

/**
 * datapitfalls detects common pitfalls in data work across the entire data
 * reasoning chain. This is the library entry point; the public API will grow
 * as the project moves through the phases described in ROADMAP.md.
 */

export const VERSION = '0.3.0';

export const TAGLINE = 'Helping you steer clear of common blunders when working with data.';

// The pitfall taxonomy: types and queries over the compiled rule catalog.
export * from './taxonomy/index.js';

// The analysis engine and report formatting.
export * from './analyze.js';
export * from './report.js';

// PowerPoint (.pptx) extraction.
export * from './pptx.js';
