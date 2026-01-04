# Phase 9: vscode-languageserver Migration

**Date:** 2026-01-04\
**Status:** ✅ Completed

## Overview

Migrated from manual JSON-RPC implementation to `vscode-languageserver` library
for cleaner, more maintainable handler registration.

## Changes

### Architecture Shift

**Before:** Manual JSON-RPC routing

- Hand-written message parsing (`io/message.ts`)
- Custom request/response types (`types/jsonrpc.ts`)
- Manual handler routing in `processRequest()`
- Handler output wrapper pattern (`types/handler.ts`)

**After:** Library-based connection

- `vscode-languageserver` handles protocol
- Standard LSP types from library
- Direct handler registration via `connection.onXxx()`
- Pure handler functions: `params => result`

### Key Implementation

#### Handler Wrapper Pattern

Created `createHandlerWrapper()` for automatic context injection:

```typescript
function createHandlerWrapper(context: LspContext) {
  return <P, R>(handler: (params: P, context: LspContext) => R) =>
  (params: P): R => handler(params, context);
}

const wrap = createHandlerWrapper(context);
connection.onInitialize(wrap(handleInitialize));
connection.onDefinition(wrap(handleTextDocumentDefinition));
```

#### Context with Connection

Updated `LspContext` to include connection for side effects:

```typescript
interface LspContext {
  cacheDir: string;
  connection: Connection;  // Added
}

// Handlers can now send requests via context
await context.connection.sendRequest("window/showDocument", { ... });
```

### Files Modified

- ✅ `src/types/lsp.ts` - Added `connection: Connection`
- ✅ `src/lsp_server.ts` - Complete rewrite (91 → 37 lines, 59% reduction)
- ✅ `src/handlers/initialize.ts` - New signature
- ✅ `src/handlers/textDocument_definition.ts` - New signature
- ✅ All handler tests updated with mock connection

### Files Deleted

- ❌ `src/types/handler.ts` - No longer needed
- ❌ `src/types/jsonrpc.ts` - Library provides types
- ❌ `src/io/message.ts` - Library handles I/O
- ❌ `src/lsp_server_test.ts` - Replaced with wrapper tests

### Dependencies Cleaned

Removed:

- `arktype` - No longer validating JSON-RPC manually
- `vscode-languageserver-protocol` - Included in main package
- `vscode-languageserver-types` - Included in main package

Added:

- `vscode-languageserver-textdocument` - Document management

## Metrics

### Code Reduction

| Metric        | Before | After     | Change |
| ------------- | ------ | --------- | ------ |
| Total LOC     | ~620   | ~470      | -24%   |
| lsp_server.ts | 91     | 37        | -59%   |
| Deleted files | -      | 129 lines | -100%  |
| Dependencies  | 7 npm  | 4 npm     | -43%   |

### Test Status

- All 21 tests passing ✓ (+3 new wrapper tests)
- No functional regressions
- Improved type safety with library types

## Benefits

1. **Maintainability**: Standard library handles protocol complexity
2. **Correctness**: Reduced custom code = fewer bugs
3. **Extensibility**: Adding handlers now single-line operation
4. **Type Safety**: No more `as` casting, library types enforce correctness
5. **Simplicity**: 150+ lines of JSON-RPC code eliminated

## Lessons Learned

1. **Library over custom**: Use established libraries when available
2. **Wrapper pattern**: Single higher-order function eliminates boilerplate
3. **Context design**: Including connection in context enables clean side
   effects
4. **Test mocking**: Mock connection at minimal interface level

## Next Steps

Ready for Phase 10: Background prefetching with `textDocument/didOpen` handler
can now be added with:

```typescript
documents.onDidOpen(wrap(handleTextDocumentDidOpen));
```
