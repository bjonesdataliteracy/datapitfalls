import { handleMcpRequest } from 'datapitfalls/mcp';

// The datapitfalls MCP server over Streamable HTTP, for use as a claude.ai
// custom connector at https://<this site>/api/mcp. It serves only the pitfall
// taxonomy: read-only, no Anthropic API calls, no key, no auth. The engine
// handler (handleMcpRequest) is stateless, so each request stands alone.
//
// Rate limiting: none for now, since a request only reads the bundled taxonomy
// and costs no API spend. If it's ever needed, check it here before handing the
// request on, e.g. with the sliding-window limiter the audit route uses:
//   const rate = checkRateLimit(clientKey(req));   // ../audit/rate-limit
//   if (!rate.ok) return new Response('Too many requests', { status: 429 });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(req: Request): Promise<Response> {
  return handleMcpRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
