/**
 * Fetcher module for CrawlLS.
 * Handles fetching URLs, extracting content, and converting to Markdown.
 * Pure function-based implementation following functional programming principles.
 */

import { Defuddle } from "defuddle/node";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import { createHash } from "node:crypto";

export interface FetchResult {
  path: string;
  isExternal: boolean;
}

const MIN_CONTENT_LENGTH = 200;

// Blocklist patterns for external resources
const EXTERNAL_PATTERNS = [
  /youtube\.com/,
  /youtu\.be/,
  /vimeo\.com/,
  /twitter\.com/,
  /x\.com/,
];

/**
 * Check if a URL matches external resource patterns.
 */
export function isExternalUrl(url: string): boolean {
  return EXTERNAL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Generate a hash from a URL for cache filename.
 */
export function generateCacheHash(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

/**
 * Get the cache file path for a given URL.
 */
export function getCachePath(url: string, cacheDir: string): string {
  const hash = generateCacheHash(url);
  const filename = `${hash}.md`;
  return join(cacheDir, filename);
}

/**
 * Save content to cache directory.
 */
export async function saveToCache(
  url: string,
  content: string,
  cacheDir: string,
): Promise<string> {
  await ensureDir(cacheDir);
  const filepath = getCachePath(url, cacheDir);
  await Deno.writeTextFile(filepath, content);
  return filepath;
}

/**
 * Fetch HTML from a URL with browser-like User-Agent.
 */
export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Convert HTML to Markdown using Defuddle.
 */
export async function htmlToMarkdown(
  html: string,
  url: string,
): Promise<string> {
  const result = await Defuddle(html, url, {
    markdown: true,
  });

  const escapeQuote = (str: string | undefined) =>
    str ? str.replace(/"/g, '\\"') : "";

  return `---
title: "${escapeQuote(result.title)}"
description: "${escapeQuote(result.description)}"
domain: "${escapeQuote(result.domain)}"
author: "${escapeQuote(result.author)}"
---

${result.content}`;
}

/**
 * Check if content is too short to be useful.
 */
export function isContentTooShort(content: string): boolean {
  return content.length < MIN_CONTENT_LENGTH;
}

/**
 * Fetch a URL and convert it to Markdown.
 * Returns the path to the cached Markdown file, or marks as external.
 *
 * This is the main entry point for the fetcher functionality.
 */
export async function fetchUrl(
  url: string,
  cacheDir: string,
): Promise<FetchResult> {
  // Check if URL matches external patterns
  if (isExternalUrl(url)) {
    return { path: "", isExternal: true };
  }

  // Fetch HTML
  const html = await fetchHtml(url);

  // Convert to Markdown
  const markdown = await htmlToMarkdown(html, url);

  // Check content length heuristic
  if (isContentTooShort(markdown)) {
    return { path: "", isExternal: true };
  }

  // Save to cache
  const cachePath = await saveToCache(url, markdown, cacheDir);

  return { path: cachePath, isExternal: false };
}
