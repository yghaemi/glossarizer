// ---- Config ----
const API_HOST = "https://commons.libretexts.org";
const page_url = window.location.hostname;
const CACHE_KEY = "glossary_data";
const CACHE_TTL = 60 * 60 * 1000;

// ---- Helpers ----
function extract_library(hostname) {
  if (hostname.includes("localhost")) {
    return "dev";
  }
  const parts = hostname.split(".");
  return parts?.[0]?.toLowerCase() ?? "dev";
}

// Stable anchor id for a term. Must match termAnchorId() in glossarizer.js.
function termAnchorId(term) {
  return (
    "gt-anchor-" +
    String(term)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

// Scroll to the first in-page appearance of a term (anchored by glossarizer.js)
// and briefly highlight it, reflecting the anchor in the URL hash.
function gtScrollToTerm(anchorId) {
  var target = document.getElementById(anchorId);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.remove("gt-flash");
  // Force reflow so the animation restarts on repeated clicks
  void target.offsetWidth;
  target.classList.add("gt-flash");
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, "", "#" + anchorId);
  }
  return true;
}

document.addEventListener("click", function (e) {
  var el = e.target.closest && e.target.closest(".glossaryTerm[data-gt-target]");
  if (!el) return;
  e.preventDefault();
  gtScrollToTerm(el.getAttribute("data-gt-target"));
});

document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
  var el = e.target.closest && e.target.closest(".glossaryTerm[data-gt-target]");
  if (!el) return;
  e.preventDefault();
  gtScrollToTerm(el.getAttribute("data-gt-target"));
});

function unescapeLatex(str) {
  return str
    .replace(/\\\\\(/g, "\\(") // \\( → \(
    .replace(/\\\\\)/g, "\\)") // \\) → \)
    .replace(/\\\\\[/g, "\\[") // \\[ → \[
    .replace(/\\\\\]/g, "\\]") // \\] → \]
    .replace(/\\\$/g, "$"); // \$ → $
}

// Configure mhchem before MathJax loads (pre-config is picked up at MathJax startup)
(function () {
  var existing = window.MathJax || {};
  var loaderLoad = [].concat((existing.loader || {}).load || []);
  if (loaderLoad.indexOf("[tex]/mhchem") === -1)
    loaderLoad.push("[tex]/mhchem");
  var texPkgs = Object.assign({}, (existing.tex || {}).packages);
  var plus = [].concat(texPkgs["[+]"] || []);
  if (plus.indexOf("mhchem") === -1) plus.push("mhchem");
  texPkgs["[+]"] = plus;
  window.MathJax = Object.assign(existing, {
    loader: Object.assign(existing.loader || {}, { load: loaderLoad }),
    tex: Object.assign(existing.tex || {}, { packages: texPkgs }),
  });
})();

function triggerMathJax() {
  function typeset() {
    MathJax.typesetPromise([document.getElementById("glossary-output")])
      .then(function () {
        console.log("MathJax typeset done");
      })
      .catch(function (err) {
        console.error("MathJax typeset error:", err);
      });
  }

  function typesetWhenReady() {
    if (typeof MathJax === "undefined" || !MathJax.typesetPromise) return false;
    typeset();
    return true;
  }

  // MathJax already loaded — ensure mhchem is present then typeset
  if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
    if (MathJax.loader && typeof MathJax.loader.load === "function") {
      Promise.resolve(MathJax.loader.load("[tex]/mhchem"))
        .then(function () {
          // Register package with the TeX input jax if not already present
          if (MathJax.config && MathJax.config.tex) {
            var p = (MathJax.config.tex.packages =
              MathJax.config.tex.packages || {});
            var plus = [].concat(p["[+]"] || []);
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
    return;
  }

  // Poll until page's MathJax is ready
  var interval = setInterval(function () {
    if (typesetWhenReady()) {
      clearInterval(interval);
      console.log("MathJax ready — typesetting glossary");
    }
  }, 100);
}

function renderTable(terms) {
  const library = extract_library(page_url);
  var rows = terms
    .map(function (item) {
      const pagesLinks = item.pages
        ?.map(
          (page, index) =>
            `<a href="https://${library}.libretexts.org/@go/page/${page}" target="_blank">(${index + 1})</a>`,
        )
        .join("");
      return (
        '<p class="glossaryElement">' +
        '<span class="glossaryTerm" role="link" tabindex="0" data-gt-target="' +
        termAnchorId(item.term) +
        '">' +
        unescapeLatex(item.term) +
        "</span>" +
        " | " +
        '<span class="glossaryDefinition">' +
        unescapeLatex(item.definition) +
        `<sup>${pagesLinks}</sup>` +
        "</span>" +
        "</p>"
      );
    })
    .join("");

  document.getElementById("glossary-output").innerHTML =
    '<div id="visibleGlossary">' + rows + "</div>";

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      console.log(
        "HTML going to MathJax:",
        document.getElementById("glossary-output").innerHTML,
      );
      triggerMathJax();
    });
  });
}

