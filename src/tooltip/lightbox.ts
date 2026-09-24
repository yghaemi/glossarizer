// Attached to `window` because the trigger button lives inside tooltip HTML
// built as a string (see tooltip/template.ts) and wired up via inline
// onclick, not addEventListener.
export function openLightbox(src: string, alt: string, caption: string): void {
  document.getElementById("gt-lightbox")?.remove();

  // Remember what had focus so we can return to it on close
  window._gtLbTrigger = document.activeElement;

  const overlay = document.createElement("div");
  overlay.id = "gt-lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", alt ? "Enlarged image: " + alt : "Enlarged image");
  overlay.innerHTML =
    '<div class="gt-lb-backdrop"></div>' +
    '<div class="gt-lb-dialog">' +
    '<button class="gt-lb-close" onclick="_gtCloseLightbox()" aria-label="Close enlarged image">&times;</button>' +
    '<img class="gt-lb-img" src="' +
    src +
    '" alt="' +
    (alt || "") +
    '" />' +
    (caption ? '<p class="gt-lb-caption">' + caption + "</p>" : "") +
    "</div>";

  overlay.querySelector(".gt-lb-backdrop")?.addEventListener("click", closeLightbox);

  window._gtLbKeyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeLightbox();
      return;
    }
    // Focus trap: keep Tab cycling inside the dialog
    if (e.key === "Tab") {
      const lb = document.getElementById("gt-lightbox");
      if (!lb) return;
      const focusable = Array.from(
        lb.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])'),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  document.addEventListener("keydown", window._gtLbKeyHandler);

  document.body.appendChild(overlay);
  // Move focus to the close button so screen readers announce the dialog
  overlay.querySelector<HTMLElement>(".gt-lb-close")?.focus();
}

export function closeLightbox(): void {
  document.getElementById("gt-lightbox")?.remove();
  if (window._gtLbKeyHandler) {
    document.removeEventListener("keydown", window._gtLbKeyHandler);
    window._gtLbKeyHandler = null;
  }
  // Return focus to the element that opened the lightbox
  const trigger = window._gtLbTrigger as HTMLElement | null;
  if (trigger && typeof trigger.focus === "function") {
    trigger.focus();
    window._gtLbTrigger = null;
  }
}

window._gtOpenLightbox = openLightbox;
window._gtCloseLightbox = closeLightbox;
