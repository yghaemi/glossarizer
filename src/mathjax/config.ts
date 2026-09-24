// Configure MathJax before it loads (pre-config is picked up at MathJax startup).
// Adds mhchem, and turns on the accessible SVG pipeline (semantic enrichment +
// speech + braille) so math renders like the LibreTexts pages. The v4
// combined SVG component (tex-mml-svg.js) enables these by default; setting
// them explicitly keeps the behavior if a non-combined build is ever used.
//
// Runs as an import-time side effect so it executes as soon as this bundle is
// parsed — same timing requirement as script.js running before the MathJax
// <script> tag in the page <head>.
function configureMathJax(): void {
  const existing = window.MathJax || {};
  const loaderLoad: string[] = ([] as string[]).concat((existing.loader || {}).load || []);
  if (loaderLoad.indexOf("[tex]/mhchem") === -1) loaderLoad.push("[tex]/mhchem");

  const texPkgs = Object.assign({}, (existing.tex || {}).packages);
  const plus: string[] = ([] as string[]).concat(texPkgs["[+]"] || []);
  if (plus.indexOf("mhchem") === -1) plus.push("mhchem");
  texPkgs["[+]"] = plus;

  const existingOptions = existing.options || {};
  const existingMenu = existingOptions.menuOptions || {};
  const existingSettings = existingMenu.settings || {};

  window.MathJax = Object.assign(existing, {
    loader: Object.assign(existing.loader || {}, { load: loaderLoad }),
    tex: Object.assign(existing.tex || {}, { packages: texPkgs }),
    options: Object.assign(existingOptions, {
      menuOptions: Object.assign(existingMenu, {
        settings: Object.assign(existingSettings, {
          enrich: true,
          speech: true,
          braille: true,
        }),
      }),
    }),
  });
}

configureMathJax();
