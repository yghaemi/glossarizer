import type { GlossaryData, GlossaryItem } from "../../types";

// Determine which glossary items should be rendered on the current page,
// per the configured GlossaryConfig mode (see .claude/skills/rendering).
// Regardless of mode, the dedicated glossary page itself always shows every term.
//
// `outputPageId` is the page id encoded in the rendered #glossary-output
// element's own id (e.g. "glossary-output-8985" -> "8985", see target.ts).
// It's a second, template-provided signal for "this page is a CHAPTER
// group's target/destination page" — used alongside `group.targetPageId`
// rather than instead of it, since the two can come from different sources
// (backend config vs. page markup) and either can be the one that's current.
export function selectGlossaryItems(
  data: GlossaryData,
  pageId: string,
  outputPageId?: string | null,
): GlossaryItem[] {
  if (pageId === data.glossaryID) return data.items;

  switch (data.mode) {
    case "PAGE":
      return data.items.filter((item) => item.pages.includes(pageId));

    case "BACKMATTER":
      return [];

    case "CHAPTER": {
      const group = data.groups.find(
        (g) => g.targetPageId === pageId || (outputPageId != null && g.targetPageId === outputPageId),
      );
      if (!group) return [];
      return data.items.filter((item) => item.pages.some((page) => group.pageIds.includes(page)));
    }

    default:
      return [];
  }
}
