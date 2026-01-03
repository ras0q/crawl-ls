/**
 * Cache management for fetched URLs.
 */

import { dirname, join } from "@std/path";
import { ensureDir } from "@std/fs";

const DENIED_SEARCH_PARAM_KEYS = [
  "utm_source",
];

/**
 * Get the cache file path for a given URL.
 */
export function getCachePath(urlString: string, cacheDir: string): string {
  const url = new URL(urlString);
  const pathname = url.pathname === "/" ? "" : url.pathname;

  let hasSearchParams = false;
  for (const key of url.searchParams.keys()) {
    if (!DENIED_SEARCH_PARAM_KEYS.includes(key)) {
      url.searchParams.delete(key);
      continue;
    }
    hasSearchParams = true;
  }

  const cacheKey = `${url.host}${pathname}${
    hasSearchParams ? "?" : ""
  }${url.searchParams}`;

  const filename = `${cacheKey}.md`;
  return join(cacheDir, filename);
}

/**
 * Check if a URL is already cached.
 * Returns the file path if cached, null otherwise.
 */
export async function checkCache(cachePath: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(cachePath);
    if (stat.isFile) {
      return true;
    }
  } catch (error) {
    // File doesn't exist or error accessing it
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }

  return false;
}

/**
 * Save content to cache directory.
 */
export async function saveToCache(
  cachePath: string,
  content: string,
): Promise<void> {
  await ensureDir(dirname(cachePath));
  await Deno.writeTextFile(cachePath, content);
}
