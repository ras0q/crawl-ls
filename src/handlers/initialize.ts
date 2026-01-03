/**
 * Initialize request handler for LSP server.
 */

import type {
  InitializeResult,
  ServerCapabilities,
} from "vscode-languageserver-protocol";
import type { JsonRpcRequest, JsonRpcResponse } from "../types/jsonrpc.ts";

/**
 * Handle initialize request.
 */
export function handleInitialize(request: JsonRpcRequest): JsonRpcResponse {
  const result: InitializeResult = {
    capabilities: {
      definitionProvider: true,
    } satisfies ServerCapabilities,
  };

  return {
    jsonrpc: "2.0",
    id: request.id,
    result,
  };
}
