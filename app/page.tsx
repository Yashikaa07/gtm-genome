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
  if (
    typeof value !== "number" ||
    Number.isNaN(value)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(value))
  );
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

export default function Home() {
  const [url, setUrl] =
    useState("");

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [progress, setProgress] =
    useState(0);

  const [loadingStep, setLoadingStep] =
    useState(0);

  const [savedReport, setSavedReport] =
    useState(false);

  const [
    savedExperiment,
    setSavedExperiment,
  ] = useState(false);

  const [
    showOutreach,
    setShowOutreach,
  ] = useState(false);

  const loadingSteps = [
    "Reading company website",
    "Detecting ICP signals",
    "Mapping buyer pains",
    "Scoring GTM opportunity",
    "Building visual report",
  ];

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setLoadingStep(0);
      return;
    }

    const timer =
      window.setInterval(() => {
        setProgress((current) => {
          const next =
            Math.min(current + 6, 92);

          const step =
            Math.min(
              Math.floor(
                (next / 100) *
                  loadingSteps.length
              ),
              loadingSteps.length - 1
            );

          setLoadingStep(step);

          return next;
        });
      }, 550);

    return () =>
      window.clearInterval(timer);
  }, [loading]);

  const analyze = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setAnalysis(null);
    setSavedReport(false);
    setSavedExperiment(false);
    setShowOutreach(false);

    try {
      const response =
        await fetch(
          "/api/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              url: url.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Analysis failed."
        );
      }

      setProgress(100);

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 200)
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

  const company =
    safeText(
      analysis?.company,
      "Company"
    );

  const category =
    safeText(
      analysis?.category,
      "Go-to-market intelligence"
    );

  const executiveSummary =
    safeText(
      analysis?.executive_summary,
      `GTM Genome generated a strategic Quick Scan for ${company}.`
    );

  const icp =
    analysis?.icp || {};

  const buyer =
    analysis?.buyer || {};

  const experiment =
    analysis?.gtm_experiment ||
    {};

  const breakdown =
    analysis?.score_breakdown ||
    {};

  const readiness =
    safeScore(
      analysis?.readiness_score,
      82
    );

  const scoreCards = [
    {
      label: "ICP Fit",
      score: safeScore(
        breakdown.icp_fit,
        icp.fit_score
      ),
      color: COLORS.green,
    },

    {
      label: "Buyer Urgency",
      score: safeScore(
        breakdown.buyer_urgency
      ),
      color: COLORS.blue,
    },

    {
      label: "Positioning",
      score: safeScore(
        breakdown.positioning_strength
      ),
      color: COLORS.purple,
    },

    {
      label: "Channel Fit",
      score: safeScore(
        breakdown.channel_fit
      ),
      color: COLORS.amber,
    },

    {
      label: "Experiment",
      score: safeScore(
        breakdown.experiment_confidence
      ),
      color: COLORS.pink,
    },
  ];

  const icpSegments =
    analysis?.icp_segments
      ?.length
      ? analysis.icp_segments
      : [
          {
            segment:
              safeText(
                icp.segment,
                "Primary ICP"
              ),

            score:
              safeScore(
                icp.fit_score
              ),
          },
        ];

  const painPoints =
    analysis?.pain_points
      ?.length
      ? analysis.pain_points
      : [
          {
            pain:
              safeText(
                analysis?.pain,
                "Primary pain"
              ),

            severity: 75,
          },
        ];

  const channelMix =
    analysis?.channel_mix
      ?.length
      ? analysis.channel_mix
      : [
          {
            channel:
              safeText(
                analysis?.channel,
                "Primary channel"
              ),

            percentage: 100,
          },
        ];

  const opportunities =
    analysis?.opportunities
      ?.length
      ? analysis.opportunities
      : [
          {
            name:
              "Primary opportunity",

            score:
              safeScore(
                icp.fit_score
              ),

            rationale:
              safeText(
                analysis?.positioning
              ),
          },
        ];

  const evidence =
    analysis?.evidence || [];

  const sources =
    analysis?.sources_analyzed ||
    [];

  const linkedinMessage =
    analysis
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

  const emailSubject =
    analysis
      ? `${company}: idea around ${safeText(
          analysis.pain
        )}`
      : "";

  const emailBody =
    analysis
      ? `Hi,

I was researching ${company} and noticed an interesting GTM opportunity.

For ${safeText(
          icp.segment,
          "your target customer"
        )}, one of the biggest challenges appears to be:

${safeText(
          analysis.pain
        )}

A potential angle worth testing:

${safeText(
          experiment.message_angle
        )}

Hypothesis:

${safeText(
          experiment.hypothesis
        )}

Would it be useful if I shared a quick breakdown of how I would test this?

Best`
      : "";

  if (!analysis) {
    return (
      <main
        className="min-h-screen overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(circle at 82% 8%, rgba(124,58,237,.28), transparent 28%), radial-gradient(circle at 9% 90%, rgba(14,165,233,.16), transparent 29%), #050816",
        }}
      >
        <div className="pointer-events-none fixed inset-0 opacity-[0.14]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",

              backgroundSize:
                "44px 44px",
            }}
          />
        </div>

        <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-7 sm:px-8 lg:px-10">

          <header className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-xl">
                🧬
              </div>

              <div>
                <p className="font-semibold">
                  GTM Genome
                </p>

                <p className="text-xs text-slate-500">
                  AI GTM Research Engine
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2">

              <a
                href={LINKEDIN}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-xs text-slate-400 transition hover:border-blue-500/40 hover:text-blue-300 sm:block"
              >
                LinkedIn ↗
              </a>

              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-xs text-slate-400 transition hover:border-violet-500/40 hover:text-violet-300 sm:block"
              >
                GitHub ↗
              </a>

            </div>

          </header>

          <div className="flex flex-1 items-center py-16">

            <div className="w-full max-w-5xl">

              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                ⚡ GTM Quick Scan
              </div>

              <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-7xl lg:text-[78px]">

                Turn any company into{" "}

                <span className="bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  actionable GTM intelligence.
                </span>

              </h1>

              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-400 sm:text-xl">

                From one company URL, map the ICP,
                buyer, pain, positioning, channel
                strategy, opportunities and next GTM
                experiment.

              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">

                <div className="h-px w-8 bg-gradient-to-r from-violet-400 to-cyan-400" />

                <p className="text-sm text-slate-500">

                  Built by{" "}

                  <span className="font-medium text-slate-200">
                    Yashika Hemnani
                  </span>

                </p>

                <a
                  href={LINKEDIN}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  LinkedIn ↗
                </a>

                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  GitHub ↗
                </a>

              </div>

              <div className="mt-10 max-w-4xl rounded-3xl border border-slate-800/80 bg-[#09101f]/85 p-2 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">

                <div className="flex flex-col gap-2 sm:flex-row">

                  <input
                    value={url}
                    onChange={(e) =>
                      setUrl(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                        "Enter"
                      ) {
                        analyze();
                      }
                    }}
                    placeholder="https://company.com"
                    className="min-w-0 flex-1 rounded-2xl bg-transparent px-5 py-4 text-base outline-none placeholder:text-slate-600"
                  />

                  <button
                    onClick={analyze}
                    disabled={
                      loading ||
                      !url.trim()
                    }
                    className="rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 px-8 py-4 font-medium shadow-lg shadow-violet-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading
                      ? "Scanning..."
                      : "Quick Scan →"}
                  </button>

                </div>

              </div>

              {loading && (
                <div className="mt-6 max-w-4xl rounded-3xl border border-slate-800 bg-[#09101f]/90 p-6">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm font-medium">
                        Building GTM report
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          loadingSteps[
                            loadingStep
                          ]
                        }
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
                        width:
                          `${progress}%`,
                      }}
                    />

                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-5">

                    {loadingSteps.map(
                      (
                        step,
                        index
                      ) => (
                        <div
                          key={
                            step
                          }
                          className={`rounded-xl border px-3 py-3 text-[11px] ${
                            index <
                            loadingStep
                              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                              : index ===
                                loadingStep
                              ? "border-violet-500/30 bg-violet-500/10 text-violet-200"
                              : "border-slate-800 text-slate-600"
                          }`}
                        >
                          {index <
                          loadingStep
                            ? "✓ "
                            : index ===
                              loadingStep
                            ? "● "
                            : "○ "}

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

              {!loading && (
                <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-500">

                  <Badge text="Homepage research" />

                  <Badge text="Visual scoring" />

                  <Badge text="Evidence-backed" />

                  <Badge text="GTM experiment" />

                </div>
              )}

            </div>

          </div>

        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">

      <div className="flex">

        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-800/80 bg-[#070c19] px-5 py-6 lg:block">

          <div className="mb-8 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500">
              🧬
            </div>

            <div>
              <p className="font-semibold">
                GTM Genome
              </p>

              <p className="text-xs text-slate-500">
                Quick Scan
              </p>
            </div>

          </div>

          <nav className="space-y-1 text-sm">

            {[
              ["Overview", "#overview"],
              ["ICP", "#icp"],
              ["Buyer Pain", "#pain"],
              [
                "Opportunities",
                "#opportunities",
              ],
              [
                "Evidence",
                "#evidence",
              ],
              [
                "Experiment",
                "#experiment",
              ],
              [
                "Outreach",
                "#outreach",
              ],
            ].map(
              (
                [label, href],
                index
              ) => (
                <a
                  key={label}
                  href={href}
                  className={`block rounded-xl px-3 py-2.5 ${
                    index === 0
                      ? "bg-violet-500/15 text-violet-200"
                      : "text-slate-500 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {label}
                </a>
              )
            )}

          </nav>

          <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">

            <p className="text-xs text-slate-500">
              Built by
            </p>

            <p className="mt-1 text-sm font-medium text-slate-200">
              Yashika Hemnani
            </p>

            <div className="mt-3 flex gap-3 text-xs">

              <a
                href={LINKEDIN}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400"
              >
                LinkedIn ↗
              </a>

              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="text-violet-400"
              >
                GitHub ↗
              </a>

            </div>

          </div>

        </aside>

        <section className="min-w-0 flex-1">

          <div className="sticky top-0 z-20 border-b border-slate-800/70 bg-[#050816]/90 px-5 py-4 backdrop-blur-xl xl:px-9">

            <div className="flex flex-col gap-3 md:flex-row">

              <div className="flex flex-1 rounded-2xl border border-slate-800 bg-slate-950/80">

                <input
                  value={url}
                  onChange={(e) =>
                    setUrl(
                      e.target.value
                    )
                  }
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                />

                <button
                  onClick={analyze}
                  disabled={loading}
                  className="m-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-2.5 text-sm font-medium"
                >
                  Analyze
                </button>

              </div>

              <div className="flex gap-2">

                <button
                  onClick={() => {
                    localStorage.setItem(
                      "gtm-genome-report",
                      JSON.stringify({
                        url,
                        analysis,
                      })
                    );

                    setSavedReport(
                      true
                    );
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm"
                >
                  {savedReport
                    ? "✓ Saved"
                    : "Save Report"}
                </button>

              </div>

            </div>

          </div>

          <div className="mx-auto max-w-[1450px] px-5 py-7 xl:px-9">

            <section
              id="overview"
              className="rounded-3xl border border-slate-800 bg-[#0b1222] p-7"
            >

              <div className="grid gap-8 xl:grid-cols-[1fr_240px]">

                <div>

                  <div className="flex flex-wrap items-center gap-3">

                    <h1 className="text-4xl font-semibold sm:text-5xl">
                      {company}
                    </h1>

                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                      Quick Scan Complete
                    </span>

                  </div>

                  <p className="mt-2 text-slate-500">
                    {category}
                  </p>

                  <p className="mt-7 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
                    Executive Summary
                  </p>

                  <p className="mt-3 max-w-4xl leading-7 text-slate-300">
                    {executiveSummary}
                  </p>

                </div>

                <ReadinessCircle
                  score={readiness}
                />

              </div>

            </section>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

              {scoreCards.map(
                (item) => (
                  <ScoreCard
                    key={
                      item.label
                    }
                    {...item}
                  />
                )
              )}

            </div>

            <section
              id="icp"
              className="mt-6 grid gap-5 xl:grid-cols-2"
            >

              <ChartCard
                title="ICP Segment Fit"
                subtitle="Strategic fit across target segments"
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

                      {icpSegments.map(
                        (_, index) => (
                          <Cell
                            key={
                              index
                            }
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

              <ChartCard
                title="Channel Mix"
                subtitle="Recommended GTM allocation"
              >

                <div className="grid h-full grid-cols-[1fr_180px] items-center">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={
                          channelMix
                        }
                        dataKey="percentage"
                        nameKey="channel"
                        innerRadius={65}
                        outerRadius={102}
                      >

                        {channelMix.map(
                          (
                            _,
                            index
                          ) => (
                            <Cell
                              key={
                                index
                              }
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
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="flex justify-between gap-3 text-xs"
                        >

                          <span className="text-slate-400">
                            {safeText(
                              item.channel
                            )}
                          </span>

                          <span>
                            {
                              item.percentage
                            }
                            %
                          </span>

                        </div>
                      )
                    )}

                  </div>

                </div>

              </ChartCard>

            </section>

            <section
              id="pain"
              className="mt-5 grid gap-5 xl:grid-cols-2"
            >

              <ChartCard
                title="Buyer Pain Severity"
                subtitle="Priority problems for the target buyer"
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
                      content={
                        <DarkTooltip />
                      }
                    />

                    <Bar
                      dataKey="severity"
                      fill={
                        COLORS.pink
                      }
                      radius={[
                        8,
                        8,
                        0,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </ChartCard>

              <div
                id="opportunities"
              >

                <ChartCard
                  title="Opportunity Ranking"
                  subtitle="Highest-priority GTM opportunities"
                >

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={
                        opportunities
                      }
                      layout="vertical"
                    >

                      <XAxis
                        type="number"
                        domain={[
                          0,
                          100,
                        ]}
                        tick={{
                          fill: "#64748b",
                          fontSize: 11,
                        }}
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={145}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 10,
                        }}
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                      />

                      <Tooltip
                        content={
                          <DarkTooltip />
                        }
                      />

                      <Bar
                        dataKey="score"
                        fill={
                          COLORS.purple
                        }
                        radius={[
                          0,
                          8,
                          8,
                          0,
                        ]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </ChartCard>

              </div>

            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-3">

              <InsightCard
                title="Primary Buyer"
                value={safeText(
                  buyer.title
                )}
                description={safeText(
                  buyer.reason
                )}
              />

              <InsightCard
                title="Buying Trigger"
                value={safeText(
                  analysis.buying_trigger
                )}
                description="Signal that may increase purchase urgency."
              />

              <InsightCard
                title="Positioning"
                value={safeText(
                  analysis.positioning
                )}
                description="Recommended differentiation angle."
              />

            </section>

            <section
              id="evidence"
              className="mt-5 rounded-3xl border border-slate-800 bg-[#0b1222] p-6"
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="font-medium">
                    Research Evidence
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Homepage evidence supporting the Quick Scan
                  </p>
                </div>

                <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-500">
                  {
                    evidence.length
                  }{" "}
                  items
                </span>

              </div>

              <div className="mt-5 space-y-3">

                {evidence.length ? (
                  evidence.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                      >

                        <div className="flex flex-col gap-3 md:flex-row md:justify-between">

                          <div>

                            <p className="text-sm leading-6 text-slate-300">
                              {safeText(
                                item.evidence
                              )}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                              Supports:{" "}
                              {safeText(
                                item.supports
                              )}
                            </p>

                          </div>

                          <div className="shrink-0 text-xs">

                            <p className="text-emerald-400">
                              {safeScore(
                                item.confidence
                              )}
                              % confidence
                            </p>

                            <a
                              href={
                                item.source_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 block text-blue-400"
                            >
                              Source ↗
                            </a>

                          </div>

                        </div>

                      </div>
                    )
                  )
                ) : (
                  <p className="py-5 text-sm text-slate-600">
                    No evidence records returned.
                  </p>
                )}

              </div>

            </section>

            <section
              id="experiment"
              className="mt-5 grid gap-5 xl:grid-cols-2"
            >

              <div className="rounded-3xl border border-slate-800 bg-[#0b1222] p-7">

                <p className="text-sm font-medium text-violet-300">
                  Recommended GTM Experiment
                </p>

                <p className="mt-5 text-2xl leading-9">
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
                  />

                  <MiniScore
                    label="Confidence"
                    score={safeScore(
                      experiment.confidence_score
                    )}
                  />

                  <MiniScore
                    label="Effort"
                    score={safeScore(
                      experiment.effort_score
                    )}
                  />

                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">

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
                    label="Message"
                    value={
                      experiment.message_angle
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
                    onClick={() =>
                      setSavedExperiment(
                        true
                      )
                    }
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-3 text-sm font-medium"
                  >
                    {savedExperiment
                      ? "✓ Experiment Saved"
                      : "Save Experiment"}
                  </button>

                  <button
                    onClick={() =>
                      setShowOutreach(
                        true
                      )
                    }
                    className="flex-1 rounded-xl border border-slate-700 px-5 py-3 text-sm"
                  >
                    Generate Outreach
                  </button>

                </div>

              </div>

              <div
                id="outreach"
                className="rounded-3xl border border-slate-800 bg-[#0b1222] p-7"
              >

                <p className="text-sm font-medium text-blue-300">
                  Outreach Generator
                </p>

                {!showOutreach ? (
                  <div className="flex min-h-[330px] flex-col items-center justify-center text-center">

                    <div className="text-3xl text-blue-400">
                      ✦
                    </div>

                    <p className="mt-4 font-medium">
                      Turn research into conversation
                    </p>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                      Create buyer-specific LinkedIn and email copy from the GTM analysis.
                    </p>

                    <button
                      onClick={() =>
                        setShowOutreach(
                          true
                        )
                      }
                      className="mt-5 rounded-xl bg-blue-500/10 px-5 py-3 text-sm text-blue-300"
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
                      text={
                        emailSubject
                      }
                    />

                    <CopyBox
                      label="Email"
                      text={
                        emailBody
                      }
                    />

                  </div>
                )}

              </div>

            </section>

            <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-800 py-7 text-xs text-slate-600 sm:flex-row">

              <span>
                AI-generated GTM strategic estimates — not verified company performance metrics.
              </span>

              <span>
                Built by{" "}
                <span className="text-slate-400">
                  Yashika Hemnani
                </span>{" "}
                ·{" "}

                <a
                  href={LINKEDIN}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400"
                >
                  LinkedIn
                </a>{" "}

                ·{" "}

                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-400"
                >
                  GitHub
                </a>

              </span>

            </footer>

          </div>

        </section>

      </div>

    </main>
  );
}

function Badge({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full border border-slate-800 px-3 py-2">
      ✓ {text}
    </span>
  );
}

function ReadinessCircle({
  score,
}: {
  score: number;
}) {
  const degrees =
    score * 3.6;

  return (
    <div className="flex items-center justify-center">

      <div
        className="flex h-36 w-36 items-center justify-center rounded-full p-[5px]"
        style={{
          background: `conic-gradient(${COLORS.cyan} 0deg, ${COLORS.purple} ${degrees}deg, #1e293b ${degrees}deg 360deg)`,
        }}
      >

        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0b1222]">

          <p className="text-4xl font-semibold">
            {score}
          </p>

          <p className="text-xs text-slate-500">
            GTM readiness
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
        style={{ color }}
      >
        {score}
      </p>

      <div className="mt-4 h-1.5 rounded-full bg-slate-800">

        <div
          className="h-full rounded-full"
          style={{
            width:
              `${score}%`,
            backgroundColor:
              color,
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
    <div className="h-[400px] rounded-3xl border border-slate-800 bg-[#0b1222] p-6">

      <p className="font-medium">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {subtitle}
      </p>

      <div className="mt-5 h-[310px]">
        {children}
      </div>

    </div>
  );
}

function InsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b1222] p-6">

      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
        {title}
      </p>

      <p className="mt-4 text-xl leading-8">
        {value}
      </p>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}

function MiniScore({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">

      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-violet-300">
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

      <p className="text-[10px] uppercase tracking-[0.17em] text-slate-600">
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

      setTimeout(
        () =>
          setCopied(false),
        1200
      );
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">

      <div className="flex items-center justify-between">

        <p className="text-xs text-slate-500">
          {label}
        </p>

        <button
          onClick={copy}
          className="text-xs text-blue-400"
        >
          {copied
            ? "Copied ✓"
            : "Copy"}
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
  }>;
  label?: string;
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-3 shadow-2xl">

      {label && (
        <p className="mb-1 text-xs text-slate-400">
          {label}
        </p>
      )}

      <p className="text-sm font-medium">
        {payload[0]?.value}
      </p>

    </div>
  );
}