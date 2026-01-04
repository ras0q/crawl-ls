# CrawlLS

A Language Server Protocol (LSP) implementation for browsing the web as a graph
of Markdown files in TUI editors like Neovim.

## Features

- Fetch web pages and convert them to Markdown
- Navigate between web pages using LSP's "Go to Definition" feature
- Smart detection of external resources (videos, etc.)
- Cache-based navigation for instant access

## Requirements

- Deno 2.x

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and how to
get started.

## Architecture

- **Fetcher**: Core logic for fetching and converting web pages to Markdown
- **LSP Server**: vscode-languageserver-based protocol implementation
- **Handlers**: Pure functions for LSP request processing
- **Cache**: Domain-based file storage for fetched content

## Technology Stack

- Runtime: Deno 2
- Language: TypeScript
- Libraries:
  - `vscode-languageserver`: LSP protocol implementation
  - `defuddle`: HTML content extraction
  - Native `fetch` for HTTP requests
