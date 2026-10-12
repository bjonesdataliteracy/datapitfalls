// datapitfalls/mcp — the MCP server entry point
//
// A separate export from the main package so that loading the MCP server never
// loads the detection engine or its SDKs. See docs/API.md.

export { createDataPitfallsServer, reviewPrompt, SERVER_NAME } from './server.js';
export { handleMcpRequest } from './http.js';
export { runStdioServer } from './stdio.js';
export {
  BOOK_CITATION,
  CHECKLIST_INPUT_TYPES,
  SITE_URL,
  buildChecklist,
  rulesForChecklist,
  searchRules,
  suggestIds,
  type ChecklistInputType,
} from './catalog.js';
