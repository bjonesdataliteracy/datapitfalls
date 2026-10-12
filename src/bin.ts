#!/usr/bin/env node
// datapitfalls — executable entry point
//
// Routes `datapitfalls mcp` straight to the MCP server, before anything else is
// loaded, so the server starts light: the CLI imports the detection engine and
// its SDKs, which the MCP server never needs. Every other command goes to the CLI.

if (process.argv[2] === 'mcp') {
  const { runStdioServer } = await import('./mcp/stdio.js');
  await runStdioServer();
} else {
  await import('./cli.js');
}
