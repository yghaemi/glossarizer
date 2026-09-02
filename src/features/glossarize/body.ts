import { escapeRegex, getLatexRanges, inLatexRange } from "../../utils/latex";
import { termAnchorId } from "../../utils/anchor";
import type { GlossaryItem } from "../../types";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "NOSCRIPT", "CODE", "PRE"]);

function defaultContentRoot(): Node {
  return document.querySelector(".mt-content-container") ?? document.body;
}

// Walk text nodes under `root` (the whole page content by default, or a
// narrower subtree for an incremental re-scan — see features/glossarize/watch.ts)
// and wrap matched terms in buttons.
export function glossarizeBody(
  termMap: Record<string, GlossaryItem>,
  root: Node = defaultContentRoot(),
): void {
  const terms = Object.keys(termMap);
  if (!terms.length) return;

  // Sort longest first so multi-word terms match before substrings
  const pattern = terms
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|");
  const regex = new RegExp(`(?<![\\w])(${pattern})(?![\\w])`, "gi");

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const el = (node as Text).parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
      if (el.closest(".glossary-term")) return NodeFilter.FILTER_REJECT;
      // Don't glossarize the rendered glossary list itself; anchors should
      // point at the page prose, not entries inside the list.
      if (el.closest("#glossary-output")) return NodeFilter.FILTER_REJECT;
      // Skip text nodes inside MathJax-rendered math containers.
      if (el.closest("mjx-container, .MathJax, .MathJax_Display")) return NodeFilter.FILTER_REJECT;
      if (regex.test(node.nodeValue ?? "")) {
        regex.lastIndex = 0;
        return NodeFilter.FILTER_ACCEPT;
      }
      regex.lastIndex = 0;
      return NodeFilter.FILTER_SKIP;
    },
  });

  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);

  // Only the first appearance (DOM order) of each canonical term gets an
  // anchor id, so the glossary list scrolls to that first occurrence. Checked
  // against the live DOM (not just this call's `anchored` set) so a later
  // incremental scan of newly added content doesn't collide with an anchor
  // assigned during an earlier full or incremental pass.
  const anchored: Record<string, boolean> = {};

  nodes.forEach((textNode) => {
    const text = textNode.nodeValue ?? "";
    const latexRanges = getLatexRanges(text);
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let matched = false;
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      if (inLatexRange(match.index, match[0].length, latexRanges)) continue;
      matched = true;
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const termData = termMap[match[0].toLowerCase()];

      // Use a real <button> — gets Enter/Space for free, correct accessible name
      // (the button text), and no need for role="button" or keydown hacks.
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "glossary-term";
      btn.textContent = match[0];
      btn.setAttribute("aria-haspopup", "dialog");
      btn.setAttribute("aria-expanded", "false");
      btn.dataset.gtItem = JSON.stringify(termData);

      const canonical = (termData.term || match[0]).toLowerCase();
      const anchorId = termAnchorId(termData.term || match[0]);
      if (!anchored[canonical] && !document.getElementById(anchorId)) {
        btn.id = anchorId;
        anchored[canonical] = true;
      }

      frag.appendChild(btn);
      lastIndex = match.index + match[0].length;
    }

    if (!matched) return;

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(frag, textNode);
  });
}
