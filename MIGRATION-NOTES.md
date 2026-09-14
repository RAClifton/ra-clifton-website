# Migration Guardrails

- APPROVED-v12-source.html is immutable reference material.
- app/globals.css is copied from v12 except for explicitly labeled accessibility/status additions.
- app/page.tsx renders the approved DOM verbatim from the v12 body, with data images replaced by real asset paths and inline JS event handlers removed.
- components/V12ClientController.tsx owns behavior only. It must not change layout or copy.
- Any future componentization should be DOM-output-equivalent before visual changes are considered.

## Locked conversion rules
- Desktop >=1024px retains approved desktop composition.
- 768-1023px retains tablet adaptation.
- 393px remains primary phone reference; 390/375/360 supported.
- <=359px retains compact fallback.
- All major assessment CTAs continue to target #assessment-interest.
- Assessment checkboxes start unchecked.
- Referral stays privacy-safe: no third-party name/email collection.
