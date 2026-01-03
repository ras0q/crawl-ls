# LSP Server Simplification

## What Was Done

Removed unnecessary abstraction layers from the LSP server implementation by
eliminating the `Stdio` interface and `RealStdio` class, replacing them with
pure functions.

### Changes Made

1. **Removed `Stdio` interface** - Was intended for dependency injection in
   tests but never actually used
2. **Removed `RealStdio` class** - Stateful class implementation that violated
   the project's functional programming preference
3. **Replaced with pure functions**:
   - `writeMessage()` - Outputs JSON-RPC response to stdout
   - `readMessage()` - Asynchronously reads LSP message from stdin
4. **Simplified all handlers** - Removed `stdio` parameter from
   `handleInitialize()`, `handleDefinition()`, and `processRequest()`
5. **Simplified `startLspServer()`** - Now takes no parameters and uses pure
   functions internally

### Code Reduction

- Removed 65 lines of abstraction code
- Final implementation: 152 lines (down from 217)
- Cleaner, more maintainable code structure

## Technical Decisions

### Why Remove the Interface?

- **Not used in tests** - `lsp_server_test.ts` tests pure message
  formatting/parsing functions, not I/O
- **Over-engineering** - Added complexity without enabling actual testing
  benefits
- **YAGNI principle** - The dependency injection pattern wasn't needed yet
- **Pure functions preferred** - Project guidelines favor functional programming

### Why Use Async `readMessage()`?

- LSP server requires waiting for stdin input
- Async/await is more idiomatic than synchronous blocking reads
- Better error handling possibilities for future enhancements
- Aligns with Deno's async-first design patterns

### LSP Message Format Handling

Both `readMessage()` and `writeMessage()` handle the LSP protocol format:

```
Content-Length: <byte count>\r\n\r\n<json-rpc message>
```

This is properly implemented in both directions without unnecessary state
management.

## Test Results

All tests pass:

```
running 7 tests from ./src/fetcher_test.ts
✓ All 7 tests passed (5s)

running 2 tests from ./src/lsp_server_test.ts
✓ LSP Server - initialize request ... ok (2ms)
✓ LSP Server - textDocument/definition request ... ok (0ms)

Total: 9 passed | 0 failed (5s)
```

Code formatting and linting checks also pass.

## Key Technologies & Implementation Details

### Deno APIs Used

- `Deno.stdin.read()` - Non-blocking async read from stdin
- `Deno.stdout.writeSync()` - Synchronous write to stdout (appropriate for
  message output)
- `TextEncoder/TextDecoder` - Byte-string conversions for I/O

### JSON-RPC Protocol

- Follows LSP specification for Content-Length header format
- Supports request/response message types
- Includes error response handling for unknown methods

### Type Safety

- `JsonRpcRequest` and `JsonRpcResponse` interfaces for message typing
- Imports from `vscode-languageserver-protocol` for LSP types
- Satisfies ServerCapabilities constraints

## Critical Decisions

1. **Kept synchronous `writeMessage()`** - Message output is fast and doesn't
   benefit from async
2. **Made `readMessage()` async** - stdin operations can block and should be
   non-blocking
3. **No mock interface needed** - Tests focus on message format validation, not
   I/O mocking
4. **Handlers remain pure** - Each handler creates a response object and writes
   it; no side effects beyond I/O

## What the Next Developer Needs to Know

### Architecture

- LSP server follows request-response pattern
- All I/O is pure - `readMessage()` and `writeMessage()` handle
  encoding/formatting
- Handler functions are composable and can be extended

### To Add New LSP Methods

1. Add handler function (e.g., `handleCustomMethod()`)
2. Add case to `processRequest()` switch statement
3. Handler creates `JsonRpcResponse` and calls `writeMessage(response)`

### Test Coverage

- Current tests validate message format encoding/decoding
- I/O itself is not mocked (follows Deno best practices)
- Future integration tests can be added by spawning the server process

### Known Limitations

- `readMessage()` assumes complete messages arrive in single read (1024 byte
  buffer)
- No message buffering across reads (suitable for testing, needs enhancement for
  production)
- Definition provider returns null result (Step 3 will connect fetcher)

## Lessons Learned

1. **Abstraction should serve a purpose** - The Stdio interface existed "just in
   case" but wasn't actually needed
2. **Pure functions are testable** - Message format handling doesn't need mocks
3. **Dependency injection has a cost** - Added cognitive load without enabling
   better testing
4. **Deno's async-first design** - Using native async I/O is simpler than custom
   buffering

## Next Steps

1. Implement fetcher integration for `textDocument/definition` handler
2. Add proper message buffering in `readMessage()` for production readiness
3. Add integration tests that spawn actual server process
4. Consider using `deno_std` LSP utilities if more complex message handling
   needed
