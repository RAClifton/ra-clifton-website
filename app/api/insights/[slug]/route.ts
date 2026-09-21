import { NextResponse } from "next/server";
import { getInsightBySlug, getInsightById } from "@/lib/insights";
import { updateInsight, publishInsight, unpublishInsight, deleteInsight, getAuditLog } from "@/lib/insights-admin";
import { insightUpdateSchema } from "@/lib/insights-schema";
import { verifyAdminToken, extractTokenFromHeader } from "@/lib/insights-auth";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const insight = await getInsightBySlug(slug);

  if (!insight) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(insight);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const insight = await getInsightBySlug(slug);

  if (!insight) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await request.json().catch(() => null);

  // Handle publish/unpublish via body
  if (data && data.status) {
    const updated =
      data.status === "published" ? await publishInsight(insight.id) : await unpublishInsight(insight.id);

    if (!updated) {
      return NextResponse.json({ error: "Could not update status" }, { status: 400 });
    }

    return NextResponse.json(updated);
  }

  // Handle field updates
  const parsed = insightUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update data" }, { status: 400 });
  }

  const updated = await updateInsight(insight.id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Could not update insight" }, { status: 400 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const insight = await getInsightBySlug(slug);

  if (!insight) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteInsight(insight.id);
  return NextResponse.json({ ok: true });
}
