import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedInsights, type Insight } from "@/lib/insights";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.raclifton.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Insights Archive — R.A. Clifton™",
  description: "Browse all published insights, articles, and business intelligence from R.A. Clifton.",
  alternates: { canonical: "/insights/archive" },
  openGraph: {
    title: "Insights Archive — R.A. Clifton™",
    description: "Browse all published insights and articles.",
    type: "website",
    url: "/insights/archive",
    siteName: "R.A. Clifton™",
  },
};

export default async function ArchivePage() {
  let insights: Insight[] = [];
  try {
    insights = await listPublishedInsights(100);
  } catch {
    // Database not configured yet
  }

  return (
    <main className="insights-archive">
      <div style={{ padding: "2rem 1rem", maxWidth: "900px", margin: "0 auto" }}>
        <Link href="/insights" style={{ color: "#8a6410", textDecoration: "none", marginBottom: "1rem", display: "inline-block" }}>
          ← Back to Recent Insights
        </Link>

        <h1 style={{ marginTop: "1rem" }}>All Insights</h1>
        <p style={{ marginBottom: "2rem", color: "#666" }}>
          Complete archive of published insights and articles.
        </p>

        {insights.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No insights yet. Check back soon.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <Link href={`/insights/${insight.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <h2 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#101820" }}>{insight.title}</h2>
                    </Link>
                    <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
                      By {insight.author} • {new Date(insight.published_at || insight.created_at).toLocaleDateString()}
                    </p>
                    <p style={{ marginTop: "1rem", marginBottom: "1rem", color: "#555" }}>
                      {insight.body.slice(0, 180)}...
                    </p>
                    <Link href={`/insights/${insight.slug}`} style={{ color: "#8a6410", textDecoration: "none", fontWeight: "bold" }}>
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
