export async function GET() {
  const protectedAccess = Boolean(process.env.GTM_OPERATOR_TOKEN);
  return Response.json({
    apollo: protectedAccess && Boolean(process.env.APOLLO_API_KEY),
    clay: protectedAccess && Boolean(process.env.CLAY_WEBHOOK_URL),
  }, { headers: { "Cache-Control": "no-store" } });
}
