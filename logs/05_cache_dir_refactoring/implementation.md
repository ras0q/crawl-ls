# Implementation Log: Step 5 - Cache Directory Management

**Date:** 2026-01-03

## Summary

Refactored cache directory handling to accept `--cache-dir` CLI argument with
sensible default. Removed global state in favor of explicit parameter passing.
Replaced custom argument parser with `@std/cli/parse-args`.

## Implementation

### Phase 1: Cache Directory Parameter Flow

**Removed global state** from cache and fetcher modules:

- `src/cache.ts`: Removed `let CACHE_DIR`, removed `setCacheDir()` function
- `src/fetcher.ts`: Removed `const CACHE_DIR`
- All cache/fetcher functions now accept `cacheDir: string` parameter

**Updated function signatures:**

```typescript
// Before
export async function checkCache(url: string): Promise<string | null>;
export async function saveToCache(
  url: string,
  content: string,
): Promise<string>;
export function getCachePath(url: string): string;
export async function fetchUrl(url: string): Promise<FetchResult>;

// After
export async function checkCache(
  url: string,
  cacheDir: string,
): Promise<string | null>;
export async function saveToCache(
  url: string,
  content: string,
  cacheDir: string,
): Promise<string>;
export function getCachePath(url: string, cacheDir: string): string;
export async function fetchUrl(
  url: string,
  cacheDir: string,
): Promise<FetchResult>;
```

### Phase 2: LSP Server Cache Directory Management

**Persistent cache directory reference** in `src/lsp_server.ts`:

- Global variable `let cacheDir: string = ""` holds configured directory
- `startLspServer(cacheDirArg: string)` sets initial value
- All handler functions use module-level `cacheDir` variable
- Passed to `checkCache()` and `fetchUrl()` calls

**Key design decision:** Cache directory set once at startup, used throughout
server lifetime. Eliminates passing parameter through every function call.

### Phase 3: CLI Argument Parsing

**Migrated from custom parser to `@std/cli/parse-args`** in `main.ts`:

```typescript
// Removed custom parseArgs() implementation (25 lines)
// Added dependency: jsr:@std/cli@1.0.25

import { parseArgs } from "@std/cli/parse-args";

const args = parseArgs(Deno.args, {
  string: ["cache-dir"],
});

const cacheDir = args["cache-dir"] ?? DEFAULT_CACHE_DIR;
await startLspServer(cacheDir);
```

**Benefits:**

- Type-safe: `string: ["cache-dir"]` ensures proper type inference
- Concise: 6 lines vs. 18 lines of custom implementation
- Feature-rich: Supports `boolean`, `collect`, `negatable` options if needed
- Tested: Proven implementation from Deno std library

### Phase 4: Test Updates

**Updated all test files** to pass `cacheDir` parameter:

- `src/cache_test.ts`: Define `CACHE_DIR = "/tmp/crawl-ls"`, pass to functions
- `src/fetcher_test.ts`: Add `CACHE_DIR` constant, pass to `fetchUrl()` and
  `getCachePath()`
- `src/cache_test.ts`: Helper functions `saveToCache()`, `getCachePath()`
  updated

**Test configuration remains unchanged:**

- All 18 tests passing
- No test isolation issues (each test uses isolated URLs)
- File cleanup handled by test teardown

## Technical Decisions

### Parameter vs. Global State

**Chosen: Explicit parameters** for cache/fetcher functions

- Pros: Pure functions, testable, composable
- Cons: More verbose function signatures
- Alternative: Global state (faster, but violates functional principles)
- Trade-off: Worth it for code clarity and testability

### LSP Server Module-Level Variable

**Chosen: Single `cacheDir` variable** in `src/lsp_server.ts`

- Pros: Set once at startup, used throughout handlers
- Cons: Slight global state within module
- Rationale: LSP server is inherently stateful; reasonable compromise
- Could extend to other server configuration (max retries, timeouts, etc.)

### Default Cache Directory

**Chosen: `/tmp/crawl-ls`** as default

- Rationale: Standard temporary directory for daemon processes
- User can override: `deno task dev -- --cache-dir ~/.cache/crawl-ls`
- Future: Could support `$XDG_CACHE_HOME` environment variable

### Dependency Choice: `@std/cli/parse-args`

