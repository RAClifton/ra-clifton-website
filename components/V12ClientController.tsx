"use client";

import { useEffect } from "react";

type LeadPayload = {
  fullName: string;
  email: string;
  interests: string[];
  ctaOrigin?: string;
  referredBy?: string;
  sessionReferralCode?: string;
  researchReportLeadId?: string;
};

function buildSessionReferralCode() {
  const key = "rac_referral_code";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const code = `rac_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  sessionStorage.setItem(key, code);
  return code;
}

export default function V12ClientController() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Preserve approved smooth-scroll destinations while recording CTA origin.
    document.querySelectorAll<HTMLAnchorElement>('a[href="#assessment-interest"]').forEach((a) => {
      const onClick = () => {
        const origin = (a.textContent || a.getAttribute("aria-label") || "assessment-cta").trim().replace(/\s+/g, " ");
        sessionStorage.setItem("rac_cta_origin", origin.slice(0, 160));
      };
      a.addEventListener("click", onClick);
      cleanups.push(() => a.removeEventListener("click", onClick));
    });

    // Referral attribution from inbound links.
    const params = new URLSearchParams(window.location.search);
    const referredBy = params.get("ref");
    if (referredBy) sessionStorage.setItem("rac_referred_by", referredBy.slice(0, 80));
    const researchLeadId = params.get("rr");
    if (researchLeadId && /^[0-9a-f-]{36}$/i.test(researchLeadId)) sessionStorage.setItem("rac_research_lead_id", researchLeadId);

    // Approved referral actions, without collecting third-party contact data.
    const copyBtn = document.querySelector<HTMLButtonElement>(".referral-primary");
    if (copyBtn) {
      const onCopy = async () => {
        const code = buildSessionReferralCode();
        const url = new URL(window.location.href);
        url.hash = "assessment-interest";
        url.searchParams.set("ref", code);
        const original = copyBtn.textContent || "Copy Referral Link →";
        try {
          await navigator.clipboard.writeText(url.toString());
          copyBtn.textContent = "Referral Link Copied ✓";
        } catch {
          const temp = document.createElement("textarea");
          temp.value = url.toString();
          document.body.appendChild(temp);
          temp.select();
          document.execCommand("copy");
          temp.remove();
          copyBtn.textContent = "Referral Link Copied ✓";
        }
        window.setTimeout(() => { copyBtn.textContent = original; }, 2200);
      };
      copyBtn.addEventListener("click", onCopy);
      cleanups.push(() => copyBtn.removeEventListener("click", onCopy));
    }

    // Keep the approved mobile sticky behavior.
    const sticky = document.getElementById("sticky");
    if (sticky) {
      const onScroll = () => {
        sticky.style.display = window.scrollY > 700 && window.innerWidth < 1024 ? "flex" : "none";
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      onScroll();
      cleanups.push(() => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      });
    }

    const form = document.querySelector<HTMLFormElement>(".brief-image9-form");
    if (form) {
      const status = document.createElement("div");
      status.className = "form-status";
      status.setAttribute("aria-live", "polite");
      form.appendChild(status);

      const onSubmit = async (event: Event) => {
        event.preventDefault();
        const nameInput = form.querySelector<HTMLInputElement>('input[type="text"]');
        const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]');
        if (!nameInput?.value.trim() || !emailInput?.value.trim()) {
          status.dataset.state = "error";
          status.textContent = "Please enter your full name and email address.";
          return;
        }
        const interests = Array.from(document.querySelectorAll<HTMLInputElement>("#assessment-interest input[type=checkbox]:checked"))
          .map((input) => input.closest("label")?.textContent?.trim().replace(/\s+/g, " ") || input.value)
          .filter(Boolean);
        const payload: LeadPayload = {
          fullName: nameInput.value.trim(),
          email: emailInput.value.trim(),
          interests,
          ctaOrigin: sessionStorage.getItem("rac_cta_origin") || undefined,
          referredBy: sessionStorage.getItem("rac_referred_by") || undefined,
          sessionReferralCode: buildSessionReferralCode(),
          researchReportLeadId: sessionStorage.getItem("rac_research_lead_id") || undefined,
        };

        const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submit) submit.disabled = true;
        status.dataset.state = "";
        status.textContent = "Submitting…";
        try {
          const response = await fetch("/api/leads", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result?.error || "Unable to submit right now.");
          if (result.referralCode) sessionStorage.setItem("rac_referral_code", result.referralCode);
          status.dataset.state = "success";
          status.textContent = "Thank you. Your information has been received.";
          form.reset();
        } catch (error) {
          status.dataset.state = "error";
          status.textContent = error instanceof Error ? error.message : "Unable to submit right now.";
        } finally {
          if (submit) submit.disabled = false;
        }
      };
      form.addEventListener("submit", onSubmit);
      cleanups.push(() => form.removeEventListener("submit", onSubmit));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
