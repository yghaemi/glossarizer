const OUTPUT_ID = "glossary-output";
const FOOTER_SELECTOR = ".elm-content-footer";

// Resolve the element the glossary should render into: a template-provided
// #glossary-output is preferred, falling back to a container appended as the
// last child of the page footer. Both mathjax/typeset.ts and
// glossarize/body.ts key off the #glossary-output id, so the fallback reuses
// it rather than inventing a new id. Looking the id up first (instead of
// tracking a module-level reference) means repeated calls find and reuse the
// same element instead of appending duplicates.
export function resolveGlossaryContainer(): HTMLElement | null {
  const existing = document.getElementById(OUTPUT_ID);
  if (existing) return existing;

  const footer = document.querySelector<HTMLElement>(FOOTER_SELECTOR);
  if (!footer) return null;

  const container = document.createElement("div");
  container.id = OUTPUT_ID;
  footer.appendChild(container);
  return container;
}
