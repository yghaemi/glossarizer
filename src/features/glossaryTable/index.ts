import "./scroll"; // registers document-level click/keydown listeners for scroll-to-term
import { extractLibrary } from "../../utils/library";
import { getCached, setCache } from "../../utils/cache";
import { resolveOwnElement } from "../../utils/scope";
import { renderTable } from "./render";
import { selectGlossaryItems } from "./selectItems";
import { resolveGlossaryContainer } from "./target";
import { glossaryUrl, fetchFreshness, fetchFullGlossary } from "./api";
import type { GlossaryData } from "../../types";

function dispatchUpdated(coverID: string, library: string): void {
  document.dispatchEvent(
    new CustomEvent("glossary:updated", { detail: { coverID, library } }),
  );
}

// Remove any platform-injected legacy Glossarizer script/stylesheet so they
// don't conflict with the local bundled version. Only called once we actually
// have new glossary data to render — if the API call errors out, the legacy
// script is left in place so it can still serve the page.
function removeLegacyGlossarizer(): void {
  document
    .querySelectorAll(
      'script[src*="libretextsGlossarizer"], link[href*="libretextsGlossarizer"]',
    )
    .forEach((el) => el.parentNode?.removeChild(el));
}

document.addEventListener("DOMContentLoaded", () => {
  // Clear out any stale glossary table (e.g. left over from a prior render)
  // before this run renders its own.
  resolveOwnElement("#visibleGlossary")?.remove();

  const style = document.createElement("style");
  style.textContent =
    ".glossaryTerm{font-weight:bold;cursor:pointer;}" +
    ".glossaryTerm:focus-visible{outline-offset:2px;border-radius:2px;}";
  document.head.appendChild(style);

  const pageIdEl = resolveOwnElement<HTMLInputElement>("#pageId");
  if (!pageIdEl) {
    console.error("[glossary] #pageId not found; skipping render");
    return;
  }

  const pageId = pageIdEl.value;
  const library = extractLibrary(window.location.hostname);
  const url = glossaryUrl(pageId, library);

  function renderGlossary(data: GlossaryData): void {
    try {
      const items = selectGlossaryItems(data, pageId);

      if (!items.length) {
        console.warn("[glossary] no terms to render for this page", { pageId, mode: data.mode });
        // const existingOut = document.getElementById("glossary-output");
        // if (existingOut) existingOut.textContent = "No glossary terms found.";
        return;
      }

      const container = resolveGlossaryContainer();
      if (!container) {
        console.error("[glossary] no #glossary-output or footer found; skipping render");
        return;
      }
      renderTable(items, container);
    } catch (err) {
      console.error("[glossary] renderGlossary failed:", err);
    }
  }

  function fetchFull(): Promise<void> {
    return fetchFullGlossary(url)
      .then((data) => {
        if (!data || data.err === true || !data.data) {
          console.error("[glossary] full fetch returned empty/error payload", data);
          // const out = document.getElementById("glossary-output");
          // if (out) out.textContent = "No glossary terms found.";
          return;
        }
        removeLegacyGlossarizer();
        setCache(String(data.data.coverID), data.data.library, data.data);
        data.data.items.sort((a, b) => a.term.localeCompare(b.term));
        renderGlossary(data.data);
        dispatchUpdated(String(data.data.coverID), data.data.library);
      })
      .catch((error) => console.error("[glossary] full fetch/render failed:", error));
  }

  console.log("Checking glossary freshness from:", url);
  fetchFreshness(url)
    .then((details) => {
      const coverInput = resolveOwnElement<HTMLInputElement>("#coverID");
      if (coverInput) coverInput.value = details.coverID;
      else console.warn("[glossary] #coverID input not found in DOM");

      const cached = getCached<GlossaryData>(details.coverID, library);
      if (
        cached &&
        cached.lastUpdatedAt &&
        new Date(cached.lastUpdatedAt) >= new Date(details.latestUpdatedAt)
      ) {
        console.log("Glossary loaded from cache");
        removeLegacyGlossarizer();
        cached.items.sort((a, b) => a.term.localeCompare(b.term));
        renderGlossary(cached);
        dispatchUpdated(details.coverID, library);
      } else {
        fetchFull();
      }
    })
    .catch((error) => console.error("[glossary] freshness check failed:", error));
});
