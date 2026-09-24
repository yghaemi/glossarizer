import { glossarizeBody } from "./body";
import { attachTooltips } from "../../tooltip/attach";
import { getActiveTermMap } from "./run";

const DEBOUNCE_MS = 200;

// Own DOM we should never treat as "new prose to glossarize": already-wrapped
// terms, Tippy's popper/portal, and the lightbox. Without this a rescan of a
// button we just created (or Tippy's own tooltip element) would just chase
// its own tail.
const OWN_UI_SELECTOR = ".glossary-term, .tippy-box, [data-tippy-root], #gt-lightbox";

function nodeRoot(node: Node, contentRoot: Node): Element | null {
  const el = node instanceof Element ? node : node.parentElement;
  if (!el || !contentRoot.contains(el)) return null;
  if (el.closest(OWN_UI_SELECTOR)) return null;
  return el;
}

export interface WatchHandle {
  // Stop observing without discarding anything already queued — used to
  // shield the watcher from a caller's own large DOM edits (e.g. the
  // document-wide cleanup+reglossarize pass run on "glossary:updated") so
  // that pass's mutations aren't captured as "new content" and re-scanned.
  pause(): void;
  resume(): void;
}

// Glossarizing only runs once up front (on initial load / "glossary:updated").
// Content added afterward — lazy-loaded sections, widgets that render late,
// anything injected by other scripts on the page — would otherwise never get
// scanned. This watches the content root for such additions and glossarizes
// just the new nodes, leaving already-wrapped terms and any open tooltips
// elsewhere on the page untouched.
export function watchForContentChanges(): WatchHandle {
  const contentRoot = document.querySelector(".mt-content-container") ?? document.body;

  const pendingRoots = new Set<Element>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush(): void {
    timer = null;
    const termMap = getActiveTermMap();
    if (!termMap) {
      // Initial glossary fetch hasn't populated the term map yet — don't
      // drop what's queued, just try again shortly instead.
      timer = setTimeout(flush, DEBOUNCE_MS);
      return;
    }
    const roots = Array.from(pendingRoots);
    pendingRoots.clear();
    if (!roots.length) return;

    // Pause observing while we make our own edits, so wrapping the new terms
    // doesn't immediately re-trigger this same callback.
    observer.disconnect();
    roots.forEach((root) => glossarizeBody(termMap, root));
    attachTooltips();
    observer.takeRecords();
    observer.observe(contentRoot, { childList: true, subtree: true, characterData: true });
  }

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        const root = nodeRoot(node, contentRoot);
        if (root) pendingRoots.add(root);
      });
      if (record.type === "characterData") {
        const root = nodeRoot(record.target, contentRoot);
        if (root) pendingRoots.add(root);
      }
    });

    if (!pendingRoots.size) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE_MS);
  });

  observer.observe(contentRoot, { childList: true, subtree: true, characterData: true });

  return {
    pause(): void {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      observer.disconnect();
    },
    resume(): void {
      observer.takeRecords();
      observer.observe(contentRoot, { childList: true, subtree: true, characterData: true });
    },
  };
}
