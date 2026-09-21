import { NextResponse } from "next/server";
import { insightCreateSchema } from "@/lib/insights-schema";
import { listPublishedInsights, listAllInsights } from "@/lib/insights";
import { createInsight } from "@/lib/insights-admin";
import { verifyAdminToken, extractTokenFromHeader } from "@/lib/insights-auth";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const insights = await listPublishedInsights(limit, offset);
  return NextResponse.json({ insights });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = insightCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid insight data" }, { status: 400 });
  }

  const insight = await createInsight(parsed.data);
  return NextResponse.json(insight, { status: 201 });
}
