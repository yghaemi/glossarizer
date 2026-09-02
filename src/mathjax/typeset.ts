export function triggerMathJax(): void {
  function typeset() {
    const el = document.getElementById("glossary-output");
    if (!el) return;
    window.MathJax.typesetPromise([el])
      .then(() => console.log("MathJax typeset done"))
      .catch((err: unknown) => console.error("MathJax typeset error:", err));
  }

  function runTypeset() {
    const mj = window.MathJax;
    if (mj.loader && typeof mj.loader.load === "function") {
      Promise.resolve(mj.loader.load("[tex]/mhchem"))
        .then(() => {
          if (mj.config && mj.config.tex) {
            const p = (mj.config.tex.packages = mj.config.tex.packages || {});
            const plus: string[] = ([] as string[]).concat(p["[+]"] || []);
            if (plus.indexOf("mhchem") === -1) {
              plus.push("mhchem");
              p["[+]"] = plus;
            }
          }
          typeset();
        })
        .catch(typeset);
    } else {
      typeset();
    }
  }

  function whenReady(cb: () => void): boolean {
    if (typeof window.MathJax === "undefined" || !window.MathJax.typesetPromise) return false;
    if (window.MathJax.startup && window.MathJax.startup.promise) {
      window.MathJax.startup.promise.then(cb).catch(cb);
    } else {
      cb();
    }
    return true;
  }

  if (whenReady(runTypeset)) return;

  // Poll until page MathJax is ready (LibreTexts loads it async)
  const interval = setInterval(() => {
    if (whenReady(runTypeset)) {
      clearInterval(interval);
      console.log("MathJax ready — typesetting glossary");
    }
  }, 100);
}

// Typeset math (incl. mhchem \ce) inside a tooltip once it's shown.
// Waits for MathJax startup (v4 on LibreTexts loads async), clears any
// stale markup from a previous open, then lets the caller reposition the
// Tippy popper after SVG layout changes the tooltip size.
export function typesetTooltip(el: Element, done?: () => void): void {
  function run() {
    if (typeof window.MathJax === "undefined" || !window.MathJax.typesetPromise) {
      done?.();
      return;
    }
    const target = el.querySelector(".gt-tooltip") || el;
    try {
      window.MathJax.typesetClear?.([target]);
    } catch {
      // ignore — nothing to clear yet
    }
    window.MathJax.typesetPromise([target])
      .then(() => done?.())
      .catch((err: unknown) => {
        console.error("MathJax tooltip typeset error:", err);
        done?.();
      });
  }

  if (typeof window.MathJax === "undefined" || !window.MathJax.typesetPromise) {
    // Poll until MathJax is ready (loaded async on the page)
    let attempts = 0;
    const poll = setInterval(() => {
      if (typeof window.MathJax !== "undefined" && window.MathJax.typesetPromise) {
        clearInterval(poll);
        const ready = window.MathJax.startup?.promise ?? Promise.resolve();
        ready.then(run).catch(run);
      } else if (++attempts > 50) {
        clearInterval(poll);
      }
    }, 100);
    return;
  }

  const ready = window.MathJax.startup?.promise ?? Promise.resolve();
  ready.then(run).catch(run);
}
