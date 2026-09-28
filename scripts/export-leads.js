/**
 * Export website leads to a dated CSV. Read-only: SELECT statements only.
 *
 *   node scripts/export-leads.js              -> ./exports/website-leads-YYYY-MM-DD.csv
 *   node scripts/export-leads.js ~/Desktop    -> writes there instead
 *
 * Deliberately export-only. There is no import counterpart, and that is a
 * decision rather than an omission: round-tripping a live table through a
 * spreadsheet is how rows get silently damaged. Excel rewrites long numbers
 * into scientific notation, strips leading zeros, reformats dates by locale
 * and mangles the JSON in interests/focus_areas. Re-importing then overwrites
 * good rows with damaged ones, and there is no undo.
 *
 * If leads ever need annotating -- a status, a note, contacted yes/no -- the
 * answer is columns on the table, not a spreadsheet round-trip.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8")
  .split("\n")
  .forEach((line) => {
    if (line && !line.startsWith("#")) {
      const [key, ...rest] = line.split("=");
      process.env[key.trim()] = rest.join("=").trim();
    }
  });

const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const QUERY = `
SELECT
  to_char(created_at AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH12:MI AM') AS "Received (ET)",
  full_name                                                                    AS "Name",
  email                                                                        AS "Email",
  CASE WHEN wants_conversation THEN 'YES' ELSE '' END                          AS "Discovery Call",
  array_to_string(ARRAY(SELECT jsonb_array_elements_text(interests)),   ' | ')  AS "Asked About",
  array_to_string(ARRAY(SELECT jsonb_array_elements_text(focus_areas)), ' | ')  AS "Wants To Improve",
  COALESCE(message, '')                                                        AS "Their Message",
  COALESCE(cta_origin, '')                                                     AS "Came From",
  COALESCE(referred_by, '')                                                    AS "Referred By",
  CASE WHEN research_report_lead_id IS NOT NULL THEN 'yes' ELSE '' END          AS "Had Report"
FROM website_leads
ORDER BY created_at DESC`;

/** A field is quoted when it could otherwise break the row, and inner quotes are doubled. */
function csvCell(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const rows = await sql.query(QUERY);
  if (rows.length === 0) {
    console.log("No leads yet — nothing written.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(",")),
  ].join("\n");

  const dir = process.argv[2] || path.join(ROOT, "exports");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `website-leads-${new Date().toISOString().slice(0, 10)}.csv`);

  // BOM so Excel opens UTF-8 correctly — without it the ™ in the assessment
  // names arrives as mojibake.
  fs.writeFileSync(file, "﻿" + csv, "utf-8");

  const calls = rows.filter((r) => r["Discovery Call"] === "YES").length;
  console.log(`Wrote ${rows.length} leads to ${file}`);
  console.log(`  ${calls} asked for a Discovery Call`);
}

main().catch((error) => {
  console.error("Export failed:", error.message);
  process.exit(1);
});
