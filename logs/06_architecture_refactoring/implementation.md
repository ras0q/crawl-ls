# LSP Server Architecture Refactoring

## Overview

Performed a major refactoring of the LSP server architecture based on the
separation of concerns principle. Specifically separated type definitions, I/O
processing, and business logic to improve maintainability and reusability.

## Implementation Details

### 1. Handler Organization and Restructuring

**File Structure:**

```
src/handlers/
├── initialize.ts                    # initialize method handling
├── initialize_test.ts               # initialize tests
├── textDocument_definition.ts        # textDocument/definition method handling
└── textDocument_definition_test.ts   # textDocument/definition tests
```

**Implementation:**

- Reflect method names in filenames (`definition.ts` →
  `textDocument_definition.ts`)
- Each handler returns `JsonRpcResponse` (no I/O operations)
- Focus on business logic only

**Tests Added:**

- `initialize_test.ts`: 2 test cases
  - initialize request with ID
  - initialize request without ID
- `textDocument_definition_test.ts`: 3 test cases
  - No link found
  - Position beyond line bounds
  - Valid link found

### 2. Messaging Functionality Integration

**Previous Problem:**

```
readMessage() called in startLspServer, writeMessage() called in processRequest
→ Message I/O operations scattered
```

**After Improvement:**

```
Both readMessage() and writeMessage() called in startLspServer
→ Message I/O operations unified
```

### 3. Type Definitions and Logic Separation (Pattern A)

**File Structure:**

```
src/
├── types/
│   ├── jsonrpc.ts                 # JSON-RPC generic type definitions
│   └── lsp.ts                     # LSP-specific types (LspContext)
├── io/
│   └── message.ts                 # JSON-RPC message I/O
└── lsp_server.ts                  # Main logic
```

**Responsibilities of Each File:**

- `types/jsonrpc.ts`: JSON-RPC protocol type definitions and validators
  - JsonRpcRequest, JsonRpcResponse
  - Runtime validation using arktype
  - Reusable in other projects

- `types/lsp.ts`: LSP server-specific type definitions
  - LspContext interface
  - Cache directory configuration

- `io/message.ts`: JSON-RPC message read/write operations
  - readMessage(): Read messages from stdin
  - writeMessage(): Send responses to stdout

- `lsp_server.ts`: Main server logic
  - Request validation
  - Handler invocation
  - Error handling

### 4. Layered Error Handling

**Layers:**

1. `startLspServer`: JSON parsing errors
2. `processRequest`: Handler runtime errors (try-catch)
3. Handlers: Business logic (errors delegated to upper layers)

**Error Codes:**

- `-32601`: Method not found
- `-32603`: Internal handler runtime error

### 5. Type Checking Guidelines Added

Recorded in AGENTS.md:

```
- Prohibit type casting using `as`
- Recommend runtime type checks using `typeof` and `in` operators
- Use `instanceof type.errors` for arktype validation
```

## Architecture Improvements

### Separation of Concerns

| Layer            | Responsibility       | File            |
| ---------------- | -------------------- | --------------- |
| I/O              | Message read/write   | `io/message.ts` |
| Business Logic   | Request processing   | `lsp_server.ts` |
| Handlers         | LSP method handling  | `handlers/*.ts` |
| Type Definitions | Types and validation | `types/*.ts`    |

### Dependency Graph (Unidirectional)

```
handlers/ → types/ → io/
lsp_server.ts → handlers/, types/, io/
main.ts → lsp_server.ts, types/lsp.ts
```

## Test Results

✅ **All 23 tests passed**

```
- cache_test.ts: 2 tests
- fetcher_test.ts: 7 tests
- handlers/initialize_test.ts: 2 tests (new)
- handlers/textDocument_definition_test.ts: 3 tests (new)
- link_parser_test.ts: 6 tests
- lsp_server_test.ts: 3 tests
```

✅ **Coverage**

- handlers/initialize.ts: 100%
- handlers/textDocument_definition.ts: 68.3%
- types/jsonrpc.ts: 100%
- link_parser.ts: 100%
- Overall: 70.8%

✅ **Quality Checks**

- Deno format: ✓
- Deno lint: ✓
- Type checking: ✓

## Technical Decisions

### 1. Why Pattern A Was Chosen

- **Reusability**: JSON-RPC type definitions are independent
- **Maintainability**: Appropriate file sizes, clear responsibilities
- **Extensibility**: Easy to add new handlers and methods
- **Testability**: Each component can be tested independently

### 2. Aliased Validator Imports

```typescript
import { JsonRpcRequest as JsonRpcRequestValidator } from "./types/jsonrpc.ts";
```

To distinguish type definitions from runtime validators.

### 3. Unified I/O Operations

Both read and write operations in `startLspServer` consolidates messaging
management in one place.

## File Changes Summary

**Files Created:**

- `src/types/jsonrpc.ts`
- `src/types/lsp.ts`
- `src/io/message.ts`
- `src/handlers/initialize_test.ts`
- `src/handlers/textDocument_definition_test.ts`
- `ARCHITECTURE.md`

**Files Renamed:**

- `src/handlers/definition.ts` → `src/handlers/textDocument_definition.ts`
- `src/handlers/definition_test.ts` →
  `src/handlers/textDocument_definition_test.ts`

**Files Deleted:**

- `src/message.ts` (functionality split into `types/jsonrpc.ts` and
  `io/message.ts`)
- `src/handlers/index.ts` (changed to direct imports)

**Files Modified:**

- `src/lsp_server.ts`: Updated for new type structure
- `src/handlers/initialize.ts`: Fixed import paths
- `src/handlers/textDocument_definition.ts`: Fixed import paths
- `main.ts`: Changed LspContext import from message.ts to types/lsp.ts

## Learning Points

1. **Importance of Separation of Concerns**: Separating type definitions, I/O,
   and logic significantly improves maintainability
2. **File Structure Design**: Group related files in directories and clarify
   dependencies
3. **Type Safety**: Achieve type safety using runtime validation with arktype

## Future Extensibility

With the current architecture, the following extensions are easy to implement:

- Add new LSP method handlers (create new files in `src/handlers/`)
- Define new message types (add to `src/types/`)
- Add custom validation rules (update `src/types/jsonrpc.ts`)
- Reuse JSON-RPC type definitions in other projects

## Conclusion

Architecture refactoring based on separation of concerns principle achieved:

✅ Improved maintainability (clear responsibilities for each file) ✅ Improved
reusability (JSON-RPC part is independent) ✅ Improved testability (added unit
tests) ✅ Improved extensibility (easy to add new features) ✅ Improved code
quality (all tests passed, type checking passed)
