import type { GlossaryData, GlossaryItem } from "../../types";

// Determine which glossary items should be rendered on the current page,
// per the configured GlossaryConfig mode (see .claude/skills/rendering).
// Regardless of mode, the dedicated glossary page itself always shows every term.
export function selectGlossaryItems(data: GlossaryData, pageId: string): GlossaryItem[] {
  if (pageId === data.glossaryID) return data.items;

  switch (data.mode) {
    case "PAGE":
      return data.items.filter((item) => item.pages.includes(pageId));

    case "BACKMATTER":
      return [];

    case "CHAPTER": {
      const group = data.groups.find((g) => g.targetPageId === pageId);
      if (!group) return [];
      return data.items.filter((item) => item.pages.some((page) => group.pageIds.includes(page)));
    }

    default:
      return [];
  }
}
