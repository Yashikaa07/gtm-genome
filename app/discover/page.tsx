import Link from "next/link";
import Brand from "../components/Brand";
import ProspectingWorkspace from "../components/ProspectingWorkspace";

export default function DiscoverPage() {
  return <main className="min-h-screen bg-[#fafbf8] text-slate-900"><header className="mx-auto flex max-w-7xl items-center justify-between gap-5 border-b border-[#e6e9df] px-6 py-7 lg:px-10"><Link href="/" aria-label="GTM Genome home"><Brand /></Link><Link href="/" className="text-xs text-[#737d67] hover:text-violet-700">Company research ↗</Link></header><div className="mx-auto max-w-7xl px-6 pb-16 lg:px-10"><div className="mb-8 mt-12"><p className="text-[10px] uppercase tracking-[.18em] text-[#8a947e]">02 / ACCOUNT & BUYER INTELLIGENCE</p><h1 className="mt-4 text-4xl font-medium tracking-[-.04em] sm:text-5xl">A considered shortlist.<br /><span className="font-serif italic text-[#737d67]">A clearer sales play.</span></h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#89917e]">Define the accounts that matter. Review the people behind them. Carry your research into the next conversation.</p></div><ProspectingWorkspace /></div></main>;
}
