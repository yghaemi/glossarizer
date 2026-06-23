

(function () {
    const license_map = {
        'arr': 'All Rights Reserved',
        'ccby': 'CC-BY',
        'ccbync': 'CC-BY-NC',
        'ccbyncnd': 'CC-BY-NC-ND',
        'ccbyncsa': 'CC-BY-NC-SA',
        'ccbynd': 'CC-BY-ND',
        'ccbysa': 'CC-BY-SA',
        'gnu': 'GNU',
        'gnudsl': 'GNU DSL',
        'gnufdl': 'GNU FDL',
        'gnugpl': 'GNU GPL',
        'publicdomain': 'Public Domain',
        'ck12': 'CK-12 License',
        'multiple': 'Multiple Licenses',
    }
  // ---- Reuse helpers from script.js if available, else define locally ----
  function getLibrary(hostname) {
    if (typeof extract_library === "function") return extract_library(hostname);
    var parts = hostname.split(".");
    return parts?.[0]?.toLowerCase() ?? "dev";
  }

  function buildCacheKey(coverID, library) {
    if (typeof cacheKey === "function") return cacheKey(coverID, library);
    return "glossary-data-" + coverID + "-" + library;
  }

  // ---- Load Tippy + Popper from CDN if not already present ----
  function loadTippy(callback) {
    if (typeof tippy !== "undefined") {
      callback();
      return;
    }

    var popper = document.createElement("script");
    popper.src = "https://unpkg.com/@popperjs/core@2/dist/umd/popper.min.js";
    popper.onload = function () {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/tippy.js@6/dist/tippy.css";
      document.head.appendChild(link);

      var tippyScript = document.createElement("script");
      tippyScript.src =
        "https://unpkg.com/tippy.js@6/dist/tippy-bundle.umd.min.js";
      tippyScript.onload = callback;
      document.head.appendChild(tippyScript);
    };
    document.head.appendChild(popper);
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Reuse script.js's unescapeLatex if present, else local fallback
  function fixLatex(str) {
    if (typeof unescapeLatex === "function") return unescapeLatex(str);
    return String(str)
      .replace(/\\\\\(/g, "\\(")
      .replace(/\\\\\)/g, "\\)")
      .replace(/\\\\\[/g, "\\[")
      .replace(/\\\\\]/g, "\\]")
      .replace(/\\\$/g, "$");
  }

  // Typeset math (incl. mhchem \ce) inside a tooltip once it's shown
  function typesetTooltip(el) {
    if (typeof MathJax === "undefined" || !MathJax.typesetPromise) return;
    var run = function () {
      MathJax.typesetPromise([el]).catch(function (err) {
        console.error("MathJax tooltip typeset error:", err);
      });
    };
    // Ensure mhchem is available before typesetting.
    // Runtime MathJax.loader.load is variadic and expects string args (not an array).
    if (MathJax.loader && typeof MathJax.loader.load === "function") {
      Promise.resolve(MathJax.loader.load("[tex]/mhchem")).then(run).catch(run);
    } else {
      run();
    }
  }

  // ---- Lightbox ----
  window._gtOpenLightbox = function (src, alt, caption) {
    var existing = document.getElementById("gt-lightbox");
    if (existing) existing.remove();

    // Remember what had focus so we can return to it on close
    window._gtLbTrigger = document.activeElement;

    var overlay = document.createElement("div");
    overlay.id = "gt-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute(
      "aria-label",
      alt ? "Enlarged image: " + alt : "Enlarged image",
    );
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

    overlay
      .querySelector(".gt-lb-backdrop")
      .addEventListener("click", window._gtCloseLightbox);

    document.addEventListener(
      "keydown",
      (window._gtLbKeyHandler = function (e) {
        if (e.key === "Escape") {
          window._gtCloseLightbox();
          return;
        }
        // Focus trap: keep Tab cycling inside the dialog
        if (e.key === "Tab") {
          var lb = document.getElementById("gt-lightbox");
          if (!lb) return;
          var focusable = Array.from(
            lb.querySelectorAll('button, [tabindex]:not([tabindex="-1"])'),
          );
          if (!focusable.length) return;
          var first = focusable[0],
            last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }),
    );

    document.body.appendChild(overlay);
    // Move focus to the close button so screen readers announce the dialog
    var closeBtn = overlay.querySelector(".gt-lb-close");
    if (closeBtn) closeBtn.focus();
  };

  window._gtCloseLightbox = function () {
    var lb = document.getElementById("gt-lightbox");
    if (lb) lb.remove();
    document.removeEventListener("keydown", window._gtLbKeyHandler);
    // Return focus to the element that opened the lightbox
    if (
      window._gtLbTrigger &&
      typeof window._gtLbTrigger.focus === "function"
    ) {
      window._gtLbTrigger.focus();
      window._gtLbTrigger = null;
    }
  };

  // Global tab-switcher (needs to be reachable from inline onclick inside the tooltip HTML)
  window._gtSwitchTab = function (btn, idx) {
    var tooltip = btn.closest(".gt-tooltip");
    if (!tooltip) return;
    tooltip.querySelectorAll(".gt-tab").forEach(function (b, i) {
      var active = i === idx;
      b.classList.toggle("gt-tab--active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
      b.setAttribute("tabindex", active ? "0" : "-1");
    });
    tooltip.querySelectorAll(".gt-panel").forEach(function (p, i) {
      var active = i === idx;
      p.classList.toggle("gt-panel--active", active);
      p.setAttribute("aria-hidden", active ? "false" : "true");
    });
  };

  // Arrow-key navigation between tabs (ARIA tabs pattern)
  window._gtTabKeydown = function (e, btn, idx, total) {
    var tooltip = btn.closest(".gt-tooltip");
    if (!tooltip) return;
    var tabs = Array.from(tooltip.querySelectorAll(".gt-tab"));
    var newIdx = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown")
      newIdx = (idx + 1) % total;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      newIdx = (idx - 1 + total) % total;
    else if (e.key === "Home") newIdx = 0;
    else if (e.key === "End") newIdx = total - 1;
    if (newIdx >= 0) {
      e.preventDefault();
      window._gtSwitchTab(tabs[newIdx], newIdx);
      tabs[newIdx].focus();
    }
  };

  function buildTooltipHTML(item) {
    var host = (typeof API_HOST !== "undefined" ? API_HOST : "")
      .replace(/\/api.*/, "")
      .replace(/\/$/, "");

    // Unique ID prefix so multiple tooltips on a page don't share IDs
    var uid = "gt-" + (window._gtUid = (window._gtUid || 0) + 1);
    var term = escapeHTML(item.term || "");

    // ---- Definition panel ----
    var defParts = [];
    defParts.push(
      '<p class="gt-definition">' + escapeHTML(fixLatex(item.definition)) + "</p>",
    );

    // ---- Attribution panel ----
    function hasValue(v) {
      return v != null && String(v).trim() !== "";
    }

    var termAttrParts = [];
    if (hasValue(item.author)) {
      termAttrParts.push('<p class="gt-attr-row"><span class="gt-attr-label">Author</span>' + escapeHTML(item.author) + "</p>");
    }
    if (hasValue(item.source)) {
      var licenseText = (typeof license_map !== "undefined" && license_map[item.source])
        ? license_map[item.source]
        : item.source;
      termAttrParts.push('<p class="gt-attr-row"><span class="gt-attr-label">License</span>' + escapeHTML(licenseText) + "</p>");
    }
    if (hasValue(item.link)) {
      termAttrParts.push(
        '<a class="gt-link" href="' + escapeHTML(item.link) + '" target="_blank" rel="noopener"' +
        ' aria-label="Read more about ' + term + ' (opens in new tab)">' +
        'Read more <span aria-hidden="true">&rarr;</span></a>',
      );
    }
    var hasAttribution = termAttrParts.length > 0;

    // ---- Image panel ----
    var imgParts = [];
    var hasImage = hasValue(item.imageUrl);
    if (hasImage) {
      var imgSrc = escapeHTML(host + item.imageUrl);
      var imgAlt = hasValue(item.altText) ? escapeHTML(item.altText) : "";

      // Build caption string: "Caption (License; author via source)"
      var captionBase = hasValue(item.caption) ? escapeHTML(fixLatex(item.caption)) : "";
      var imgAttrParts = [];
      if (hasValue(item.imageLicense)) imgAttrParts.push(escapeHTML(item.imageLicense));
      if (hasValue(item.imageAuthor) && hasValue(item.imageSource))
        imgAttrParts.push(escapeHTML(item.imageAuthor) + " via " + escapeHTML(item.imageSource));
      else if (hasValue(item.imageAuthor))
        imgAttrParts.push(escapeHTML(item.imageAuthor));
      else if (hasValue(item.imageSource))
        imgAttrParts.push(escapeHTML(item.imageSource));
      var imgAttribution = imgAttrParts.length ? "(" + imgAttrParts.join("; ") + ")" : "";
      var imgCaption = [captionBase, imgAttribution].filter(Boolean).join(" ");

      imgParts.push(
        '<div class="gt-img-wrap">' +
          '<button class="gt-lb-trigger"' +
          " onclick=\"_gtOpenLightbox('" +
          imgSrc +
          "','" +
          imgAlt +
          "','" +
          imgCaption +
          "')\"" +
          ' aria-label="View image larger' +
          (imgAlt ? ": " + imgAlt : "") +
          '">' +
          '<img class="gt-lb-thumb" src="' +
          imgSrc +
          '" alt="" aria-hidden="true" />' +
          "</button>" +
          (imgCaption ? '<p class="gt-caption">' + imgCaption + "</p>" : "") +
          "</div>",
      );
    }

    // No image and no attribution — return simple layout without tabs
    if (!hasImage && !hasAttribution) {
      return '<div class="gt-tooltip">' + defParts.join("") + "</div>";
    }

    // ---- Tabbed layout (Definition always + optional Image + optional Attribution) ----
    var tabDefs = [{ id: uid + "-def", btnId: uid + "-btn0", label: "Definition", content: defParts.join("") }];
    if (hasImage) tabDefs.push({ id: uid + "-img", btnId: uid + "-btn" + tabDefs.length, label: "Image", content: imgParts.join("") });
    if (hasAttribution) tabDefs.push({ id: uid + "-attr", btnId: uid + "-btn" + tabDefs.length, label: "Attribution", content: termAttrParts.join("") });
    var total = tabDefs.length;

    var tabButtons = tabDefs.map(function (t, i) {
      return '<button class="gt-tab' + (i === 0 ? ' gt-tab--active' : '') + '"' +
        ' role="tab" id="' + t.btnId + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '"' +
        ' aria-controls="' + t.id + '" tabindex="' + (i === 0 ? '0' : '-1') + '"' +
        ' onclick="_gtSwitchTab(this,' + i + ')" onkeydown="_gtTabKeydown(event,this,' + i + ',' + total + ')">' +
        t.label + '</button>';
    }).join('');

    var tabPanels = tabDefs.map(function (t, i) {
      return '<div class="gt-panel' + (i === 0 ? ' gt-panel--active' : '') + '"' +
        ' role="tabpanel" id="' + t.id + '" aria-labelledby="' + t.btnId + '"' +
        (i !== 0 ? ' aria-hidden="true"' : '') + '>' +
        t.content + '</div>';
    }).join('');

    return '<div class="gt-tooltip">' +
      '<div class="gt-tabs" role="tablist" aria-label="' + term + ' sections">' + tabButtons + '</div>' +
      tabPanels +
      '</div>';
  }

  // ---- Walk text nodes and wrap matched terms ----
  function glossarizeBody(termMap) {
    var terms = Object.keys(termMap);
    if (!terms.length) return;

    // Sort longest first so multi-word terms match before substrings
    var pattern = terms
      .sort(function (a, b) {
        return b.length - a.length;
      })
      .map(escapeRegex)
      .join("|");
    var regex = new RegExp("(?<![\\w])(" + pattern + ")(?![\\w])", "gi");

    var skipTags = new Set([
      "SCRIPT",
      "STYLE",
      "TEXTAREA",
      "INPUT",
      "NOSCRIPT",
      "CODE",
      "PRE",
    ]);

    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          var el = node.parentElement;
          if (!el) return NodeFilter.FILTER_REJECT;
          if (skipTags.has(el.tagName)) return NodeFilter.FILTER_REJECT;
          if (el.closest(".glossary-term")) return NodeFilter.FILTER_REJECT;
          if (regex.test(node.nodeValue)) {
            regex.lastIndex = 0;
            return NodeFilter.FILTER_ACCEPT;
          }
          regex.lastIndex = 0;
          return NodeFilter.FILTER_SKIP;
        },
      },
    );

    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);

    nodes.forEach(function (textNode) {
      var text = textNode.nodeValue;
      var frag = document.createDocumentFragment();
      var lastIndex = 0;
      var matched = false;
      var match;
      regex.lastIndex = 0;

      while ((match = regex.exec(text)) !== null) {
        matched = true;
        if (match.index > lastIndex) {
          frag.appendChild(
            document.createTextNode(text.slice(lastIndex, match.index)),
          );
        }
        var termData = termMap[match[0].toLowerCase()];

        // Pre-render a plain-text, visually-hidden description so ANDI and
        // screen readers can always find the definition in the static DOM —
        // independent of whether Tippy has mounted its tooltip yet.
        var descId =
          "gt-desc-" + (window._gtDescId = (window._gtDescId || 0) + 1);
        var descEl = document.createElement("span");
        descEl.id = descId;
        descEl.className = "gt-sr-only";
        descEl.setAttribute("role", "tooltip");
        descEl.textContent =
          (termData.definition ? fixLatex(termData.definition) : "") +
          (termData.source ? " Source: " + termData.source : "");

        var span = document.createElement("span");
        span.className = "glossary-term";
        span.textContent = match[0];
        span.style.cssText =
          "border-bottom:1px dotted currentColor;cursor:help;";
        span.setAttribute("role", "button");
        span.setAttribute("tabindex", "0");
        span.setAttribute("aria-haspopup", "dialog");
        span.setAttribute("aria-expanded", "false");
        // Point directly at the always-present hidden description
        span.setAttribute("aria-describedby", descId);
        // Enter and Space must fire click so Tippy's 'click' trigger activates
        span.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        });
        span.dataset.tippyContent = buildTooltipHTML(termData);
        frag.appendChild(span);
        frag.appendChild(descEl); // must follow span in DOM
        lastIndex = match.index + match[0].length;
      }

      if (!matched) return;

      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function attachTooltips() {
    var style = document.getElementById("gt-styles");
    if (!style) {
      style = document.createElement("style");
      style.id = "gt-styles";
      style.textContent = [
        ".gt-tooltip{max-width:280px;line-height:1;color:#000; font-size:0.9rem; line-height:1; border-radius:0.5rem;}",
        ".gt-img-wrap{margin-bottom:8px;display:flex;justify-content:center;flex-direction:column;}",
        ".gt-caption{margin:4px 0 0;font-size:0.9rem!important,font-weight:normal!important;color:#4f4545;text-align:center;}",
        ".gt-definition{margin:0 0 6px; font-size:0.9rem!important; line-height:1.5!important; font-weight:normal!important;}",
        ".gt-source{margin:4px 0;font-size:0.9rem;color:#aaa;}",
        ".gt-link{display:inline-block;margin-top:4px;font-size:0.9rem;color:#4a90e2;text-decoration:none;}",
        ".gt-link:hover{text-decoration:underline;}",
        '.tippy-box[data-theme~="light"]{background-color:#ffffff; border-radius:0.2rem;  border:1px solid #4a90e2;}',
        '.tippy-box[data-theme~="light"] .tippy-content{padding:10px 14px;font-size:0.8rem; line-height:1;}',
        ".gt-tabs{display:flex;border-bottom:1px solid #ddd;margin-bottom:8px;}",
        ".gt-tab{flex:1;padding:4px 8px;border:none;background:none;cursor:pointer;font-size:0.8rem;color:#888;border-bottom:2px solid transparent;margin-bottom:-1px;}",
        ".gt-tab--active{color:#4a90e2;border-bottom:2px solid #4a90e2;}",
        ".gt-panel{display:none;}",
        ".gt-panel--active{display:block;}",
        ".gt-attr-row{margin:0 0 6px;font-size:0.85rem;display:flex;gap:6px;}",
        ".gt-attr-label{font-weight:600;color:#555;min-width:52px;}",
        ".gt-lb-trigger{background:none;border:none;padding:0;display:block;width:100%;cursor:zoom-in;}",
        ".gt-lb-thumb{max-width:100%;border-radius:4px;display:block;}",
        "#gt-lightbox{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;}",
        ".gt-lb-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.75);}",
        ".gt-lb-dialog{position:relative;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;gap:8px;}",
        ".gt-lb-img{max-width:90vw;max-height:80vh;border-radius:6px;box-shadow:0 8px 32px rgba(0,0,0,0.5);object-fit:contain;}",
        ".gt-lb-caption{color:#eee;font-size:0.85rem;text-align:center;max-width:80vw;}",
        ".gt-lb-close{position:absolute;top:-36px;right:0;background:none;border:none;color:#fff;font-size:28px;line-height:1;cursor:pointer;padding:0 4px;}",
        ".gt-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}",
        ".glossary-term:focus-visible{outline:2px solid #4a90e2;outline-offset:2px;border-radius:2px;}",
        ".gt-tab:focus-visible{outline:2px solid #4a90e2;outline-offset:-2px;border-radius:2px;}",
        ".gt-panel:focus-visible{outline:2px solid #4a90e2;outline-offset:-2px;border-radius:2px;}",
        ".gt-lb-trigger:focus-visible{outline:2px solid #4a90e2;outline-offset:2px;border-radius:4px;}",
        ".gt-lb-close:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:2px;}",
      ].join("");
      document.head.appendChild(style);
    }

    tippy(".glossary-term", {
      delay: [500, 0],
      theme: "light",
      allowHTML: true,
      interactive: true,
      maxWidth: 400,
      minWidth: 300,
      // 'click' makes Enter/Space keyboard activation work on role="button" spans
      trigger: "mouseenter focus click",
      // aria-describedby is set manually on each span pointing to the pre-rendered
      // hidden description — tell Tippy not to overwrite it
      aria: {
        content: null,
        expanded: "auto",
      },
      content: function (el) {
        return el.dataset.tippyContent;
      },
      onShow: function (instance) {
        instance.reference.setAttribute("aria-expanded", "true");

        // Collect all focusable elements inside the tooltip (visible only)
        function getFocusable() {
          return Array.from(
            instance.popper.querySelectorAll(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter(function (el) {
            return el.offsetParent !== null;
          });
        }

        instance._gtKbHandler = function (e) {
          var ref = instance.reference;

          // Tab from term → jump into first focusable tooltip element
          if (
            e.key === "Tab" &&
            !e.shiftKey &&
            document.activeElement === ref
          ) {
            var focusable = getFocusable();
            if (focusable.length) {
              e.preventDefault();
              focusable[0].focus();
            }
            return;
          }

          // Shift+Tab from first focusable in tooltip → return to term
          if (e.key === "Tab" && e.shiftKey) {
            var focusable = getFocusable();
            if (focusable.length && document.activeElement === focusable[0]) {
              e.preventDefault();
              ref.focus();
            }
            return;
          }

          // Escape from anywhere inside tooltip → close and return focus to term
          if (
            e.key === "Escape" &&
            instance.popper.contains(document.activeElement)
          ) {
            e.stopPropagation();
            instance.hide();
            ref.focus();
          }
        };
        document.addEventListener("keydown", instance._gtKbHandler);

        // Dismiss whenever focus moves to something outside the term + tooltip
        instance._gtFocusHandler = function (e) {
          var target = e.target;
          if (
            target !== instance.reference &&
            !instance.popper.contains(target)
          ) {
            instance.hide();
          }
        };
        document.addEventListener("focusin", instance._gtFocusHandler);
      },
      onHide: function (instance) {
        instance.reference.setAttribute("aria-expanded", "false");
        if (instance._gtKbHandler) {
          document.removeEventListener("keydown", instance._gtKbHandler);
          instance._gtKbHandler = null;
        }
        if (instance._gtFocusHandler) {
          document.removeEventListener("focusin", instance._gtFocusHandler);
          instance._gtFocusHandler = null;
        }
      },
      onShown: function (instance) {
        typesetTooltip(instance.popper);
      },
    });
  }

  // ---- Read from cache and run ----
  function run(coverID) {
    var pageIdEl = document.getElementById("pageId");
    if (!pageIdEl) return;

    var pageId = pageIdEl.value;
    var library = getLibrary(window.location.hostname);
    var key = buildCacheKey(coverID, library);

    var raw = localStorage.getItem(key);
    if (!raw) return;

    var cached;
    try {
      cached = JSON.parse(raw);
    } catch (e) {
      return;
    }

    var data = cached.data;
    if (!data || !data.items || !data.items.length) return;

    var showAll = pageId === data.glossaryID;
    var items = showAll
      ? data.items
      : data.items.filter(function (item) {
          return item.pages.includes(pageId);
        });

    if (!items.length) return;

    var termMap = {};
    items.forEach(function (item) {
      termMap[item.term.toLowerCase()] = item;
    });

    loadTippy(function () {
      glossarizeBody(termMap);
      attachTooltips();
    });
  }

  // ---- Cleanup previously injected tooltips and spans before re-running ----
  function cleanup() {
    document.querySelectorAll(".glossary-term").forEach(function (span) {
      if (span._tippy) span._tippy.destroy();
      // Remove the paired hidden description element
      var descId = span.getAttribute("aria-describedby");
      if (descId) {
        var descEl = document.getElementById(descId);
        if (descEl) descEl.remove();
      }
      span.parentNode.replaceChild(
        document.createTextNode(span.textContent),
        span,
      );
    });
  }

  function tryRunFromCache() {
    var el = document.getElementById("coverID");
    if (el && el.value) run(el.value);
  }

  function init() {
    // Warm visit: coverID already in DOM from a previous load
    tryRunFromCache();

    // Fires after every render (both cached and fresh fetch paths)
    document.addEventListener("glossary:updated", function (e) {
      cleanup();
      run(e.detail.coverID);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
