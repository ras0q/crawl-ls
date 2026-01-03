/**
 * Main entry point for CrawlLS.
 * Starts the LSP server.
 */

import { parseArgs } from "@std/cli/parse-args";
import type { LspContext } from "./src/types/lsp.ts";
import { startLspServer } from "./src/lsp_server.ts";

const DEFAULT_CACHE_DIR = "/tmp/crawl-ls";

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["cache-dir"],
  });

  const cacheDir = args["cache-dir"] ?? DEFAULT_CACHE_DIR;
  const context: LspContext = {
    cacheDir,
  };

  await startLspServer(context);
}
