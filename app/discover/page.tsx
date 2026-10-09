import Link from "next/link";
import ProspectingWorkspace from "../components/ProspectingWorkspace";

export default function DiscoverPage() {
  return <main className="min-h-screen bg-[#050816] px-5 py-8 text-white sm:px-10"><div className="mx-auto max-w-6xl"><header className="flex items-center justify-between gap-5"><Link href="/" className="font-semibold">🧬 GTM Genome</Link><Link href="/" className="text-sm text-violet-300 hover:text-white">Run company research ↗</Link></header><div className="mt-12"><p className="text-xs uppercase tracking-[.2em] text-violet-300">Account research & buyer discovery</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Turn research into your next sales play.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Start with your own target accounts, or run a company analysis to carry its ICP and buyer hypotheses into this workspace.</p></div><ProspectingWorkspace /></div></main>;
}
