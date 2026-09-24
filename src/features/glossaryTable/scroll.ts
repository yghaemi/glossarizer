// Scroll to the first in-page appearance of a term (anchored by features/glossarize)
// and briefly highlight it, reflecting the anchor in the URL hash.
export function gtScrollToTerm(anchorId: string): boolean {
  const target = document.getElementById(anchorId);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.remove("gt-flash");
  // Force reflow so the animation restarts on repeated clicks
  void target.offsetWidth;
  target.classList.add("gt-flash");
  if (window.history?.replaceState) {
    window.history.replaceState(null, "", "#" + anchorId);
  }
  return true;
}

function closestTarget(e: Event): HTMLElement | null {
  const el = e.target as HTMLElement | null;
  return el?.closest?.(".glossaryTerm[data-gt-target]") ?? null;
}

document.addEventListener("click", (e) => {
  const el = closestTarget(e);
  if (!el) return;
  e.preventDefault();
  gtScrollToTerm(el.getAttribute("data-gt-target")!);
});

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
  const el = closestTarget(e);
  if (!el) return;
  e.preventDefault();
  gtScrollToTerm(el.getAttribute("data-gt-target")!);
});
