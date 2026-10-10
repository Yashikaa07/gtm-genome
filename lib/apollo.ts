import type { Buyer } from "./prospecting";

type ApolloPerson = {
  id?: string; name?: string; first_name?: string; last_name?: string;
  last_name_obfuscated?: string; title?: string;
  organization?: { name?: string; primary_domain?: string; website_url?: string };
};

export async function searchBuyers(domains: string[], titles: string[], apiKey: string, fetcher: typeof fetch = fetch) {
  const response = await fetcher("https://api.apollo.io/api/v1/mixed_people/api_search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey, Accept: "application/json" },
    body: JSON.stringify({ q_organization_domains_list: domains, person_titles: titles, include_similar_titles: false, page: 1, per_page: 25 }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "Apollo rejected the API key. Check the connection settings.",
      403: "This Apollo account or key does not have People Search access.",
      429: "Apollo's rate limit was reached. Wait before trying again.",
    };
    throw new Error(messages[response.status] || "Apollo search is temporarily unavailable.");
  }
  const data = await response.json();
  if (!Array.isArray(data.people)) throw new Error("Apollo returned an unexpected search response.");
  const retrieved_at = new Date().toISOString();
  const seen = new Set<string>();
  const buyers: Buyer[] = data.people.filter((person: ApolloPerson) => {
    if (typeof person.id !== "string" || seen.has(person.id)) return false;
    seen.add(person.id);
    return true;
  }).map((person: ApolloPerson) => ({
    id: person.id!,
    name: person.name || [person.first_name, person.last_name || person.last_name_obfuscated].filter(Boolean).join(" ") || "Name not disclosed",
    title: person.title || "Title not disclosed",
    company: person.organization?.name || "Company not disclosed",
    domain: person.organization?.primary_domain || "",
    source: "apollo" as const,
    retrieved_at,
  }));
  return { buyers, total: typeof data.total_entries === "number" ? data.total_entries : buyers.length };
}
