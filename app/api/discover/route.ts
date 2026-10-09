import { authorized, readJson } from "@/lib/integration-auth";
import { parseSearch } from "@/lib/prospecting";
import { searchBuyers } from "@/lib/apollo";

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Enter your operator access code to use connected tools." }, { status: 401 });
  const key = process.env.APOLLO_API_KEY;
  if (!key) return Response.json({ error: "Apollo is not configured yet." }, { status: 503 });
  let search;
  try { search = parseSearch(await readJson(request)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid search." }, { status: 400 }); }
  try {
    return Response.json({ ...await searchBuyers(search.domains, search.titles, key), filters: search }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Buyer discovery failed." }, { status: 502 });
  }
}
