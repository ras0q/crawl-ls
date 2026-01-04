/**
 * Tests for initialize handler.
 */

import { assertEquals } from "@std/assert";
import { handleInitialize } from "./initialize.ts";
import type { InitializeParams } from "vscode-languageserver";
import type { LspContext } from "../types/lsp.ts";
import type { Connection } from "vscode-languageserver";

// Mock connection for testing
const mockConnection: Connection = {
  sendRequest: () => Promise.resolve(),
  listen: () => {},
  onInitialize: () => {},
  onDefinition: () => {},
} as unknown as Connection;

Deno.test("initialize handler - returns capabilities", async () => {
  const context: LspContext = {
    cacheDir: "/tmp/test",
    connection: mockConnection,
  };

  const params: InitializeParams = {
    processId: null,
    rootUri: null,
    capabilities: {},
    workspaceFolders: null,
  };

  const result = await handleInitialize(params, context);

  assertEquals(result.capabilities.definitionProvider, true);
  // Check textDocumentSync structure
  if (typeof result.capabilities.textDocumentSync === "object") {
    assertEquals(result.capabilities.textDocumentSync.openClose, true);
  }
});

Deno.test("initialize handler - returns InitializeResult type", async () => {
  const context: LspContext = {
    cacheDir: "/tmp/test",
    connection: mockConnection,
  };

  const params: InitializeParams = {
    processId: 1234,
    rootUri: "file:///workspace",
    capabilities: {},
    workspaceFolders: null,
  };

  const result = await handleInitialize(params, context);

  // Verify result structure matches InitializeResult
  assertEquals(typeof result.capabilities, "object");
});
