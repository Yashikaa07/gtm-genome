import { timingSafeEqual } from "node:crypto";

export function authorized(request: Request) {
  const expected = process.env.GTM_OPERATOR_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readJson(request: Request) {
  const text = await request.text();
  if (text.length > 32_000) throw new Error("Request is too large.");
  try { return JSON.parse(text) as unknown; }
  catch { throw new Error("Provide valid JSON."); }
}
