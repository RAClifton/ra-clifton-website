"use client";

import { useEffect } from "react";
import { recommendFromChips, type AssessmentKey } from "@/lib/chip-recommendations";

type LeadPayload = {
  fullName: string;
  email: string;
  interests: string[];
  focusAreas: string[];
  ctaOrigin?: string;
  referredBy?: string;
  sessionReferralCode?: string;
  researchReportLeadId?: string;
};

/**
 * sessionStorage is not guaranteed to exist.
 *
 * Safari with "Block All Cookies" enabled, and several in-app browsers
 * (Instagram, LinkedIn), throw SecurityError on the very first property access.
 * Because every listener in this file is registered inside ONE mount effect, an
 * unguarded throw would abort the effect body at that line and everything
 * declared after it — including the lead form's submit listener — would never
 * register. The form would then fall back to a native GET submit and the lead
 * would be lost silently.
 *
 * So: every sessionStorage access in this file goes through these helpers.
 * Storage is treated as a best-effort convenience. When it is unavailable the
 * site stays fully functional — chips select, the recommendation appears, the
 * form submits and the lead is captured. Only cross-page memory degrades.
 */
function safeGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage unavailable or full. Persisting is best-effort by design.
  }
}

function safeGetJSON<T>(key: string, fallback: T): T {
  const raw = safeGet(key);
  if (raw === null || raw === "") return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function randomReferralCode() {
  try {
    // crypto.randomUUID is undefined outside secure contexts; never let it throw
    // here, because this runs eagerly at mount (see safeGet's note above).
    return `rac_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  } catch {
    return `rac_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  }
}

/** Always returns a usable code. Persisting it across pages is best-effort. */
function buildSessionReferralCode() {
  const key = "rac_referral_code";
  const existing = safeGet(key);
  if (existing) return existing;
  const code = randomReferralCode();
  safeSet(key, code);
  return code;
}

export default function V12ClientController() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Preserve approved smooth-scroll destinations while recording CTA origin.
    document.querySelectorAll<HTMLAnchorElement>('a[href="#assessment-interest"], a[href="#why-ai-now"]').forEach((a) => {
      const onClick = () => {
        const origin = (a.textContent || a.getAttribute("aria-label") || "assessment-cta").trim().replace(/\s+/g, " ");
        safeSet("rac_cta_origin", origin.slice(0, 160));
      };
      a.addEventListener("click", onClick);
      cleanups.push(() => a.removeEventListener("click", onClick));
    });

    // Referral attribution from inbound links.
    const params = new URLSearchParams(window.location.search);
    const referredBy = params.get("ref");
    if (referredBy) safeSet("rac_referred_by", referredBy.slice(0, 80));
    const researchLeadId = params.get("rr");
    if (researchLeadId && /^[0-9a-f-]{36}$/i.test(researchLeadId)) safeSet("rac_research_lead_id", researchLeadId);

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

    // Share by Email must carry the same referral URL the copy button produces.
    // The markup ships an empty mailto: because the body needs the live code.
    const shareBtn = document.querySelector<HTMLAnchorElement>(".referral-secondary");
    if (shareBtn) {
      const onShare = () => {
        const code = buildSessionReferralCode();
        const url = new URL(window.location.href);
        url.hash = "assessment-interest";
        url.searchParams.set("ref", code);
        const subject = "Complimentary AI Readiness Score";
        const body = [
          "I thought you might find this useful. R.A. Clifton is offering complimentary pre-launch access to its AI Readiness Score.",
          "",
          `Get started here: ${url.toString()}`,
        ].join("\n");
        shareBtn.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      };
      shareBtn.addEventListener("mousedown", onShare);
      shareBtn.addEventListener("touchstart", onShare, { passive: true });
      shareBtn.addEventListener("focus", onShare);
      onShare();
      cleanups.push(() => {
        shareBtn.removeEventListener("mousedown", onShare);
        shareBtn.removeEventListener("touchstart", onShare);
        shareBtn.removeEventListener("focus", onShare);
      });
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

    // "Not sure where to start?" — chips record intent and recommend one next step.
    const chipButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".chips button"));
    const chipResult = document.getElementById("chip-result");
    if (chipButtons.length && chipResult) {
      const selected = new Set<string>();

      const applyRecommendation = () => {
        const labels = Array.from(selected);
        safeSet("rac_focus_areas", JSON.stringify(labels));

        const recommendation = recommendFromChips(labels);
        chipResult.textContent = "";
        if (!recommendation) return;

        const link = document.createElement("a");
        link.href = "#assessment-interest";
        link.textContent = recommendation.message;
        link.addEventListener("click", () => {
          recommendation.checkboxValues.forEach((value: AssessmentKey) => {
            const box = document.querySelector<HTMLInputElement>(
              `#assessment-interest input[type=checkbox][value="${value}"]`
            );
            if (box) box.checked = true;
          });
          safeSet("rac_cta_origin", `chip recommendation: ${recommendation.primary}`);
        });
        chipResult.appendChild(link);
      };

      chipButtons.forEach((button) => {
        const label = (button.textContent || "").trim();
        const onChipClick = () => {
          if (selected.has(label)) {
            selected.delete(label);
            button.classList.remove("sel");
            button.setAttribute("aria-pressed", "false");
          } else {
            selected.add(label);
            button.classList.add("sel");
            button.setAttribute("aria-pressed", "true");
          }
          applyRecommendation();
        };
        button.addEventListener("click", onChipClick);
        cleanups.push(() => button.removeEventListener("click", onChipClick));
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
        // Stored focus areas are only ever written by applyRecommendation above,
        // but the value is user-reachable, so it is validated before it is sent:
        // anything that is not an array of non-empty strings would fail Zod
        // server-side and show the visitor a confusing error.
        const storedFocusAreas = safeGetJSON<unknown>("rac_focus_areas", []);
        const focusAreas = Array.isArray(storedFocusAreas)
          ? storedFocusAreas
              .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
              .map((entry) => entry.trim())
              .slice(0, 10)
          : [];

        const payload: LeadPayload = {
          fullName: nameInput.value.trim(),
          email: emailInput.value.trim(),
          interests,
          focusAreas,
          ctaOrigin: safeGet("rac_cta_origin") || undefined,
          referredBy: safeGet("rac_referred_by") || undefined,
          sessionReferralCode: buildSessionReferralCode(),
          researchReportLeadId: safeGet("rac_research_lead_id") || undefined,
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
          if (result.referralCode) safeSet("rac_referral_code", result.referralCode);
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
