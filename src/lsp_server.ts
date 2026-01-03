/**
 * LSP Server for CrawlLS.
 * Implements JSON-RPC protocol over stdin/stdout.
 */

import type {
  InitializeResult,
  Location,
  ServerCapabilities,
} from "vscode-languageserver-protocol";

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown;
  id?: number;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id?: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Write a JSON-RPC response to stdout.
 */
function writeMessage(response: JsonRpcResponse): void {
  const content = JSON.stringify(response);
  const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
  const encoder = new TextEncoder();
  Deno.stdout.writeSync(encoder.encode(message));
}

/**
 * Handle initialize request.
 */
function handleInitialize(request: JsonRpcRequest) {
  const result: InitializeResult = {
    capabilities: {
      definitionProvider: true,
    } satisfies ServerCapabilities,
  };

  const response: JsonRpcResponse = {
    jsonrpc: "2.0",
    id: request.id,
    result,
  };
  writeMessage(response);
}

/**
 * Handle textDocument/definition request.
 */
function handleDefinition(request: JsonRpcRequest) {
  // For now, return empty result
  // This will be connected to the fetcher in Step 3
  const result: Location | Location[] | null = null;

  const response: JsonRpcResponse = {
    jsonrpc: "2.0",
    id: request.id,
    result,
  };
  writeMessage(response);
}

/**
 * Process a single JSON-RPC request.
 */
function processRequest(request: JsonRpcRequest) {
  switch (request.method) {
    case "initialize":
      handleInitialize(request);
      break;
    case "textDocument/definition":
      handleDefinition(request);
      break;
    default:
      // Unknown method - send error response
      if (request.id !== undefined) {
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };
        writeMessage(response);
      }
      break;
  }
}

/**
 * Read a single LSP message from stdin.
 */
async function readMessage(): Promise<string | null> {
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return null;

  const decoder = new TextDecoder();
  const chunk = decoder.decode(buf.slice(0, n));

  // Parse Content-Length header and extract message
  const match = chunk.match(/Content-Length: (\d+)\r\n\r\n(.+)/);
  if (match) {
    const contentLength = parseInt(match[1]);
    return match[2].slice(0, contentLength);
  }

  return null;
}

/**
 * Start the LSP server.
 */
export async function startLspServer() {
  while (true) {
    const message = await readMessage();
    if (!message) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      continue;
    }

    try {
      const request: JsonRpcRequest = JSON.parse(message);
      processRequest(request);
    } catch (error) {
      // Invalid JSON - ignore or send error response
      console.error("Failed to parse JSON-RPC message:", error);
    }
  }
}

/**
 * Main entry point when run directly.
 */
if (import.meta.main) {
  await startLspServer();
}
