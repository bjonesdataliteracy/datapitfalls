// Tests for the MCP server: tools, prompt, resources, and the stdio and HTTP
// transports, driven through the MCP SDK's own client.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  CHECKLIST_INPUT_TYPES,
  createDataPitfallsServer,
  handleMcpRequest,
  rulesForChecklist,
  suggestIds,
} from '../dist/mcp/index.js';
import { getAllRules, getRule, rulesForInput } from '../dist/taxonomy/index.js';

const PKG = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const BIN = fileURLToPath(new URL('../dist/bin.js', import.meta.url));
const SITE = 'avoidingdatapitfalls.com';

async function connect() {
  const server = createDataPitfallsServer();
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return client;
}

async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  return { text: result.content.map((c) => c.text).join('\n'), isError: Boolean(result.isError) };
}

test('lists the four read-only tools with descriptions', async () => {
  const client = await connect();
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), [
    'get_checklist',
    'get_pitfall',
    'list_pitfalls',
    'search_pitfalls',
  ]);
  for (const tool of tools) {
    assert.ok(tool.description.length > 40, `${tool.name} needs a real description`);
    assert.equal(tool.annotations.readOnlyHint, true);
  }
  const checklist = tools.find((t) => t.name === 'get_checklist');
  assert.deepEqual(checklist.inputSchema.properties.inputType.enum, [...CHECKLIST_INPUT_TYPES]);
  await client.close();
});

test('list_pitfalls lists every rule, and filters by domain and severity', async () => {
  const client = await connect();
  const all = await call(client, 'list_pitfalls');
  for (const rule of getAllRules()) assert.ok(all.text.includes(`\`${rule.id}\``), rule.id);
  assert.ok(all.text.includes(SITE));

  const gaffes = await call(client, 'list_pitfalls', { domain: 'Graphical Gaffes' });
  assert.ok(gaffes.text.includes('`truncated-y-axis`'));
  assert.ok(!gaffes.text.includes('`silent-null-drop`'));

  const errors = await call(client, 'list_pitfalls', { severity: 'error' });
  for (const rule of getAllRules()) {
    assert.equal(errors.text.includes(`\`${rule.id}\``), rule.severity === 'error', rule.id);
  }
  await client.close();
});

test('get_pitfall returns the full rule with its references', async () => {
  const client = await connect();
  const rule = getRule('truncated-y-axis');
  const { text, isError } = await call(client, 'get_pitfall', { id: rule.id });
  assert.equal(isError, false);
  assert.ok(text.includes(rule.name));
  assert.ok(text.includes('## How to detect it'));
  assert.ok(text.includes('## Remediation'));
  for (const ref of rule.references) assert.ok(text.includes(ref));
  await client.close();
});

test('get_pitfall errors on an unknown id with near-match suggestions', async () => {
  const client = await connect();
  const { text, isError } = await call(client, 'get_pitfall', { id: 'truncated-y-axes' });
  assert.equal(isError, true);
  assert.ok(text.includes('No pitfall has the id'));
  assert.ok(text.includes('`truncated-y-axis`'));
  assert.ok(suggestIds('dual axis').includes('dual-axis-distortion'));
  assert.deepEqual(suggestIds('zzzzzzzzzzzzzzzz'), []);
  await client.close();
});

test('checklists use the engine rule selection', () => {
  const ids = (rules) => rules.map((r) => r.id);
  assert.deepEqual(ids(rulesForChecklist('sql')), ids(rulesForInput('code')));
  assert.deepEqual(ids(rulesForChecklist('chart')), ids(rulesForInput('image')));
  assert.deepEqual(ids(rulesForChecklist('image')), ids(rulesForInput('image')));
  assert.deepEqual(ids(rulesForChecklist('prose')), ids(rulesForInput('text')));
  assert.deepEqual(ids(rulesForChecklist('document')), ids(rulesForInput('document')));
});

test('the dashboard checklist is the de-duplicated union of SQL and chart rules, charts first', () => {
  const dashboard = rulesForChecklist('dashboard').map((r) => r.id);
  const chart = rulesForInput('image').map((r) => r.id);
  const union = new Set([...chart, ...rulesForInput('code').map((r) => r.id)]);
  assert.equal(new Set(dashboard).size, dashboard.length, 'no duplicates');
  assert.deepEqual(new Set(dashboard), union);
  assert.deepEqual(dashboard.slice(0, chart.length), chart);
});

test('get_checklist builds a numbered checklist, and focus narrows it', async () => {
  const client = await connect();
  const chart = await call(client, 'get_checklist', { inputType: 'chart' });
  const chartRules = rulesForInput('image');
  assert.ok(chart.text.includes(`${chartRules.length} rules`));
  assert.ok(chart.text.includes(`${chartRules.length}. **`));
  assert.ok(chart.text.includes('Check for:') && chart.text.includes('Fix:'));
  assert.ok(chart.text.includes(SITE));

  const focused = await call(client, 'get_checklist', {
    inputType: 'sql',
    focus: ['Technical Trespasses'],
  });
  assert.ok(focused.text.includes('## Technical Trespasses'));
  assert.ok(!focused.text.includes('## Graphical Gaffes'));

  const empty = await call(client, 'get_checklist', {
    inputType: 'chart',
    focus: ['Mathematical Miscues'],
  });
  assert.equal(empty.isError, true);
  await client.close();
});

