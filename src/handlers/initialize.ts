/**
 * Initialize request handler for LSP server.
 */

import {
  type InitializeParams,
  type InitializeResult,
} from "vscode-languageserver";
import type { LspContext } from "../types/lsp.ts";

/**
 * Handle initialize request.
 * Returns server capabilities.
 */
export function handleInitialize(
  _params: InitializeParams,
  _context: LspContext,
): Promise<InitializeResult> {
  return new Promise<InitializeResult>((resolve) => {
    resolve({
      capabilities: {
        definitionProvider: true,
      },
    });
  });
}
