import { assertEquals, assertExists } from "@std/assert";
import { fetchUrl, isContentTooShort, isExternalUrl } from "./fetcher.ts";

Deno.test({
  name: "fetchUrl should fetch a URL and create a Markdown file",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    // Use a URL with more substantial content
    const testUrl = "https://en.wikipedia.org/wiki/Test-driven_development";

    const { isExternal, content } = await fetchUrl(testUrl);

    // Assert that the result is not marked as external
    assertEquals(isExternal, false, `URL was marked as external`);

    // Assert that a file path was returned
    assertExists(content);
    assertEquals(content.length > 0, true);
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
