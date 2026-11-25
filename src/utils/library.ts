// Known LibreTexts libraries. Only these keys are ever sent to the API.
export const LIBRARIES = [
  { key: "bio", text: "Biology" },
  { key: "biz", text: "Business" },
  { key: "chem", text: "Chemistry" },
  { key: "dev", text: "Development" },
  { key: "eng", text: "Engineering" },
  { key: "espanol", text: "Español" },
  { key: "geo", text: "Geosciences" },
  { key: "human", text: "Humanities" },
  { key: "k12", text: "K12 Education" },
  { key: "math", text: "Mathematics" },
  { key: "med", text: "Health" },
  { key: "phys", text: "Physics" },
  { key: "socialsci", text: "Social Science" },
  { key: "stats", text: "Statistics" },
  { key: "workforce", text: "Workforce" },
] as const;

export type LibraryKey = (typeof LIBRARIES)[number]["key"];

const LIBRARY_KEYS: ReadonlySet<string> = new Set(LIBRARIES.map((l) => l.key));

// Library is derived from the hostname subdomain, e.g. chem.libretexts.org -> "chem".
//
// The leading token is split on "." or "-" so proxied hosts also resolve:
// Google Translate serves chem.libretexts.org as chem-libretexts-org.translate.goog.
// Returns null for hosts that don't map to a known library, so callers can
// skip the API request instead of sending a bogus library param.
export function extractLibrary(hostname: string): LibraryKey | null {
  const host = hostname.toLowerCase();
  if (host.includes("localhost")) return "dev";
  const candidate = host.split(/[.-]/)[0] ?? "";
  return LIBRARY_KEYS.has(candidate) ? (candidate as LibraryKey) : null;
}
