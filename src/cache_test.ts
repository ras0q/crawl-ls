/**
 * Tests for cache management.
 */

import { assertEquals } from "@std/assert";
import { checkCache, getCachePath, saveToCache } from "./cache.ts";

const CACHE_DIR = "/tmp/crawl-ls";

Deno.test({
  name: "Cache - check existing cached file",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const testUrl = "https://example.com/test-cache";
    const content = "# Test Content\n\nThis is a test.";

    // Create cache file
    const cachePath = getCachePath(testUrl, CACHE_DIR);
    await saveToCache(cachePath, content);

    // Check if cached
    const found = await checkCache(cachePath);
    assertEquals(found, true);
  },
});

Deno.test({
  name: "Cache - check non-existent file",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const cachePath = "non-existent.md";

    const found = await checkCache(cachePath);
    assertEquals(found, false);
  },
});
