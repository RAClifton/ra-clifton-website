import Link from "next/link";

export default function TopNav() {
  return (
    <nav
      style={{
        padding: "0.75rem 1rem",
        backgroundColor: "#fff",
        borderBottom: "1px solid #f0f0f0",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <style>{`
        .top-nav-link {
          color: #101820;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.2s;
        }
        .top-nav-link:hover {
          color: #8a6410;
        }
      `}</style>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "flex-end", gap: "2rem" }}>
        {/* Plain anchor, not Link: this nav only renders on the homepage, so this
            is a same-page fragment. Next's router would client-side navigate and
            run its own scroll logic, which ignores the section's scroll-margin-top. */}
        <a href="#latest-insights" className="top-nav-link">
          Insights
        </a>
        <Link href="/insights/archive" className="top-nav-link">
          All Insights
        </Link>
      </div>
    </nav>
  );
}
