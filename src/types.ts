export interface GlossaryItem {
  term: string;
  definition: string;
  pages: string[];
  aliases?: string[];
  author?: string;
  source?: string;
  link?: string;
  imageUrl?: string;
  altText?: string;
  caption?: string;
  imageLicense?: string;
  imageAuthor?: string;
  imageSource?: string;
  italic?: boolean;
}

export type GlossaryConfigMode = "PAGE" | "CHAPTER" | "BACKMATTER";

export interface GlossaryConfigGroup {
  groupID: string;
  pageIds: string[];
  targetPageId: string;
}

export interface GlossaryData {
  coverID: number;
  glossaryID: string;
  library: string;
  items: GlossaryItem[];
  lastUpdatedAt: string;
  mode: GlossaryConfigMode;
  groups: GlossaryConfigGroup[];
  showTermOnly: boolean;
}

export interface FreshnessResponse {
  coverID: string;
  latestUpdatedAt: string;
}

export interface GetGlossaryPageSuccess {
  err: false;
  data: GlossaryData;
}

export interface GetGlossaryPageError {
  err: true;
  errMsg: string;
}

export type FullGlossaryResponse = GetGlossaryPageSuccess | GetGlossaryPageError;

export interface CachedEntry<T> {
  timestamp: number;
  data: T;
}