**Chosen: Over custom implementation** and other libraries

- Rationale: Part of Deno std, well-tested, zero external deps
- Minimist-compatible API (but simpler)
- Small payload, proven stability

## Usage Examples

### Default cache directory

```bash
deno task dev
# Uses /tmp/crawl-ls
```

### Custom cache directory

```bash
deno task dev -- --cache-dir /var/cache/crawl-ls
```

### With Neovim

```lua
local crawl_ls_config = {
  cmd = { "deno", "task", "dev", "--", "--cache-dir", cache_dir },
  filetypes = { "markdown" },
}
```

## Test Results

**18/18 tests passing** across all modules:

```
✓ 2 cache tests (updated signatures)
✓ 7 fetcher tests (including getCachePath)
✓ 6 link_parser tests (unchanged)
✓ 3 lsp_server tests (unchanged)
```

Code formatting and linting checks pass (`deno task check:fix`).

## File Structure

```
main.ts                          - Updated: @std/cli/parse-args integration
src/
  cache.ts                       - Updated: cacheDir parameter
  cache_test.ts                  - Updated: pass cacheDir to all calls
  fetcher.ts                     - Updated: cacheDir parameter
  fetcher_test.ts                - Updated: pass cacheDir to all calls
  lsp_server.ts                  - Updated: module-level cacheDir variable
  lsp_server_test.ts             - Unchanged
  link_parser.ts                 - Unchanged
  link_parser_test.ts            - Unchanged
deno.jsonc                        - Updated: added @std/cli@1.0.25
```

## Key Technologies

### @std/cli/parse-args

- `parseArgs(args, options)` function
- Options: `string`, `boolean`, `collect`, `negatable`
- Returns: `Args` object with parsed values
- Type-safe with TypeScript integration

### Deno Task System

- `.nvim.lua` passes `--` before custom args to `deno task dev`
- Separator `--` passes remaining args to script
- Allows: `deno task dev -- --cache-dir /custom/path`

## What the Next Developer Needs to Know

### Adding CLI Options

To add a new option (e.g., `--log-level`):

1. Add to `parseArgs()` options in `main.ts`:
   ```typescript
   parseArgs(Deno.args, {
     string: ["cache-dir", "log-level"],
   });
   ```

2. Pass to `startLspServer()` as needed (or create new function)

3. Store in module-level variable if needed across handlers

### Cache Directory Requirements

- Must be writable by Deno process
- Created automatically by `ensureDir()` in `saveToCache()`
- Persists across server restarts
- No cleanup: old cached files remain indefinitely (future: add cleanup task)

### Testing with Custom Cache Directory

```typescript
// In tests, always use explicit CACHE_DIR constant
const CACHE_DIR = "/tmp/test-crawl-ls-" + Date.now();
await saveToCache(url, content, CACHE_DIR);
const cached = await checkCache(url, CACHE_DIR);
```

## Performance Notes

- Parameter passing has negligible overhead
- No lazy initialization needed (directory created on first write)
- No caching of directory path string (simple and correct)

## Known Limitations

- No environment variable support yet (`$XDG_CACHE_HOME`)
- No validation of cache directory path (could be invalid on startup)
- No automatic cleanup of old cache files
- No concurrent access control (assumes single LSP server instance)

## Lessons Learned

1. **Global state can be minimized**: Pure functions work well when parameters
   are explicit
2. **Standard library tools are worth using**: `@std/cli/parse-args` reduced
   code and improved reliability
3. **Module-level state is acceptable in stateful modules**: LSP server is
   inherently stateful, so one variable is reasonable
4. **Type safety from argument parsing**: `string` option prevents runtime
   errors from type confusion

## Next Steps

**Step 6: Environment Variable Support**

1. Support `$XDG_CACHE_HOME` environment variable for default
2. Parse other environment variables (e.g., `CRAWL_LS_LOG_LEVEL`)
3. Document configuration precedence: CLI args > env vars > defaults
4. Add validation of cache directory at startup

**Step 7: Cache Management**

1. Implement cache expiration (e.g., 7 days)
2. Add cache size limits
3. Implement cleanup CLI command
4. Add cache statistics (hit rate, total size)

---

**Status:** ✅ Complete - All tests passing, CLI argument handling working
