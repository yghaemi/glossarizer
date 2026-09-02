import { API_HOST, LICENSE_MAP } from "../config";
import { escapeHTML } from "../utils/html";
import { unescapeLatex } from "../utils/latex";
import type { GlossaryItem } from "../types";

let uidCounter = 0;

function hasValue(v: unknown): boolean {
  return v != null && String(v).trim() !== "";
}

interface TabDef {
  id: string;
  btnId: string;
  label: string;
  content: string;
}

export function buildTooltipHTML(item: GlossaryItem): string {
  const host = API_HOST.replace(/\/api.*/, "").replace(/\/$/, "");

  // Unique ID prefix so multiple tooltips on a page don't share IDs
  const uid = "gt-" + ++uidCounter;
  const term = escapeHTML(item.term || "");

  // ---- Definition panel ----
  // Match the previous behavior: unescape LaTeX delimiters only — do not
  // HTML-escape, or MathJax sees &lt; instead of < and raw delimiters fail to parse.
  const defParts = ['<p class="gt-definition">' + unescapeLatex(item.definition) + "</p>"];

  // ---- Attribution panel ----
  const termAttrParts: string[] = [];
  if (hasValue(item.author)) {
    termAttrParts.push(
      '<p class="gt-attr-row"><span class="gt-attr-label">Author: </span>' +
        escapeHTML(item.author) +
        "</p>",
    );
  }
  if (hasValue(item.source)) {
    const licenseText = (item.source && LICENSE_MAP[item.source]) || item.source || "";
    termAttrParts.push(
      '<p class="gt-attr-row"><span class="gt-attr-label">License: </span>' +
        escapeHTML(licenseText) +
        "</p>",
    );
  }
  if (hasValue(item.aliases) && (item.aliases?.length ?? 0) > 0) {
    termAttrParts.push(
      '<p class="gt-attr-row"><span class="gt-attr-label">Aliases: </span>' +
        escapeHTML(item.aliases!.join(", ")) +
        "</p>",
    );
  }
  if (hasValue(item.link)) {
    termAttrParts.push(
      '<a class="gt-link" href="' +
        escapeHTML(item.link) +
        '" target="_blank" rel="noopener"' +
        ' aria-label="Read more about ' +
        term +
        ' (opens in new tab)">' +
        'Read more <span aria-hidden="true">&rarr;</span></a>',
    );
  }
  const hasAttribution = termAttrParts.length > 0;

  // ---- Media panel ----
  const imgParts: string[] = [];
  const hasImage = hasValue(item.imageUrl);
  if (hasImage) {
    const imgSrc = escapeHTML(host + item.imageUrl);
    const imgAlt = hasValue(item.altText) ? escapeHTML(item.altText!) : "";

    // Build caption string: "Caption (License; author via source)"
    const captionBase = hasValue(item.caption) ? unescapeLatex(item.caption) : "";
    const imgAttrParts: string[] = [];
    if (hasValue(item.imageLicense)) {
      imgAttrParts.push(escapeHTML(LICENSE_MAP[item.imageLicense!] || item.imageLicense!));
    }
    if (hasValue(item.imageAuthor) && hasValue(item.imageSource)) {
      imgAttrParts.push(escapeHTML(item.imageAuthor!) + " via " + escapeHTML(item.imageSource!));
    } else if (hasValue(item.imageAuthor)) {
      imgAttrParts.push(escapeHTML(item.imageAuthor!));
    } else if (hasValue(item.imageSource)) {
      imgAttrParts.push(escapeHTML(item.imageSource!));
    }
    const imgAttribution = imgAttrParts.length ? "(" + imgAttrParts.join("; ") + ")" : "";
    const imgCaption = [captionBase, imgAttribution].filter(Boolean).join(" ");

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

  // ---- Tabbed layout (Definition always + optional Attribution + optional Media) ----
  const tabDefs: TabDef[] = [
    { id: uid + "-def", btnId: uid + "-btn0", label: "Definition", content: defParts.join("") },
  ];
  if (hasAttribution) {
    tabDefs.push({
      id: uid + "-attr",
      btnId: uid + "-btn" + tabDefs.length,
      label: "Attribution",
      content: termAttrParts.join(""),
    });
  }
  if (hasImage) {
    tabDefs.push({
      id: uid + "-img",
      btnId: uid + "-btn" + tabDefs.length,
      label: "Media",
      content: imgParts.join(""),
    });
  }
  const total = tabDefs.length;

  const tabButtons = tabDefs
    .map(
      (t, i) =>
        '<button class="gt-tab' +
        (i === 0 ? " gt-tab--active" : "") +
        '"' +
        ' role="tab" id="' +
        t.btnId +
        '" aria-selected="' +
        (i === 0 ? "true" : "false") +
        '"' +
        ' aria-controls="' +
        t.id +
        '" tabindex="' +
        (i === 0 ? "0" : "-1") +
        '"' +
        ' onclick="_gtSwitchTab(this,' +
        i +
        ')" onkeydown="_gtTabKeydown(event,this,' +
        i +
        "," +
        total +
        ')">' +
        t.label +
        "</button>",
    )
    .join("");

  const tabPanels = tabDefs
    .map(
      (t, i) =>
        '<div class="gt-panel' +
        (i === 0 ? " gt-panel--active" : "") +
        '"' +
        ' role="tabpanel" id="' +
        t.id +
        '" aria-labelledby="' +
        t.btnId +
        '"' +
        (i !== 0 ? ' aria-hidden="true"' : "") +
        ">" +
        t.content +
        "</div>",
    )
    .join("");

  return (
    '<div class="gt-tooltip">' +
    '<div class="gt-tabs" role="tablist" aria-label="' +
    term +
    ' sections">' +
    tabButtons +
    "</div>" +
    tabPanels +
    "</div>"
  );
}
