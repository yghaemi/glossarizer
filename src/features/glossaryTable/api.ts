import { API_HOST } from "../../config";
import type { FreshnessResponse, FullGlossaryResponse } from "../../types";

export function glossaryUrl(pageId: string, library: string): string {
  return `${API_HOST}/api/v1/commons/glossary/page/${pageId}/library/${library}`;
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
