import Link from "next/link";
import { listPublishedInsights, type Insight } from "@/lib/insights";

export default async function InsightsCarousel() {
  let insights: Insight[] = [];
  try {
    insights = await listPublishedInsights(4);
  } catch {
    // Database not configured
  }

  if (insights.length === 0) return null;

  const imageColors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ];

  return (
    <section
      id="latest-insights"
      className="insights-carousel"
      aria-labelledby="latest-insights-title"
      style={{ padding: "4rem 1rem", backgroundColor: "#fafafa", scrollMarginTop: "72px" }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ margin: "0 0 0.5rem 0", color: "#8a6410", fontSize: "0.875rem", fontWeight: "600", letterSpacing: "0.05em" }}>
            STAY INFORMED
          </p>
          <h2 id="latest-insights-title" style={{ margin: "0 0 1rem 0", fontSize: "1.875rem", color: "#101820" }}>
            Latest Insights
          </h2>
          <p style={{ margin: 0, color: "#666", fontSize: "1rem" }}>
            Business intelligence and strategy from R.A. Clifton.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "2rem",
          }}
        >
          {insights.map((insight, idx) => (
            <Link key={insight.id} href={`/insights/${insight.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <article
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #e0e0e0",
                  cursor: "pointer",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  transition: "box-shadow 0.3s ease, transform 0.3s ease",
                }}
              >
                {/* Image Placeholder */}
                <div
                  style={{
                    width: "100%",
                    height: "200px",
                    background: imageColors[idx % imageColors.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "3rem",
                    fontWeight: "300",
                  }}
                  aria-hidden="true"
                >
                  📰
                </div>

                {/* Card Content */}
                <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#8a6410", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.05em" }}>
                    INSIGHT
                  </p>
                  <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.125rem", color: "#101820", lineHeight: "1.4", flex: 1 }}>
                    {insight.title}
                  </h3>
                  <p style={{ margin: "0 0 1rem 0", color: "#666", fontSize: "0.875rem" }}>
                    By {insight.author} • {new Date(insight.published_at || insight.created_at).toLocaleDateString()}
                  </p>
                  <p style={{ margin: 0, color: "#555", fontSize: "0.875rem", lineHeight: "1.5" }}>
                    {insight.body.slice(0, 100)}...
                  </p>
                </div>

                {/* Read More CTA */}
                <div style={{ padding: "0 1.5rem 1.5rem 1.5rem", borderTop: "1px solid #f0f0f0", marginTop: "1rem" }}>
                  <span style={{ color: "#8a6410", fontWeight: "600", fontSize: "0.875rem" }}>
                    Read More →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link
            href="/insights/archive"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              backgroundColor: "#101820",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "600",
              fontSize: "0.875rem",
              transition: "background-color 0.2s ease",
            }}
          >
            View All Insights →
          </Link>
        </div>
      </div>
    </section>
  );
}
