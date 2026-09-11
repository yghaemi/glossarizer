import type { GlossaryData, GlossaryItem } from "../../types";

// Determine which glossary items should be rendered on the current page,
// per the configured GlossaryConfig mode (see .claude/skills/rendering).
export function selectGlossaryItems(data: GlossaryData, pageId: string): GlossaryItem[] {
  switch (data.mode) {
    case "PAGE":
      return data.items.filter((item) => item.pages.includes(pageId));

    case "BACKMATTER":
      return pageId === data.glossaryID ? data.items : [];

    case "CHAPTER": {
      const group = data.groups.find((g) => g.targetPageId === pageId);
      if (!group) return [];
      return data.items.filter((item) => item.pages.some((page) => group.pageIds.includes(page)));
    }

    default:
      return [];
  }
}
