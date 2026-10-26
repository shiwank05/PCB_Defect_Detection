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

- **Home:** hero, an illustrative result card, three model stats, a three-step "how it works", a feature grid, the six defect classes and a footer.
- **Login / Register:** one centered card; Google sign-in first, then email form; inline password-strength meter and mismatch error on Register.
- **Detect:** two-column layout: upload card and progress on the left, tips and model info on the right.
- **Result:** verdict card (green pass / red fail), annotated image with tabs and legend, per-class confidence bars, a detections table and a recommendation.

## Polish pass

The first redesign was clean but flat. This pass adds depth, hierarchy and feedback without changing the palette or going back to the old sci-fi look. Every addition is a token or a shared component, not per-page CSS.

**Depth**
- **Three shadow levels** (`shadow-card`, `shadow-raise`, `shadow-pop`), each made of two layered shadows, so elevation reads as soft and natural. Cards sit at the lowest level, hovered cards and form panels one up, popovers and the hero preview the highest.
- **Softer borders** (`#E8EAEF`) so surfaces are separated by light and shadow rather than hard lines.
- **A faint indigo wash** at the top of every page (a single radial gradient at 8% opacity) gives the background some life without being noticeable as a "gradient".

**Hierarchy**
- A `SectionHeading` (small indigo label, large title, muted subtitle) is used for every section, so headings and spacing are consistent.
- **Icons in tinted squares** (`IconBadge`) mark features, steps and stats. Icons are a small inline SVG set in `ui.jsx`, so there is no extra dependency. A teal secondary accent is used only for a few highlights.
- The home page hero highlights one key phrase in the accent color, followed by a mock result card, built with plain HTML/CSS and clearly labeled "Illustrative example", so it makes no accuracy claims.
- Result page: a verdict banner (green or red tint), three summary cards (total defects, most frequent type, average confidence, all derived from the response), and a defect list with severity badges and confidence bars.

**Feedback and motion**
- Cards and buttons lift 1-2 px with a shadow change on hover (150-200 ms). Page content fades and slides up once on load. Both use `motion-safe` / a reduced-motion rule, so they switch off for users who prefer less motion.
- One `Alert` component (icon + tinted message) is used for errors and warnings on every page, replacing ad-hoc messages.
- The upload area has hover and drag-active tints, shows a thumbnail, file name and size after selection, and the analyzing state has a spinner, a status text, a step list and skeleton placeholders.
- Empty and error states (no scan data, no defects, image could not render) use the same `EmptyState` / `Alert` pieces.

**Small details**
- The navbar is the only translucent surface (white at ~80% with a slight blur), so it stays readable while scrolling. Cards are never translucent.
- Auth pages use a split layout: a solid indigo brand panel with three benefits on desktop (hidden on mobile) and the form on the other side.
- Indigo text selection, thin quiet scrollbars, and focus rings that now include a soft halo on inputs.

**What was deliberately left out:** glows, strong gradients, particles, glassmorphism on cards, parallax, 3D effects, monospace fonts, and any invented number or testimonial. The only figures on the site (93.6% mAP@0.5, 693 training images, 6 classes) come from the project README; an unverified inference-speed figure was removed.

## Why a bar list instead of a radar chart

The previous result page used a decorative radar chart. A horizontal bar list shows the same information (confidence per defect class) but is easier to read, easier to compare, accessible (`role="progressbar"`) and simple to explain. It also removed a custom animated canvas.

## What was intentionally removed

Neon glows, gradients, glassmorphism, particle / animated canvas backgrounds, scan lines, noise overlays, glitch effects, the Orbitron / Share Tech Mono / Rajdhani fonts, and the terminal-style boot screens. They added about 2,000 lines of per-page CSS and made the interface harder to read.

## Scope note

Only presentation changed. API calls, endpoints, routes, auth flow, state handling and environment variables are untouched. The only behavioural differences are small and presentation-related: forms are real `<form>` elements (Enter submits), and switching back to the "Annotated" tab on the result page redraws the boxes.
