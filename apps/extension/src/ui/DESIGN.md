# Ghost Job Detector — Popup & Side-Panel Design System

Premium redesign of the extension's **page** surfaces (popup + side-panel). Spirit
of Linear × Raycast × a financial analytics terminal: a near-black canvas, a
violet brand, glassmorphic cards, an animated trust-score gauge, and an adaptive
verdict accent.

> **Scope boundary.** This system lives in `apps/extension/src/ui/` and is loaded
> **only** by the popup and side-panel (normal `chrome-extension://` pages). The
> in-page Shadow-DOM overlay deliberately keeps its system-font shared theme
> (`packages/shared/theme.css`) to blend with LinkedIn/Indeed and dodge FOUC, and
> the 4-band scoring engine is untouched. We map the engine's 4 bands onto the
> brief's verdict-colour language in the UI layer (`verdict.ts`).

---

## 1. Design tokens

All tokens are CSS custom properties in `theme.css`. Dark is `:root`; light
overrides live under `[data-theme="light"]`. `color-scheme` is set per theme so
the CSS `light-dark()` function resolves chip text colours automatically.

### Colour

| Role | Token | Dark | Light |
|---|---|---|---|
| Brand (constant) | `--brand` | `#7C5CFF` | `#7C5CFF` |
| Brand glow | `--brand-glow` | `rgba(124,92,255,.45)` | ← |
| Canvas | `--bg` | `#0A0A0F` | `#F7F7FB` |
| Elevated | `--bg-elev` | `#111119` | `#FFFFFF` |
| Glass surface / hover | `--surface` / `--surface-2` / `--surface-hover` | white α 4.5–10% | ink α 2.5–6% |
| Border / strong | `--border` / `--border-strong` | white α 9 / 16% | ink α 10 / 18% |
| Ink / soft / muted / faint | `--ink*` | `#F4F4F8 → #5C5D6E` | `#14151C → #9698A3` |

**Verdict accent (`--v-*`)** is a *runtime* family set on the surface element via
`verdictVars()` when a score settles, so the whole UI recolours. Defaults to the
brand violet until then.

| Band (score) | Verdict word | `--v-from → --v-to` | Icon |
|---|---|---|---|
| legitimate (80–100) | **Trusted** | `#34E89E → #0FB8AD` (green→teal) | shield-check |
| caution (50–79) | **Caution** | `#FFB75E → #ED8F03` (amber→gold) | alert-triangle |
| suspicious (20–49) | **Suspicious** | `#FF8567 → #FF5F6D` (coral) | flag |
| ghost (0–19) | **Likely Ghost** | `#FF5F6D → #FF2D55` (coral→rose) | ghost |

Colour is **never** the only signal — every verdict pairs the accent with a word
and an icon (`color-not-only`).

### Type
Geometric/grotesque sans: **Inter** (`--font`), system stack fallback for offline.
Scale `--t-2xs…--t-lg` (11→20px) + `--t-display`. All numerals use
`.gjd-tnum` (`font-variant-numeric: tabular-nums`).

### Space / radius / shadow
4-pt rhythm `--s-1…--s-8`. Radii: `--r-card` 12px, `--r-container` 20px,
`--r-pill` 999px. Elevation `--shadow-card` / `--shadow-pop`; focus `--ring`
(2px bg gap + 4px brand violet).

---

## 2. Motion spec

Timing + easing tokens live in both `theme.css` (CSS) and `motion.ts` (JS/WAAPI)
so CSS and JS-driven animations share one rhythm.

| Tier | Duration | Easing | Used by |
|---|---|---|---|
| Micro | 150ms (`--dur-micro`) | ease-out-quart | hover, press, chevrons |
| Standard | 300ms (`--dur-standard`) | ease-out-expo | card reveals, expands, slides |
| Recolor | 600ms (`--dur-recolor`) | ease-out-expo | ambient + accent recolour, pill pop |
| Hero | 900ms (`--dur-hero`) | ease-out-expo | gauge arc draw-on |

**Easings.** `--ease-expo` `cubic-bezier(.16,1,.3,1)` (entrances/hero) ·
`--ease-quart` `cubic-bezier(.25,1,.5,1)` (interactions) · `--ease-soft`
`cubic-bezier(.22,1,.36,1)`.

**Spring physics** (`motion.ts`). The brief's interaction spring (stiffness 180,
damping 22, mass 1 → ζ≈0.82, ~630ms settle) is sampled analytically into WAAPI
keyframes by `springKeyframes()`. Drives the **gauge needle** overshoot-and-settle
and the **verdict pill** spring-in. `SPRING_SNAPPY` is available for tighter
presses.

**60fps contract.** Every animation touches only `transform` / `opacity` (and
`stroke-dashoffset` on the gauge arc, which is compositor-cheap). No width/height/
top/left animation; the one auto-height expand (signal card) uses the
`grid-template-rows: 0fr→1fr` technique with an opacity/translate inner reveal.

**The two wow moments**
1. **Verdict reveal** — arc draws on (900ms expo) while the numeral counts up in
   lockstep (rAF synced to the arc's own clock) and the needle springs to its
   angle; at ~520ms the verdict pill pops in (`gjd-pop`); the one-line verdict
   fades at ~620ms; the whole popup's ambient gradient + `--v-*` accents crossfade
   to the verdict over 600ms.
2. **Shareable card** — `ShareCard` composes a 1080² PNG on a canvas (verdict
   gradient arc, score, pill, posting) for one-tap Download / Copy.

**Loading continuity.** The radar sweep sits where the gauge ring will be, so the
loading→result crossfade reads as one persistent element (shared anchor).

**Reduced motion.** `useReducedMotion()` makes every animated component snap to
its final frame; a global `@media (prefers-reduced-motion: reduce)` block also
neutralises CSS animations/transitions. Data is always readable immediately.

---

## 3. Component inventory

`TrustGauge` · `VerdictPill` · `ResultHero` · `SignalCard` / `SignalList`
(grouped working-against-it / in-its-favour, stagger 55ms, impact bars,
tap-to-expand) · `GhostMascot` (idle / loading / verdict / peek / puzzled) ·
`SampleChips` · `HistoryList` · `GhostsDodged` (milestone celebration) ·
`Onboarding` (3-step, drag + ← →) · `ShareCard` · `ThemeToggle` · `IconButton` ·
`Brand` · `icons.tsx` (hand-authored SVG, `<Glyph>` wrapper, no lucide).

## 4. States
Loading (radar + skeleton shimmer) · Result (hero) · Empty (peeking ghost +
samples) · Error (puzzled ghost + Retry) · Offline (slim banner — cached results
& samples still work).

## 5. Layouts
- **Popup**: fixed **380px**, ≤600px tall, sticky header + scroll body + footer.
- **Side-panel**: fluid width, two panes (`gjd-panes`: gauge + history left /
  signal detail right) collapsing to one column < 720px. Opened from the popup's
  Expand button via `chrome.sidePanel.open` (`sidePanel` permission).

## 6. Accessibility
WCAG AA targets: brand focus ring on every control (`.gjd-focus`), 32px+ hit
areas, `prefers-color-scheme` honoured on first run, full keyboard nav, SR labels
on icon-only buttons, `role="img"` + label on the gauge, `aria-live` on loading /
offline / error, colour never the sole signal, and reduced-motion respected
throughout.
