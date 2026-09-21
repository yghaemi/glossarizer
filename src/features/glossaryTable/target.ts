import { resolveOwnElement, resolveOwnElements } from "../../utils/scope";

const OUTPUT_ID = "glossary-output";
// Template-provided output elements now carry a page-specific id (e.g.
// id="glossary-output-8985"), so the id itself can no longer be relied on as
// a stable selector — name="glossary-output" stays constant instead.
const OUTPUT_SELECTOR = '[name="glossary-output"]';
const FOOTER_SELECTOR = ".mt-content-footer";

// A template-provided output element's id encodes the page it was authored
// for (id="glossary-output-8985" -> "8985"); our own fallback-created
// element (see resolveGlossaryContainer) has no suffix and yields null.
export function outputElementPageId(el: HTMLElement | null): string | null {
  const prefix = OUTPUT_ID + "-";
  const id = el?.id ?? "";
  return id.startsWith(prefix) ? id.slice(prefix.length) : null;
}

// Find the template-provided output element without creating a fallback —
// used to read outputElementPageId() before deciding whether there's
// anything to render (see glossaryTable/index.ts).
export function findExistingGlossaryOutput(): HTMLElement | null {
  return resolveOwnElement<HTMLElement>(OUTPUT_SELECTOR);
}

// Resolve the element the glossary should render into: a template-provided
// output element is preferred, falling back to a container inserted
// immediately above the page footer. Both mathjax/typeset.ts and
// glossarize/body.ts key off name="glossary-output" to find/exclude this
// element, so the fallback carries the same attribute. The fallback's id
// also follows the same id="glossary-output-{pageId}" convention as a
// template-provided one, so outputElementPageId() works on it too. Looking
// it up first (instead of tracking a module-level reference) means repeated
// calls find and reuse the same element instead of appending duplicates.
// Lookups are scoped to this script's own instance (see utils/scope.ts)
// since MindTouch transclusion can duplicate this whole widget's markup
// into one document.
export function resolveGlossaryContainer(pageId: string): HTMLElement | null {
  const existing = findExistingGlossaryOutput();
  if (existing) return existing;

  const footer = resolveOwnElement<HTMLElement>(FOOTER_SELECTOR);
  if (!footer?.parentNode) return null;

  const container = document.createElement("div");
  container.id = `${OUTPUT_ID}-${pageId}`;
  container.setAttribute("name", OUTPUT_ID);
  footer.parentNode.insertBefore(container, footer);
  return container;
}

// A page can carry more than one output placeholder (e.g. one per chapter
// section), but only one is ever the render target for the current page.
// Empty any other one whose id names a *different* page (glossary-output-N
// where N != pageId) so it doesn't keep showing stale or template-default
// content. An id with no page suffix at all (legacy/no convention) is left
// alone — it isn't claiming to belong to any particular page.
export function clearOtherGlossaryOutputs(pageId: string): void {
  resolveOwnElements<HTMLElement>(OUTPUT_SELECTOR).forEach((el) => {
    const elPageId = outputElementPageId(el);
    if (elPageId != null && elPageId !== pageId) el.innerHTML = "";
  });
}
