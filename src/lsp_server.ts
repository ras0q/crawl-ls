/**
 * LSP Server for CrawlLS.
 * Implements JSON-RPC protocol using vscode-languageserver.
 */

import process from "node:process";
import { TextDocuments } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { createConnection } from "vscode-languageserver/node.js";
import { handleInitialize } from "./handlers/initialize.ts";
import { handleTextDocumentDefinition } from "./handlers/textDocument_definition.ts";
import type { LspContext } from "./types/lsp.ts";

function createHandlerWrapper(context: LspContext) {
  return <P, R>(handler: (params: P, context: LspContext) => Promise<R>) =>
  async (params: P): Promise<R> => {
    return await handler(params, context);
  };
}

export function startLspServer(cacheDir: string): void {
  const connection = createConnection(
    process.stdin,
    process.stdout,
  );
  const documents = new TextDocuments(TextDocument);
  documents.listen(connection);

  const context: LspContext = {
    cacheDir,
    connection,
  };

  const wrap = createHandlerWrapper(context);

  connection.onInitialize(wrap(handleInitialize));
  connection.onInitialized(() => {
    connection.onDefinition(wrap(handleTextDocumentDefinition));
  });

  connection.listen();
}
