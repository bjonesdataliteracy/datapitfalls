// Tests for .pptx extraction. Builds a tiny synthetic deck in memory, so it runs
// fully offline with no API key or network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { extractSlides } from '../dist/index.js';

function slideXml(text) {
  return (
    '<?xml version="1.0"?><p:sld xmlns:a="http://x"><p:cSld><p:spTree>' +
    `<a:p><a:r><a:t>${text}</a:t></a:r></a:p>` +
    '</p:spTree></p:cSld></p:sld>'
  );
}

function imageRels() {
  return (
    '<?xml version="1.0"?><Relationships xmlns="http://x">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>' +
    '</Relationships>'
  );
}

function buildPptx() {
  return zipSync({
    'ppt/slides/slide1.xml': strToU8(slideXml('Revenue doubled this quarter')),
    'ppt/slides/slide2.xml': strToU8(slideXml('See chart below')),
    'ppt/slides/_rels/slide2.xml.rels': strToU8(imageRels()),
    'ppt/media/image1.png': new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]),
  });
}

test('extractSlides pulls per-slide text in order', () => {
  const result = extractSlides(buildPptx());
  assert.ok(!('error' in result), 'should not error');
  assert.equal(result.slides.length, 2);
  assert.match(result.slides[0].text, /Revenue doubled this quarter/);
  assert.match(result.slides[1].text, /See chart below/);
});

test('extractSlides attaches a slide image from its rels', () => {
  const { slides } = extractSlides(buildPptx());
  assert.equal(slides[0].images.length, 0);
  assert.equal(slides[1].images.length, 1);
  assert.equal(slides[1].images[0].mediaType, 'image/png');
  assert.ok(slides[1].images[0].content.length > 0);
});

test('extractSlides errors on data that is not a .pptx', () => {
  const result = extractSlides(strToU8('definitely not a zip archive'));
  assert.ok('error' in result);
});

test('extractSlides errors on a zip with no slides', () => {
  const result = extractSlides(zipSync({ 'docProps/app.xml': strToU8('<x/>') }));
  assert.ok('error' in result);
});
