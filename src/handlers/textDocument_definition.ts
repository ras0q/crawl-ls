/**
 * textDocument/definition request handler for LSP server.
 */

import type {
  DefinitionParams,
  Location,
} from "vscode-languageserver-protocol";
import type { JsonRpcRequest } from "../types/jsonrpc.ts";
import type { HandlerOutput } from "../types/handler.ts";
import type { LspContext } from "../types/lsp.ts";
import { extractLinkAtPosition } from "../link_parser.ts";
import { checkCache, getCachePath, saveToCache } from "../cache.ts";
import { fetchUrl } from "../fetcher.ts";

/**
 * Handle textDocument/definition request.
 */
export async function handleTextDocumentDefinition(
  request: JsonRpcRequest,
  context: LspContext,
): Promise<HandlerOutput> {
  // TODO: Validate request params
  const params = request.params as DefinitionParams;

  // Get document URI and position
  const documentUri = params.textDocument.uri;
  const position = params.position;

  // Read document content from file
  const filePath = documentUri.replace("file://", "");
  const content = await Deno.readTextFile(filePath);
  const lines = content.split("\n");

  // Get line at cursor position
  if (position.line >= lines.length) {
    return {
      response: {
        jsonrpc: "2.0",
        id: request.id,
        result: null,
      },
    };
  }

  const line = lines[position.line];

  // Extract link at cursor position
  const url = extractLinkAtPosition(line, position.character);

  if (!url) {
    // No link found
    return {
      response: {
        jsonrpc: "2.0",
        id: request.id,
        result: null,
      },
    };
  }

  // Check cache first
  const cachePath = getCachePath(url, context.cacheDir);
  const cached = await checkCache(cachePath);

  // If not cached, fetch it
  if (!cached) {
    const fetchResult = await fetchUrl(url);

    if (fetchResult.isExternal) {
      // Send window/showDocument request for external URLs
      return {
        response: {
          jsonrpc: "2.0",
          id: request.id,
          result: null,
        },
        serverRequest: {
          jsonrpc: "2.0",
          method: "window/showDocument",
          params: {
            uri: url,
            external: true,
          },
        },
      };
    }

    await saveToCache(cachePath, fetchResult.content);
  }

  // Return location of cached markdown file
  const location: Location = {
    uri: `file://${cachePath}`,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
  };

  return {
    response: {
      jsonrpc: "2.0",
      id: request.id,
      result: location,
    },
  };
}
