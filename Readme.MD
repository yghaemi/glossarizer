# Glossarizer

Client-side glossary for LibreTexts pages. It loads glossary terms from the Commons API, renders a glossary list, and wraps matching terms in page content with accessible tooltips.

## Features

- Fetches glossary data by page ID and library, with localStorage caching (1 hour TTL)
- Renders an alphabetical glossary list into `#glossary-output`
- Glossarizes terms inside `.mt-content-container` (and its children)
- Interactive Tippy tooltips with definition, attribution, and media tabs
- MathJax support in glossary list and tooltips (including mhchem)
- Skips matches inside LaTeX, MathJax output, code/pre, scripts, and the glossary list itself
- Term aliases; longest-match-first so multi-word terms win over substrings
- Click a glossary term to scroll to its first in-page occurrence
- Image lightbox with keyboard focus trap
- Keyboard-accessible tabs and tooltips

## Files

| File | Purpose |
|------|---------|
| `script.js` | API fetch, cache, glossary list render, MathJax config |
| `glossarizer.js` | In-page term matching, Tippy tooltips, lightbox |
| `script.min.js` / `glossarizer.min.js` | Minified production builds |
| `LICENSE` | MIT |

## Required DOM

Pages need these elements for the scripts to run:

```html
<input type="hidden" id="pageId" value="6543" />
<input type="hidden" id="coverID" />
<div class="mt-content-container"><!-- page prose --></div>
<div id="glossary-output"></div>
```

Load order (source or minified):

```html
<script src="script.js"></script>
<script src="glossarizer.js"></script>
```

MathJax should be available on the page (LibreTexts loads it, or include it yourself). Tippy/Popper are loaded from CDN by `glossarizer.js` if missing.

## API

Base host defaults to `https://commons.libretexts.org` (override `API_HOST` in `script.js` for local development).

| Method | Endpoint | Use |
|--------|----------|-----|
| `GET` | `/api/v1/commons/glossary/page/{pageId}/library/{library}` | Freshness check; returns `coverID` and `latestUpdatedAt` |
| `POST` | same path | Full glossary payload (`items`, `coverID`, `library`, …) |

Library is derived from the hostname subdomain (e.g. `chem.libretexts.org` → `chem`; localhost → `dev`).

Cache key: `glossary-data-{coverID}-{library}`.

## Build

Write the current short commit hash, then minify:

```bash
git rev-parse --short HEAD > version.txt

npx terser glossarizer.js -o glossarizer.min.js
npx terser script.js -o script.min.js
```

`index.html` and `version.txt` are local-only (listed in `.gitignore`).

## License

MIT — see [LICENSE](LICENSE).
