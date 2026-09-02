export interface GlossaryItem {
  term: string;
  definition: string;
  pages: Array<string | number>;
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
}

export interface GlossaryData {
  coverID: string;
  library: string;
  glossaryID?: string;
  lastUpdatedAt?: string;
  items: GlossaryItem[];
}

export interface FreshnessResponse {
  coverID: string;
  latestUpdatedAt: string;
}

export interface FullGlossaryResponse {
  err?: boolean;
  data?: GlossaryData;
}

export interface CachedEntry<T> {
  timestamp: number;
  data: T;
}
