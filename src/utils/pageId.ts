// Read the current page id from MindTouch's #mt-global-settings JSON blob.
//
// MindTouch renders exactly one of these per document, describing the page
// actually being viewed (not any transcluded page), so unlike the widget's
// #pageId hidden input it can't be duplicated by page inclusion — a plain
// document-wide lookup is correct here (no resolveOwnElement needed).
export function getGlobalSettingsPageId(): string | null {
  const el = document.getElementById("mt-global-settings");
  if (!el?.textContent) return null;
  try {
    const settings = JSON.parse(el.textContent) as { pageId?: string | number };
    return settings.pageId != null && settings.pageId !== "" ? String(settings.pageId) : null;
  } catch (err) {
    console.warn("[glossary] failed to parse #mt-global-settings:", err);
    return null;
  }
}
