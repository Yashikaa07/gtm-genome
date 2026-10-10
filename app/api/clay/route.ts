import { authorized, readJson } from "@/lib/integration-auth";
import { normalizeDomain } from "@/lib/prospecting";

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Enter your operator access code to use connected tools." }, { status: 401 });
  const endpoint = process.env.CLAY_WEBHOOK_URL;
  if (!endpoint) return Response.json({ error: "Clay is not configured yet. You can still export a CSV." }, { status: 503 });
  try {
    // The destination is server-configured; visitors cannot select arbitrary URLs.
    const destination = new URL(endpoint);
    if (destination.protocol !== "https:" || !(destination.hostname === "clay.com" || destination.hostname.endsWith(".clay.com")) || destination.username || destination.password || destination.port) {
      return Response.json({ error: "The configured Clay webhook URL is invalid." }, { status: 503 });
    }
    const body = await readJson(request) as Record<string, unknown>;
    if (!body || !Array.isArray(body.domains) || body.domains.length !== 1 || typeof body.domains[0] !== "string") {
      return Response.json({ error: "Send one account domain at a time." }, { status: 400 });
    }
    const domain = normalizeDomain(body.domains[0]);
    const text = (value: unknown) => typeof value === "string" ? value.slice(0, 1000) : "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.CLAY_WEBHOOK_AUTH_TOKEN) headers.Authorization = `Bearer ${process.env.CLAY_WEBHOOK_AUTH_TOKEN}`;
    const response = await fetch(endpoint, {
      method: "POST", headers,
      body: JSON.stringify({ account_domain: domain, buyer_title: text(body.buyer_title), icp_hypothesis: text(body.icp_hypothesis), signal_to_validate: text(body.signal_to_validate), research_company: text(body.research_company), source: "gtm-genome", review_status: "unqualified", submitted_at: new Date().toISOString() }),
      redirect: "error", signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return Response.json({ error: "Clay did not accept this account. Check your webhook configuration." }, { status: 502 });
    return Response.json({ domain, status: "submitted", message: "Account submitted to Clay. Enrichment results must be reviewed in your Clay table." });
  } catch (error) {
    return Response.json({ error: error instanceof Error && /valid|domain|JSON|large/.test(error.message) ? error.message : "Clay submission failed. Check the table before retrying to avoid duplicate rows." }, { status: 400 });
  }
}
