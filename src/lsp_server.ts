/**
 * LSP Server for CrawlLS.
 * Implements JSON-RPC protocol over stdin/stdout.
 */

import { type } from "arktype";

import type { JsonRpcRequest, JsonRpcResponse } from "./types/jsonrpc.ts";
import { JsonRpcRequest as JsonRpcRequestValidator } from "./types/jsonrpc.ts";
import type { LspContext } from "./types/lsp.ts";
import { readMessage, writeMessage } from "./io/message.ts";
import { handleInitialize } from "./handlers/initialize.ts";
import { handleTextDocumentDefinition } from "./handlers/textDocument_definition.ts";

/**
 * Validate and process a single JSON-RPC request and return response.
 */
async function processRequest(
  request: JsonRpcRequest,
  context: LspContext,
): Promise<JsonRpcResponse> {
  try {
    switch (request.method) {
      case "initialize":
        return handleInitialize(request);
      case "textDocument/definition":
        return await handleTextDocumentDefinition(
          request,
          context,
        );
      default:
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        } satisfies JsonRpcResponse;
    }
  } catch (error) {
    console.error("Handler error:", error);
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32603,
        message: "Internal error",
      },
    } satisfies JsonRpcResponse;
  }
}

/**
 * Start the LSP server.
 */
export async function startLspServer(context: LspContext) {
  while (true) {
    const message = await readMessage();
    if (!message) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      continue;
    }

    const request = JSON.parse(message);
    const validatedRequest = JsonRpcRequestValidator(request);
    if (validatedRequest instanceof type.errors) {
      console.error(
        "Received invalid JSON-RPC request:",
        validatedRequest.summary,
      );
      continue;
    }

    const response = await processRequest(validatedRequest, context);
    if (response) {
      writeMessage(response);
    }
  }
}
