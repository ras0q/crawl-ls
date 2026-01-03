/**
 * LSP Server for CrawlLS.
 * Implements JSON-RPC protocol over stdin/stdout.
 */

import type {
  DefinitionParams,
  InitializeResult,
  Location,
  ServerCapabilities,
} from "vscode-languageserver-protocol";
import { extractLinkAtPosition } from "./link_parser.ts";
import { checkCache } from "./cache.ts";
import { fetchUrl } from "./fetcher.ts";

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

export interface LspContext {
  cacheDir: string;
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
async function handleDefinition(request: JsonRpcRequest, context: LspContext) {
  const params = request.params as DefinitionParams;

  try {
    // Get document URI and position
    const documentUri = params.textDocument.uri;
    const position = params.position;

    // Read document content from file
    const filePath = documentUri.replace("file://", "");
    const content = await Deno.readTextFile(filePath);
    const lines = content.split("\n");

    // Get line at cursor position
    if (position.line >= lines.length) {
      const response: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: request.id,
        result: null,
      };
      writeMessage(response);
      return;
    }

    const line = lines[position.line];

    // Extract link at cursor position
    const url = extractLinkAtPosition(line, position.character);

    if (!url) {
      // No link found
      const response: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: request.id,
        result: null,
      };
      writeMessage(response);
      return;
    }

    // Check cache first
    let cachePath = await checkCache(url, context.cacheDir);

    // If not cached, fetch it
    if (!cachePath) {
      const fetchResult = await fetchUrl(url, context.cacheDir);

      if (fetchResult.isExternal) {
        // Send window/showDocument request for external URLs
        const showDocRequest = {
          jsonrpc: "2.0",
          method: "window/showDocument",
          params: {
            uri: url,
            external: true,
          },
        };
        writeMessage(showDocRequest);

        // Return null for the definition
        const response: JsonRpcResponse = {
          jsonrpc: "2.0",
          id: request.id,
          result: null,
        };
        writeMessage(response);
        return;
      }

      cachePath = fetchResult.path;
    }

    // Return location of cached markdown file
    const location: Location = {
      uri: `file://${cachePath}`,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
    };

    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id: request.id,
      result: location,
    };
    writeMessage(response);
  } catch (error) {
    // Error handling
    console.error("Definition handler error:", error);
    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id: request.id,
      result: null,
    };
    writeMessage(response);
  }
}

/**
 * Process a single JSON-RPC request.
 */
async function processRequest(
  request: JsonRpcRequest,
  context: LspContext,
) {
  switch (request.method) {
    case "initialize":
      handleInitialize(request);
      break;
    case "textDocument/definition":
      await handleDefinition(request, context);
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
  const decoder = new TextDecoder();
  let buffer = "";
  let contentLength = 0;
  let headerParsed = false;

  // First, read the headers and find Content-Length
  while (!headerParsed) {
    const chunk = new Uint8Array(512);
    const bytesRead = await Deno.stdin.read(chunk);
    if (bytesRead === null) return null;

    buffer += decoder.decode(chunk.slice(0, bytesRead));

    // Look for end of headers (\r\n\r\n)
    const headerEndIdx = buffer.indexOf("\r\n\r\n");
    if (headerEndIdx !== -1) {
      const headers = buffer.substring(0, headerEndIdx);
      buffer = buffer.substring(headerEndIdx + 4); // Remove headers and separator

      // Parse Content-Length
      const match = headers.match(/Content-Length: (\d+)/);
      if (match) {
        contentLength = parseInt(match[1]);
        headerParsed = true;
      } else {
        return null; // No Content-Length header found
      }
    }
  }

  // Now read the exact amount of content specified by Content-Length
  while (buffer.length < contentLength) {
    const chunk = new Uint8Array(512);
    const bytesRead = await Deno.stdin.read(chunk);
    if (bytesRead === null) return null;

    buffer += decoder.decode(chunk.slice(0, bytesRead));
  }

  return buffer.substring(0, contentLength);
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

    try {
      const request: JsonRpcRequest = JSON.parse(message);
      await processRequest(request, context);
    } catch (error) {
      // Invalid JSON - ignore or send error response
      console.error("Failed to parse JSON-RPC message:", error);
    }
  }
}
