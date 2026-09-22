"use client";

import { useEffect, useState } from "react";

/**
 * Three separate hamburgers exist across the breakpoints and all open this one
 * menu: the bar over the desktop hero, the real <header> on tablet, and a
 * hotspot over the burger painted into the phone artwork. They live in the
 * approved markup string, so they are wired by selector here rather than being
 * rendered by React, the same way V12ClientController attaches to that markup.
 */
const LINKS = [
  { href: "#assessments", label: "Solutions" },
  { href: "#why-ai-now", label: "Resources" },
  { href: "#about", label: "About" },
  { href: "#latest-insights", label: "Insights" },
  { href: "/insights/archive", label: "All Insights" },
  { href: "#assessment-interest", label: "Contact" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggles = Array.from(document.querySelectorAll<HTMLElement>(".rac-nav-toggle"));
    const onToggle = (event: Event) => {
      event.preventDefault();
      setOpen((wasOpen) => !wasOpen);
    };
    toggles.forEach((toggle) => toggle.addEventListener("click", onToggle));
    return () => toggles.forEach((toggle) => toggle.removeEventListener("click", onToggle));
  }, []);

  useEffect(() => {
    document
      .querySelectorAll(".rac-nav-toggle")
      .forEach((toggle) => toggle.setAttribute("aria-expanded", String(open)));

    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      {open && (
        <button className="rac-nav-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />
      )}
      <nav id="rac-nav-menu" className="rac-nav-menu" aria-label="Main" hidden={!open}>
        <button className="rac-nav-close" aria-label="Close navigation" onClick={() => setOpen(false)}>
          ×
        </button>
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>
    </>
  );
}
