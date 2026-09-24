import { CACHE_TTL } from "../config";
import type { CachedEntry } from "../types";

export function cacheKey(coverID: string, library: string): string {
  return `glossary-data-${coverID}-${library}`;
}

export function getCached<T>(coverID: string, library: string): T | null {
  try {
    const key = cacheKey(coverID, library);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const cached: CachedEntry<T> = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

export function setCache<T>(coverID: string, library: string, data: T): void {
  try {
    localStorage.setItem(
      cacheKey(coverID, library),
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch (e) {
    console.warn("Cache write failed:", e);
  }
}
