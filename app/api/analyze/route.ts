import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type ScrapeResult = {
  title: string;
  description: string;
  text: string;
  finalUrl: string;
};

const BLOCK_PATTERNS = [
  "access denied",
  "service unavailable",
  "temporarily unavailable",
  "enable javascript",
  "please enable javascript",
  "verify you are human",
  "checking your browser",
  "captcha",
  "cloudflare",
  "forbidden",
  "request blocked",
  "bot detection",
  "maintenance mode",
  "under maintenance",
  "site maintenance",
  "temporarily down",
];

function normalizeUrl(input: string) {
  const value = input.trim();

  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }

  return value;
}

function cleanText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function isSafePublicUrl(value: string) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function looksBlockedOrBroken(
  title: string,
  description: string,
  text: string
) {
  const combined = `${title} ${description} ${text}`.toLowerCase();

  return BLOCK_PATTERNS.some((pattern) =>
    combined.includes(pattern)
  );
}

function hasEnoughUsefulContent(text: string) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    text.length >= 1200 &&
    words.length >= 180
  );
}

async function scrapeHomepage(
  url: string
): Promise<ScrapeResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36",

      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

      "Accept-Language":
        "en-US,en;q=0.9",
    },

    redirect: "follow",
    cache: "no-store",

    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(
      `Website returned HTTP ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    throw new Error(
      "Website did not return an HTML page."
    );
  }

  const html = await response.text();

  const $ = cheerio.load(html);

  $(
    [
      "script",
      "style",
      "noscript",
      "svg",
      "iframe",
      "canvas",
      "form",
      "footer",
    ].join(",")
  ).remove();

  const title = cleanText(
    $("title").first().text()
  );

  const description = cleanText(
    $('meta[name="description"]').attr("content") || ""
  );

  const headings = $("h1, h2, h3")
    .map((_, element) =>
      cleanText($(element).text())
    )
    .get()
    .filter(Boolean)
    .slice(0, 20);

  const paragraphs = $("p, li")
    .map((_, element) =>
      cleanText($(element).text())
    )
    .get()
    .filter(
      (value) =>
        value.length >= 30 &&
        value.length <= 700
    )
    .slice(0, 50);

  const text = [
    description,
    ...headings,
    ...paragraphs,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 7500);

  return {
    title,
    description,
    text,
    finalUrl: response.url || url,
  };
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const inputUrl =
      normalizeUrl(
        body?.url || ""
      );

    if (
      !inputUrl ||
      !isSafePublicUrl(inputUrl)
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid public company website.",
        },
        { status: 400 }
      );
    }

    let page: ScrapeResult;

    try {
      page =
        await scrapeHomepage(
          inputUrl
        );
    } catch (error) {
      console.error(
        "Website fetch failed:",
        error
      );

      return NextResponse.json(
        {
          error:
            "We could not reliably access this website. The site may block automated requests or require browser rendering. Try another company for now.",
          code:
            "WEBSITE_UNREADABLE",
        },
        { status: 422 }
      );
    }

    const blocked =
      looksBlockedOrBroken(
        page.title,
        page.description,
        page.text
      );

    const enoughContent =
      hasEnoughUsefulContent(
        page.text
      );

    if (
      blocked ||
      !enoughContent
    ) {
      console.warn(
        "Low-quality website extraction:",
        {
          title: page.title,
          chars:
            page.text.length,
          blocked,
        }
      );

      return NextResponse.json(
        {
          error:
            "GTM Genome could not retrieve enough reliable company information from this website. Some large or JavaScript-heavy sites block automated research. No GTM scores were generated.",
          code:
            "INSUFFICIENT_WEBSITE_DATA",
        },
        { status: 422 }
      );
    }

    const prompt = `
You are a senior GTM strategist and market researcher.

Analyze this company using ONLY the website evidence supplied below.

COMPANY WEBSITE:
${page.finalUrl}

PAGE TITLE:
${page.title}

PAGE DESCRIPTION:
${page.description}

WEBSITE CONTENT:
${page.text}

IMPORTANT ACCURACY RULES:

- Never claim the company is experiencing an outage, maintenance, shutdown, or service issue unless the supplied website explicitly and clearly states that.
- Never interpret missing information as evidence that a company has no product, customers, positioning, or market.
- Never invent company facts.
- Never invent revenue, customer counts, headcount, financial metrics, or market share.
- Scores are strategic AI estimates only.
- If evidence for a conclusion is weak, say "Limited evidence available."
- Return exactly 2 ICP segments.
- Return exactly 2 buyer pain points.
- Return exactly 2 GTM opportunities.
- Return 3 or 4 channels whose percentages total 100.
- Return at most 3 evidence records.
- Keep answers concise.
- Return ONLY valid JSON matching the supplied schema.
`;

    const aiResponse =
      await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${process.env.OPENROUTER_API_KEY}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            model:
              "openrouter/free",

            provider: {
              sort: "latency",
            },

            temperature: 0.1,

            max_tokens: 1800,

            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],

            response_format: {
              type: "json_schema",

              json_schema: {
                name:
                  "gtm_analysis",

                strict: true,

                schema: {
                  type: "object",
                  additionalProperties:
                    false,

                  properties: {
                    company: {
                      type: "string",
                    },

                    category: {
                      type: "string",
                    },

                    executive_summary: {
                      type: "string",
                    },

                    readiness_score: {
                      type: "number",
                    },

                    score_breakdown: {
                      type: "object",
                      additionalProperties:
                        false,

                      properties: {
                        icp_fit: {
                          type: "number",
                        },

                        buyer_urgency: {
                          type: "number",
                        },

                        positioning_strength: {
                          type: "number",
                        },

                        channel_fit: {
                          type: "number",
                        },

                        experiment_confidence: {
                          type: "number",
                        },
                      },

                      required: [
                        "icp_fit",
                        "buyer_urgency",
                        "positioning_strength",
                        "channel_fit",
                        "experiment_confidence",
                      ],
                    },

                    icp: {
                      type: "object",
                      additionalProperties:
                        false,

                      properties: {
                        segment: {
                          type: "string",
                        },

                        company_size: {
                          type: "string",
                        },

                        fit_score: {
                          type: "number",
                        },

                        reason: {
                          type: "string",
                        },
                      },

                      required: [
                        "segment",
                        "company_size",
                        "fit_score",
                        "reason",
                      ],
                    },

                    icp_segments: {
                      type: "array",

                      items: {
                        type: "object",
                        additionalProperties:
                          false,

                        properties: {
                          segment: {
                            type: "string",
                          },

                          score: {
                            type: "number",
                          },

                          reason: {
                            type: "string",
                          },
                        },

                        required: [
                          "segment",
                          "score",
                          "reason",
                        ],
                      },
                    },

                    buyer: {
                      type: "object",
                      additionalProperties:
                        false,

                      properties: {
                        title: {
                          type: "string",
                        },

                        reason: {
                          type: "string",
                        },
                      },

                      required: [
                        "title",
                        "reason",
                      ],
                    },

                    pain: {
                      type: "string",
                    },

                    pain_points: {
                      type: "array",

                      items: {
                        type: "object",
                        additionalProperties:
                          false,

                        properties: {
                          pain: {
                            type: "string",
                          },

                          severity: {
                            type: "number",
                          },
                        },

                        required: [
                          "pain",
                          "severity",
                        ],
                      },
                    },

                    buying_trigger: {
                      type: "string",
                    },

                    positioning: {
                      type: "string",
                    },

                    channel: {
                      type: "string",
                    },

                    channel_mix: {
                      type: "array",

                      items: {
                        type: "object",
                        additionalProperties:
                          false,

                        properties: {
                          channel: {
                            type: "string",
                          },

                          percentage: {
                            type: "number",
                          },
                        },

                        required: [
                          "channel",
                          "percentage",
                        ],
                      },
                    },

                    opportunities: {
                      type: "array",

                      items: {
                        type: "object",
                        additionalProperties:
                          false,

                        properties: {
                          name: {
                            type: "string",
                          },

                          score: {
                            type: "number",
                          },

                          rationale: {
                            type: "string",
                          },
                        },

                        required: [
                          "name",
                          "score",
                          "rationale",
                        ],
                      },
                    },

                    evidence: {
                      type: "array",

                      items: {
                        type: "object",
                        additionalProperties:
                          false,

                        properties: {
                          source_url: {
                            type: "string",
                          },

                          source_title: {
                            type: "string",
                          },

                          evidence: {
                            type: "string",
                          },

                          supports: {
                            type: "string",
                          },

                          confidence: {
                            type: "number",
                          },
                        },

                        required: [
                          "source_url",
                          "source_title",
                          "evidence",
                          "supports",
                          "confidence",
                        ],
                      },
                    },

                    sources_analyzed: {
                      type: "array",

                      items: {
                        type: "object",
                        additionalProperties:
                          false,

                        properties: {
                          url: {
                            type: "string",
                          },

                          title: {
                            type: "string",
                          },
                        },

                        required: [
                          "url",
                          "title",
                        ],
                      },
                    },

                    gtm_experiment: {
                      type: "object",
                      additionalProperties:
                        false,

                      properties: {
                        hypothesis: {
                          type: "string",
                        },

                        target: {
                          type: "string",
                        },

                        signal: {
                          type: "string",
                        },

                        message_angle: {
                          type: "string",
                        },

                        success_metric: {
                          type: "string",
                        },

                        impact_score: {
                          type: "number",
                        },

                        confidence_score: {
                          type: "number",
                        },

                        effort_score: {
                          type: "number",
                        },
                      },

                      required: [
                        "hypothesis",
                        "target",
                        "signal",
                        "message_angle",
                        "success_metric",
                        "impact_score",
                        "confidence_score",
                        "effort_score",
                      ],
                    },
                  },

                  required: [
                    "company",
                    "category",
                    "executive_summary",
                    "readiness_score",
                    "score_breakdown",
                    "icp",
                    "icp_segments",
                    "buyer",
                    "pain",
                    "pain_points",
                    "buying_trigger",
                    "positioning",
                    "channel",
                    "channel_mix",
                    "opportunities",
                    "evidence",
                    "sources_analyzed",
                    "gtm_experiment",
                  ],
                },
              },
            },
          }),
        }
      );

    const data =
      await aiResponse.json();

    if (!aiResponse.ok) {
      console.error(
        "OpenRouter error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "AI analysis failed.",
        },
        { status: 500 }
      );
    }

    const text =
      data?.choices?.[0]
        ?.message?.content;

    if (!text) {
      return NextResponse.json(
        {
          error:
            "AI returned an empty response.",
        },
        { status: 500 }
      );
    }

    let analysis;

    try {
      analysis =
        JSON.parse(text);
    } catch (error) {
      console.error(
        "JSON parse error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "The AI response could not be processed. Please try again.",
        },
        { status: 500 }
      );
    }

    analysis.sources_analyzed =
      [
        {
          url:
            page.finalUrl,
          title:
            page.title ||
            page.finalUrl,
        },
      ];

    return NextResponse.json(
      analysis
    );
  } catch (error) {
    console.error(
      "GTM Genome error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to analyze GTM strategy.",
      },
      { status: 500 }
    );
  }
}