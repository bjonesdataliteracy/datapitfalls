// datapitfalls — MCP over stdio
//
// For local clients (Claude Code, Claude Desktop), which start the server as a
// subprocess: `claude mcp add datapitfalls -- npx -y datapitfalls mcp`.
// stdout carries the protocol, so nothing else may write to it.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createDataPitfallsServer } from './server.js';

/** Serve the taxonomy over stdin/stdout until the client disconnects. */
export async function runStdioServer(): Promise<void> {
  const server = createDataPitfallsServer();
  await server.connect(new StdioServerTransport());
}