test('search_pitfalls finds rules by keyword and handles empty and no-hit queries', async () => {
  const client = await connect();
  const hit = await call(client, 'search_pitfalls', { query: 'dual axis' });
  assert.ok(hit.text.includes('`dual-axis-distortion`'));
  const none = await call(client, 'search_pitfalls', { query: 'xylophone' });
  assert.equal(none.isError, false);
  assert.ok(none.text.includes('No pitfalls matched'));
  const blank = await call(client, 'search_pitfalls', { query: '   ' });
  assert.equal(blank.isError, true);
  await client.close();
});

test('review_for_pitfalls prompt carries the review method and the work', async () => {
  const client = await connect();
  const { prompts } = await client.listPrompts();
  assert.deepEqual(
    prompts.map((p) => p.name),
    ['review_for_pitfalls']
  );
  const result = await client.getPrompt({
    name: 'review_for_pitfalls',
    arguments: { inputType: 'sql', artifact: 'SELECT AVG(rate) FROM regions' },
  });
  const text = result.messages[0].content.text;
  assert.ok(text.includes('get_checklist with inputType "sql"'));
  for (const word of ['active', 'latent', 'changes-takeaway', 'Avoided', SITE]) {
    assert.ok(text.includes(word), word);
  }
  assert.ok(text.includes('SELECT AVG(rate) FROM regions'));
  await client.close();
});

test('resources serve each rule and the domain overview', async () => {
  const client = await connect();
  const { resources } = await client.listResources();
  const uris = resources.map((r) => r.uri);
  assert.ok(uris.includes('datapitfalls://domains'));
  assert.ok(uris.includes('datapitfalls://rules/truncated-y-axis'));
  assert.equal(
    uris.filter((u) => u.startsWith('datapitfalls://rules/')).length,
    getAllRules().length
  );

  const rule = await client.readResource({ uri: 'datapitfalls://rules/truncated-y-axis' });
  assert.ok(rule.contents[0].text.includes('Truncated'));
  const domains = await client.readResource({ uri: 'datapitfalls://domains' });
  assert.ok(domains.contents[0].text.includes('Graphical Gaffes'));
  await client.close();
});

test('the MCP entry point loads neither the engine nor its SDKs', () => {
  // Walk the static and dynamic imports reachable from dist/mcp/index.js.
  const seen = new Set();
  const external = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    const imports =
      /^\s*(?:import|export)\b[^'";]*?from\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm;
    for (const [, staticSpec, dynamicSpec] of source.matchAll(imports)) {
      const spec = staticSpec ?? dynamicSpec;
      if (spec.startsWith('.')) visit(fileURLToPath(new URL(spec, pathToFileURL(file))));
      else external.add(spec);
    }
  };
  visit(fileURLToPath(new URL('../dist/mcp/index.js', import.meta.url)));
  const local = [...seen].map((f) => f.replace(/\\/g, '/'));
  assert.ok(
    local.some((f) => f.endsWith('/dist/taxonomy/index.js')),
    'sanity: taxonomy is reached'
  );
  for (const file of [
    '/dist/index.js',
    '/dist/analyze.js',
    '/dist/file-input.js',
    '/dist/pptx.js',
  ]) {
    assert.ok(!local.some((f) => f.endsWith(file)), `${file} must not load on the MCP path`);
  }
  assert.ok(external.has('zod'), 'sanity: package imports are seen');
  for (const pkg of external) {
    assert.ok(
      pkg.startsWith('node:') || pkg.startsWith('@modelcontextprotocol/sdk') || pkg === 'zod',
      `unexpected dependency on the MCP path: ${pkg}`
    );
  }
});

test('stdio round trip: `datapitfalls mcp` serves tools to the SDK client', async () => {
  const client = new Client({ name: 'stdio-test', version: '0.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [BIN, 'mcp'],
    env: { PATH: process.env.PATH ?? '' },
    stderr: 'pipe',
  });
  await client.connect(transport);
  assert.equal(client.getServerVersion().name, 'datapitfalls');
  assert.equal(client.getServerVersion().version, PKG.version);
  assert.match(client.getInstructions(), /get_checklist/);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 4);
  const { text } = await call(client, 'get_pitfall', { id: 'silent-null-drop' });
  assert.ok(text.includes(getRule('silent-null-drop').name));
  await client.close();
});

test('HTTP round trip: handleMcpRequest serves the SDK client statelessly', async () => {
  const fetchViaHandler = (url, init) => handleMcpRequest(new Request(url, init));
  const client = new Client({ name: 'http-test', version: '0.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL('http://localhost/api/mcp'), {
    fetch: fetchViaHandler,
  });
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 4);
  const { text } = await call(client, 'get_checklist', { inputType: 'dashboard' });
  assert.ok(text.includes(`${rulesForChecklist('dashboard').length} rules`));
  await client.close();
});
