# GTM Genome

An AI GTM research engine with an account and buyer discovery workspace. Company homepage research produces ICP hypotheses, buyer personas, positioning, channel recommendations and an experiment. The discovery workspace turns research into an operator-reviewed customer shortlist, Apollo buyer records and a Clay enrichment handoff.

## Implemented workflow

- Existing Cheerio + OpenRouter homepage research and visual reports.
- Embedded discovery workspace after each report, plus `/discover` for independent account research.
- Up to 10 customer domains and 5 editable buyer titles per search.
- Server-side Apollo People Search, normalized results and deduplication by Apollo ID.
- Clay account CSV exports and one-account-at-a-time webhook submissions.
- Selected-buyer CSV and versioned RevenueOS JSON handoff exports.
- Connection status, explicit empty/error states and an in-memory session activity log.
- Server-held provider credentials and protected integration routes.

## Setup

Use Node.js 24+ (tests use native TypeScript stripping).

```bash
npm ci
npm run dev
```

Create `.env.local` with your own values; never commit credentials:

```dotenv
OPENROUTER_API_KEY=
APOLLO_API_KEY=
GTM_OPERATOR_TOKEN=
CLAY_WEBHOOK_URL=
CLAY_WEBHOOK_AUTH_TOKEN=
```

Set these same variables in the existing Vercel project's environment to enable deployed integrations. Use a long, random `GTM_OPERATOR_TOKEN`; enter it under **Operator access** in the workspace. This is your app access code, not your Apollo API key. Provider credentials remain on the server. Without configured tools, the app still supports account CSV preparation; it does not generate simulated buyers.

### Apollo

Create an API key with People API Search access. Account eligibility and plan permissions apply. Search returns up to 25 first-page matches; names may be partially hidden. It does not return emails or phone numbers. Separate contact enrichment is a future step and is not silently invoked.

Enter prospective customers of the analyzed company, not the analyzed company's own domain. Apollo domain matching may include former employers; confirm current employment before outreach.

Reference: https://docs.apollo.io/reference/people-api-search

### Clay

In a Clay workbook, add a **Monitor webhook** source. Set its HTTPS URL as `CLAY_WEBHOOK_URL`. If you configure Bearer-token authentication, set `CLAY_WEBHOOK_AUTH_TOKEN` to that token; match the generated Clay cURL instructions.

Submit one account at a time. The payload includes `account_domain`, `buyer_title`, `icp_hypothesis`, `signal_to_validate`, `research_company`, `source`, `review_status` and `submitted_at`. Map these columns in Clay and configure company-size, industry and signal enrichments. Submission means Clay accepted the row; it does not mean enrichment finished or the account qualified.

Alternatively, import the account CSV into a Clay table. Successful submissions are tracked within the current page session only. Check the table before retrying an uncertain submission or reloading. Configure domain-based deduplication in Clay for durable duplicate prevention.

References:
- https://university.clay.com/docs/webhook-integration-guide
- https://university.clay.com/docs/csv-import-overview

## Demo

1. Analyze a company and review its proposed ICP and persona.
2. Enter 2–3 potential customer domains and adjust buyer titles.
3. Export accounts or submit them to your configured Clay table.
4. Run Apollo discovery with your operator access code.
5. Review returned roles and employment, then select suitable buyers.
6. Export buyer records and a RevenueOS JSON handoff.

## Current boundaries

Research reads a single homepage. ICP scores and buying triggers are hypotheses rather than verified facts. Clay enrichment results are reviewed in Clay and are not synced back in this increment. RevenueOS handoff downloads a file rather than synchronizing a CRM. There is no automatic outreach, contact enrichment or persistent audit history. The operator code supports a controlled portfolio demo; a shared team deployment should use user-level authentication and durable usage limits.

## Validation

```bash
npm test
npm run build
```

Tests cover input limits, domain normalization, CSV formula escaping, Apollo filters and response deduplication, provider errors and fail-closed authentication. Live-provider verification requires configured Apollo and Clay accounts.
