// Stable anchor id for a term, shared by the glossary list (features/glossaryTable)
// and in-page term wrapping (features/glossarize) so clicking a list entry can
// scroll to the term's first in-page occurrence.
export function termAnchorId(term: string): string {
  return (
    "gt-anchor-" +
    String(term)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}
