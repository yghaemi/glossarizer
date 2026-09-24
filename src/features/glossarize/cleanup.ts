interface ElementWithTippy extends HTMLElement {
  _tippy?: { destroy(): void };
}

// Cleanup previously injected tooltips and spans before re-running.
export function cleanupGlossaryTerms(): void {
  document.querySelectorAll<ElementWithTippy>(".glossary-term").forEach((el) => {
    el._tippy?.destroy();
    el.parentNode?.replaceChild(document.createTextNode(el.textContent ?? ""), el);
  });
}
