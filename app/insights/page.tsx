import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedInsights, type Insight } from "@/lib/insights";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.raclifton.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Insights — R.A. Clifton™",
  description: "Business intelligence, AI strategy, and financial insights from R.A. Clifton.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "Insights — R.A. Clifton™",
    description: "Business intelligence, AI strategy, and financial insights.",
    type: "website",
    url: "/insights",
    siteName: "R.A. Clifton™",
  },
};

export default async function InsightsPage() {
  let insights: Insight[] = [];
  try {
    insights = await listPublishedInsights(100);
  } catch {
    // Database not configured yet
  }

  return (
    <main className="insights-page">
      <div style={{ padding: "2rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
        <h1>Insights</h1>
        <p style={{ marginBottom: "2rem", color: "#666" }}>
          Business intelligence, AI strategy, and financial insights from R.A. Clifton.
        </p>

        {insights.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No insights yet. Check back soon.</p>
        ) : (
          <div style={{ display: "grid", gap: "1.5rem" }}>
            {insights.map((insight) => (
              <article
                key={insight.id}
                style={{
                  padding: "1.5rem",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  backgroundColor: "#fafafa",
                }}
              >
                <Link href={`/insights/${insight.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <h2 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#101820" }}>{insight.title}</h2>
                </Link>
                <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
                  By {insight.author} • {new Date(insight.published_at || insight.created_at).toLocaleDateString()}
                </p>
                <p style={{ marginTop: "1rem", marginBottom: "1rem", color: "#555" }}>
                  {insight.body.slice(0, 200)}...
                </p>
                <Link href={`/insights/${insight.slug}`} style={{ color: "#8a6410", textDecoration: "none", fontWeight: "bold" }}>
                  Read More →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
