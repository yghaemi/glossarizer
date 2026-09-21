// Captured synchronously while this bundle's own <script> tag is still the
// currently-executing script — document.currentScript is only set during a
// classic script's synchronous top-level execution, so this MUST run at
// module load time and be stored for later use, not read inside a callback.
//
// This exists because the widget can be transcluded: MindTouch page
// inclusion can embed a page that carries this script into another page,
// duplicating this script's whole markup block (the <script> tag plus its
// #pageId/#coverID/#glossary-output elements) into one document. A plain
// document.getElementById then silently returns whichever copy comes first
// in the merged DOM, which may belong to the *included* page rather than
// the one actually being viewed. Scoping lookups to an ancestor of *this*
// <script> tag finds this instance's own elements instead.
const ownScript = document.currentScript as HTMLScriptElement | null;

export function resolveOwnElement<T extends Element = HTMLElement>(selector: string): T | null {
  let scope: Element | null = ownScript?.parentElement ?? null;
  while (scope) {
    const found = scope.querySelector<T>(selector);
    if (found) return found;
    scope = scope.parentElement;
  }
  // No ownScript (e.g. dynamically inserted, or type="module"/async in a way
  // that clears currentScript) or no ancestor had a match — fall back to a
  // plain document-wide lookup rather than failing outright.
  return document.querySelector<T>(selector);
}

// Same ancestor-walk as resolveOwnElement, but collects every match at the
// narrowest scope that has any, instead of stopping at the first — for
// operations that need to see all of this instance's own copies of
// something (e.g. clearing every other glossary-output placeholder on this
// page, see glossaryTable/target.ts), not just the nearest one.
export function resolveOwnElements<T extends Element = HTMLElement>(selector: string): T[] {
  let scope: Element | null = ownScript?.parentElement ?? null;
  while (scope) {
    const found = scope.querySelectorAll<T>(selector);
    if (found.length) return Array.from(found);
    scope = scope.parentElement;
  }
  return Array.from(document.querySelectorAll<T>(selector));
}
