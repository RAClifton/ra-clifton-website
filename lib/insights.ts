import { getSql } from "@/lib/db";

export interface Insight {
  id: string;
  slug: string;
  title: string;
  body: string;
  author: string;
  image_url: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getInsightBySlug(slug: string): Promise<Insight | null> {
  const sql = getSql();
  if (!sql) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (await sql`
    SELECT * FROM insights WHERE slug = ${slug} AND status = 'published'
  `) as any;
  return results?.[0] || null;
}

export async function listPublishedInsights(limit = 10, offset = 0): Promise<Insight[]> {
  const sql = getSql();
  if (!sql) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insights = (await sql`
    SELECT * FROM insights
    WHERE status = 'published'
    ORDER BY published_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as any;
  return insights || [];
}

export async function listAllInsights(limit = 10, offset = 0): Promise<Insight[]> {
  const sql = getSql();
  if (!sql) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insights = (await sql`
    SELECT * FROM insights
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as any;
  return insights || [];
}

export async function getInsightById(id: string): Promise<Insight | null> {
  const sql = getSql();
  if (!sql) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (await sql`
    SELECT * FROM insights WHERE id = ${id}::uuid
  `) as any;
  return results?.[0] || null;
}

export async function getInsightBySlugAny(slug: string): Promise<Insight | null> {
  const sql = getSql();
  if (!sql) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (await sql`
    SELECT * FROM insights WHERE slug = ${slug}
  `) as any;
  return results?.[0] || null;
}
