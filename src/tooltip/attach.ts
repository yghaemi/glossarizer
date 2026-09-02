import tippy, { type Instance } from "tippy.js";
import { buildTooltipHTML } from "./template";
import { typesetTooltip } from "../mathjax/typeset";
import { ensureTooltipStyles } from "./styles";
import type { GlossaryItem } from "../types";

interface GtInstanceExtras {
  _gtKbHandler?: (e: KeyboardEvent) => void;
  _gtFocusHandler?: (e: FocusEvent) => void;
}

interface ElementWithTippy extends HTMLElement {
  _tippy?: unknown;
}

// Idempotent: only wires up `.glossary-term` buttons that don't already have
// a Tippy instance, so calling this again after an incremental glossarize
// pass (see features/glossarize/watch.ts) doesn't stack duplicate tooltips
// on terms that were already wrapped.
export function attachTooltips(root: ParentNode = document): void {
  const targets = Array.from(root.querySelectorAll<ElementWithTippy>(".glossary-term")).filter(
    (el) => !el._tippy,
  );
  if (!targets.length) return;

  ensureTooltipStyles();

  tippy(targets, {
    animation: false,
    delay: [500, 0],
    theme: "light",
    allowHTML: true,
    interactive: true,
    maxWidth: 400,
    // No "focus" trigger — opening on focus interrupts screen reader reading order.
    // The native <button> handles Enter/Space via "click" automatically.
    trigger: "mouseenter click",
    hideOnClick: true,
    aria: {
      content: "describedby", // sets aria-describedby on the button while open
      expanded: "auto",
    },
    content(el) {
      // Build HTML on open so LaTeX backslashes (e.g. \%) are not corrupted
      // by storing pre-rendered markup in a data-* attribute.
      try {
        const raw = (el as HTMLElement).dataset.gtItem;
        return raw ? buildTooltipHTML(JSON.parse(raw) as GlossaryItem) : "";
      } catch {
        return "";
      }
    },
    onShow(instance) {
      instance.reference.setAttribute("aria-expanded", "true");
      if (instance.popper) (instance.popper as Element & { _gtTippy?: Instance })._gtTippy = instance;

      // Collect all focusable elements inside the tooltip (visible only)
      function getFocusable(): HTMLElement[] {
        return Array.from(
          instance.popper.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);
      }

      const extras = instance as Instance & GtInstanceExtras;

      extras._gtKbHandler = (e: KeyboardEvent) => {
        const ref = instance.reference as HTMLElement;

        // Tab from term → jump into first focusable tooltip element
        if (e.key === "Tab" && !e.shiftKey && document.activeElement === ref) {
          const focusable = getFocusable();
          if (focusable.length) {
            e.preventDefault();
            focusable[0].focus();
          }
          return;
        }

        // Shift+Tab from first focusable in tooltip → return to term
        if (e.key === "Tab" && e.shiftKey) {
          const focusable = getFocusable();
          if (focusable.length && document.activeElement === focusable[0]) {
            e.preventDefault();
            ref.focus();
          }
          return;
        }

        // Escape from the button or anywhere inside the tooltip → close
        if (e.key === "Escape") {
          const active = document.activeElement;
          if (active === ref || instance.popper.contains(active)) {
            e.preventDefault();
            e.stopPropagation();
            instance.hide();
            ref.focus();
          }
        }
      };
      document.addEventListener("keydown", extras._gtKbHandler);

      // Dismiss whenever focus moves to something outside the term + tooltip
      extras._gtFocusHandler = (e: FocusEvent) => {
        const target = e.target as Node;
        if (target !== instance.reference && !instance.popper.contains(target)) {
          instance.hide();
        }
      };
      document.addEventListener("focusin", extras._gtFocusHandler);
    },
    onHide(instance) {
      instance.reference.setAttribute("aria-expanded", "false");
      const extras = instance as Instance & GtInstanceExtras;
      if (extras._gtKbHandler) {
        document.removeEventListener("keydown", extras._gtKbHandler);
        extras._gtKbHandler = undefined;
      }
      if (extras._gtFocusHandler) {
        document.removeEventListener("focusin", extras._gtFocusHandler);
        extras._gtFocusHandler = undefined;
      }
    },
    // onMount fires after the popper is attached to the DOM.
    // onShown (fires after CSS transition) is unreliable with animation:false.
    onMount(instance) {
      typesetTooltip(instance.popper, () => {
        instance.popperInstance?.update();
        instance.popper.querySelector(".gt-tooltip")?.classList.add("gt-ready");
      });
    },
  });
}
