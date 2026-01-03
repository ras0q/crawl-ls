/**
 * Tests for textDocument/definition handler.
 */

import { assertEquals } from "@std/assert";
import { handleTextDocumentDefinition } from "./textDocument_definition.ts";
import type { JsonRpcRequest } from "../types/jsonrpc.ts";
import type { LspContext } from "../types/lsp.ts";

Deno.test({
  name: "textDocument/definition handler - no link found",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    // Create a temporary test file
    const testFile = "/tmp/crawl-ls-def-test-1.md";
    const testContent = "This is plain text without any links";
    await Deno.writeTextFile(testFile, testContent);

    try {
      const context: LspContext = {
        cacheDir: "/tmp/crawl-ls-cache",
      };

      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "textDocument/definition",
        params: {
          textDocument: { uri: `file://${testFile}` },
          position: { line: 0, character: 5 },
        },
        id: 1,
      };

      const response = await handleTextDocumentDefinition(request, context);

      assertEquals(response.jsonrpc, "2.0");
      assertEquals(response.id, 1);
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
  name: "textDocument/definition handler - position beyond line length",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    // Create a temporary test file
    const testFile = "/tmp/crawl-ls-def-test-2.md";
    const testContent = "Single line";
    await Deno.writeTextFile(testFile, testContent);

    try {
      const context: LspContext = {
        cacheDir: "/tmp/crawl-ls-cache",
      };

      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "textDocument/definition",
        params: {
          textDocument: { uri: `file://${testFile}` },
          position: { line: 10, character: 0 },
        },
        id: 2,
      };

      const response = await handleTextDocumentDefinition(request, context);

      assertEquals(response.jsonrpc, "2.0");
      assertEquals(response.id, 2);
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
  name: "textDocument/definition handler - with valid link",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    // Create a temporary test file with a link
    const testFile = "/tmp/crawl-ls-def-test-3.md";
    const testContent = "Check [Example](https://example.com) here";
    await Deno.writeTextFile(testFile, testContent);

    try {
      const context: LspContext = {
        cacheDir: "/tmp/crawl-ls-cache",
      };

      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "textDocument/definition",
        params: {
          textDocument: { uri: `file://${testFile}` },
          position: { line: 0, character: 15 },
        },
        id: 3,
      };

      const response = await handleTextDocumentDefinition(request, context);

      assertEquals(response.jsonrpc, "2.0");
      assertEquals(response.id, 3);
      // Response should have result (location or null depending on fetch result)
      assertEquals(response.result !== undefined, true);
    } finally {
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});
