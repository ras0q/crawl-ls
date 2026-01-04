# Current Project Status

**Last Updated:** 2026-01-04 11:00 JST

## Overview

CrawlLS is a Language Server Protocol (LSP) implementation for browsing web
content as Markdown files within TUI editors like Neovim.

## Implementation Progress

### ✅ Completed Phases (1-9)

| Phase | Title                           | Status | Key Deliverable                  |
| ----- | ------------------------------- | ------ | -------------------------------- |
| 1     | Fetcher Implementation          | ✅     | Pure fetch/convert functions     |
| 2     | LSP Protocol Walking Skeleton   | ✅     | JSON-RPC over stdio              |
| 3     | LSP Server Simplification       | ✅     | Removed abstraction layers       |
| 4     | Definition Integration          | ✅     | Link extraction + cache checking |
| 5     | Cache Dir Refactoring           | ✅     | CLI `--cache-dir` argument       |
| 6     | Architecture Refactoring        | ✅     | Type/handler/IO separation       |
| 7     | Handler Output Pattern          | ✅     | Pure side effect handling        |
| 8     | Cache Key Readability           | ✅     | Domain-path cache structure      |
| 9     | vscode-languageserver Migration | ✅     | Library-based connection         |

### Current Test Status

**All 21 tests passing ✓**

```
- cache_test.ts:                          2/2
- fetcher_test.ts:                        5/5
- handlers/initialize_test.ts:            2/2
- handlers/textDocument_definition_test.ts: 3/3
- link_parser_test.ts:                    6/6
- lsp_server_test.ts:                     3/3
```

### Architecture Summary

```
┌─────────────────────────────────────────┐
│    LSP Server (lsp_server.ts)          │
│  - vscode-languageserver connection     │
│  - Handler wrapper with context inject  │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────────┬────────────────┐
        │                 │                │
   ┌────▼────────┐  ┌────▼──────┐  ┌─────▼──────┐
   │  Handlers   │  │ Link Parser│  │   Cache    │
   │  (pure)     │  │  (pure)    │  │ (file I/O) │
   └────┬────────┘  └────────────┘  └──────┬─────┘
        │                                   │
   ┌────▼──────────────────────────────────┘
   │
┌──▼──────────────────┐
│   Fetcher (pure)    │
│ - Fetch HTML        │
│ - Convert Markdown  │
│ - Detect external   │
└─────────────────────┘
```

### Key Files & LOC

| File                                      | Lines    | Role                     |
| ----------------------------------------- | -------- | ------------------------ |
| `src/lsp_server.ts`                       | 37       | Connection & routing     |
| `src/handlers/textDocument_definition.ts` | 69       | Definition handler       |
| `src/handlers/initialize.ts`              | 33       | Initialize handler       |
| `src/fetcher.ts`                          | 117      | Pure fetch/convert       |
| `src/cache.ts`                            | 66       | File cache ops           |
| `src/link_parser.ts`                      | 28       | Markdown link extraction |
| `main.ts`                                 | 18       | CLI entry point          |
| **Total**                                 | **~470** | **24% reduction**        |

### Dependencies

**Core:**

- `deno` 2.x
- `defuddle` 0.6.6 - HTML extraction
- `vscode-languageserver` ^9.0.1 - LSP protocol
- `vscode-languageserver-textdocument` ^1.0.12 - Document management

**Standard Library:**

- `@std/fs` - Directory/file operations
- `@std/path` - Path utilities
- `@std/cli` - CLI argument parsing
- `@std/assert` - Testing

### Implemented LSP Features

- ✅ `initialize` - Advertise capabilities
- ✅ `textDocument/definition` - Navigate to cached markdown
- ✅ `window/showDocument` - Open external URLs in browser
- ❌ `textDocument/didOpen` - (Prefetch queue pending)
- ❌ `textDocument/didChange` - (Not yet implemented)
- ❌ `textDocument/didClose` - (Not yet implemented)

### Cache Structure

```
~/.cache/crawl-ls/
├── example.com/
│   ├── index.md
│   └── article.md
├── github.com/
│   └── user/repo.md
└── stackoverflow.com/
    └── help/minimal-reproducible-example.md
```

### Code Quality

- ✅ Type safety: No `as` type casting except for test mocks (`as unknown as T`)
- ✅ Pure functions: Most logic is side-effect free
- ✅ TDD approach: Tests written before implementation
- ✅ YAGNI principle: Only necessary features implemented
- ✅ All checks pass: `deno fmt`, `deno lint`, `deno check`
- ✅ Library-based: Using `vscode-languageserver` for protocol handling

## Known Limitations

1. **URL parsing**: Only `[text](url)` markdown format supported
2. **Relative URLs**: No URL resolution relative to page context
3. **No cache TTL**: Cached files persist indefinitely
4. **No concurrent access control**: No locking for simultaneous writes
5. **Special characters**: Paths with special chars need escaping

## Next Steps (Priority Order)

### Phase 9: Background Prefetching Queue (High Priority)

- Implement `PrefetchQueue` class
- Hook `textDocument/didOpen` lifecycle
- Extract all links and queue for background processing
- Add rate limiting and sequential processing

### Phase 10: LSP Lifecycle Events (Medium Priority)

- Handle `textDocument/didChange` for document updates
- Implement `textDocument/didClose` for cleanup
- Track open documents in memory

### Phase 11: Production Readiness (Medium Priority)

- Message buffering across multiple reads
- Integration tests with actual LSP client
- Error recovery and reconnection logic

### Phase 12: Observability (Low Priority)

- Cache metrics (hit rate, total size)
- Performance logging
- Debug mode for troubleshooting

## Development Guidelines

- Always run `deno test -P` before committing
- Always run `deno task check:fix` to format/lint
- Write tests first (TDD)
- Keep pure functions separate from side effects
- Update `logs/current.md` after each phase

## Getting Started (For Future Developers)

```bash
# Install dependencies
deno cache --reload deno.jsonc

# Run tests
deno test -P

# Start LSP server
deno task dev

# With custom cache directory
deno task dev -- --cache-dir ~/.cache/crawl-ls

# Code quality checks
deno task check:fix
```

## Architecture Decisions

### Why pure functions?

- Testable without mocks
- Composable and reusable
- Easier to reason about

### Why domain-based cache keys?

- Readable filesystem structure
- Debuggable by inspection
- No hash computation overhead

### Why handler wrapper pattern?

- Automatic context injection eliminates boilerplate
- Single-line handler registration: `connection.onXxx(wrap(handleXxx))`
- Type-safe with generic inference
- Easy to add new handlers

### Why vscode-languageserver library?

- Standard protocol implementation
- Reduces custom code (150+ lines eliminated)
- Better type safety with official LSP types
- Easier to extend with new handlers

### Why handler wrapper pattern?

- Automatic context injection eliminates boilerplate
- Single-line handler registration: `connection.onXxx(wrap(handleXxx))`
- Type-safe with generic inference
- Easy to add new handlers

## Recent Changes Summary

**Latest Phase:** Phase 9 - vscode-languageserver Migration

- Migrated from manual JSON-RPC to `vscode-languageserver`
- Eliminated 150+ lines of protocol handling code
- Implemented handler wrapper pattern for clean registration
- Removed 3 unused dependencies (arktype, protocol types)
- Reduced total codebase by 24% (620 → 470 lines)
- All 21 tests passing with improved type safety
