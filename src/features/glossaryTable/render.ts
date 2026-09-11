import { extractLibrary } from "../../utils/library";
import { termAnchorId } from "../../utils/anchor";
import { unescapeLatex } from "../../utils/latex";
import { triggerMathJax } from "../../mathjax/typeset";
import type { GlossaryItem } from "../../types";

export function renderTable(
  terms: GlossaryItem[],
  container: HTMLElement,
  showTermOnly: boolean,
): void {
  try {
    if (!Array.isArray(terms)) {
      console.error("[glossary] render failed: terms is not an array", terms);
      return;
    }

    const library = extractLibrary(window.location.hostname);
    const rows = terms
      .map((item) => {
        try {
          const termSpan =
            '<span class="glossaryTerm" role="link" tabindex="0" data-gt-target="' +
            termAnchorId(item.term) +
            '">' +
            unescapeLatex(item.term) +
            "</span>";
          if (showTermOnly) {
            return '<p class="glossaryElement">' + termSpan + "</p>";
          }
          const pagesLinks =
            item.pages
              ?.map(
                (page, index) =>
                  `<a href="https://${library}.libretexts.org/@go/page/${page}#${termAnchorId(item.term)}" target="_blank">(${index + 1})</a>`,
              )
              .join("") ?? "";
          return (
            '<p class="glossaryElement">' +
            termSpan +
            " | " +
            '<span class="glossaryDefinition">' +
            unescapeLatex(item.definition) +
            `<sup>${pagesLinks}</sup>` +
            "</span>" +
            "</p>"
          );
        } catch (itemErr) {
          console.error("[glossary] failed to render term:", item?.term, itemErr);
          return "";
        }
      })
      .join("");

    container.innerHTML = '<div id="visibleGlossary">' + rows + "</div>";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          triggerMathJax();
        } catch (mjErr) {
          console.error("[glossary] MathJax typeset failed:", mjErr);
        }
      });
    });
  } catch (err) {
    console.error("[glossary] renderTable failed:", err);
  }
}
