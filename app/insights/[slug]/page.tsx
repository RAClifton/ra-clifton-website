import type { Metadata } from "next";
import Link from "next/link";
import { getInsightBySlug, listPublishedInsights } from "@/lib/insights";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.raclifton.com";

export async function generateStaticParams() {
  try {
    const insights = await listPublishedInsights(100);
    return insights.map((insight) => ({
      slug: insight.slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const insight = await getInsightBySlug(slug);

  if (!insight) {
    return {
      title: "Not Found",
    };
  }

  const description = insight.body.slice(0, 160);

  return {
    metadataBase: new URL(SITE_URL),
    title: insight.title,
    description,
    alternates: { canonical: `/insights/${slug}` },
    openGraph: {
      title: insight.title,
      description,
      type: "article",
      url: `/insights/${slug}`,
      siteName: "R.A. Clifton™",
    },
  };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = await getInsightBySlug(slug);

  if (!insight) {
    return (
      <main style={{ padding: "2rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
        <h1>Insight Not Found</h1>
        <p>The insight you're looking for doesn't exist.</p>
        <Link href="/insights">← Back to Insights</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem 1rem", maxWidth: "800px", margin: "0 auto" }}>
      <Link href="/insights" style={{ color: "#8a6410", textDecoration: "none", marginBottom: "1rem", display: "inline-block" }}>
        ← Back to Insights
      </Link>

      <article>
        <h1 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>{insight.title}</h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "2rem" }}>
          By {insight.author} • Published {new Date(insight.published_at || insight.created_at).toLocaleDateString()}
        </p>

        <div
          style={{
            lineHeight: "1.8",
            color: "#333",
            fontSize: "1rem",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {insight.body}
        </div>
      </article>

      <hr style={{ marginTop: "3rem", marginBottom: "2rem", border: "none", borderTop: "1px solid #e0e0e0" }} />

      <div style={{ padding: "1.5rem", backgroundColor: "#f5f1e8", borderRadius: "8px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Want a customized insights analysis for your business?</h3>
        <p style={{ marginBottom: "1rem", color: "#555" }}>Discover where your business stands with our AI-powered assessments.</p>
        <a
          href="https://assess.raclifton.com/ai-readiness?ref=insights&utm_campaign=prelaunch"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#efbd55",
            color: "#17130b",
            textDecoration: "none",
            borderRadius: "6px",
            fontWeight: "bold",
          }}
        >
          Get Your AI Readiness Score →
        </a>
      </div>

      <Link
        href="/insights"
        style={{
          display: "inline-block",
          marginTop: "2rem",
          color: "#8a6410",
          textDecoration: "none",
        }}
      >
        ← Back to Insights
      </Link>
    </main>
  );
}
