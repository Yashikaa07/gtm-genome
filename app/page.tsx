"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* =========================================================
   TYPES
========================================================= */

type EvidenceItem = {
  source_url?: string;
  source_title?: string;
  evidence?: string;
  supports?: string;
  confidence?: number;
};

type SourceItem = {
  url?: string;
  title?: string;
};

type Analysis = {
  company?: string;
  category?: string;
  executive_summary?: string;

  readiness_score?: number;

  score_breakdown?: {
    icp_fit?: number;
    buyer_urgency?: number;
    positioning_strength?: number;
    channel_fit?: number;
    experiment_confidence?: number;
  };

  icp?: {
    segment?: string;
    company_size?: string;
    fit_score?: number;
    reason?: string;
  };

  icp_segments?: {
    segment?: string;
    score?: number;
    reason?: string;
  }[];

  buyer?: {
    title?: string;
    reason?: string;
  };

  pain?: string;

  pain_points?: {
    pain?: string;
    severity?: number;
  }[];

  buying_trigger?: string;
  positioning?: string;
  channel?: string;

  channel_mix?: {
    channel?: string;
    percentage?: number;
  }[];

  opportunities?: {
    name?: string;
    score?: number;
    rationale?: string;
  }[];

  evidence?: EvidenceItem[];
  sources_analyzed?: SourceItem[];

  gtm_experiment?: {
    hypothesis?: string;
    target?: string;
    signal?: string;
    message_angle?: string;
    success_metric?: string;
    impact_score?: number;
    confidence_score?: number;
    effort_score?: number;
  };
};

/* =========================================================
   HELPERS
========================================================= */

const LINKEDIN =
  "https://www.linkedin.com/in/yashika-hemnani-6883b5214/";

const GITHUB =
  "https://github.com/Yashikaa07";

const safeText = (
  value?: string,
  fallback = "Not enough evidence available yet."
) => value?.trim() || fallback;

const safeLower = (
  value?: string,
  fallback = "this opportunity"
) => value?.trim()?.toLowerCase() || fallback;

const safeScore = (
  value?: number,
  fallback = 72
) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const COLORS = {
  purple: "#8b5cf6",
  blue: "#3b82f6",
  cyan: "#22d3ee",
  teal: "#2dd4bf",
  green: "#22c55e",
  amber: "#f59e0b",
  pink: "#ec4899",
};

const CHART_COLORS = [
  COLORS.purple,
  COLORS.blue,
  COLORS.teal,
  COLORS.amber,
  COLORS.pink,
];

/* =========================================================
   PAGE
========================================================= */

