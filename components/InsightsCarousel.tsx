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

  // Site palette: navy and ink bases lifting into gold, teal and cyan.
  const imageColors = [
    "linear-gradient(135deg, #071116 0%, #0f2b3a 55%, #efbd55 100%)",
    "linear-gradient(135deg, #08151d 0%, #0d3b3a 55%, #19bda4 100%)",
    "linear-gradient(135deg, #071116 0%, #0e3242 55%, #20c7df 100%)",
    "linear-gradient(135deg, #101820 0%, #2a2618 55%, #c9962f 100%)",
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
                {/* Cover image, or a palette gradient carrying the brand's
                    infinity mark when the post has no image of its own. */}
                <div
                  style={{
                    width: "100%",
                    height: "200px",
                    background: insight.image_url ? "#08151d" : imageColors[idx % imageColors.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(239,189,85,.32)",
                    fontSize: "3.4rem",
                    lineHeight: 1,
                  }}
                  aria-hidden={insight.image_url ? undefined : "true"}
                >
                  {insight.image_url ? (
                    <img
                      src={insight.image_url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: "1rem" }}
                    />
                  ) : (
                    "∞"
                  )}
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
