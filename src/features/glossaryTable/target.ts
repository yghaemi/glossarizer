import { resolveOwnElement } from "../../utils/scope";

const OUTPUT_ID = "glossary-output";
const FOOTER_SELECTOR = ".mt-content-footer";

// Resolve the element the glossary should render into: a template-provided
// #glossary-output is preferred, falling back to a container inserted
// immediately above the page footer. Both mathjax/typeset.ts and
// glossarize/body.ts key off the #glossary-output id, so the fallback reuses
// it rather than inventing a new id. Looking the id up first (instead of
// tracking a module-level reference) means repeated calls find and reuse the
// same element instead of appending duplicates. Lookups are scoped to this
// script's own instance (see utils/scope.ts) since MindTouch transclusion
// can duplicate this whole widget's markup into one document.
export function resolveGlossaryContainer(): HTMLElement | null {
  const existing = resolveOwnElement<HTMLElement>(`#${OUTPUT_ID}`);
  if (existing) return existing;

  const footer = resolveOwnElement<HTMLElement>(FOOTER_SELECTOR);
  if (!footer?.parentNode) return null;

  const container = document.createElement("div");
  container.id = OUTPUT_ID;
  footer.parentNode.insertBefore(container, footer);
  return container;
}
