import { assertEquals } from "@std/assert";
import { assertExists } from "@std/assert";
import {
  fetchUrl,
  generateCacheHash,
  getCachePath,
  isContentTooShort,
  isExternalUrl,
} from "./fetcher.ts";
import { exists } from "@std/fs";

const CACHE_DIR = "/tmp/crawl-ls";

Deno.test({
  name: "fetchUrl should fetch a URL and create a Markdown file",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    // Use a URL with more substantial content
    const testUrl = "https://en.wikipedia.org/wiki/Test-driven_development";

    const result = await fetchUrl(testUrl, CACHE_DIR);

    // Assert that the result is not marked as external
    assertEquals(result.isExternal, false, `URL was marked as external`);

    // Assert that a file path was returned
    assertExists(result.path);
    assertEquals(result.path.length > 0, true);

    // Assert that the file actually exists
    const fileExists = await exists(result.path);
    assertEquals(fileExists, true);

    // Assert that the file contains some content
    const content = await Deno.readTextFile(result.path);
    assertEquals(content.length > 0, true);
    console.log(`Fetched content length: ${content.length} characters`);
  },
});

Deno.test("isExternalUrl should mark YouTube URLs as external", () => {
  const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const result = isExternalUrl(youtubeUrl);
  assertEquals(result, true);
});

Deno.test("isExternalUrl should mark Vimeo URLs as external", () => {
  const vimeoUrl = "https://vimeo.com/123456";
  const result = isExternalUrl(vimeoUrl);
  assertEquals(result, true);
});

Deno.test("isExternalUrl should not mark regular URLs as external", () => {
  const regularUrl = "https://example.com/article";
  const result = isExternalUrl(regularUrl);
  assertEquals(result, false);
});

Deno.test("isContentTooShort should detect short content", () => {
  const shortContent = "Too short";
  const longContent = "a".repeat(300);

  assertEquals(isContentTooShort(shortContent), true);
  assertEquals(isContentTooShort(longContent), false);
});

Deno.test("generateCacheHash should generate consistent hashes", () => {
  const url = "https://example.com/test";
  const hash1 = generateCacheHash(url);
  const hash2 = generateCacheHash(url);

  assertEquals(hash1, hash2);
  assertEquals(hash1.length, 64); // SHA-256 produces 64 hex characters
});

Deno.test("getCachePath should return correct path format", () => {
  const url = "https://example.com/test";
  const path = getCachePath(url, CACHE_DIR);

  assertEquals(path.includes("/tmp/crawl-ls/"), true);
  assertEquals(path.endsWith(".md"), true);
});
