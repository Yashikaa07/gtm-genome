import Link from "next/link";

type Props = { url: string; setUrl: (value: string) => void; analyze: () => void; loading: boolean; error: string; progress: number; loadingStep: string };

export default function ResearchLanding({ url, setUrl, analyze, loading, error, progress, loadingStep }: Props) {
  return (
    <main className="genome-home min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"><span className="brand-mark" aria-hidden="true">✳</span>GTM Genome<span className="ml-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-600">Workspace</span></Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm font-medium"><a href="#workflow" className="hidden text-slate-600 hover:text-violet-700 sm:block">How it works</a><a href="https://github.com/Yashikaa07/gtm-genome" target="_blank" rel="noreferrer" className="hidden text-slate-600 hover:text-violet-700 sm:block">GitHub ↗</a><Link href="/discover" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm hover:border-violet-300">Buyer discovery ↗</Link></nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-16 pt-14 lg:grid-cols-[1.1fr_1fr] lg:px-10 lg:pb-24 lg:pt-20">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700"><span className="h-1.5 w-1.5 rounded-full bg-violet-600" />Your next GTM move starts here</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-[-.055em] sm:text-6xl lg:text-[68px]">Good research.<br />Better <span className="relative inline-block text-violet-600">revenue moves.<span className="hero-underline" aria-hidden="true" /></span></h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">Turn a company website into a clear go-to-market plan. Understand the buyer, find the opportunity, and build your next experiment.</p>
          <form className="mt-8" onSubmit={(event) => { event.preventDefault(); if (!loading && url.trim()) analyze(); }}>
            <label htmlFor="company-url" className="mb-2 block text-xs font-semibold text-slate-700">Start with a company website</label>
            <div className="flex flex-col gap-2 rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm transition focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100 sm:flex-row">
              <input id="company-url" type="text" inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} disabled={loading} placeholder="https://company.com" className="min-w-0 flex-1 rounded-lg px-3 py-3 text-sm outline-none placeholder:text-slate-400" />
              <button disabled={loading || !url.trim()} className="shrink-0 rounded-lg bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Researching…" : "Research company →"}</button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>Try a company:</span>{["hubspot.com", "clay.com", "apollo.io"].map((domain) => <button key={domain} disabled={loading} onClick={() => setUrl(`https://${domain}`)} className="rounded-md border border-slate-200 px-2 py-1 hover:border-violet-300 hover:text-violet-700 disabled:opacity-50">{domain}</button>)}</div>
          {loading && <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4"><div className="flex justify-between gap-4 text-xs text-violet-800"><span>{loadingStep}</span><span>{progress}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} /></div></div>}
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <p className="mt-6 text-xs text-slate-500">Homepage research · Evidence-led insights · Reviewable experiments</p>
        </div>

        <div className="research-canvas" aria-label="Illustration of the research workflow">
          <div className="canvas-label"><span className="h-2 w-2 rounded-full bg-violet-500" />A little context. A clearer next move.<span className="ml-auto rounded bg-white/80 px-2 py-1 text-[10px]">ILLUSTRATIVE WORKFLOW</span></div>
          <div className="canvas-source"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xl">↗</span><div><p className="text-xs text-slate-600">The starting point</p><p className="mt-1 font-semibold">One company website</p></div><span className="ml-auto text-slate-500">＋</span></div>
          <div className="canvas-path" aria-hidden="true" />
          <div className="grid grid-cols-2 gap-3">
            <div className="canvas-card bg-[#e9e2ff]"><span className="tile-icon text-violet-700">◎</span><p className="mt-5 text-sm font-semibold">Find your ICP</p><p className="mt-2 text-xs leading-5 text-slate-600">Who fits, and why they might care.</p><span className="mt-5 inline-block rounded bg-white/70 px-2 py-1 text-[10px] text-violet-800">01 · RESEARCH</span></div>
            <div className="canvas-card bg-[#dcf4e7]"><span className="tile-icon text-emerald-800">⌘</span><p className="mt-5 text-sm font-semibold">Map the buyer</p><p className="mt-2 text-xs leading-5 text-slate-600">Roles, pains, and signals to review.</p><span className="mt-5 inline-block rounded bg-white/70 px-2 py-1 text-[10px] text-emerald-800">02 · UNDERSTAND</span></div>
          </div>
          <div className="canvas-path" aria-hidden="true" />
          <div className="canvas-result"><div className="flex items-center gap-3"><span className="tile-icon bg-[#ffedb5] text-amber-800">✦</span><div><p className="text-sm font-semibold">Your next experiment</p><p className="mt-1 text-xs text-slate-500">A hypothesis, an audience, a measurable test.</p></div></div><div className="mt-4 flex flex-wrap gap-2 text-[10px]"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">Positioning</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Channel strategy</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">Evidence</span></div></div>
          <span className="canvas-spark" aria-hidden="true">✳</span>
        </div>
      </section>

      <section id="workflow" className="border-y border-slate-200 bg-[#fafaf8]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-widest text-violet-700">From insight to action</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">One connected research workflow.</h2></div><Link href="/discover" className="text-sm font-medium text-violet-700 hover:underline">Open your discovery workspace →</Link></div><div className="grid gap-4 md:grid-cols-3">{[{ n:"01", title:"Understand the company", copy:"Read its website and review ICP, positioning, buyer pain, and supporting evidence.", color:"bg-violet-100 text-violet-800" },{ n:"02", title:"Build your account list", copy:"Choose target companies. Prepare account research and enrichment in Clay.", color:"bg-emerald-100 text-emerald-800" },{ n:"03", title:"Discover the right buyers", copy:"Review Apollo matches and export a shortlist for your next sales play.", color:"bg-amber-100 text-amber-800" }].map((item) => <article key={item.n} className="rounded-xl border border-slate-200 bg-white p-6"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${item.color}`}>{item.n}</span><h3 className="mt-5 text-base font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p></article>)}</div></div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-7 text-xs text-slate-500 lg:px-10"><p>GTM Genome · Built by Yashika Hemnani</p><a href="https://www.linkedin.com/in/yashika-hemnani-6883b5214/" target="_blank" rel="noreferrer" className="hover:text-violet-700">Connect on LinkedIn ↗</a><p>AI research is a starting point. Review before acting.</p></footer>
    </main>
  );
}
