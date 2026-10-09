"use client";

import { useEffect, useRef, useState } from "react";
import { buyersCsv, createHandoff, csvCell, normalizeDomain, type Buyer, type ResearchContext } from "@/lib/prospecting";

const inputStyle = "w-full rounded-xl border border-slate-700 bg-[#050816] px-4 py-3 text-sm text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20";
const buttonStyle = "rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 transition hover:border-violet-400 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-40";

function download(name: string, content: string, type: string) {
  const href = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = href; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default function ProspectingWorkspace({ context = {} }: { context?: ResearchContext }) {
  const [domainsText, setDomainsText] = useState("");
  const [titlesText, setTitlesText] = useState(context.buyer?.title || "");
  const [accessCode, setAccessCode] = useState("");
  const [connections, setConnections] = useState<{ apollo: boolean; clay: boolean } | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const [searchedTitles, setSearchedTitles] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/integrations", { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error("Connection status unavailable.");
      return response.json();
    }).then(setConnections).catch((err) => {
      if (err.name !== "AbortError") setError("Could not check tool connections. Refresh to try again.");
    });
    return () => controller.abort();
  }, []);

  const record = (event: string) => setEvents((current) => [`${new Date().toLocaleTimeString()} — ${event}`, ...current].slice(0, 8));
  const getDomains = () => {
    const values = domainsText.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);
    if (!values.length || values.length > 10) throw new Error("Add between 1 and 10 account domains.");
    return [...new Set(values.map(normalizeDomain))];
  };
  const getTitles = () => {
    const values = titlesText.split(/[,\n]+/).map((value) => value.trim()).filter(Boolean);
    if (!values.length || values.length > 5 || values.some((value) => value.length > 100)) throw new Error("Add between 1 and 5 buyer titles, separated by commas.");
    return values;
  };
  const picked = buyers.filter((buyer) => selected.has(buyer.id));

  async function search() {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(""); setBusy("apollo"); setBuyers([]); setSelected(new Set()); setTotal(null);
    try {
      const domains = getDomains();
      const titles = getTitles();
      const response = await fetch("/api/discover", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessCode}` },
        body: JSON.stringify({ domains, titles }), signal: AbortSignal.timeout(20_000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Buyer discovery failed.");
      setBuyers(data.buyers); setTotal(data.total); setSearchedTitles(titles);
      record(`Apollo returned ${data.buyers.length} buyers across ${domains.length} target accounts.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Buyer discovery failed.");
      record("Apollo search failed. No buyer records added.");
    } finally { setBusy(""); inFlight.current = false; }
  }

  async function sendClay(domain: string) {
    if (inFlight.current || submitted.has(domain)) return;
    inFlight.current = true;
    setError(""); setBusy(domain);
    try {
      const response = await fetch("/api/clay", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessCode}` },
        body: JSON.stringify({ domains: [domain], buyer_title: titlesText, icp_hypothesis: context.icp?.segment, signal_to_validate: context.buying_trigger, research_company: context.company }),
        signal: AbortSignal.timeout(15_000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Clay submission failed.");
      setSubmitted((current) => new Set([...current, domain]));
      record(`${domain} submitted to Clay. Review enrichment in your table.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clay submission failed.");
      record(`${domain}: submission not confirmed. Check Clay before retrying.`);
    } finally { setBusy(""); inFlight.current = false; }
  }

  function exportAccounts() {
    setError("");
    try {
      const domains = getDomains();
      const rows = [["account_domain", "buyer_title", "icp_hypothesis", "signal_to_validate", "research_company", "qualification_status"],
        ...domains.map((domain) => [domain, titlesText, context.icp?.segment || "", context.buying_trigger || "", context.company || "", "review_required"])];
      download("gtm-genome-clay-accounts.csv", rows.map((row) => row.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8");
      record(`Exported ${domains.length} accounts for Clay import.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Export failed."); }
  }

  let domains: string[] = [];
  try { domains = getDomains(); } catch { /* Errors appear when an action is requested. */ }

  return (
    <section id="discovery" className="mt-5 overflow-hidden rounded-3xl border border-violet-500/30 bg-[#0b1222]">
      <div className="border-b border-slate-800 bg-gradient-to-r from-violet-500/10 to-cyan-500/5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300">Research → accounts → buyers</p><h2 className="mt-2 text-2xl font-semibold">Build your target-account shortlist</h2></div>
          <div className="flex flex-wrap gap-2 text-xs">
            {(["apollo", "clay"] as const).map((tool) => <span key={tool} className={`rounded-full border px-3 py-1.5 ${connections?.[tool] ? "border-emerald-400/30 text-emerald-300" : "border-slate-700 text-slate-400"}`}>{tool === "apollo" ? "Apollo" : "Clay"} · {connections === null ? "Checking" : connections[tool] ? "Configured" : "Setup needed"}</span>)}
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Choose companies that could buy the researched company’s product. Review their fit, find the relevant people, and prepare an enrichment handoff.</p>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {context.company ? <div className="rounded-2xl border border-slate-700 p-4"><p className="text-xs text-slate-500">Research context · {context.company}</p><p className="mt-2 text-sm text-slate-200">{context.icp?.segment || "Define your target segment"}</p><p className="mt-2 text-xs leading-5 text-slate-400">{context.icp?.reason}</p><p className="mt-3 text-xs text-amber-300">ICP and buying signals are hypotheses requiring review.</p></div> : null}
          <div><label htmlFor="account-domains" className="mb-2 block text-sm text-slate-300">Target-account domains</label><textarea id="account-domains" rows={4} value={domainsText} disabled={Boolean(busy)} onChange={(event) => { setDomainsText(event.target.value); setBuyers([]); setSelected(new Set()); setTotal(null); }} placeholder={"customer-one.com\ncustomer-two.com"} className={inputStyle} /><p className="mt-2 text-xs text-slate-500">Up to 10 domains. These are your prospective customers, not the company you analyzed.</p></div>
          <div><label htmlFor="buyer-titles" className="mb-2 block text-sm text-slate-300">Buyer titles</label><input id="buyer-titles" value={titlesText} disabled={Boolean(busy)} onChange={(event) => { setTitlesText(event.target.value); setBuyers([]); setSelected(new Set()); setTotal(null); }} placeholder="VP of Sales, Revenue Operations Director" className={inputStyle} /><p className="mt-2 text-xs text-slate-500">Review the suggested persona. Separate up to 5 titles with commas.</p></div>
          <details className="rounded-xl border border-slate-800 p-4"><summary className="cursor-pointer text-sm text-slate-400">Operator access</summary><label htmlFor="operator-code" className="mt-3 mb-2 block text-xs text-slate-400">Access code for connected tools</label><input id="operator-code" type="password" autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} className={inputStyle} /><p className="mt-2 text-xs text-slate-500">Use your app access code. Provider API keys stay on the server. This code is kept only for this page session.</p></details>
          <div className="flex flex-wrap gap-3"><button type="button" onClick={search} disabled={Boolean(busy) || !connections?.apollo || !accessCode} className={`${buttonStyle} bg-violet-600/30`}>{busy === "apollo" ? "Searching Apollo…" : "Find buyers with Apollo"}</button><button type="button" onClick={exportAccounts} disabled={Boolean(busy)} className={buttonStyle}>Export accounts for Clay</button></div>
          {!connections?.apollo && connections !== null ? <p className="text-xs leading-5 text-slate-400">Apollo requires account setup before live search. You can prepare and export your account list now.</p> : null}
        </div>

        <div>
          <div className="flex items-center justify-between"><h3 className="text-sm font-medium text-slate-300">Account review</h3><span className="text-xs text-slate-500">{domains.length} unique domains</span></div>
          <div className="mt-3 space-y-2">{domains.length ? domains.map((domain) => <div key={domain} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 p-4"><div><p className="text-sm text-slate-200">{domain}</p><p className="mt-1 text-xs text-slate-500">{submitted.has(domain) ? "Submitted · review results in Clay" : "Fit unverified · pending enrichment"}</p></div><button type="button" onClick={() => sendClay(domain)} disabled={Boolean(busy) || !connections?.clay || !accessCode || submitted.has(domain)} className={buttonStyle}>{busy === domain ? "Submitting…" : submitted.has(domain) ? "Submitted" : "Send to Clay"}</button></div>) : <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center"><p className="text-sm text-slate-400">Your next sales play starts here.</p><p className="mt-2 text-xs leading-5 text-slate-500">Add customer domains to prepare your shortlist.<br />No accounts or buyers are generated from assumptions.</p></div>}</div>
          <div className="mt-5 rounded-xl bg-slate-900/70 p-4 text-xs leading-5 text-slate-400"><p className="font-medium text-slate-200">What happens in Clay?</p><p className="mt-1">Import the account CSV or use the connected webhook. Enrich company size, industry and signals in your Clay table, then review fit there. Submission alone does not qualify an account.</p></div>
        </div>
      </div>

      {error ? <div role="alert" className="mx-6 mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200 sm:mx-8">{error}</div> : null}
      <div aria-live="polite" className="border-t border-slate-800 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-medium">Buyer discovery</h3><p className="mt-1 text-xs text-slate-500">{total !== null ? `Showing ${buyers.length} of ${total} Apollo matches · first page` : "Results appear after an authenticated Apollo search."}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={!picked.length} className={buttonStyle} onClick={() => { download("gtm-genome-buyers.csv", buyersCsv(picked, context), "text/csv;charset=utf-8"); record(`Exported ${picked.length} reviewed buyers.`); }}>Export selected CSV ({picked.length})</button><button type="button" disabled={!picked.length} className={buttonStyle} onClick={() => { download("gtm-genome-revenueos-handoff.json", JSON.stringify(createHandoff(picked, context), null, 2), "application/json"); record(`Prepared RevenueOS JSON handoff for ${picked.length} buyers.`); }}>RevenueOS handoff</button></div></div>
        <p className="mt-3 text-xs leading-5 text-amber-200/80">Apollo search can return partially hidden names and employer matches from past roles. Confirm current employment before outreach. Emails and phone numbers require separate enrichment.</p>
        {buyers.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Apollo buyers matching the selected target accounts and titles</caption><thead className="text-xs text-slate-500"><tr><th className="p-3">Review</th><th className="p-3">Buyer</th><th className="p-3">Account</th><th className="p-3">Why included</th></tr></thead><tbody>{buyers.map((buyer) => <tr key={buyer.id} className="border-t border-slate-800"><td className="p-3"><input type="checkbox" aria-label={`Select ${buyer.name}`} checked={selected.has(buyer.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(buyer.id); else next.delete(buyer.id); return next; })} /></td><td className="p-3"><p className="text-slate-200">{buyer.name}</p><p className="mt-1 text-xs text-slate-500">{buyer.title}</p></td><td className="p-3"><p className="text-slate-300">{buyer.company}</p><p className="mt-1 text-xs text-slate-500">{buyer.domain || "Domain not returned"}</p></td><td className="p-3 text-xs leading-5 text-slate-400">Apollo title/domain search match.<br />Requested: {searchedTitles.join(", ")}</td></tr>)}</tbody></table></div> : <p className="mt-6 text-sm text-slate-500">{total === 0 ? "No buyers matched. Try broader buyer titles or another target account." : "No buyer records yet."}</p>}
        <p className="mt-4 text-xs text-slate-500">RevenueOS handoff downloads a reviewable JSON file. Direct CRM synchronization is a later step.</p>
      </div>
      {events.length ? <div className="border-t border-slate-800 px-6 py-5 sm:px-8"><h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">Session activity</h3><ol className="mt-3 space-y-2 text-xs text-slate-400">{events.map((event, index) => <li key={`${event}-${index}`}>{event}</li>)}</ol><p className="mt-3 text-xs text-slate-600">Activity and submission tracking reset when you leave this page.</p></div> : null}
    </section>
  );
}
