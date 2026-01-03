/**
 * Cache management for fetched URLs.
 */

import { join } from "@std/path";
import { createHash } from "node:crypto";

/**
 * Generate a hash from a URL for cache filename.
 */
function generateCacheHash(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

/**
 * Get the cache file path for a given URL.
 */
function getCachePath(url: string, cacheDir: string): string {
  const hash = generateCacheHash(url);
  const filename = `${hash}.md`;
  return join(cacheDir, filename);
}

/**
 * Check if a URL is already cached.
 * Returns the file path if cached, null otherwise.
 */
export async function checkCache(
  url: string,
  cacheDir: string,
): Promise<string | null> {
  const cachePath = getCachePath(url, cacheDir);

  try {
    const stat = await Deno.stat(cachePath);
    if (stat.isFile) {
      return cachePath;
    }
  } catch (error) {
    // File doesn't exist or error accessing it
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }

  return null;
}
