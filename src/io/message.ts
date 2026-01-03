/**
 * JSON-RPC message I/O utilities.
 */

import { type } from "arktype";
import type { JsonRpcResponse } from "../types/jsonrpc.ts";
import { JsonRpcResponse as JsonRpcResponseValidator } from "../types/jsonrpc.ts";

/**
 * Write a JSON-RPC response to stdout.
 */
export function writeMessage(response: JsonRpcResponse): void {
  const validatedResponse = JsonRpcResponseValidator(response);
  if (validatedResponse instanceof type.errors) {
    console.error("Invalid JSON-RPC response:", validatedResponse.summary);
    return;
  }

  const content = JSON.stringify(response);
  const message = `Content-Length: ${content.length}\r\n\r\n${content}`;
  const encoder = new TextEncoder();
  Deno.stdout.writeSync(encoder.encode(message));
}

/**
 * Read a single LSP message from stdin.
 */
export async function readMessage(): Promise<string | null> {
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
