export {};

declare global {
  // `process.env.API_HOST` is never read at runtime in the browser — esbuild's
  // `define` (see scripts/build.mjs) replaces it with a string literal at
  // build time. Declared narrowly here instead of pulling in @types/node's
  // full NodeJS.Process global, which this DOM-only bundle has no other use for.
  const process: { env: { API_HOST?: string } };

  interface Window {
    // MathJax is loaded from a CDN <script> tag on the host page, not bundled;
    // treated as untyped since its shape depends on which components load.
    MathJax: any;

    // Registered by tooltip/lightbox.ts and tooltip/tabs.ts. These stay on
    // `window` because tooltip markup is generated as an HTML string (for
    // Tippy's allowHTML content) and wires up interactivity via inline
    // `onclick`/`onkeydown` attributes rather than addEventListener.
    _gtOpenLightbox: (src: string, alt: string, caption: string) => void;
    _gtCloseLightbox: () => void;
    _gtSwitchTab: (btn: HTMLElement, idx: number) => void;
    _gtTabKeydown: (
      e: KeyboardEvent,
      btn: HTMLElement,
      idx: number,
      total: number,
    ) => void;

    _gtLbTrigger?: Element | null;
    _gtLbKeyHandler?: ((e: KeyboardEvent) => void) | null;
  }
}
