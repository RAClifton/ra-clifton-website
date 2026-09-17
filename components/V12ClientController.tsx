"use client";

import { useEffect } from "react";

type LeadPayload = {
  fullName: string;
  email: string;
  interests: string[];
  focusAreas: string[];
  message?: string;
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
    document.querySelectorAll<HTMLAnchorElement>('a[href="#assessment-interest"]').forEach((a) => {
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

    // The full email now ships in the markup, so Share by Email works with no
    // JavaScript at all. This only UPGRADES it: same copy, but the link gains
    // this visitor's referral code so the referral can be attributed.
    const shareBtn = document.querySelector<HTMLAnchorElement>(".referral-secondary");
    if (shareBtn) {
      const onShare = () => {
        const code = buildSessionReferralCode();
        const url = new URL(window.location.href);
        url.hash = "assessment-interest";
        url.searchParams.set("ref", code);
        // Written to read like a person forwarding something, not a broadcast:
        // a reason to open it, what they get, what it costs them, and the link.
        const subject = "Thought this might be useful \u2014 free AI readiness score";
        const body = [
          "I came across this and thought of you.",
          "",
          "R.A. Clifton, a CPA and business advisory firm, is giving complimentary access to their AI Readiness Score\u2122 during pre-launch. It takes about five minutes and shows you where your business actually stands with AI \u2014 what you are already set up for, where the practical opportunities are, and what is worth doing first.",
          "",
          "No cost, nothing to install, and your results come back straight away.",
          "",
          "Get your score here:",
          url.toString(),
          "",
          "Your information stays private and secure.",
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

    /**
     * The improvement pills appear twice: under "Not sure where to start?" and
     * again inside the signup box. They are ONE answer shown in two places, so a
     * click on either copy updates every button carrying that label.
     *
     * They deliberately do not recommend an assessment and do not tick any
     * checkbox. The checkboxes are what the visitor asks for; the pills are what
     * they say they care about. Both are captured when they submit.
     */
    const chipButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".chips button"));
    const chipResult = document.getElementById("chip-result");
    if (chipButtons.length) {
      const labelOf = (b: HTMLButtonElement) => (b.textContent || "").trim();
      const selected = new Set<string>(
        safeGetJSON<unknown>("rac_focus_areas", []) instanceof Array
          ? (safeGetJSON<unknown[]>("rac_focus_areas", []).filter(
              (v): v is string => typeof v === "string" && v.trim().length > 0
            ) as string[])
          : []
      );

      const render = () => {
        chipButtons.forEach((b) => {
          const on = selected.has(labelOf(b));
          b.classList.toggle("sel", on);
          b.setAttribute("aria-pressed", String(on));
        });

        if (!chipResult) return;
        chipResult.textContent = "";
        if (selected.size === 0) return;
        const link = document.createElement("a");
        link.href = "#assessment-interest";
        link.textContent = "Tell us where to send it \u2192";
        chipResult.appendChild(link);
      };

      chipButtons.forEach((button) => {
        const onChipClick = () => {
          const label = labelOf(button);
          if (selected.has(label)) selected.delete(label);
          else selected.add(label);
          safeSet("rac_focus_areas", JSON.stringify(Array.from(selected)));
          render();
        };
        button.addEventListener("click", onChipClick);
        cleanups.push(() => button.removeEventListener("click", onChipClick));
      });

      render();
    }

    const form = document.querySelector<HTMLFormElement>(".brief-image9-form");
    if (form) {
      const status = document.createElement("div");
      status.className = "form-status";
      status.setAttribute("aria-live", "polite");
      form.appendChild(status);

      // Live character counter for the optional message box. maxlength already
      // stops typing past the cap; this just tells the visitor where they are.
      const messageInput = form.querySelector<HTMLTextAreaElement>("#brief-message");
      const counter = form.querySelector<HTMLElement>("#brief-message-counter");
      const counterValue = counter?.querySelector<HTMLElement>(".brief-message-count");
      if (messageInput && counter && counterValue) {
        const MESSAGE_MAX = 1000;
        const renderCount = () => {
          const used = messageInput.value.length;
          counterValue.textContent = used.toLocaleString("en-US");
          counter.dataset.state = used >= MESSAGE_MAX ? "full" : used >= MESSAGE_MAX * 0.9 ? "near" : "";
        };
        messageInput.addEventListener("input", renderCount);
        cleanups.push(() => messageInput.removeEventListener("input", renderCount));
        renderCount();
      }

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
        // Read straight off the page rather than out of storage: the pills now
        // sit inside this form, so what is selected on screen at the moment they
        // press the button is the honest answer. Deduplicated because the same
        // label is rendered in both pill groups.
        const focusAreas = Array.from(
          new Set(
            Array.from(document.querySelectorAll<HTMLButtonElement>(".chips button.sel"))
              .map((b) => (b.textContent || "").trim())
              .filter((label) => label.length > 0)
          )
        ).slice(0, 10);

        const payload: LeadPayload = {
          fullName: nameInput.value.trim(),
          email: emailInput.value.trim(),
          interests,
          focusAreas,
          message: messageInput?.value.trim() ? messageInput.value.trim().slice(0, 1000) : undefined,
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
          if (counterValue) {
            counterValue.textContent = "0";
            if (counter) counter.dataset.state = "";
          }
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
