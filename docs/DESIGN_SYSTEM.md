# Design System — Restrained Neo-Brutalism

**Principle**: brutalist shell, clear core flow. The landing page and branding can be
bold and raw. The "check your rights" flow (forms, answers, citations) must stay simple
and high-contrast above all else — this is used by people under real financial stress
on budget phones, sometimes in a second language.

## Color tokens
```css
:root {
  --bg: #F5F1E8;           /* warm off-white, not pure white — softer on low-end screens */
  --ink: #111111;          /* near-black text/borders */
  --accent: #FFD400;       /* electric yellow — primary CTA / brand accent */
  --accent-ink: #111111;   /* text on accent */
  --risk-low: #2E7D32;     /* green */
  --risk-medium: #E8A400;  /* amber */
  --risk-high: #D7263D;    /* red */
  --surface: #FFFFFF;      /* card backgrounds */
}
```
Contrast-check every pairing against WCAG AA (4.5:1 body text) before shipping — the
accent yellow especially needs dark text, never white text on it.

## Typography
- Headings: bold grotesque sans (e.g. "Space Grotesk" or "Archivo Black"), large scale,
  tight leading.
- Body: a highly legible sans (e.g. "Inter") at minimum 16px, generous line-height
  (1.5+) — this is not the place to get "brutalist" with tiny cramped type.
- Numbers/data (risk stats): a monospace face for that "raw data" feel, but only for
  standalone stat displays, not for paragraph text.

## Components
- **Borders**: solid, 2–4px, `var(--ink)`, no border-radius (or max 2px, never pill-
  shaped) on structural components (cards, buttons, inputs).
- **Shadows**: hard offset shadows, no blur — e.g. `box-shadow: 4px 4px 0 var(--ink);`
  never `rgba` soft/blurred shadows.
- **Buttons**: solid fill, thick border, shadow that "presses in" (shadow removed +
  slight translate) on `:active` for tactile feedback.
- **Risk badge**: solid-color chip using the risk-* tokens, black border, bold
  uppercase label ("HIGH RISK" / "MEDIUM RISK" / "LOW RISK") plus the plain-language
  explanation next to it — never rely on color alone to convey risk level
  (colorblind-safe: always pair with text).
- **Citation list** (Ask Rights answers): plain bordered list items, expandable to show
  source excerpt — resist the urge to make this "fun," it needs to read as
  trustworthy/document-like.
- **Forms/inputs**: thick border, generous padding, 44px+ minimum height, clear focus
  state (accent-colored outline, not just a subtle color shift — must be visible in
  bright outdoor light on a phone screen).

## Motion
- Minimal. Snappy 100-150ms transitions on press states only. No decorative animation,
  no parallax — this wastes data/battery for the target users and adds nothing to trust.

## Explicitly avoid
- Gradients, soft/blurred shadows, border-radius on structural elements, decorative
  background textures/noise that increase page weight, tiny low-contrast "brutalist
  chic" gray-on-gray text.
