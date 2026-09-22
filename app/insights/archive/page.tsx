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

  const imageColors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)",
  ];

  return (
    <main className="insights-archive">
      <div style={{ padding: "2rem 1rem", maxWidth: "1000px", margin: "0 auto" }}>
        <Link href="/" style={{ color: "#8a6410", textDecoration: "none", marginBottom: "1rem", display: "inline-block" }}>
          ← Back to Home
        </Link>

        <h1 style={{ marginTop: "1rem" }}>All Insights</h1>
        <p style={{ marginBottom: "2rem", color: "#666" }}>
          Complete archive of published insights and articles from R.A. Clifton.
        </p>

        {insights.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No insights yet. Check back soon.</p>
        ) : (
          <div style={{ display: "grid", gap: "2rem" }}>
            {insights.map((insight, idx) => (
              <article
                key={insight.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 1fr",
                  gap: "1.5rem",
                  padding: "1.5rem",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                }}
              >
                <div
                  style={{
                    height: "160px",
                    background: imageColors[idx % imageColors.length],
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "2.5rem",
                    fontWeight: "300",
                  }}
                  aria-hidden="true"
                >
                  📰
                </div>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <Link href={`/insights/${insight.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <h2 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#101820", fontSize: "1.25rem" }}>
                        {insight.title}
                      </h2>
                    </Link>
                    <p style={{ margin: "0 0 1rem 0", color: "#666", fontSize: "0.875rem" }}>
                      By {insight.author} • {new Date(insight.published_at || insight.created_at).toLocaleDateString()}
                    </p>
                    <p style={{ margin: 0, color: "#555", lineHeight: "1.6" }}>
                      {insight.body.slice(0, 200)}...
                    </p>
                  </div>
                  <div style={{ marginTop: "1rem" }}>
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
