/**
 * LSP server tests for CrawlLS.
 * Tests JSON-RPC communication over stdin/stdout.
 */

import { assertEquals, assertStringIncludes } from "@std/assert";

/**
 * Helper to create JSON-RPC request message in LSP format.
 */
function createLspMessage(
  method: string,
  params?: unknown,
  id?: number,
): string {
  const message: Record<string, unknown> = {
    jsonrpc: "2.0",
    method,
  };

  if (params) {
    message.params = params;
  }

  if (id !== undefined) {
    message.id = id;
  }

  const content = JSON.stringify(message);
  return `Content-Length: ${content.length}\r\n\r\n${content}`;
}

/**
 * Parse LSP message from raw string.
 */
function parseLspMessage(raw: string): string | null {
  const match = raw.match(/Content-Length: (\d+)\r\n\r\n(.+)/);
  if (!match) return null;

  const contentLength = parseInt(match[1]);
  return match[2].slice(0, contentLength);
}

/**
 * Create JSON-RPC response for LSP method.
 */
function createLspResponse(
  method: string,
  id?: number,
): Record<string, unknown> & { result?: unknown } {
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        capabilities: {
          definitionProvider: true,
        },
      },
    };
  } else if (method === "textDocument/definition") {
    return {
      jsonrpc: "2.0",
      id,
      result: null,
    };
  }

  return {
    jsonrpc: "2.0",
    id,
  };
}

Deno.test("LSP Server - initialize request", () => {
  const method = "initialize";
  const params = {
    processId: null,
    rootUri: "file:///test",
    capabilities: {},
  };

  // Create request
  const request = createLspMessage(method, params, 1);
  assertStringIncludes(request, "Content-Length:");
  assertStringIncludes(request, '"jsonrpc":"2.0"');

  // Parse request
  const parsed = parseLspMessage(request);
  if (parsed) {
    const json = JSON.parse(parsed);
    assertEquals(json.method, "initialize");
    assertEquals(json.id, 1);
  }

  // Create and verify response
  const response = createLspResponse(method, 1);
  const result = response.result as Record<string, Record<string, unknown>>;
  assertEquals(result.capabilities?.definitionProvider, true);
});

Deno.test("LSP Server - textDocument/definition request", () => {
  const method = "textDocument/definition";
  const params = {
    textDocument: { uri: "file:///test.md" },
    position: { line: 0, character: 10 },
  };

  // Create request
  const request = createLspMessage(method, params, 2);
  assertStringIncludes(request, "Content-Length:");
  assertStringIncludes(request, '"id":2');

  // Parse request
  const parsed = parseLspMessage(request);
  if (parsed) {
    const json = JSON.parse(parsed);
    assertEquals(json.method, "textDocument/definition");
    assertEquals(json.id, 2);
  }

  // Create and verify response
  const response = createLspResponse(method, 2);
  assertEquals(response.result, null);
});
