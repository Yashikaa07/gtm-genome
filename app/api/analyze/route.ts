import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type ScrapedPage = {
  url: string;
  title: string;
  description: string;
  text: string;
};

const PAGE_KEYWORDS = [
  "product",
  "products",
  "solution",
  "solutions",
  "use-case",
  "use-cases",
  "pricing",
  "customer",
  "customers",
  "case-study",
  "case-studies",
  "integration",
  "integrations",
  "about",
  "platform",
];

function normalizeUrl(input: string) {
  const value = input.trim();

  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }

  return value;
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

function cleanText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

async function scrapePage(url: string): Promise<{
  page: ScrapedPage;
  links: string[];
}> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; GTMGenomeResearchBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Could not read ${url}. Status ${response.status}`
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    throw new Error(`${url} did not return HTML.`);
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
    ].join(",")
  ).remove();

  const title = cleanText($("title").first().text());

  const description = cleanText(
    $('meta[name="description"]').attr("content") || ""
  );

  const headings = $("h1, h2, h3")
    .map((_, element) =>
      cleanText($(element).text())
    )
    .get()
    .filter(Boolean)
    .slice(0, 40);

  const paragraphs = $("p, li")
    .map((_, element) =>
      cleanText($(element).text())
    )
    .get()
    .filter(
      (text) =>
        text.length >= 35 &&
        text.length <= 1000
    )
    .slice(0, 120);

  const text = [
    description,
    ...headings,
    ...paragraphs,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 16000);

  const base = new URL(url);

  const links = $("a[href]")
    .map((_, element) => {
      const href =
        $(element).attr("href") || "";

      try {
        const target = new URL(href, base);

        target.hash = "";

        return target.toString();
      } catch {
        return "";
      }
    })
    .get()
    .filter(Boolean);

  return {
    page: {
      url,
      title,
      description,
      text,
    },
    links,
  };
}

function rankInternalLinks(
  homepage: string,
  links: string[]
) {
  const origin = new URL(homepage).origin;

  const unique = Array.from(new Set(links));

  return unique
    .filter((link) => {
      try {
        const parsed = new URL(link);

        return (
          parsed.origin === origin &&
          parsed.pathname !== "/" &&
          !parsed.pathname.match(
            /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|xml)$/i
          )
        );
      } catch {
        return false;
      }
    })
    .map((link) => {
      const lower = link.toLowerCase();

      let score = 0;

      PAGE_KEYWORDS.forEach(
        (keyword, index) => {
          if (lower.includes(keyword)) {
            score +=
              PAGE_KEYWORDS.length - index;
          }
        }
      );

      return {
        link,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.link);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const inputUrl = normalizeUrl(
      body?.url || ""
    );

    if (!inputUrl) {
      return NextResponse.json(
        {
          error:
            "Website URL is required.",
        },
        { status: 400 }
      );
    }

    if (!isSafePublicUrl(inputUrl)) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid public website URL.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // 1. READ HOMEPAGE
    // ---------------------------------------

    let homepageResult;

    try {
      homepageResult =
        await scrapePage(inputUrl);
    } catch (error) {
      console.error(
        "Homepage scraping failed:",
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

    const pages: ScrapedPage[] = [
      homepageResult.page,
    ];

    // ---------------------------------------
    // 2. DISCOVER HIGH-VALUE INTERNAL PAGES
    // ---------------------------------------

    const discoveredLinks =
      rankInternalLinks(
        inputUrl,
        homepageResult.links
      );

    const selectedLinks =
      discoveredLinks.slice(0, 4);

    // ---------------------------------------
    // 3. SCRAPE UP TO 4 MORE PAGES
    // ---------------------------------------

    const extraResults =
      await Promise.allSettled(
        selectedLinks.map((link) =>
          scrapePage(link)
        )
      );

    for (const result of extraResults) {
      if (
        result.status === "fulfilled"
      ) {
        pages.push(result.value.page);
      }
    }

    // ---------------------------------------
    // 4. BUILD RESEARCH CORPUS
    // ---------------------------------------

    const researchCorpus = pages
      .map(
        (page, index) => `
==============================
SOURCE ${index + 1}
URL: ${page.url}
TITLE: ${page.title}
DESCRIPTION: ${page.description}

CONTENT:
${page.text}
==============================
`
      )
      .join("\n")
      .slice(0, 50000);

    const sourceList = pages.map(
      (page, index) => ({
        id: index + 1,
        url: page.url,
        title:
          page.title ||
          `Source ${index + 1}`,
      })
    );

    // ---------------------------------------
    // 5. AI RESEARCH PROMPT
    // ---------------------------------------

    const prompt = `
You are an elite GTM strategist, market researcher, product marketer, and growth analyst.

You are analyzing a company using ACTUAL WEBSITE CONTENT gathered from multiple pages.

COMPANY WEBSITE:
${inputUrl}

SOURCES:
${JSON.stringify(sourceList, null, 2)}

RESEARCH CORPUS:
${researchCorpus}

Create a rigorous, research-friendly GTM intelligence report.

RULES:

1. Base conclusions primarily on the supplied website evidence.
2. Do not claim access to information outside these sources.
3. Do not invent revenue, customers, conversion rates, market share, headcount, or financial metrics.
4. Strategic scores are AI estimates from 0-100.
5. Channel percentages must total exactly 100.
6. Return 3-5 ICP segments.
7. Return 3-5 pain points.
8. Return 3-5 GTM opportunities.
9. Evidence records must reference one of the supplied URLs.
10. Evidence snippets must be short paraphrases or short extracted ideas from the supplied website content.
11. Use confidence scores conservatively.
12. If evidence is weak, say so.
13. Return ONLY valid JSON matching the schema.
`;

    // ---------------------------------------
    // 6. OPENROUTER
    // ---------------------------------------

    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          model: "openrouter/free",

          temperature: 0.2,

          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],

          response_format: {
            type: "json_schema",

            json_schema: {
              name: "gtm_research",

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
            "OpenRouter request failed.",
        },
        { status: 500 }
      );
    }

    const text =
      data?.choices?.[0]?.message
        ?.content;

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
      analysis = JSON.parse(text);
    } catch (error) {
      console.error(
        "JSON parse failed:",
        error
      );

      console.error(
        "Raw model response:",
        text
      );

      return NextResponse.json(
        {
          error:
            "The AI returned malformed research data. Please try again.",
        },
        { status: 500 }
      );
    }

    // Use the pages we actually fetched as
    // authoritative source metadata.
    analysis.sources_analyzed =
      pages.map((page) => ({
        url: page.url,
        title:
          page.title || page.url,
      }));

    return NextResponse.json(
      analysis
    );
  } catch (error) {
    console.error(
      "GTM research error:",
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