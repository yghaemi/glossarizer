import { typesetTooltip } from "../mathjax/typeset";

interface TippyBoxWithInstance extends Element {
  _gtTippy?: { popperInstance?: { update(): void } };
}

function updateTippyPopper(el: Element): void {
  const box = el.closest?.(".tippy-box") as TippyBoxWithInstance | null;
  box?._gtTippy?.popperInstance?.update();
}

// Global tab-switcher — reachable from inline onclick inside tooltip HTML (see tooltip/template.ts).
export function switchTab(btn: HTMLElement, idx: number): void {
  const tooltip = btn.closest<HTMLElement>(".gt-tooltip");
  if (!tooltip) return;

  tooltip.querySelectorAll<HTMLElement>(".gt-tab").forEach((b, i) => {
    const active = i === idx;
    b.classList.toggle("gt-tab--active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
    b.setAttribute("tabindex", active ? "0" : "-1");
  });
  tooltip.querySelectorAll<HTMLElement>(".gt-panel").forEach((p, i) => {
    const active = i === idx;
    p.classList.toggle("gt-panel--active", active);
    p.setAttribute("aria-hidden", active ? "false" : "true");
  });

  // Typeset math in the newly visible panel (hidden panels are skipped by MathJax)
  const panel = tooltip.querySelectorAll<HTMLElement>(".gt-panel")[idx];
  if (panel) {
    typesetTooltip(panel, () => updateTippyPopper(tooltip));
  }
}

// Arrow-key navigation between tabs (ARIA tabs pattern)
export function tabKeydown(
  e: KeyboardEvent,
  btn: HTMLElement,
  idx: number,
  total: number,
): void {
  const tooltip = btn.closest<HTMLElement>(".gt-tooltip");
  if (!tooltip) return;
  const tabs = Array.from(tooltip.querySelectorAll<HTMLElement>(".gt-tab"));
  let newIdx = -1;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") newIdx = (idx + 1) % total;
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") newIdx = (idx - 1 + total) % total;
  else if (e.key === "Home") newIdx = 0;
  else if (e.key === "End") newIdx = total - 1;
  if (newIdx >= 0) {
    e.preventDefault();
    switchTab(tabs[newIdx], newIdx);
    tabs[newIdx].focus();
  }
}

window._gtSwitchTab = switchTab;
window._gtTabKeydown = tabKeydown;
