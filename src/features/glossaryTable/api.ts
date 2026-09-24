import { API_HOST } from "../../config";
import type { FreshnessResponse, FullGlossaryResponse } from "../../types";

const DEKI_TOKEN_URL = "https://cdn.libretexts.net/authenBrowser.json";

interface DekiPageResponse {
  "@id"?: string | number;
}

export function glossaryUrl(pageId: string, library: string): string {
  return `${API_HOST}/api/v1/commons/glossary/page/${pageId}/library/${library}`;
}

// Resolve the id of the page actually in the address bar via MindTouch's
// Deki API, rather than trusting the #pageId hidden input — that input's
// value can't be trusted when this page has been transcluded into another
// page (duplicating the widget's markup; see utils/scope.ts), but
// window.location always reflects the page the user is really viewing.
export function fetchCurrentPageId(library: string): Promise<string> {
  return fetch(DEKI_TOKEN_URL)
    .then((response) => {
      if (!response.ok) throw new Error("Request failed with status: " + response.status);
      return response.json() as Promise<Record<string, string>>;
    })
    .then((tokens) => {
      const token = tokens[library];
      if (!token) throw new Error(`No x-deki-token for library "${library}"`);

      // Deki's page-by-path lookup expects the path (no leading slash,
      // no domain) double URL-encoded as a single path segment.
      const path = window.location.pathname.replace(/^\//, "");
      const encodedPath = encodeURIComponent(encodeURIComponent(path));
      const url = `https://${library}.libretexts.org/@api/deki/pages/=${encodedPath}?dream.out.format=json`;

      return fetch(url, {
        method: "GET",
        headers: {
          "x-deki-token": token,
          "x-requested-with": "XMLHttpRequest",
        },
      });
    })
    .then((response) => {
      if (!response.ok) throw new Error("Request failed with status: " + response.status);
      return response.json() as Promise<DekiPageResponse>;
    })
    .then((data) => {
      if (!data?.["@id"]) throw new Error("Deki pages response missing @id");
      return String(data["@id"]);
    });
}

export function fetchFreshness(url: string): Promise<FreshnessResponse> {
  return fetch(url, {
    method: "GET",
    headers: { "X-Requested-With": "XMLHttpRequest" },
  }).then((response) => {
    if (!response.ok) throw new Error("Request failed with status: " + response.status);
    return response.json();
  });
}

export function fetchFullGlossary(url: string): Promise<FullGlossaryResponse> {
  console.log("Fetching full glossary from:", url);
  return fetch(url, {
    method: "POST",
    headers: { "X-Requested-With": "XMLHttpRequest" },
  }).then((response) => {
    if (!response.ok) throw new Error("Request failed with status: " + response.status);
    return response.json();
  });
}
