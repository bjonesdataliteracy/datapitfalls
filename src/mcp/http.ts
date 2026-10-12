// datapitfalls — MCP over Streamable HTTP
//
// A Web-standard Request → Response handler, so any host can mount it: a Next.js
// route on Vercel (web/app/api/mcp/route.ts), or anything else with fetch-style
// handlers. It runs stateless — a fresh server and transport per request, no
// session to store — which fits serverless, and the tools are read-only, so
// nothing is lost between requests.
//
// The endpoint is public and needs no auth: it only serves the published
// taxonomy. Rate limiting, if it's ever needed, belongs in the host route in
// front of this handler (see web/app/api/mcp/route.ts).

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createDataPitfallsServer } from './server.js';

/** Handle one MCP Streamable HTTP request (GET, POST or DELETE). */
export async function handleMcpRequest(req: Request): Promise<Response> {
  const server = createDataPitfallsServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    // Plain JSON responses: every tool answers at once, so there's nothing to stream.
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    // The JSON response is fully built by now, so the per-request server can go.
    await server.close();
  }
}
