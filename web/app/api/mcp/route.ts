import { handleMcpRequest } from 'datapitfalls/mcp';
import { clientKey, createRateLimiter } from '../audit/rate-limit';

// The datapitfalls MCP server over Streamable HTTP, for use as a claude.ai
// custom connector at https://<this site>/api/mcp. It serves only the pitfall
// taxonomy: read-only, no Anthropic API calls, no key, no auth. The engine
// handler (handleMcpRequest) is stateless, so each request stands alone.
//
// Rate limiting: a request costs no API spend, so the limit is loose and only
// there to blunt floods. It must stay loose because claude.ai connector traffic
// for many users arrives from a small pool of Anthropic IPs, and one review
// makes several tool calls. Per instance, like the audit limiter.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const checkRateLimit = createRateLimiter({
  windowSeconds: Number(process.env.MCP_RATE_LIMIT_WINDOW_SECONDS) || 60,
  max: Number(process.env.MCP_RATE_LIMIT_MAX) || 300,
});

async function handle(req: Request): Promise<Response> {
  const rate = checkRateLimit(clientKey(req));
  if (!rate.ok) {
    // A JSON-RPC error body, so MCP clients surface a readable message.
    return Response.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: `Too many requests. Please wait ${rate.retryAfterSeconds}s and try again.`,
        },
        id: null,
      },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }
  return handleMcpRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
