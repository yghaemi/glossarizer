import type { GlossaryData, GlossaryItem } from "../../types";

// Determine which glossary items should be rendered on the current page,
// per the configured GlossaryConfig mode (see .claude/skills/rendering).
// Regardless of mode, the dedicated glossary page itself always shows every term.
//
// `outputPageId` is the page id encoded in the rendered #glossary-output
// element's own id (e.g. "glossary-output-8985" -> "8985", see target.ts).
// When it equals the current page, that's a template-level signal that this
// page should show its chapter's glossary here, independent of whether the
// backend's `groups` config has caught up to name this page as the group's
// targetPageId yet.
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
      // Primary: backend config says this page is the group's destination.
      let group = data.groups.find((g) => g.targetPageId === pageId);

      // Fallback: the page's own output element declares itself the
      // destination (id="glossary-output-{pageId}") even though no group's
      // targetPageId names it yet — render whichever group this page is a
      // member of.
      if (!group && outputPageId != null && outputPageId === pageId) {
        group = data.groups.find((g) => g.pageIds.includes(pageId));
      }

      if (!group) return [];
      return data.items.filter((item) => item.pages.some((page) => group.pageIds.includes(page)));
    }

    default:
      return [];
  }
}
