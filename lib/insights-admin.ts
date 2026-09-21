import { getSql } from "@/lib/db";
import type { InsightInput, InsightUpdate } from "@/lib/insights-schema";
import type { Insight } from "@/lib/insights";

export async function createInsight(data: InsightInput): Promise<{ id: string; slug: string }> {
  const sql = getSql();
  if (!sql) throw new Error("Database not configured");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (await sql`
    INSERT INTO insights (slug, title, body, author, status, created_at, updated_at)
    VALUES (${data.slug}, ${data.title}, ${data.body}, ${data.author}, 'draft', now(), now())
    RETURNING id, slug
  `) as any;

  const insight = results?.[0] as { id: string; slug: string } | undefined;
  if (!insight) throw new Error("Failed to create insight");

  await logAuditEvent(insight.id, "created", {
    slug: data.slug,
    title: data.title,
    author: data.author,
  });

  return insight;
}

export async function updateInsight(id: string, data: InsightUpdate): Promise<Insight | null> {
  const sql = getSql();
  if (!sql) throw new Error("Database not configured");

  const updates: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push("title");
    values.push(data.title);
  }
  if (data.body !== undefined) {
    updates.push("body");
    values.push(data.body);
  }
  if (data.author !== undefined) {
    updates.push("author");
    values.push(data.author);
  }
  if (data.slug !== undefined) {
    updates.push("slug");
    values.push(data.slug);
  }

  if (updates.length === 0) return null;

  values.push(id);

  const setClause = updates.map((field) => `${field} = $${updates.indexOf(field) + 1}`).join(", ");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (await sql`
    UPDATE insights
    SET ${setClause}, updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING *
  `) as any;

  const insight = results?.[0] as Insight | undefined;
  if (insight) {
    await logAuditEvent(id, "updated", data);
  }

  return insight || null;
}

export async function publishInsight(id: string): Promise<Insight | null> {
  const sql = getSql();
  if (!sql) throw new Error("Database not configured");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (await sql`
    UPDATE insights
    SET status = 'published', published_at = now(), updated_at = now()
    WHERE id = ${id}::uuid AND status = 'draft'
    RETURNING *
  `) as any;

  const insight = results?.[0] as Insight | undefined;
  if (insight) {
    await logAuditEvent(id, "published", { status: "published" });
  }

  return insight || null;
}

export async function unpublishInsight(id: string): Promise<Insight | null> {
  const sql = getSql();
  if (!sql) throw new Error("Database not configured");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (await sql`
    UPDATE insights
    SET status = 'draft', published_at = null, updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING *
  `) as any;

  const insight = results?.[0] as Insight | undefined;
  if (insight) {
    await logAuditEvent(id, "unpublished", { status: "draft" });
  }

  return insight || null;
}

export async function deleteInsight(id: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) throw new Error("Database not configured");

  await sql`DELETE FROM insights WHERE id = ${id}::uuid`;
  await logAuditEvent(id, "deleted", {});

  return true;
}

async function logAuditEvent(insightId: string, action: string, changedFields: Record<string, unknown>) {
  const sql = getSql();
  if (!sql) return;

  await sql`
    INSERT INTO insights_audit (insight_id, action, changed_fields, changed_at)
    VALUES (${insightId}::uuid, ${action}, ${JSON.stringify(changedFields)}::jsonb, now())
  `;
}

export async function getAuditLog(insightId: string): Promise<Array<{ action: string; changed_at: string; changed_fields: unknown }>> {
  const sql = getSql();
  if (!sql) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (await sql`
    SELECT action, changed_at, changed_fields FROM insights_audit
    WHERE insight_id = ${insightId}::uuid
    ORDER BY changed_at DESC
  `) as any as Array<{ action: string; changed_at: string; changed_fields: unknown }>;

  return events || [];
}
