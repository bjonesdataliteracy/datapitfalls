// datapitfalls — main entry point

/**
 * datapitfalls audits data work for common pitfalls across the entire data
 * reasoning chain. This is the library entry point; the public API will grow
 * as the project moves through the phases described in ROADMAP.md.
 */

export const VERSION = '0.1.0';

export const TAGLINE = 'Helping you steer clear of common blunders when working with data.';

// The pitfall taxonomy: types and queries over the compiled rule catalog.
export * from './taxonomy/index.js';
