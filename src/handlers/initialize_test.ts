/**
 * Tests for initialize handler.
 */

import { assertEquals } from "@std/assert";
import { handleInitialize } from "./initialize.ts";
import type { JsonRpcRequest } from "../types/jsonrpc.ts";

Deno.test("initialize handler - returns capabilities", () => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    id: 1,
  };

  const response = handleInitialize(request);

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

Deno.test("initialize handler - handles request without id", () => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "initialize",
  };

  const response = handleInitialize(request);

  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, undefined);
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
