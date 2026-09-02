import "./scroll"; // registers document-level click/keydown listeners for scroll-to-term
import { extractLibrary } from "../../utils/library";
import { getCached, setCache } from "../../utils/cache";
import { renderTable } from "./render";
import { glossaryUrl, fetchFreshness, fetchFullGlossary } from "./api";
import type { GlossaryData } from "../../types";

function dispatchUpdated(coverID: string, library: string): void {
  document.dispatchEvent(
    new CustomEvent("glossary:updated", { detail: { coverID, library } }),
  );
}

document.addEventListener("DOMContentLoaded", () => {
  // Remove any platform-injected legacy Glossarizer script/stylesheet so they
  // don't conflict with the local bundled version.
  document
    .querySelectorAll(
      'script[src*="libretextsGlossarizer"], link[href*="libretextsGlossarizer"]',
    )
    .forEach((el) => el.parentNode?.removeChild(el));

  const style = document.createElement("style");
  style.textContent =
    ".glossaryTerm{font-weight:bold;cursor:pointer;}" +
    ".glossaryTerm:focus-visible{outline-offset:2px;border-radius:2px;}";
  document.head.appendChild(style);

  const pageIdEl = document.getElementById("pageId") as HTMLInputElement | null;
  if (!pageIdEl) {
    console.error("[glossary] #pageId not found; skipping render");
    return;
  }

  const pageId = pageIdEl.value;
  const library = extractLibrary(window.location.hostname);
  const url = glossaryUrl(pageId, library);

  function renderGlossary(data: GlossaryData): void {
    try {
      if (!data?.items?.length) {
        console.warn("[glossary] no terms to render", data);
        const emptyOut = document.getElementById("glossary-output");
        if (emptyOut) emptyOut.textContent = "No glossary terms found.";
        else console.error("[glossary] #glossary-output not found");
        return;
      }
      const showAll =
        pageId === data.glossaryID ||
        window.location.pathname.endsWith("zz%3A_Back_Matter/20%3A_Glossary");
      renderTable(showAll ? data.items : data.items.filter((item) => item.pages.includes(pageId)));
    } catch (err) {
      console.error("[glossary] renderGlossary failed:", err);
    }
  }

  function fetchFull(): Promise<void> {
    return fetchFullGlossary(url)
      .then((data) => {
        if (!data || data.err === true || !data.data) {
          console.error("[glossary] full fetch returned empty/error payload", data);
          const out = document.getElementById("glossary-output");
          if (out) out.textContent = "No glossary terms found.";
          return;
        }
        setCache(data.data.coverID, data.data.library, data.data);
        data.data.items.sort((a, b) => a.term.localeCompare(b.term));
        renderGlossary(data.data);
        dispatchUpdated(data.data.coverID, data.data.library);
      })
      .catch((error) => console.error("[glossary] full fetch/render failed:", error));
  }

  console.log("Checking glossary freshness from:", url);
  fetchFreshness(url)
    .then((details) => {
      const coverInput = document.getElementById("coverID") as HTMLInputElement | null;
      if (coverInput) coverInput.value = details.coverID;
      else console.warn("[glossary] #coverID input not found in DOM");

      const cached = getCached<GlossaryData>(details.coverID, library);
      if (
        cached &&
        cached.lastUpdatedAt &&
        new Date(cached.lastUpdatedAt) >= new Date(details.latestUpdatedAt)
      ) {
        console.log("Glossary loaded from cache");
        cached.items.sort((a, b) => a.term.localeCompare(b.term));
        renderGlossary(cached);
        dispatchUpdated(details.coverID, library);
      } else {
        fetchFull();
      }
    })
    .catch((error) => console.error("[glossary] freshness check failed:", error));
});
