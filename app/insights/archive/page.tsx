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

  // Site palette: navy and ink bases lifting into gold, teal and cyan.
  const imageColors = [
    "linear-gradient(135deg, #071116 0%, #0f2b3a 55%, #efbd55 100%)",
    "linear-gradient(135deg, #08151d 0%, #0d3b3a 55%, #19bda4 100%)",
    "linear-gradient(135deg, #071116 0%, #0e3242 55%, #20c7df 100%)",
    "linear-gradient(135deg, #101820 0%, #2a2618 55%, #c9962f 100%)",
    "linear-gradient(135deg, #08151d 0%, #123040 55%, #f7f3e9 100%)",
    "linear-gradient(135deg, #071116 0%, #17313c 55%, #5a6871 100%)",
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
                    background: insight.image_url ? "#08151d" : imageColors[idx % imageColors.length],
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(239,189,85,.32)",
                    fontSize: "2.8rem",
                    lineHeight: 1,
                    overflow: "hidden",
                  }}
                  aria-hidden={insight.image_url ? undefined : "true"}
                >
                  {insight.image_url ? (
                    <img
                      src={insight.image_url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                    />
                  ) : (
                    "\u221e"
                  )}
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
