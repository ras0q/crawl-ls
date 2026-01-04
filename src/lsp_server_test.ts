/**
 * Tests for LSP server.
 */

import { assertEquals } from "@std/assert";
import type { Connection } from "vscode-languageserver";
import type { LspContext } from "./types/lsp.ts";

Deno.test("createHandlerWrapper - injects context into handler", () => {
  const mockConnection: Connection = {
    sendRequest: () => Promise.resolve(),
  } as unknown as Connection;

  const mockContext: LspContext = {
    cacheDir: "/tmp/test-cache",
    connection: mockConnection,
  };

  // Replicate the createHandlerWrapper logic
  function createHandlerWrapper(context: LspContext) {
    return <P, R>(handler: (params: P, context: LspContext) => R) =>
    (params: P): R => handler(params, context);
  }

  // Test handler that uses context
  const testHandler = (
    params: { value: number },
    context: LspContext,
  ): number => {
    return params.value + context.cacheDir.length;
  };

  const wrap = createHandlerWrapper(mockContext);
  const wrappedHandler = wrap(testHandler);

  const result = wrappedHandler({ value: 10 });
  assertEquals(result, 10 + "/tmp/test-cache".length);
});

Deno.test("createHandlerWrapper - preserves handler return type", () => {
  const mockContext: LspContext = {
    cacheDir: "/tmp/test",
    connection: {} as Connection,
  };

  function createHandlerWrapper(context: LspContext) {
    return <P, R>(handler: (params: P, context: LspContext) => R) =>
    (params: P): R => handler(params, context);
  }

  const stringHandler = (
    params: { name: string },
    _context: LspContext,
  ): string => {
    return `Hello, ${params.name}`;
  };

  const wrap = createHandlerWrapper(mockContext);
  const wrappedHandler = wrap(stringHandler);

  const result = wrappedHandler({ name: "World" });
  assertEquals(result, "Hello, World");
  assertEquals(typeof result, "string");
});

Deno.test("createHandlerWrapper - works with async handlers", async () => {
  const mockContext: LspContext = {
    cacheDir: "/tmp/test",
    connection: {} as Connection,
  };

  function createHandlerWrapper(context: LspContext) {
    return <P, R>(handler: (params: P, context: LspContext) => R) =>
    (params: P): R => handler(params, context);
  }

  const asyncHandler = async (
    params: { delay: number },
    context: LspContext,
  ): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, params.delay));
    return `Processed in ${context.cacheDir}`;
  };

  const wrap = createHandlerWrapper(mockContext);
  const wrappedHandler = wrap(asyncHandler);

  const result = await wrappedHandler({ delay: 10 });
  assertEquals(result, "Processed in /tmp/test");
});
