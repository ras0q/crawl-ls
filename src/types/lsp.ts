/**
 * LSP server context and configuration.
 */

import type { Connection } from "vscode-languageserver";

export interface LspContext {
  cacheDir: string;
  connection: Connection;
}
