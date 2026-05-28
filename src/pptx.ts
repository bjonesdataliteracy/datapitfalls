// datapitfalls — PowerPoint (.pptx) extraction
//
// A .pptx is a zip of XML + media. We pull each slide's text (the <a:t> runs) and
// the chart/screenshot images it references, so a deck can be reviewed as slide
// content — both the written claims and the charts. Note: native (vector)
// PowerPoint charts aren't rendered to images here; pasted or exported chart
// images are.

import { unzipSync, strFromU8 } from 'fflate';
import { imageMediaTypeForExtension } from './analyze.js';
import type { ImageSource, SlideContent } from './analyze.js';

const SLIDE_RE = /^ppt\/slides\/slide(\d+)\.xml$/;
const MAX_IMAGES_PER_SLIDE = 8;
const MAX_IMAGES_TOTAL = 24;

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Pull visible text from a slide's XML: the <a:t> runs, one line per paragraph. */
function slideText(xml: string): string {
  const lines: string[] = [];
  for (const para of xml.split(/<a:p[ >]/).slice(1)) {
    const runs = [...para.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeEntities(m[1] ?? ''));
    const line = runs.join('').replace(/\s+/g, ' ').trim();
    if (line) lines.push(line);
  }
  return lines.join('\n');
}

/** Resolve a slide rels Target (e.g. "../media/image1.png") to a zip path. */
function resolveMediaPath(target: string): string {
  const clean = target.replace(/^(\.\.\/)+/, '');
  return clean.startsWith('ppt/') ? clean : `ppt/${clean}`;
}

/** Image relationship targets from a slide's .rels XML, in document order. */
function imageTargets(relsXml: string): string[] {
  const targets: string[] = [];
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)) {
    const tag = m[0];
    if (!tag || !/Type="[^"]*\/image"/.test(tag)) continue;
    const target = tag.match(/Target="([^"]+)"/);
    if (target?.[1]) targets.push(target[1]);
  }
  return targets;
}

export interface ExtractedSlides {
  slides: SlideContent[];
}

/** Extract per-slide text and chart images from a .pptx file's bytes. */
export function extractSlides(data: Uint8Array): ExtractedSlides | { error: string } {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data);
  } catch {
    return { error: 'Could not read that .pptx file (not a valid PowerPoint archive).' };
  }

  const slideNums = Object.keys(files)
    .map((name) => SLIDE_RE.exec(name))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);

  if (slideNums.length === 0) return { error: 'No slides found in that .pptx file.' };

  let totalImages = 0;
  const slides: SlideContent[] = [];
  for (const n of slideNums) {
    const raw = files[`ppt/slides/slide${n}.xml`];
    if (!raw) continue;
    const text = slideText(strFromU8(raw));

    const images: ImageSource[] = [];
    const rels = files[`ppt/slides/_rels/slide${n}.xml.rels`];
    if (rels) {
      const seen = new Set<string>();
      for (const target of imageTargets(strFromU8(rels))) {
        if (images.length >= MAX_IMAGES_PER_SLIDE || totalImages >= MAX_IMAGES_TOTAL) break;
        const path = resolveMediaPath(target);
        if (seen.has(path)) continue;
        seen.add(path);
        const bytes = files[path];
        if (!bytes) continue;
        const dot = path.lastIndexOf('.');
        const mediaType = imageMediaTypeForExtension(dot >= 0 ? path.slice(dot) : '');
        if (!mediaType) continue; // skip EMF/WMF/SVG and other non-Vision formats
        images.push({ content: Buffer.from(bytes).toString('base64'), mediaType });
        totalImages += 1;
      }
    }
    slides.push({ text, images });
  }

  return { slides };
}
