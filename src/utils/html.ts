export function escapeHTML(str: unknown): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Escapes a value for safe embedding as a single-quoted JS string literal
// inside an inline HTML event handler attribute, e.g. onclick="fn('VALUE')".
// Apply this on top of an already escapeHTML()'d value — it only handles the
// JS-string-literal layer (backslash, quote, newlines), not the surrounding
// HTML-attribute layer.
export function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}
