// Baked in at build time from the API_HOST env var (see scripts/build.mjs) —
// set it in a local .env file (copy .env.example) to point a dev build at a
// local API server instead of production.
export const API_HOST = process.env.API_HOST || "https://commons.libretexts.org";

export const CACHE_TTL = 60 * 60 * 1000;

export const LICENSE_MAP: Record<string, string> = {
  arr: "All Rights Reserved",
  ccby: "CC-BY",
  ccbync: "CC-BY-NC",
  ccbyncnd: "CC-BY-NC-ND",
  ccbyncsa: "CC-BY-NC-SA",
  ccbynd: "CC-BY-ND",
  ccbysa: "CC-BY-SA",
  gnu: "GNU",
  gnudsl: "GNU DSL",
  gnufdl: "GNU FDL",
  gnugpl: "GNU GPL",
  publicdomain: "Public Domain",
  ck12: "CK-12 License",
  multiple: "Multiple Licenses",
};
