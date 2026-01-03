/**
 * Fetcher module for CrawlLS.
 * Handles fetching URLs, extracting content, and converting to Markdown.
 * Pure function-based implementation following functional programming principles.
 */

import { Defuddle } from "defuddle/node";

export interface FetchResult {
  content: string;
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
export async function fetchUrl(url: string): Promise<FetchResult> {
  if (isExternalUrl(url)) {
    return { content: "", isExternal: true };
  }

  const html = await fetchHtml(url);
  const markdown = await htmlToMarkdown(html, url);

  if (isContentTooShort(markdown)) {
    return { content: "", isExternal: true };
  }

  return { content: markdown, isExternal: false };
}
