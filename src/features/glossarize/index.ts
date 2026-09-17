import { resolveOwnElement } from "../../utils/scope";
import { cleanupGlossaryTerms } from "./cleanup";
import { runGlossarize } from "./run";
import { watchForContentChanges } from "./watch";

function tryRunFromCache(): void {
  const el = resolveOwnElement<HTMLInputElement>("#coverID");
  if (el?.value) runGlossarize(el.value);
}

function init(): void {
  // Warm visit: coverID already in DOM from a previous load
  tryRunFromCache();

  // Catch content added after the initial pass (see watch.ts).
  const watcher = watchForContentChanges();

  // Fires after every render (both cached and fresh fetch paths). Pause the
  // mutation watcher around our own cleanup+reglossarize edits so it doesn't
  // capture them as "new content" and redundantly re-run itself afterward.
  document.addEventListener("glossary:updated", (e) => {
    const detail = (e as CustomEvent<{ coverID: string; library: string }>).detail;
    watcher.pause();
    cleanupGlossaryTerms();
    runGlossarize(detail.coverID);
    watcher.resume();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
