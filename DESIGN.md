# Design Notes

A short guide to the visual design of the PCB Defect Detection frontend and the reasoning behind it. It is written so it can be explained in an interview.

## Goal

The app is an internal-tool style product: a user signs in, uploads a board photo and reads a verdict. The design should make that flow **clear, trustworthy and easy to scan**. I chose a clean SaaS / dashboard look (in the spirit of Stripe, Linear and Vercel) because it is familiar, readable, and keeps attention on the data (verdict, confidence, detections) instead of on decoration.

The earlier version used a neon "cyber" theme. It was visually loud, hard to read (tiny monospace labels, low contrast) and hard to justify for a quality-control tool, so it was replaced entirely.

## Design tokens (one place)

All theme values live in `src/index.css` inside a Tailwind v4 `@theme` block. Tailwind turns each variable into utility classes (`bg-primary`, `text-ink`, `border-line`), so components never hard-code hex values.

| Role | Token | Value | Why |
|---|---|---|---|
| Accent | `primary` | `#4F46E5` indigo | One calm, professional accent used only for actions and focus |
| Page background | `page` | `#F9FAFB` | Soft off-white so white cards stand out |
| Surface | `surface` | `#FFFFFF` | Cards, navbar, inputs |
| Border | `line` | `#E5E7EB` | Subtle separation instead of heavy shadows |
| Text | `ink` / `body` / `muted` | `#111827` / `#374151` / `#6B7280` | Three levels of hierarchy |
| Success | `success` | `#15803D` (+ light tint) | Pass, strong password |
| Warning | `warning` | `#B45309` (+ light tint) | Medium severity, action required |
| Danger | `danger` | `#B91C1C` (+ light tint) | Defects, errors |

Design decisions worth mentioning:

- **One accent color.** Color is reserved for meaning: indigo means "interactive", green / amber / red mean status. Everything else is gray.
- **Text-safe status shades.** The status colors are the darker shades (e.g. amber-700 rather than amber-500) so text on their light tint backgrounds meets WCAG AA contrast (4.5:1).
- **Tints for backgrounds.** Badges and alerts use a pale tint, a thin tinted border and the strong color for text. This stays readable without large blocks of saturated color.

## Typography

- **Font:** Inter, with a system-font fallback stack. One typeface keeps the UI consistent and professional; it is designed for screens and reads well at small sizes.
- **Weights:** only 400, 500 and 600. Hierarchy comes from size and weight, not from uppercase or letter-spacing tricks.
- **Scale:** 12 / 14 / 16 / 20 / 24 / 36 px. Body and form text is 14-16 px, captions 12-14 px, page titles 24-36 px.

## Component patterns

Shared components live in `src/components/ui.jsx` so styling is defined once and reused everywhere:

| Component | Purpose |
|---|---|
| `Container`, `PageHeader` | Consistent `max-w-6xl` page width and title/subtitle block |
| `Card`, `CardHeader` | White surface, 1 px border, 12 px radius, soft shadow |
| `Button` | `primary`, `secondary`, `ghost`, `danger`; renders a router link when given `to` |
| `Field`, `Input` | Label, hint and error text wired to the input |
| `Badge`, `Alert` | Status chips and messages, tone-based |
| `Meter` | Horizontal confidence bar (replaces the old radar chart) |
| `Spinner`, `FullPageSpinner`, `EmptyState` | Loading and empty states |

Other shared pieces: `Navbar` (sticky top bar with a user menu) and `AuthLayout` (the card shell shared by Login and Register).

Rules applied everywhere:

- **Shape:** 8 px radius on controls, 12 px on cards, one border style.
- **Spacing:** Tailwind's 4 px scale only (no one-off pixel values).
- **Motion:** only 150 ms color / shadow transitions on hover, plus a loading spinner. Animations are disabled when the user prefers reduced motion.
- **Responsive:** single-column on mobile, multi-column grids from `sm` / `lg`; tables scroll horizontally inside their card; 16 px page gutters.

## Accessibility

- Text and status colors meet AA contrast on their backgrounds.
- A global `:focus-visible` rule gives every interactive element a visible 2 px indigo outline.
- Real `<form>`, `<label>` and `<table>` markup; the Enter key submits the login and register forms.
- The upload area is keyboard-operable (`role="button"`, Enter / Space).
- Status messages use `role="alert"` or `role="status"`; icons are `aria-hidden`; the user menu uses `aria-expanded`.

## Page-by-page

- **Home:** hero with one primary action, four key model stats, a three-step "how it works", and the six defect classes as cards.
- **Login / Register:** one centered card; Google sign-in first, then email form; inline password-strength meter and mismatch error on Register.
- **Detect:** two-column layout: upload card and progress on the left, tips and model info on the right.
- **Result:** verdict card (green pass / red fail), annotated image with tabs and legend, per-class confidence bars, a detections table and a recommendation.

## Why a bar list instead of a radar chart

The previous result page used a decorative radar chart. A horizontal bar list shows the same information (confidence per defect class) but is easier to read, easier to compare, accessible (`role="progressbar"`) and simple to explain. It also removed a custom animated canvas.

## What was intentionally removed

Neon glows, gradients, glassmorphism, particle / animated canvas backgrounds, scan lines, noise overlays, glitch effects, the Orbitron / Share Tech Mono / Rajdhani fonts, and the terminal-style boot screens. They added about 2,000 lines of per-page CSS and made the interface harder to read.

## Scope note

Only presentation changed. API calls, endpoints, routes, auth flow, state handling and environment variables are untouched. The only behavioural differences are small and presentation-related: forms are real `<form>` elements (Enter submits), and switching back to the "Annotated" tab on the result page redraws the boxes.
