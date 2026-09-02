import { cacheKey } from "../../utils/cache";
import { extractLibrary } from "../../utils/library";
import { glossarizeBody } from "./body";
import { attachTooltips } from "../../tooltip/attach";
import type { CachedEntry, GlossaryData, GlossaryItem } from "../../types";

// The term map built by the most recent successful run, kept around so
// features/glossarize/watch.ts can glossarize newly-added content later
// without re-reading and re-parsing the cache on every DOM mutation.
let activeTermMap: Record<string, GlossaryItem> | null = null;

export function getActiveTermMap(): Record<string, GlossaryItem> | null {
  return activeTermMap;
}

// Read glossary data from cache and glossarize the page body against it.
export function runGlossarize(coverID: string): void {
  const pageIdEl = document.getElementById("pageId");
  if (!pageIdEl) return;

  const library = extractLibrary(window.location.hostname);
  const key = cacheKey(coverID, library);

  const raw = localStorage.getItem(key);
  if (!raw) return;

  let cached: CachedEntry<GlossaryData>;
  try {
    cached = JSON.parse(raw);
  } catch {
    return;
  }

  const data = cached.data;
  if (!data?.items?.length) return;

  const items = data.items;
  const termMap: Record<string, GlossaryItem> = {};

  // First pass: register canonical terms
  items.forEach((item) => {
    termMap[item.term.toLowerCase()] = item;
  });
  // Second pass: register aliases only when not already a term
  items.forEach((item) => {
    if (!Array.isArray(item.aliases)) return;
    item.aliases.forEach((alias) => {
      const key = alias.toLowerCase().trim();
      if (key && !termMap[key]) termMap[key] = item;
    });
  });

  activeTermMap = termMap;
  glossarizeBody(termMap);
  attachTooltips();
}
