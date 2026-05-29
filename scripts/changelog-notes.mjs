import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Prints the CHANGELOG.md section for a given version, for use as GitHub
// Release notes. Usage: node scripts/changelog-notes.mjs 0.5.0
// The version may be passed with or without a leading "v".

const root = fileURLToPath(new URL("..", import.meta.url));
const changelogPath = join(root, "CHANGELOG.md");

const raw = process.argv[2];
if (!raw) {
  console.error("Usage: node scripts/changelog-notes.mjs <version>");
  process.exit(1);
}
const version = raw.replace(/^v/, "");

const lines = readFileSync(changelogPath, "utf8").split("\n");

// Section headings look like:  ## [0.5.0] - 2026-05-29   (or ## [Unreleased])
const headingFor = (v) =>
  new RegExp(`^##\\s+\\[${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`);

const start = lines.findIndex((line) => headingFor(version).test(line));
if (start === -1) {
  console.error(`No CHANGELOG section found for version ${version}`);
  process.exit(1);
}

// Collect everything until the next "## " heading (or the link-reference
// footer that starts with "[").
const body = [];
for (let i = start + 1; i < lines.length; i++) {
  const line = lines[i];
  if (/^##\s+/.test(line)) break;
  if (/^\[[^\]]+\]:\s+http/.test(line)) break;
  body.push(line);
}

console.log(body.join("\n").trim() + "\n");