function cacheKey(coverID, library) {
  return "glossary-data-" + coverID + "-" + library;
}

function getCached(coverID, library) {
  try {
    var key = cacheKey(coverID, library);
    // var storages = localStorage.keys();
    // storages.forEach(function(storage) {
    //     console.log(storage);
    // });
    var raw = localStorage.getItem(key);
    if (!raw) return null;
    var cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return cached.data;
  } catch (e) {
    return null;
  }
}

function setCache(coverID, library, data) {
  try {
    localStorage.setItem(
      cacheKey(coverID, library),
      JSON.stringify({
        timestamp: Date.now(),
        data: data,
      }),
    );
  } catch (e) {
    console.warn("Cache write failed:", e);
  }
}

// ---- Main ----
document.addEventListener("DOMContentLoaded", function () {
  var _s = document.createElement("style");
  _s.textContent =
    ".glossaryTerm{font-weight:bold;cursor:pointer;color:#4a90e2;}" +
    ".glossaryTerm:hover{text-decoration:underline;}" +
    ".glossaryTerm:focus-visible{outline:2px solid #4a90e2;outline-offset:2px;border-radius:2px;}";
  document.head.appendChild(_s);

  const pageIdEl = document.getElementById("pageId");
  if (!pageIdEl) {
    document.getElementById("glossary-output").textContent =
      "Error: pageId element not found";
    return;
  }

  const pageId = pageIdEl.value;
  const library = extract_library(page_url);
  const url =
    API_HOST +
    "/api/v1/commons/glossary/page/" +
    pageId +
    "/library/" +
    library;
  function renderGlossary(data) {
    if (!data || !data.items || !data.items.length) {
      document.getElementById("glossary-output").textContent =
        "No glossary terms found.";
      return;
    }
    const showAll = pageId === data.glossaryID;
    renderTable(
      showAll
        ? data.items
        : data.items.filter((item) => item.pages.includes(pageId)),
    );
  }

  function fetchFull() {
    console.log("Fetching full glossary from:", url);
    return fetch(url, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then(function (response) {
        if (!response.ok)
          throw new Error("Request failed with status: " + response.status);
        return response.json();
      })
      .then(function (data) {
        if (!data || data.err === true || !data.data) {
          document.getElementById("glossary-output").textContent =
            "No glossary terms found.";
          return;
        }
        setCache(data.data.coverID, data.data.library, data.data);
        renderGlossary(data.data);
        document.dispatchEvent(
          new CustomEvent("glossary:updated", {
            detail: { coverID: data.data.coverID, library: data.data.library },
          }),
        );
      });
  }

  console.log("Checking glossary freshness from:", url);
  fetch(url, {
    method: "GET",
    headers: { "X-Requested-With": "XMLHttpRequest" },
  })
    .then(function (response) {
      if (!response.ok)
        throw new Error("Request failed with status: " + response.status);
      return response.json();
    })
    .then(function (details) {
      var coverInput = document.getElementById("coverID");
      if (coverInput) coverInput.value = details.coverID;
      var cached = getCached(details.coverID, library);
      if (
        cached &&
        new Date(cached.lastUpdatedAt) >= new Date(details.latestUpdatedAt)
      ) {
        console.log("Glossary loaded from cache");
        renderGlossary(cached);
        document.dispatchEvent(
          new CustomEvent("glossary:updated", {
            detail: { coverID: details.coverID, library: library },
          }),
        );
      } else {
        fetchFull();
      }
    })
    .catch(function (error) {
      document.getElementById("glossary-output").textContent =
        "Error: " + error.message;
    });
});
