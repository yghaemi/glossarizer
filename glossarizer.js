(function () {
    // ---- Reuse helpers from script.js if available, else define locally ----
    function getLibrary(hostname) {
        if (typeof extract_library === 'function') return extract_library(hostname);
        var parts = hostname.split('.');
        return parts?.[0]?.toLowerCase() ?? 'dev';
    }

    function buildCacheKey(coverID, library) {
        if (typeof cacheKey === 'function') return cacheKey(coverID, library);
        return 'glossary-data-' + coverID + '-' + library;
    }

    // ---- Load Tippy + Popper from CDN if not already present ----
    function loadTippy(callback) {
        if (typeof tippy !== 'undefined') { callback(); return; }

        var popper = document.createElement('script');
        popper.src = 'https://unpkg.com/@popperjs/core@2/dist/umd/popper.min.js';
        popper.onload = function () {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/tippy.js@6/dist/tippy.css';
            document.head.appendChild(link);

            var tippyScript = document.createElement('script');
            tippyScript.src = 'https://unpkg.com/tippy.js@6/dist/tippy-bundle.umd.min.js';
            tippyScript.onload = callback;
            document.head.appendChild(tippyScript);
        };
        document.head.appendChild(popper);
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Reuse script.js's unescapeLatex if present, else local fallback
    function fixLatex(str) {
        if (typeof unescapeLatex === 'function') return unescapeLatex(str);
        return String(str)
            .replace(/\\\\\(/g, '\\(')
            .replace(/\\\\\)/g, '\\)')
            .replace(/\\\\\[/g, '\\[')
            .replace(/\\\\\]/g, '\\]')
            .replace(/\\\$/g, '$');
    }

    // Typeset math (incl. mhchem \ce) inside a tooltip once it's shown
    function typesetTooltip(el) {
        if (typeof MathJax === 'undefined' || !MathJax.typesetPromise) return;
        var run = function () {
            MathJax.typesetPromise([el]).catch(function (err) {
                console.error('MathJax tooltip typeset error:', err);
            });
        };
        // Ensure mhchem is available before typesetting.
        // Runtime MathJax.loader.load is variadic and expects string args (not an array).
        if (MathJax.loader && typeof MathJax.loader.load === 'function') {
            Promise.resolve(MathJax.loader.load('[tex]/mhchem')).then(run).catch(run);
        } else {
            run();
        }
    }

    function buildTooltipHTML(item) {
        var host = (typeof API_HOST !== 'undefined' ? API_HOST : '').replace(/\/api.*/, '').replace(/\/$/, '');
        var parts = [];

        if (item.imageUrl) {
            parts.push(
                '<div class="gt-img-wrap">' +
                    '<img src="' + escapeHTML(host + item.imageUrl) + '"' +
                    (item.altText ? ' alt="' + escapeHTML(item.altText) + '"' : '') +
                    ' style="max-width:100%;border-radius:4px;" />' +
                    (item.caption ? '<p class="gt-caption">' + escapeHTML(fixLatex(item.caption)) + '</p>' : '') +
                '</div>'
            );
        }

        parts.push('<p class="gt-definition">' + escapeHTML(fixLatex(item.definition)) + '</p>');

        if (item.source) {
            parts.push('<p class="gt-source">Source: ' + escapeHTML(item.source) + '</p>');
        }

        if (item.link) {
            parts.push(
                '<a class="gt-link" href="' + escapeHTML(item.link) + '" target="_blank" rel="noopener">' +
                    'Read more &rarr;' +
                '</a>'
            );
        }

        return '<div class="gt-tooltip">' + parts.join('') + '</div>';
    }

    // ---- Walk text nodes and wrap matched terms ----
    function glossarizeBody(termMap) {
        var terms = Object.keys(termMap);
        if (!terms.length) return;

        // Sort longest first so multi-word terms match before substrings
        var pattern = terms
            .sort(function (a, b) { return b.length - a.length; })
            .map(escapeRegex)
            .join('|');
        var regex = new RegExp('(?<![\\w])(' + pattern + ')(?![\\w])', 'gi');

        var skipTags = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'CODE', 'PRE']);

        var walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    var el = node.parentElement;
                    if (!el) return NodeFilter.FILTER_REJECT;
                    if (skipTags.has(el.tagName)) return NodeFilter.FILTER_REJECT;
                    if (el.closest('.glossary-term')) return NodeFilter.FILTER_REJECT;
                    if (regex.test(node.nodeValue)) {
                        regex.lastIndex = 0;
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    regex.lastIndex = 0;
                    return NodeFilter.FILTER_SKIP;
                }
            }
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
                    frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                }
                var span = document.createElement('span');
                span.className = 'glossary-term';
                span.textContent = match[0];
                span.style.cssText = 'border-bottom:1px dotted currentColor;cursor:help;';
                span.dataset.tippyContent = buildTooltipHTML(termMap[match[0].toLowerCase()]);
                frag.appendChild(span);
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
        var style = document.getElementById('gt-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'gt-styles';
            style.textContent = [
                '.gt-tooltip{max-width:280px;font-size:13px;line-height:1.5;}',
                '.gt-img-wrap{margin-bottom:8px;}',
                '.gt-caption{margin:4px 0 0;font-size:11px;color:#888;text-align:center;}',
                '.gt-definition{margin:0 0 6px;}',
                '.gt-source{margin:4px 0;font-size:11px;color:#aaa;}',
                '.gt-link{display:inline-block;margin-top:4px;font-size:12px;color:#4a90e2;text-decoration:none;}',
                '.gt-link:hover{text-decoration:underline;}',
                '.tippy-box[data-theme~="light"]{background-color:#f0f4ff;}'
            ].join('');
            document.head.appendChild(style);
        }

        tippy('.glossary-term', {
            delay: [500, 0],
            theme: 'light',
            allowHTML: true,
            interactive: true,
            maxWidth: 300,
            content: function (el) { return el.dataset.tippyContent; },
            onShown: function (instance) {
                typesetTooltip(instance.popper);
            }
        });
    }

    // ---- Read from cache and run ----
    function run(coverID) {
        var pageIdEl = document.getElementById('pageId');
        if (!pageIdEl) return;

        var pageId = pageIdEl.value;
        var library = getLibrary(window.location.hostname);
        var key = buildCacheKey(coverID, library);

        var raw = localStorage.getItem(key);
        if (!raw) return;

        var cached;
        try { cached = JSON.parse(raw); } catch (e) { return; }

        var data = cached.data;
        if (!data || !data.items || !data.items.length) return;

        var showAll = pageId === data.glossaryID;
        var items = showAll
            ? data.items
            : data.items.filter(function (item) { return item.pages.includes(pageId); });

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
        document.querySelectorAll('.glossary-term').forEach(function (span) {
            if (span._tippy) span._tippy.destroy();
            span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
        });
    }

    function tryRunFromCache() {
        var el = document.getElementById('coverID');
        if (el && el.value) run(el.value);
    }

    function init() {
        // Warm visit: coverID already in DOM from a previous load
        tryRunFromCache();

        // Fires after every render (both cached and fresh fetch paths)
        document.addEventListener('glossary:updated', function (e) {
            cleanup();
            run(e.detail.coverID);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
