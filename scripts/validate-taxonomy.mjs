import { readFileSync, readdirSync } from "node:fs";
import { join, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const taxonomyDir = join(root, "src", "taxonomy");
const schema = JSON.parse(readFileSync(join(taxonomyDir, "schema.json"), "utf8"));

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);

const files = readdirSync(taxonomyDir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
  .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
  .sort();

let failures = 0;
const seenIds = new Map();

for (const file of files) {
  const rel = relative(root, file);
  const problems = [];

  let rule;
  try {
    rule = yaml.load(readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`[FAIL] ${rel}\n    - YAML parse error: ${err.message}`);
    failures++;
    continue;
  }

  if (!validate(rule)) {
    for (const e of validate.errors) {
      const loc = e.instancePath || "(root)";
      problems.push(`${loc} ${e.message}`);
    }
  }

  const expectedId = basename(file).replace(/\.ya?ml$/, "");
  if (rule?.id !== expectedId) {
    problems.push(`id "${rule?.id}" does not match filename "${expectedId}"`);
  }

  if (rule?.id) {
    if (seenIds.has(rule.id)) {
      problems.push(`duplicate id "${rule.id}" (also in ${seenIds.get(rule.id)})`);
    } else {
      seenIds.set(rule.id, rel);
    }
  }

  if (problems.length) {
    failures++;
    console.error(`[FAIL] ${rel}`);
    for (const p of problems) console.error(`    - ${p}`);
  } else {
    console.log(`[ok]   ${rel}`);
  }
}

console.log(`\n${files.length} rule(s) checked, ${failures} invalid.`);
process.exit(failures ? 1 : 0);
