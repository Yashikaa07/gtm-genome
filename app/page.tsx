"use client";

import { useEffect, useState, type ReactNode } from "react";
import ResearchLanding from "./components/ResearchLanding";
import ProspectingWorkspace from "./components/ProspectingWorkspace";
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
    return <ResearchLanding url={url} setUrl={setUrl} analyze={analyze} loading={loading} error={error} progress={progress} loadingStep={loadingSteps[loadingStep]} />;
  }

  return (
    <main className="min-h-screen bg-[#fafaf8] text-slate-900">

      <div className="flex">

        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:block">

          <div className="mb-8 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              ✳
            </div>

            <div>
              <p className="font-semibold">
                GTM Genome
              </p>

              <p className="text-xs text-slate-600">
                Quick Scan
              </p>
            </div>

          </div>

          <nav className="space-y-1 text-sm">

            {[
              ["Overview", "#overview"],
              ["ICP", "#icp"],
              ["Account Discovery", "#discovery"],
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
                      ? "bg-violet-500/15 text-violet-700"
                      : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  {label}
                </a>
              )
            )}

          </nav>

          <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <p className="text-xs text-slate-600">
              Built by
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              Yashika Hemnani
            </p>

            <div className="mt-3 flex gap-3 text-xs">

              <a
                href={LINKEDIN}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700"
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

          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-xl xl:px-9">

            <div className="flex flex-col gap-3 md:flex-row">

              <div className="flex flex-1 rounded-2xl border border-slate-200 bg-white">

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
                  className="m-1 rounded-xl bg-violet-600 text-white hover:bg-violet-700 px-5 py-2.5 text-sm font-medium"
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
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
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
              className="rounded-3xl border border-slate-200 bg-white p-7"
            >

              <div className="grid gap-8 xl:grid-cols-[1fr_240px]">

                <div>

                  <div className="flex flex-wrap items-center gap-3">

                    <h1 className="text-4xl font-semibold sm:text-5xl">
                      {company}
                    </h1>

                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700">
                      Quick Scan Complete
                    </span>

                  </div>

                  <p className="mt-2 text-slate-600">
                    {category}
                  </p>

                  <p className="mt-7 text-xs font-medium uppercase tracking-[0.18em] text-violet-700">
                    Executive Summary
                  </p>

                  <p className="mt-3 max-w-4xl leading-7 text-slate-700">
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
                      stroke="#e8eaf0"
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
                        fill: "#64748b",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={
                        <ResearchTooltip />
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
                          <ResearchTooltip />
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

                          <span className="text-slate-600">
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
                      stroke="#e8eaf0"
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
                        <ResearchTooltip />
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
                          fill: "#64748b",
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
                          <ResearchTooltip />
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
              className="mt-5 rounded-3xl border border-slate-200 bg-white p-6"
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="font-medium">
                    Research Evidence
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Homepage evidence supporting the Quick Scan
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
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
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                      >

                        <div className="flex flex-col gap-3 md:flex-row md:justify-between">

                          <div>

                            <p className="text-sm leading-6 text-slate-700">
                              {safeText(
                                item.evidence
                              )}
                            </p>

                            <p className="mt-2 text-xs text-slate-600">
                              Supports:{" "}
                              {safeText(
                                item.supports
                              )}
                            </p>

                          </div>

                          <div className="shrink-0 text-xs">

                            <p className="text-emerald-700">
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
                              className="mt-2 block text-blue-700"
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

            <ProspectingWorkspace context={analysis} />

            <section
              id="experiment"
              className="mt-5 grid gap-5 xl:grid-cols-2"
            >

              <div className="rounded-3xl border border-slate-200 bg-white p-7">

                <p className="text-sm font-medium text-violet-700">
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
                    className="flex-1 rounded-xl bg-violet-600 text-white hover:bg-violet-700 px-5 py-3 text-sm font-medium"
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
                    className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-sm"
                  >
                    Generate Outreach
                  </button>

                </div>

              </div>

              <div
                id="outreach"
                className="rounded-3xl border border-slate-200 bg-white p-7"
              >

                <p className="text-sm font-medium text-blue-700">
                  Outreach Generator
                </p>

                {!showOutreach ? (
                  <div className="flex min-h-[330px] flex-col items-center justify-center text-center">

                    <div className="text-3xl text-blue-700">
                      ✦
                    </div>

                    <p className="mt-4 font-medium">
                      Turn research into conversation
                    </p>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
                      Create buyer-specific LinkedIn and email copy from the GTM analysis.
                    </p>

                    <button
                      onClick={() =>
                        setShowOutreach(
                          true
                        )
                      }
                      className="mt-5 rounded-xl bg-blue-500/10 px-5 py-3 text-sm text-blue-700"
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

            <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-200 py-7 text-xs text-slate-600 sm:flex-row">

              <span>
                AI-generated GTM strategic estimates — not verified company performance metrics.
              </span>

              <span>
                Built by{" "}
                <span className="text-slate-600">
                  Yashika Hemnani
                </span>{" "}
                ·{" "}

                <a
                  href={LINKEDIN}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700"
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
          background: `conic-gradient(${COLORS.cyan} 0deg, ${COLORS.purple} ${degrees}deg, #e9e5f4 ${degrees}deg 360deg)`,
        }}
      >

        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">

          <p className="text-4xl font-semibold">
            {score}
          </p>

          <p className="text-xs text-slate-600">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p
        className="mt-3 text-3xl font-semibold"
        style={{ color }}
      >
        {score}
      </p>

      <div className="mt-4 h-1.5 rounded-full bg-slate-100">

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
    <div className="h-[400px] rounded-3xl border border-slate-200 bg-white p-6">

      <p className="font-medium">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-600">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6">

      <p className="text-xs uppercase tracking-[0.15em] text-slate-600">
        {title}
      </p>

      <p className="mt-4 text-xl leading-8">
        {value}
      </p>

      <p className="mt-4 text-sm leading-6 text-slate-600">
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-violet-700">
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

      <p className="mt-2 text-sm leading-6 text-slate-700">
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

      <div className="flex items-center justify-between">

        <p className="text-xs text-slate-600">
          {label}
        </p>

        <button
          onClick={copy}
          className="text-xs text-blue-700"
        >
          {copied
            ? "Copied ✓"
            : "Copy"}
        </button>

      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
        {text}
      </p>

    </div>
  );
}

function ResearchTooltip({
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
    <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-2xl">

      {label && (
        <p className="mb-1 text-xs text-slate-600">
          {label}
        </p>
      )}

      <p className="text-sm font-medium">
        {payload[0]?.value}
      </p>

    </div>
  );
}
