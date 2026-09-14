"use client";
import { FormEvent, useEffect, useRef, useState } from "react";

const REPORT_PATH = "/research/ai-for-a-small-business-the-case-for-starting-now.pdf";

export default function ResearchReportLeadMagnet() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [reportUrl, setReportUrl] = useState(REPORT_PATH);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = document.querySelector<HTMLButtonElement>(".research-report-trigger");
    if (!trigger) return;
    const show = () => setOpen(true);
    trigger.addEventListener("click", show);
    return () => trigger.removeEventListener("click", show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("report-modal-open");
    window.setTimeout(() => dialog.current?.querySelector<HTMLInputElement>("input")?.focus(), 0);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("report-modal-open"); window.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, [open]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true); setStatus("Preparing your report…");
    try {
      const r = await fetch("/api/research-report", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ fullName:fd.get("fullName"), email:fd.get("email"), ctaOrigin:"why_ai_research_section" }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Unable to prepare the report right now.");
      sessionStorage.setItem("rac_research_lead_id", data.leadId);
      setReportUrl(data.reportUrl || REPORT_PATH);
      setDone(true);
      setStatus(data.emailSent ? "A copy has also been sent to your email." : "Your report is ready now.");
    } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to prepare the report right now."); }
    finally { setBusy(false); }
  }

  if (!open) return null;
  return <div className="report-modal-backdrop" onMouseDown={(e)=>{ if(e.target===e.currentTarget) setOpen(false); }}>
    <div className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title" ref={dialog}>
      <button className="report-modal-close" aria-label="Close research report form" onClick={()=>setOpen(false)}>×</button>
      {!done ? <>
        <p className="report-modal-eyebrow">R.A. CLIFTON RESEARCH</p>
        <h2 id="report-title">AI for a Small Business:<br/><span>The Case for Starting Now.</span></h2>
        <p className="report-modal-deck">A decision brief for business owners who want a practical, measured way to evaluate AI—without hype or a wholesale transformation.</p>
        <form className="report-modal-form" onSubmit={submit}>
          <label>Full Name<input name="fullName" type="text" autoComplete="name" required minLength={2}/></label>
          <label>Email Address<input name="email" type="email" autoComplete="email" required/></label>
          <button type="submit" disabled={busy}>{busy ? "Preparing…" : "Get the Research Report →"}</button>
          <small>Immediate access after submission. We’ll also email you a copy.</small>
          <div className="report-modal-status" aria-live="polite">{status}</div>
        </form>
      </> : <div className="report-success">
        <p className="report-modal-eyebrow">YOUR RESEARCH REPORT IS READY</p>
        <h2 id="report-title">Start with the research.<br/><span>Then decide what deserves action.</span></h2>
        <p className="report-modal-deck">Read it now or save the PDF. When you’re ready, the AI Readiness Score™ is the natural next step.</p>
        <div className="report-success-actions">
          <a className="report-primary" href={reportUrl} target="_blank" rel="noreferrer">Read Report →</a>
          <a className="report-secondary" href={reportUrl} download>Download PDF</a>
        </div>
        <a className="report-readiness-link" href="#assessment-interest" onClick={()=>{ sessionStorage.setItem("rac_cta_origin","research_report_success"); setOpen(false); }}>Discover Your AI Readiness Score™ →</a>
        <div className="report-modal-status" aria-live="polite">{status}</div>
      </div>}
    </div>
  </div>;
}
