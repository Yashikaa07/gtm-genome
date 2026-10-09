export type Buyer = {
  id: string;
  name: string;
  title: string;
  company: string;
  domain: string;
  source: "apollo";
  retrieved_at: string;
};

export type ResearchContext = {
  company?: string;
  icp?: { segment?: string; reason?: string };
  buyer?: { title?: string; reason?: string };
  buying_trigger?: string;
  sources_analyzed?: { url?: string; title?: string }[];
};

export function normalizeDomain(input: string): string {
  const value = input.trim();
  if (!value || value.length > 253) throw new Error("Enter a valid company domain.");
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch { throw new Error("Enter a valid company domain."); }
  const domain = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!/^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) ||
      domain.endsWith(".local") || domain.endsWith(".localhost") || url.username || url.password ||
      url.port || !["https:", "http:"].includes(url.protocol)) {
    throw new Error("Use a public company domain, such as example.com.");
  }
  return domain;
}

export function parseSearch(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Invalid search.");
  const data = input as Record<string, unknown>;
  if (!Array.isArray(data.domains) || !data.domains.length || data.domains.length > 10 ||
      !data.domains.every((item) => typeof item === "string")) {
    throw new Error("Provide between 1 and 10 target-account domains.");
  }
  if (!Array.isArray(data.titles) || !data.titles.length || data.titles.length > 5 ||
      !data.titles.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= 100)) {
    throw new Error("Provide between 1 and 5 buyer titles.");
  }
  return {
    domains: [...new Set(data.domains.map((item: string) => normalizeDomain(item)))],
    titles: [...new Set(data.titles.map((item: string) => item.trim()))],
  };
}

// Escape formula prefixes as well as quotes: exported provider data is untrusted.
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function createHandoff(buyers: Buyer[], context: ResearchContext) {
  return {
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    source: "gtm-genome",
    status: "research_review_required",
    research: context,
    buyers,
  };
}

export function buyersCsv(buyers: Buyer[], context: ResearchContext) {
  const headers = ["apollo_id", "buyer_name", "buyer_title", "account_name", "account_domain", "source", "retrieved_at", "icp_hypothesis", "signal_to_validate", "research_urls"];
  const rows = buyers.map((buyer) => [buyer.id, buyer.name, buyer.title, buyer.company, buyer.domain, buyer.source, buyer.retrieved_at, context.icp?.segment, context.buying_trigger, context.sources_analyzed?.map((source) => source.url).join(" | ")]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
