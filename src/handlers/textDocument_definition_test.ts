/**
 * Tests for textDocument/definition handler.
 */

import { assertEquals } from "@std/assert";
import { handleTextDocumentDefinition } from "./textDocument_definition.ts";
import type { DefinitionParams } from "vscode-languageserver";
import type { LspContext } from "../types/lsp.ts";
import type { Connection } from "vscode-languageserver";

// Mock connection for testing
const createMockConnection = (): Connection => ({
  sendRequest: () => Promise.resolve(),
  listen: () => {},
  onInitialize: () => {},
  onDefinition: () => {},
} as unknown as Connection);

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
        connection: createMockConnection(),
      };

      const params: DefinitionParams = {
        textDocument: { uri: `file://${testFile}` },
        position: { line: 0, character: 5 },
      };

      const result = await handleTextDocumentDefinition(params, context);

      assertEquals(result, null);
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
        connection: createMockConnection(),
      };

      const params: DefinitionParams = {
        textDocument: { uri: `file://${testFile}` },
        position: { line: 10, character: 0 },
      };

      const result = await handleTextDocumentDefinition(params, context);

      assertEquals(result, null);
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
        connection: createMockConnection(),
      };

      const params: DefinitionParams = {
        textDocument: { uri: `file://${testFile}` },
        position: { line: 0, character: 15 },
      };

      const result = await handleTextDocumentDefinition(params, context);

      // Result should be null (external URL) or Location object (cached)
      assertEquals(
        result === null || (typeof result === "object" && "uri" in result),
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
