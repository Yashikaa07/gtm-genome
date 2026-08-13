import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type Source = {
  url: string;
  title: string;
};

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
    const parsed = new URL(value);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function readHomepage(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; GTMGenome/2.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(7000),
  });

  if (!response.ok) {
    throw new Error(
      `Could not read website. Status ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    throw new Error(
      "The supplied URL did not return an HTML website."
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

  const metaDescription = cleanText(
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
      (text) =>
        text.length >= 35 &&
        text.length <= 650
    )
    .slice(0, 45);

  const websiteText = [
    `TITLE: ${title}`,
    `DESCRIPTION: ${metaDescription}`,
    "",
    "HEADINGS:",
    ...headings,
    "",
    "CONTENT:",
    ...paragraphs,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 7500);

  return {
    title,
    text: websiteText,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const inputUrl = normalizeUrl(
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

    let homepage;

    try {
      homepage =
        await readHomepage(inputUrl);
    } catch (error) {
      console.error(
        "Website reading error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "GTM Genome could not read this website.",
        },
        { status: 400 }
      );
    }

    const source: Source = {
      url: inputUrl,
      title:
        homepage.title || inputUrl,
    };

    const prompt = `
You are a senior GTM strategist, product marketer and market researcher.

Create a FAST, concise GTM Quick Scan using ONLY the supplied website content.

WEBSITE:
${inputUrl}

WEBSITE CONTENT:
${homepage.text}

TASK:
Turn the website into an actionable GTM intelligence report.

RULES:
- Be specific and concise.
- Do not invent revenue, customers, market share, headcount or financial metrics.
- Scores are AI strategic estimates from 0 to 100.
- Return exactly 2 ICP segments.
- Return exactly 2 pain points.
- Return exactly 2 GTM opportunities.
- Return 3-4 channels whose percentages total exactly 100.
- Keep the executive summary under 70 words.
- Keep each rationale under 35 words.
- Evidence must come from the supplied homepage.
- Return no more than 3 evidence records.
- If evidence is weak, say so.
- Return ONLY JSON matching the schema.
`;

    const aiResponse = await fetch(
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
          model: "openrouter/free",

          temperature: 0.15,

          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],

          response_format: {
            type: "json_schema",

            json_schema: {
              name: "gtm_quick_scan",

              strict: true,

              schema: {
                type: "object",
                additionalProperties: false,

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
                    additionalProperties: false,

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
                    additionalProperties: false,

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
                      additionalProperties: false,

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
                    additionalProperties: false,

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
                      additionalProperties: false,

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
                      additionalProperties: false,

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
                      additionalProperties: false,

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
                      additionalProperties: false,

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
                      additionalProperties: false,

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
                    additionalProperties: false,

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

          plugins: [
            {
              id: "response-healing",
            },
          ],
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
            "The AI returned an empty response.",
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

      console.error(
        "Raw response:",
        text
      );

      return NextResponse.json(
        {
          error:
            "The AI returned malformed research. Please try again.",
        },
        { status: 500 }
      );
    }

    analysis.sources_analyzed = [
      source,
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