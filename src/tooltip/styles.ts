// Tippy's base stylesheet (from tippy.js/dist/tippy.css), inlined here instead
// of injecting a CDN <link> or wiring up a CSS build step, so the whole
// feature ships as one JS file with no extra network request. Only needs to
// be updated if the tippy.js dependency version bumps and its base CSS changes.
const TIPPY_BASE_CSS =
  ".tippy-box[data-animation=fade][data-state=hidden]{opacity:0}[data-tippy-root]{max-width:calc(100vw - 10px)}.tippy-box{position:relative;background-color:#333;color:#fff;border-radius:4px;font-size:14px;line-height:1.4;white-space:normal;outline:0;transition-property:transform,visibility,opacity}.tippy-box[data-placement^=top]>.tippy-arrow{bottom:0}.tippy-box[data-placement^=top]>.tippy-arrow:before{bottom:-7px;left:0;border-width:8px 8px 0;border-top-color:initial;transform-origin:center top}.tippy-box[data-placement^=bottom]>.tippy-arrow{top:0}.tippy-box[data-placement^=bottom]>.tippy-arrow:before{top:-7px;left:0;border-width:0 8px 8px;border-bottom-color:initial;transform-origin:center bottom}.tippy-box[data-placement^=left]>.tippy-arrow{right:0}.tippy-box[data-placement^=left]>.tippy-arrow:before{border-width:8px 0 8px 8px;border-left-color:initial;right:-7px;transform-origin:center left}.tippy-box[data-placement^=right]>.tippy-arrow{left:0}.tippy-box[data-placement^=right]>.tippy-arrow:before{left:-7px;border-width:8px 8px 8px 0;border-right-color:initial;transform-origin:center right}.tippy-box[data-inertia][data-state=visible]{transition-timing-function:cubic-bezier(.54,1.5,.38,1.11)}.tippy-arrow{width:16px;height:16px;color:#333}.tippy-arrow:before{content:\"\";position:absolute;border-color:transparent;border-style:solid}.tippy-content{position:relative;padding:5px 9px;z-index:1}";

const GT_STYLES = [
  ".gt-tooltip{width:380px;line-height:1;color:#000;font-size:1.1rem;border-radius:0.5rem;}",
  "@media(max-width:380px){.gt-tooltip{width:95vw;}}",
  ".gt-img-wrap{margin-bottom:8px;display:flex;justify-content:center;flex-direction:column;}",
  ".gt-caption{margin:4px 0 0;font-size:1.1rem!important,font-weight:normal!important;color:#4f4545;text-align:center;}",
  ".gt-definition{margin:0 0 6px; font-size:1.1rem!important; line-height:1.5!important; font-weight:normal!important;}",
  ".gt-source{margin:4px 0;font-size:1.1rem;color:#aaa;}",
  ".gt-link{display:inline-block;margin-top:4px;font-size:1.1rem;color:#4a90e2;text-decoration:none;}",
  ".gt-link:hover{text-decoration:underline;}",
  "button.glossary-term{border:none;border-bottom:1px dotted currentColor;background:none;padding:0;margin:0;font:inherit;color:inherit;cursor:help;display:inline;}",
  '.tippy-box[data-theme~="light"]{background-color:#ffffff; border-radius:0.2rem;  border:1px solid #4a90e2;}',
  '.tippy-box[data-theme~="light"] .tippy-content{padding:10px 14px;font-size:1.1rem; line-height:1;}',
  ".gt-tabs{display:flex;border-bottom:1px solid #ddd;margin-bottom:8px;}",
  ".gt-tab{flex:1;padding:4px 8px;border:none;background:none;cursor:pointer;font-size:1.1rem;color:#888;border-bottom:2px solid transparent;margin-bottom:-1px;}",
  ".gt-tab--active{color:#4a90e2;border-bottom:2px solid #4a90e2;}",
  ".gt-panel{display:none;}",
  ".gt-panel--active{display:block;}",
  ".gt-attr-row{margin:0 0 6px;font-size:1.1rem;display:flex;gap:6px;}",
  ".gt-attr-label{font-weight:600;color:#555;min-width:52px;}",
  ".gt-lb-trigger{background:none;border:none;padding:0;display:flex;justify-content:center;width:100%;cursor:zoom-in;}",
  ".gt-lb-thumb{max-width:100%;border-radius:4px;display:block;}",
  "#gt-lightbox{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;}",
  ".gt-lb-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.75);}",
  ".gt-lb-dialog{position:relative;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;gap:8px;}",
  ".gt-lb-img{max-width:90vw;max-height:80vh;border-radius:6px;box-shadow:0 8px 32px rgba(0,0,0,0.5);object-fit:contain;}",
  ".gt-lb-caption{color:#eee;font-size:1.1rem!important;font-weight:normal!important;text-align:center;max-width:80vw;}",
  ".gt-lb-close{position:absolute;top:-36px;right:0;background:none;border:none;color:#fff;font-size:1.1rem;line-height:1;cursor:pointer;padding:0 4px;}",
  ".gt-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}",
  ".glossary-term:focus-visible{outline:2px solid #4a90e2;outline-offset:2px;border-radius:2px;}",
  ".gt-tab:focus-visible{outline:2px solid #4a90e2;outline-offset:-2px;border-radius:2px;}",
  ".gt-panel:focus-visible{outline:2px solid #4a90e2;outline-offset:-2px;border-radius:2px;}",
  ".gt-lb-trigger:focus-visible{outline:2px solid #4a90e2;outline-offset:2px;border-radius:4px;}",
  ".gt-lb-close:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:2px;}",
  ".glossaryElement{font-size:1.1rem!important;}",
  ".glossary-term.gt-flash{animation:gt-flash 1.5s ease-out;}",
  "@keyframes gt-flash{0%{background:#ffe9a8;}100%{background:transparent;}}",
].join("");

export function ensureTooltipStyles(): void {
  if (!document.getElementById("gt-tippy-base-styles")) {
    const base = document.createElement("style");
    base.id = "gt-tippy-base-styles";
    base.textContent = TIPPY_BASE_CSS;
    document.head.appendChild(base);
  }
  if (!document.getElementById("gt-styles")) {
    const style = document.createElement("style");
    style.id = "gt-styles";
    style.textContent = GT_STYLES;
    document.head.appendChild(style);
  }
}
