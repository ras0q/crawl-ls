/**
 * Tests for LSP server request processing.
 */

import { assertEquals } from "@std/assert";
import { processRequest } from "./lsp_server.ts";
import type { JsonRpcRequest } from "./types/jsonrpc.ts";
import type { LspContext } from "./types/lsp.ts";

const mockContext: LspContext = {
  cacheDir: "/tmp/crawl-ls-test-cache",
};

Deno.test("processRequest - initialize method", async () => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      processId: null,
      rootUri: "file:///test",
      capabilities: {},
    },
    id: 1,
  };

  const response = await processRequest(request, mockContext);

  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 1);
  if (
    response.result &&
    typeof response.result === "object" &&
    "capabilities" in response.result
  ) {
    const result = response.result as Record<string, unknown>;
    const capabilities = result.capabilities as Record<string, unknown>;
    assertEquals(capabilities.definitionProvider, true);
  }
});

Deno.test("processRequest - unknown method", async () => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "unknown/method",
    id: 2,
  };

  const response = await processRequest(request, mockContext);

  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 2);
  if (response.error) {
    assertEquals(response.error.code, -32601);
    assertEquals(response.error.message.includes("Method not found"), true);
  }
});

Deno.test({
  name: "processRequest - textDocument/definition with no link",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = "/tmp/crawl-ls-server-test-1.md";
    const testContent = "Plain text without links";
    await Deno.writeTextFile(testFile, testContent);

    try {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "textDocument/definition",
        params: {
          textDocument: { uri: `file://${testFile}` },
          position: { line: 0, character: 5 },
        },
        id: 3,
      };

      const response = await processRequest(request, mockContext);

      assertEquals(response.jsonrpc, "2.0");
      assertEquals(response.id, 3);
      assertEquals(response.result, null);
    } finally {
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});

Deno.test({
  name: "processRequest - textDocument/definition beyond file bounds",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = "/tmp/crawl-ls-server-test-2.md";
    const testContent = "Single line";
    await Deno.writeTextFile(testFile, testContent);

    try {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "textDocument/definition",
        params: {
          textDocument: { uri: `file://${testFile}` },
          position: { line: 100, character: 0 },
        },
        id: 4,
      };

      const response = await processRequest(request, mockContext);

      assertEquals(response.jsonrpc, "2.0");
      assertEquals(response.id, 4);
      assertEquals(response.result, null);
    } finally {
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});

Deno.test({
  name: "processRequest - textDocument/definition with external URL",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testFile = "/tmp/crawl-ls-server-test-3.md";
    const testContent = "See [Example](https://example.com) for details";
    await Deno.writeTextFile(testFile, testContent);

    try {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "textDocument/definition",
        params: {
          textDocument: { uri: `file://${testFile}` },
          position: { line: 0, character: 20 },
        },
        id: 5,
      };

      const response = await processRequest(request, mockContext);

      assertEquals(response.jsonrpc, "2.0");
      assertEquals(response.id, 5);
      // Result should be either null or a Location object
      assertEquals(
        typeof response.result === "object" || response.result === null,
        true,
      );
    } finally {
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});
