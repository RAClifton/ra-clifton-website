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
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "flex-end", gap: "1.5rem" }}>
        <Link href="/insights/archive" className="top-nav-link">
          Insights
        </Link>
      </div>
    </nav>
  );
}
