import { cleanupGlossaryTerms } from "./cleanup";
import { runGlossarize } from "./run";
import { watchForContentChanges } from "./watch";

function tryRunFromCache(): void {
  const el = document.getElementById("coverID") as HTMLInputElement | null;
  if (el?.value) runGlossarize(el.value);
}

function init(): void {
  // Warm visit: coverID already in DOM from a previous load
  tryRunFromCache();

  // Fires after every render (both cached and fresh fetch paths)
  document.addEventListener("glossary:updated", (e) => {
    const detail = (e as CustomEvent<{ coverID: string; library: string }>).detail;
    cleanupGlossaryTerms();
    runGlossarize(detail.coverID);
  });

  // Catch content added after the initial pass (see watch.ts).
  watchForContentChanges();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
