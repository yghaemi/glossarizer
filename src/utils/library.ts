// Library is derived from the hostname subdomain, e.g. chem.libretexts.org -> "chem".
export function extractLibrary(hostname: string): string {
  if (hostname.includes("localhost")) return "dev";
  const parts = hostname.split(".");
  return parts?.[0]?.toLowerCase() ?? "dev";
}