export default function Home() {
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  const [savedReport, setSavedReport] = useState(false);
  const [savedExperiment, setSavedExperiment] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);

  /* ---------------------------------------------------------
     LOADING ANIMATION
  --------------------------------------------------------- */

  const loadingSteps = [
    "Reading company website",
    "Finding buyer and ICP signals",
    "Mapping pain points and triggers",
    "Scoring GTM opportunities",
    "Analyzing channels and positioning",
    "Building your intelligence report",
  ];

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setLoadingStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 4, 92);

        const step = Math.min(
          Math.floor((next / 100) * loadingSteps.length),
          loadingSteps.length - 1
        );

        setLoadingStep(step);

        return next;
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [loading]);

  /* ---------------------------------------------------------
     ANALYZE
  --------------------------------------------------------- */

  const analyze = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setAnalysis(null);

    setSavedReport(false);
    setSavedExperiment(false);
    setShowOutreach(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Analysis failed."
        );
      }

      setProgress(100);

      await new Promise((resolve) =>
        setTimeout(resolve, 250)
      );

      setAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     DERIVED DATA
  --------------------------------------------------------- */

  const company = safeText(
    analysis?.company,
    "Company"
  );

  const category = safeText(
    analysis?.category,
    "Go-to-market intelligence"
  );

  const executiveSummary = safeText(
    analysis?.executive_summary,
    `GTM Genome analyzed ${company} and generated a strategic research report from the available website evidence.`
  );

  const icp = analysis?.icp || {};
  const buyer = analysis?.buyer || {};
  const experiment =
    analysis?.gtm_experiment || {};

  const scoreBreakdown =
    analysis?.score_breakdown || {};

  const readiness = safeScore(
    analysis?.readiness_score,
    82
  );

  const scoreCards = [
    {
      label: "ICP Fit",
      score: safeScore(
        scoreBreakdown.icp_fit,
        icp.fit_score
      ),
      color: COLORS.green,
    },
    {
      label: "Buyer Urgency",
      score: safeScore(
        scoreBreakdown.buyer_urgency,
        78
      ),
      color: COLORS.blue,
    },
    {
      label: "Positioning",
      score: safeScore(
        scoreBreakdown.positioning_strength,
        80
      ),
      color: COLORS.purple,
    },
    {
      label: "Channel Fit",
      score: safeScore(
        scoreBreakdown.channel_fit,
        76
      ),
      color: COLORS.amber,
    },
    {
      label: "Experiment",
      score: safeScore(
        scoreBreakdown.experiment_confidence,
        81
      ),
      color: COLORS.pink,
    },
  ];

  const icpSegments =
    analysis?.icp_segments?.length
      ? analysis.icp_segments
      : [
          {
            segment: safeText(
              icp.segment,
              "Primary ICP"
            ),
            score: safeScore(icp.fit_score),
            reason: safeText(icp.reason),
          },
        ];

  const painPoints =
    analysis?.pain_points?.length
      ? analysis.pain_points
      : [
          {
            pain: safeText(
              analysis?.pain,
              "Primary buyer pain"
            ),
            severity: 78,
          },
        ];

  const opportunities =
    analysis?.opportunities?.length
      ? analysis.opportunities
      : [
          {
            name: "Primary opportunity",
            score: safeScore(
              icp.fit_score,
              80
            ),
            rationale: safeText(
              analysis?.positioning
            ),
          },
        ];

  const channelMix =
    analysis?.channel_mix?.length
      ? analysis.channel_mix
      : [
          {
            channel: safeText(
              analysis?.channel,
              "Primary channel"
            ),
            percentage: 100,
          },
        ];

  const evidence =
    analysis?.evidence || [];

  const sources =
    analysis?.sources_analyzed || [];

  /* ---------------------------------------------------------
     OUTREACH
  --------------------------------------------------------- */

  const linkedinMessage = analysis
    ? `Hi — I was researching ${company} and noticed ${safeLower(
        analysis.pain
      )} may be an important challenge. Given ${safeLower(
        analysis.buying_trigger,
        "the current buying environment"
      )}, I thought this might be timely. Curious how your team is approaching ${safeLower(
        experiment.message_angle,
        "this area"
      )}?`
    : "";

  const emailSubject = analysis
    ? `${company}: idea around ${safeText(
        analysis.pain,
        "your GTM motion"
      )}`
    : "";

  const emailBody = analysis
    ? `Hi,

I was researching ${company} and noticed an interesting GTM opportunity.

For ${safeText(
        icp.segment,
        "your target customers"
      )}, one of the biggest challenges appears to be:

${safeText(analysis.pain)}

A potential angle worth testing:

${safeText(experiment.message_angle)}

Hypothesis:

${safeText(experiment.hypothesis)}

Would it be useful if I shared a quick breakdown of how I would test this?

Best`
    : "";

  /* ---------------------------------------------------------
     SAVE + EXPORT
  --------------------------------------------------------- */

  const saveReport = () => {
    if (!analysis) return;

    localStorage.setItem(
      "gtm-genome-report",
      JSON.stringify({
        url,
        analysis,
        savedAt: new Date().toISOString(),
      })
    );

    setSavedReport(true);
  };

  const exportReport = () => {
    if (!analysis) return;

    const file = new Blob(
      [
        JSON.stringify(
          {
            product: "GTM Genome",
            createdBy: "Yashika Hemnani",
            analyzedUrl: url,
            generatedAt:
              new Date().toISOString(),
            analysis,
          },
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const objectUrl =
      URL.createObjectURL(file);

    const anchor =
      document.createElement("a");

    anchor.href = objectUrl;

    anchor.download = `${company
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}-gtm-genome.json`;

    anchor.click();

    URL.revokeObjectURL(objectUrl);
  };

  /* =========================================================
     LANDING PAGE
  ========================================================= */

  if (!analysis) {
    return (
      <main
        className="min-h-screen overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(circle at 80% 10%, rgba(124,58,237,.26), transparent 28%), radial-gradient(circle at 10% 90%, rgba(14,165,233,.15), transparent 28%), #050816",
        }}
      >
        <div className="pointer-events-none fixed inset-0 opacity-[0.16]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
        </div>

        <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-7 sm:px-8 lg:px-10">

          {/* TOP NAV */}

          <header className="flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-xl shadow-lg shadow-violet-950/30">
                🧬
              </div>

              <div>
                <p className="font-semibold tracking-tight">
                  GTM Genome
                </p>

                <p className="text-xs text-slate-500">
                  AI GTM Research Engine
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">

              <a
                href={LINKEDIN}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-xs text-slate-400 transition hover:border-blue-500/40 hover:text-blue-300"
              >
                LinkedIn ↗
              </a>

              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-xs text-slate-400 transition hover:border-violet-500/40 hover:text-violet-300"
              >
                GitHub ↗
              </a>

            </div>

          </header>

          {/* HERO */}

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1fr_340px]">

            <div>

              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
                <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,.9)]" />

                AI-powered go-to-market intelligence
              </div>

              <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-7xl lg:text-[76px]">
                Turn any company into{" "}
                <span className="bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  actionable GTM intelligence.
                </span>
              </h1>

              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-400 sm:text-xl">
                Research ICPs, buyers, pain points,
                positioning, channels, opportunities,
                evidence and your next GTM experiment —
                from a single company URL.
              </p>

              {/* CREATOR CREDIT */}

              <div className="mt-7 flex flex-wrap items-center gap-3">

                <div className="h-px w-9 bg-gradient-to-r from-violet-400 to-cyan-400" />

                <p className="text-sm text-slate-500">
                  Designed & built by{" "}
                  <span className="font-medium text-slate-200">
                    Yashika Hemnani
                  </span>
                </p>

                <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
                  Creator
                </span>

              </div>

              {/* SEARCH */}

              <div className="mt-10 max-w-4xl rounded-3xl border border-slate-800/80 bg-[#09101f]/80 p-2 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">

                <div className="flex flex-col gap-2 sm:flex-row">

                  <input
                    value={url}
                    onChange={(e) =>
                      setUrl(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        analyze();
                      }
                    }}
                    placeholder="https://company.com"
                    className="min-w-0 flex-1 rounded-2xl bg-transparent px-5 py-4 text-base text-white outline-none placeholder:text-slate-600"
                  />

                  <button
                    onClick={analyze}
                    disabled={
                      loading || !url.trim()
                    }
                    className="rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 px-7 py-4 font-medium text-white shadow-lg shadow-violet-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading
                      ? "Researching..."
                      : "Decode GTM →"}
                  </button>

                </div>

              </div>

              {/* LOADING EXPERIENCE */}

              {loading && (
                <div className="mt-6 max-w-4xl rounded-3xl border border-slate-800 bg-[#09101f]/90 p-6 backdrop-blur-xl">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Researching company
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {loadingSteps[loadingStep]}
                      </p>
                    </div>

                    <span className="text-sm font-medium text-violet-300">
                      {progress}%
                    </span>

                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                      }}
                    />

                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">

                    {loadingSteps.map(
                      (step, index) => (
                        <div
                          key={step}
                          className={`rounded-xl border px-3 py-3 text-xs ${
                            index < loadingStep
                              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                              : index === loadingStep
                              ? "border-violet-500/30 bg-violet-500/10 text-violet-200"
                              : "border-slate-800 text-slate-600"
                          }`}
                        >
                          <span className="mr-2">
                            {index <
                            loadingStep
                              ? "✓"
                              : index ===
                                loadingStep
                              ? "●"
                              : "○"}
                          </span>

                          {step}
                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {error && (
                <div className="mt-6 max-w-4xl rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
                  {error}
                </div>
              )}

              {/* VALUE PROPS */}

              {!loading && (
                <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-500">

                  <span className="rounded-full border border-slate-800 px-3 py-2">
                    ✓ ICP intelligence
                  </span>

                  <span className="rounded-full border border-slate-800 px-3 py-2">
                    ✓ Visual scoring
                  </span>

                  <span className="rounded-full border border-slate-800 px-3 py-2">
                    ✓ Research evidence
                  </span>

                  <span className="rounded-full border border-slate-800 px-3 py-2">
                    ✓ GTM experiments
                  </span>

                </div>
              )}

            </div>

            {/* CREATOR CARD */}

            <div className="hidden lg:block">

              <div className="relative overflow-hidden rounded-[30px] border border-slate-800 bg-[#0a1020] shadow-2xl shadow-black/50">

                <div className="relative h-[410px] overflow-hidden">

                  <img
                    src="/yashika.jpg"
                    alt="Yashika Hemnani"
                    className="h-full w-full scale-[1.04] object-cover object-center opacity-55 blur-[0.8px] grayscale-[12%]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b16] via-[#070b16]/45 to-[#070b16]/10" />

                  <div className="absolute inset-x-0 bottom-0 p-6">

                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-violet-300">
                      Built by
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Yashika Hemnani
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Business Analytics × GTM × AI
                    </p>

                    <div className="mt-5 flex gap-2">

                      <a
                        href={LINKEDIN}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs text-blue-200 transition hover:bg-blue-500/20"
                      >
                        LinkedIn ↗
                      </a>

                      <a
                        href={GITHUB}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs text-violet-200 transition hover:bg-violet-500/20"
                      >
                        GitHub ↗
                      </a>

                    </div>

                  </div>

                </div>

              </div>

              <p className="mt-4 text-center text-[11px] leading-5 text-slate-600">
                Creator profile is intentionally
                secondary to the product experience.
              </p>

            </div>

          </div>

        </section>
      </main>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#050816] text-white">

      <div className="flex">

        {/* SIDEBAR */}

        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-800/80 bg-[#070c19] px-5 py-6 lg:block">

          <div className="mb-8 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-950/30">
              🧬
            </div>

            <div>
              <p className="font-semibold">
                GTM Genome
              </p>

              <p className="text-xs text-slate-500">
                Research OS
              </p>
            </div>

          </div>

          <nav className="space-y-1 text-sm">

            {[
              ["Overview", "#overview"],
              ["ICP & Buyers", "#icp"],
              ["Pains & Triggers", "#pain"],
              ["Positioning", "#positioning"],
              ["Channels", "#channels"],
              ["Opportunities", "#opportunities"],
              ["Evidence", "#evidence"],
              ["Experiment", "#experiment"],
              ["Outreach", "#outreach"],
            ].map(([label, href], index) => (
              <a
                key={label}
                href={href}
                className={`block rounded-xl px-3 py-2.5 transition ${
                  index === 0
                    ? "bg-violet-500/15 text-violet-200"
                    : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {label}
              </a>
            ))}

          </nav>

          {/* CREATOR MINI */}

          <div className="absolute bottom-5 left-5 right-5">

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">

              <div className="flex items-center gap-3">

                <div className="h-9 w-9 overflow-hidden rounded-xl border border-slate-700">

                  <img
                    src="/yashika.jpg"
                    alt="Yashika Hemnani"
                    className="h-full w-full object-cover opacity-70 blur-[0.3px]"
                  />

                </div>

                <div className="min-w-0">

                  <p className="truncate text-xs font-medium text-slate-300">
                    Yashika Hemnani
                  </p>

                  <p className="text-[10px] text-slate-600">
                    Creator
                  </p>

                </div>

              </div>

              <div className="mt-3 flex gap-2">

                <a
                  href={LINKEDIN}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-lg border border-slate-800 px-2 py-1.5 text-center text-[10px] text-slate-500 hover:text-blue-300"
                >
                  LinkedIn
                </a>

                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-lg border border-slate-800 px-2 py-1.5 text-center text-[10px] text-slate-500 hover:text-violet-300"
                >
                  GitHub
                </a>

              </div>

            </div>

          </div>

        </aside>

        {/* CONTENT */}

        <section className="min-w-0 flex-1">

          {/* TOP BAR */}

          <div className="sticky top-0 z-30 border-b border-slate-800/70 bg-[#050816]/90 px-5 py-4 backdrop-blur-xl xl:px-9">

            <div className="flex flex-col gap-3 md:flex-row md:items-center">

              <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-800 bg-slate-950/80">

                <input
                  value={url}
                  onChange={(e) =>
                    setUrl(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      analyze();
                    }
                  }}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                />

                <button
                  onClick={analyze}
                  disabled={loading}
                  className="m-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {loading
                    ? "Analyzing..."
                    : "Analyze"}
                </button>

              </div>

              <div className="flex gap-2">

                <button
                  onClick={saveReport}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-700"
                >
                  {savedReport
                    ? "✓ Saved"
                    : "Save Report"}
                </button>

                <button
                  onClick={exportReport}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-700"
                >
                  Export Report
                </button>

              </div>

            </div>

          </div>

          {/* REPORT */}

          <div className="mx-auto max-w-[1500px] px-5 py-7 xl:px-9">

            {/* OVERVIEW */}

            <section
              id="overview"
              className="scroll-mt-24"
            >

              <div
                className="rounded-3xl border border-slate-800 p-7 shadow-2xl shadow-black/20"
                style={{
                  background:
                    "radial-gradient(circle at 90% 10%, rgba(59,130,246,.14), transparent 32%), linear-gradient(135deg,#0b1222,#080d19)",
                }}
              >

                <div className="grid gap-8 xl:grid-cols-[1fr_250px]">

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                        {company}
                      </h1>

                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                        AI Research Complete
                      </span>

                    </div>

                    <p className="mt-2 text-slate-500">
                      {category}
                    </p>

                    <p className="mt-8 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
                      Executive Summary
                    </p>

                    <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300">
                      {executiveSummary}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">

                      <Pill
                        label={`ICP · ${safeText(
                          icp.segment
                        )}`}
                      />

                      <Pill
                        label={`Buyer · ${safeText(
                          buyer.title
                        )}`}
                      />

                      <Pill
                        label={`Channel · ${safeText(
                          analysis.channel
                        )}`}
                      />

                    </div>

                  </div>

                  <ReadinessCircle
                    score={readiness}
                  />

                </div>

              </div>

            </section>

            {/* SCORES */}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

              {scoreCards.map((item) => (
                <ScoreCard
                  key={item.label}
                  {...item}
                />
              ))}

            </div>

            {/* ICP + CHANNEL */}

            <section
              id="icp"
              className="mt-6 grid scroll-mt-24 gap-5 xl:grid-cols-2"
            >

              <ChartCard
                title="ICP Segment Attractiveness"
                subtitle="Relative strategic fit across target segments"
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={icpSegments}
                    layout="vertical"
                  >

                    <CartesianGrid
                      stroke="rgba(148,163,184,.07)"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{
                        fill: "#64748b",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="segment"
                      width={150}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={<DarkTooltip />}
                    />

                    <Bar
                      dataKey="score"
                      radius={[
                        0,
                        8,
                        8,
                        0,
                      ]}
                    >

                      {icpSegments.map(
                        (_, index) => (
                          <Cell
                            key={index}
                            fill={
                              CHART_COLORS[
                                index %
                                  CHART_COLORS.length
                              ]
                            }
                          />
                        )
                      )}

                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              </ChartCard>

              <div
                id="channels"
                className="scroll-mt-24"
              >

                <ChartCard
                  title="Recommended Channel Mix"
                  subtitle="Suggested GTM channel allocation"
                >

                  <div className="grid h-full items-center gap-4 md:grid-cols-[1fr_180px]">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <PieChart>

                        <Pie
                          data={channelMix}
                          dataKey="percentage"
                          nameKey="channel"
                          innerRadius={68}
                          outerRadius={106}
                          paddingAngle={3}
                        >

                          {channelMix.map(
                            (_, index) => (
                              <Cell
                                key={index}
                                fill={
                                  CHART_COLORS[
                                    index %
                                      CHART_COLORS.length
                                  ]
                                }
                              />
                            )
                          )}

                        </Pie>

                        <Tooltip
                          content={
                            <DarkTooltip />
                          }
                        />

                      </PieChart>

                    </ResponsiveContainer>

                    <div className="space-y-3">

                      {channelMix.map(
                        (item, index) => (
                          <div
                            key={`${item.channel}-${index}`}
                            className="flex items-center justify-between gap-4 text-xs"
                          >

                            <div className="flex items-center gap-2 text-slate-400">

                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    CHART_COLORS[
                                      index %
                                        CHART_COLORS.length
                                    ],
                                }}
                              />

                              {safeText(
                                item.channel,
                                "Channel"
                              )}

                            </div>

                            <span className="text-slate-200">
                              {item.percentage ||
                                0}
                              %
                            </span>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                </ChartCard>

              </div>

            </section>

            {/* PAIN + OPPORTUNITY */}

            <section
              id="pain"
              className="mt-5 grid scroll-mt-24 gap-5 xl:grid-cols-2"
            >

              <ChartCard
                title="Buyer Pain Severity"
                subtitle="Relative urgency of target buyer problems"
              >

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={painPoints}
                  >

                    <CartesianGrid
                      stroke="rgba(148,163,184,.07)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="pain"
                      tick={{
                        fill: "#64748b",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tick={{
                        fill: "#64748b",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={<DarkTooltip />}
                    />

                    <Bar
                      dataKey="severity"
                      radius={[
                        7,
                        7,
                        0,
                        0,
                      ]}
                    >

                      {painPoints.map(
                        (_, index) => (
                          <Cell
                            key={index}
                            fill={
                              CHART_COLORS[
                                index %
                                  CHART_COLORS.length
                              ]
                            }
                          />
                        )
                      )}

                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              </ChartCard>

              <div
                id="opportunities"
                className="scroll-mt-24"
              >

                <ChartCard
                  title="GTM Opportunity Ranking"
                  subtitle="Highest-impact opportunities to prioritize"
                >

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={opportunities}
                      layout="vertical"
                    >

                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{
                          fill: "#64748b",
                          fontSize: 11,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={150}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 10,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        content={
                          <DarkTooltip />
                        }
                      />

                      <Bar
                        dataKey="score"
                        radius={[
                          0,
                          8,
                          8,
                          0,
                        ]}
                      >

                        {opportunities.map(
                          (_, index) => (
                            <Cell
                              key={index}
                              fill={
                                CHART_COLORS[
                                  index %
                                    CHART_COLORS.length
                                ]
                              }
                            />
                          )
                        )}

                      </Bar>

                    </BarChart>

                  </ResponsiveContainer>

                </ChartCard>

              </div>

            </section>

            {/* INSIGHTS */}

            <section
              id="positioning"
              className="mt-5 grid scroll-mt-24 gap-px overflow-hidden rounded-3xl border border-slate-800 bg-slate-800 md:grid-cols-2 xl:grid-cols-6"
            >

              <InsightCard
                icon="◎"
                label="Strongest ICP"
                value={safeText(
                  icp.segment
                )}
                sub={`Fit score ${safeScore(
                  icp.fit_score
                )}/100`}
                color={COLORS.blue}
              />

              <InsightCard
                icon="◉"
                label="Primary Buyer"
                value={safeText(
                  buyer.title
                )}
                sub={safeText(
                  buyer.reason
                )}
                color={COLORS.purple}
              />

              <InsightCard
                icon="⚡"
                label="Buying Trigger"
                value={safeText(
                  analysis.buying_trigger
                )}
                sub="Primary urgency signal"
                color={COLORS.amber}
              />

              <InsightCard
                icon="△"
                label="Core Pain"
                value={safeText(
                  analysis.pain
                )}
                sub="Priority buyer problem"
                color={COLORS.pink}
              />

              <InsightCard
                icon="◎"
                label="Best Channel"
                value={safeText(
                  analysis.channel
                )}
                sub="Recommended acquisition route"
                color={COLORS.green}
              />

              <InsightCard
                icon="☆"
                label="Positioning"
                value={safeText(
                  analysis.positioning
                )}
                sub="Differentiation opportunity"
                color={COLORS.cyan}
              />

            </section>

            {/* OPPORTUNITY DETAILS */}

            <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {opportunities.map(
                (opportunity, index) => (
                  <div
                    key={`${opportunity.name}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-[#0b1222] p-5"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <p className="font-medium text-slate-200">
                        {safeText(
                          opportunity.name,
                          "Opportunity"
                        )}
                      </p>

                      <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                        {safeScore(
                          opportunity.score
                        )}
                      </span>

                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      {safeText(
                        opportunity.rationale
                      )}
                    </p>

                  </div>
                )
              )}

            </section>

            {/* EVIDENCE */}

            <section
              id="evidence"
              className="mt-6 scroll-mt-24 rounded-3xl border border-slate-800 bg-[#0b1222] p-6"
            >

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>
                  <p className="font-medium">
                    Research Evidence
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Website evidence supporting
                    GTM Genome conclusions
                  </p>
                </div>

                <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-500">
                  {evidence.length} items
                </span>

              </div>

              <div className="mt-5 overflow-x-auto">

                <table className="w-full min-w-[850px] text-left text-sm">

                  <thead>

                    <tr className="border-b border-slate-800 text-xs text-slate-600">

                      <th className="pb-3 pr-5 font-medium">
                        Evidence
                      </th>

                      <th className="pb-3 pr-5 font-medium">
                        Supports
                      </th>

                      <th className="pb-3 pr-5 font-medium">
                        Source
                      </th>

                      <th className="pb-3 font-medium">
                        Confidence
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {evidence.length ? (
                      evidence.map(
                        (item, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-800/70 align-top"
                          >

                            <td className="max-w-xl py-4 pr-5 leading-6 text-slate-300">
                              “
                              {safeText(
                                item.evidence
                              )}
                              ”
                            </td>

                            <td className="py-4 pr-5 text-slate-500">
                              {safeText(
                                item.supports
                              )}
                            </td>

                            <td className="py-4 pr-5">

                              <a
                                href={
                                  item.source_url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                {safeText(
                                  item.source_title,
                                  "Source"
                                )}{" "}
                                ↗
                              </a>

                            </td>

                            <td className="py-4">

                              <Confidence
                                score={safeScore(
                                  item.confidence,
                                  70
                                )}
                              />

                            </td>

                          </tr>
                        )
                      )
                    ) : (
                      <tr>

                        <td
                          colSpan={4}
                          className="py-9 text-center text-slate-600"
                        >
                          Evidence records were
                          not returned for this
                          analysis.
                        </td>

                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

            </section>

            {/* SOURCES */}

            <section className="mt-5 rounded-3xl border border-slate-800 bg-[#0b1222] p-6">

              <div className="flex items-center gap-2">

                <span className="text-emerald-400">
                  ▣
                </span>

                <p className="font-medium">
                  Sources Analyzed
                </p>

              </div>

              <div className="mt-4 flex flex-wrap gap-3">

                {sources.length ? (
                  sources.map(
                    (source, index) => (
                      <a
                        key={`${source.url}-${index}`}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-[180px] rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 transition hover:border-violet-500/30"
                      >

                        <p className="text-xs font-medium text-slate-300">
                          {safeText(
                            source.title,
                            `Source ${
                              index + 1
                            }`
                          )}
                        </p>

                        <p className="mt-1 max-w-[220px] truncate text-[10px] text-slate-600">
                          {source.url}
                        </p>

                      </a>
                    )
                  )
                ) : (
                  <p className="text-sm text-slate-600">
                    Source metadata unavailable.
                  </p>
                )}

              </div>

            </section>

            {/* EXPERIMENT + OUTREACH */}

            <section className="mt-6 grid gap-5 xl:grid-cols-2">

              <div
                id="experiment"
                className="scroll-mt-24 rounded-3xl border border-slate-800 bg-[#0b1222] p-7"
              >

                <div className="flex items-center gap-2">

                  <span className="text-violet-400">
                    ⚗
                  </span>

                  <p className="font-medium">
                    Recommended GTM Experiment
                  </p>

                </div>

                <p className="mt-6 text-xl leading-8 text-slate-200">
                  {safeText(
                    experiment.hypothesis
                  )}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">

                  <MiniScore
                    label="Impact"
                    score={safeScore(
                      experiment.impact_score
                    )}
                    color={COLORS.green}
                  />

                  <MiniScore
                    label="Confidence"
                    score={safeScore(
                      experiment.confidence_score
                    )}
                    color={COLORS.purple}
                  />

                  <MiniScore
                    label="Effort"
                    score={safeScore(
                      experiment.effort_score,
                      50
                    )}
                    color={COLORS.amber}
                  />

                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">

                  <SmallField
                    label="Target"
                    value={
                      experiment.target
                    }
                  />

                  <SmallField
                    label="Signal"
                    value={
                      experiment.signal
                    }
                  />

                  <SmallField
                    label="Success"
                    value={
                      experiment.success_metric
                    }
                  />

                </div>

                <div className="mt-6 flex gap-3">

                  <button
                    onClick={() => {
                      localStorage.setItem(
                        "gtm-genome-experiment",
                        JSON.stringify(
                          experiment
                        )
                      );

                      setSavedExperiment(
                        true
                      );
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-5 py-3 text-sm font-medium"
                  >
                    {savedExperiment
                      ? "✓ Experiment Saved"
                      : "Save Experiment"}
                  </button>

                  <button
                    onClick={() =>
                      setShowOutreach(true)
                    }
                    className="flex-1 rounded-xl border border-violet-500/30 bg-violet-500/5 px-5 py-3 text-sm text-violet-200"
                  >
                    Generate Outreach
                  </button>

                </div>

              </div>

              <div
                id="outreach"
                className="scroll-mt-24 rounded-3xl border border-slate-800 bg-[#0b1222] p-7"
              >

                <div className="flex items-center gap-2">

                  <span className="text-blue-400">
                    ➤
                  </span>

                  <p className="font-medium">
                    Outreach Generator
                  </p>

                </div>

                {!showOutreach ? (
                  <div className="flex min-h-[330px] flex-col items-center justify-center text-center">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-2xl text-blue-400">
                      ✦
                    </div>

                    <p className="mt-4 font-medium">
                      Turn insight into
                      conversation
                    </p>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Generate buyer-specific
                      LinkedIn and email messaging
                      based on this GTM research.
                    </p>

                    <button
                      onClick={() =>
                        setShowOutreach(true)
                      }
                      className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 py-3 text-sm text-blue-300"
                    >
                      Generate Messages
                    </button>

                  </div>
                ) : (
                  <div className="mt-6 space-y-4">

                    <CopyBox
                      label="LinkedIn opener"
                      text={
                        linkedinMessage
                      }
                    />

                    <CopyBox
                      label="Cold email subject"
                      text={emailSubject}
                    />

                    <CopyBox
                      label="Email preview"
                      text={emailBody}
                    />

                  </div>
                )}

              </div>

            </section>

            {/* FOOTER */}

            <footer className="mt-9 flex flex-col gap-4 border-t border-slate-800 py-7 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">

              <p>
                GTM Genome uses AI-generated
                strategic research and estimates.
                Scores are not verified company
                performance metrics.
              </p>

              <div className="flex items-center gap-3">

                <span>
                  Built by{" "}
                  <span className="text-slate-400">
                    Yashika Hemnani
                  </span>
                </span>

                <a
                  href={LINKEDIN}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-300"
                >
                  LinkedIn ↗
                </a>

                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-violet-300"
                >
                  GitHub ↗
                </a>

              </div>

            </footer>

          </div>

        </section>

      </div>

    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Pill({
  label,
}: {
  label: string;
}) {
  return (
    <span className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
      {label}
    </span>
  );
}

function ReadinessCircle({
  score,
}: {
  score: number;
}) {
  const degrees = score * 3.6;

  const rating =
    score >= 85
      ? "Exceptional"
      : score >= 75
      ? "Strong"
      : score >= 60
      ? "Developing"
      : "Early";

  return (
    <div className="flex items-center justify-center">

      <div
        className="flex h-40 w-40 items-center justify-center rounded-full p-[5px]"
        style={{
          background: `conic-gradient(${COLORS.cyan} 0deg, ${COLORS.purple} ${degrees}deg, #1e293b ${degrees}deg 360deg)`,
        }}
      >

        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0b1222]">

          <p className="text-5xl font-semibold">
            {score}
          </p>

          <p className="text-xs text-slate-500">
            /100
          </p>

          <p className="mt-2 text-xs font-medium text-emerald-400">
            {rating}
          </p>

        </div>

      </div>

    </div>
  );
}

function ScoreCard({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b1222] p-5">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className="mt-3 text-3xl font-semibold"
        style={{
          color,
        }}
      >
        {score}

        <span className="ml-0.5 text-sm text-slate-600">
          /100
        </span>
      </p>

      <div className="mt-4 h-1.5 rounded-full bg-slate-800">

        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        />

      </div>

    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="h-[410px] rounded-3xl border border-slate-800 bg-[#0b1222] p-6">

      <p className="font-medium text-slate-200">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {subtitle}
      </p>

      <div className="mt-5 h-[320px]">
        {children}
      </div>

    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-[#0b1222] p-5">

      <p
        className="text-xl"
        style={{
          color,
        }}
      >
        {icon}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-sm font-medium leading-6 text-slate-200">
        {value}
      </p>

      <p className="mt-3 text-xs leading-5 text-slate-600">
        {sub}
      </p>

    </div>
  );
}

function Confidence({
  score,
}: {
  score: number;
}) {
  return (
    <div className="min-w-[120px]">

      <div className="flex items-center gap-3">

        <span className="w-8 text-xs text-emerald-400">
          {score}%
        </span>

        <div className="h-1.5 flex-1 rounded-full bg-slate-800">

          <div
            className="h-full rounded-full bg-emerald-500"
            style={{
              width: `${score}%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}

function MiniScore({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">

      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p
        className="mt-2 text-2xl font-semibold"
        style={{
          color,
        }}
      >
        {score}
      </p>

    </div>
  );
}

function SmallField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>

      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        {safeText(value)}
      </p>

    </div>
  );
}

function CopyBox({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  const [copied, setCopied] =
    useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        1400
      );
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">

      <div className="flex items-center justify-between gap-3">

        <p className="text-xs text-slate-500">
          {label}
        </p>

        <button
          onClick={copy}
          className="rounded-lg border border-slate-800 px-2.5 py-1 text-[10px] text-slate-500 transition hover:text-slate-300"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>

      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">
        {text}
      </p>

    </div>
  );
}

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number | string;
    name?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-3 shadow-2xl">

      {label && (
        <p className="mb-1 max-w-[240px] text-xs text-slate-400">
          {label}
        </p>
      )}

      <p className="text-sm font-medium text-white">
        {payload[0]?.value}
      </p>

    </div>
  );
}