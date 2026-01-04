/**
 * textDocument/definition request handler for LSP server.
 */

import type { DefinitionParams, Location } from "vscode-languageserver";
import type { LspContext } from "../types/lsp.ts";
import { extractLinkAtPosition } from "../link_parser.ts";
import { checkCache, getCachePath, saveToCache } from "../cache.ts";
import { fetchUrl } from "../fetcher.ts";

/**
 * Handle textDocument/definition request.
 * Returns cached markdown file location or null.
 */
export async function handleTextDocumentDefinition(
  params: DefinitionParams,
  context: LspContext,
): Promise<Location | null> {
  const documentUri = params.textDocument.uri;
  const position = params.position;

  // Read document content from file
  const filePath = documentUri.replace("file://", "");
  const content = await Deno.readTextFile(filePath);
  const lines = content.split("\n");

  // Get line at cursor position
  if (position.line >= lines.length) {
    return null;
  }

  const line = lines[position.line];

  // Extract link at cursor position
  const url = extractLinkAtPosition(line, position.character);

  if (!url) {
    return null;
  }

  // Check cache first
  const cachePath = getCachePath(url, context.cacheDir);
  const cached = await checkCache(cachePath);

  // If not cached, fetch it
  if (!cached) {
    const fetchResult = await fetchUrl(url);

    if (fetchResult.isExternal) {
      // Send window/showDocument request via context connection
      await context.connection.sendRequest("window/showDocument", {
        uri: url,
        external: true,
      });
      return null;
    }

    await saveToCache(cachePath, fetchResult.content);
  }

  // Return location of cached markdown file
  return {
    uri: `file://${cachePath}`,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
  };
}
