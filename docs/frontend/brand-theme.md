# Brand & Theme Guide

Reference for **Community Marketplace** colors, typography, logo, favicon, and where each token is defined in the codebase.

---

## Brand identity

| Item | Value |
|------|--------|
| **Product name** | Community Marketplace |
| **Short name (PWA)** | CMarket |
| **Tagline (metadata)** | Buy and sell within your community in Ireland |
| **Market** | Ireland (`en-IE`, EUR, Europe/Dublin) |

**Source:** `packages/config/src/constants.ts`, `packages/config/src/platform.ts`, `apps/web/src/app/layout.tsx`, `apps/web/public/manifest.json`

---

## Color system (public marketplace)

The public site uses two related layers:

1. **Shadcn UI tokens** (`primary`, `secondary`, etc.) — buttons, links, form controls  
2. **Brand tokens** (`--brand-*`) — marketing surfaces, sale badges, category cards, shadows

There is no separate token named `tertiary`. In practice:

| Role | Token name | Use for |
|------|------------|---------|
| **Primary** | `--brand-primary` / `primary` | Logo, CTAs, links, main prices |
| **Secondary** | `--brand-secondary` | Sale badges, discount pills, promotional emphasis |
| **Accent** | `--brand-accent` | Savings text (“You save €X”), success / positive highlights |
| **Neutral** | `--brand-neutral` | Section backgrounds (e.g. featured listings strip) |

### Primary

| Format | Value |
|--------|--------|
| **HEX** | `#2563EB` |
| **HSL** | `221 83% 53%` |
| **CSS variable** | `--brand-primary` and `--primary` (shadcn) |
| **Tailwind** | `bg-primary`, `text-primary`, `bg-brand-primary` |

Used for: navbar logo mark, **Join Now** / **Sign In** primary actions, listing prices, browser `theme-color`.

### Secondary

| Format | Value |
|--------|--------|
| **HEX** | `#F97316` |
| **HSL** | `25 95% 53%` |
| **CSS variable** | `--brand-secondary` |
| **Tailwind** | `bg-brand-secondary` (via `hsl(var(--brand-secondary))`) |

Used for: sale overlay badges on listing images, discount pills in the Deal Block.

### Accent (success / savings)

| Format | Value |
|--------|--------|
| **HEX** | `#22C55E` |
| **HSL** | `142 71% 45%` |
| **CSS variable** | `--brand-accent` |
| **Tailwind** | `text-brand-accent` |

Used for: “You save €X” lines, positive pricing feedback.

### Neutral background

| Format | Value |
|--------|--------|
| **HEX** | `#F9FAFB` |
| **HSL** | `210 20% 98%` |
| **CSS variable** | `--brand-neutral` |

Used for: soft page sections, PWA `background_color` in `manifest.json`.

### Supporting UI colors (shadcn)

Defined in `packages/ui/src/styles/globals.css`:

| Token | Purpose | Light mode (HSL) |
|-------|---------|------------------|
| `background` | Page background | `0 0% 100%` (white) |
| `foreground` | Body text | `222.2 84% 4.9%` |
| `muted` / `muted-foreground` | Subtle fills & helper text | Gray scale |
| `destructive` | Errors, reject actions | Red |
| `border` | Cards, inputs | `214.3 31.8% 91.4%` |

---

## Typography

| Style | Size | Weight | CSS class | Usage |
|-------|------|--------|-----------|--------|
| **H1** | 32px | Bold (700) | `.text-h1` | Hero headline |
| **H2** | 24px (1.5rem) | Semibold (600) | `.text-h2` | Section titles |
| **H3** | 20px (1.25rem) | Medium (500) | `.text-h3` | Subsection titles |
| **Body** | 16px (1rem) | Regular (400) | `.text-body` | Paragraphs |
| **Small** | 14px (0.875rem) | Regular (400) | `.text-small` | Captions, metadata |

**Font family:** [Inter](https://fonts.google.com/specimen/Inter) via `next/font/google`  
**Variable:** `--font-inter`  
**Applied as:** `font-sans` on `<body>`

**Source:** `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`

---

## Radius & shadows

| Token | Value | Tailwind |
|-------|--------|----------|
| Default shadcn radius | `0.5rem` (8px) | `rounded-lg` (via `--radius`) |
| Brand small | `8px` | `rounded-brand-sm` |
| Brand medium | `12px` | `rounded-brand-md` |
| Shadow small | Subtle card shadow | `shadow-brand-sm` |
| Shadow medium | Hover lift on cards | `shadow-brand-md` |
| Shadow large | Dropdowns, modals | `shadow-brand-lg` |

**Source:** `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts`

---

## Logo

There is **no standalone logo PNG** in the repo. The logo is built from code:

| Asset | Location | Description |
|-------|----------|-------------|
| **Logo component** | `apps/web/src/components/brand/logo.tsx` | Blue rounded square + white marketplace icon + “Community Marketplace” wordmark |
| **Icon only** | Same component with `showText={false}` | Used in footer |

### Logo mark (icon)

- **Shape:** Rounded square (`rounded-brand-md`, 32–36px)
- **Background:** Primary blue (`bg-primary`)
- **Glyph:** White SVG — three horizontal lines + dot (abstract “listing shelf”)
- **Wordmark:** `APP_NAME` in semibold primary blue

### Usage

```tsx
import { Logo } from '@/components/brand/logo';

<Logo />                    // Full logo + text (navbar)
<Logo showText={false} />   // Icon only
<Logo size="sm" />          // Compact navbar size
```

---

## Favicon & app icons

| Asset | Path | Format | Notes |
|-------|------|--------|-------|
| **Static SVG icon** | `apps/web/public/icons/icon.svg` | SVG 512×512 | Blue `#2563eb` rounded rect, white lines; used by PWA manifest |
| **Next.js app icon** | `apps/web/src/app/icon.tsx` | PNG 32×32 (generated) | Same glyph; browser tab favicon |
| **Manifest reference** | `apps/web/public/manifest.json` | — | `theme_color`: `#2563eb`, `background_color`: `#f9fafb` |
| **Metadata icons** | `apps/web/src/app/layout.tsx` | — | `icon` and `apple` → `/icons/icon.svg` |
| **Viewport theme** | `apps/web/src/app/layout.tsx` | — | `themeColor: '#2563eb'` |

### Replacing the favicon

1. Update `apps/web/public/icons/icon.svg` for PWA / Apple touch reference.
2. Update `apps/web/src/app/icon.tsx` if you want the generated tab favicon to match.
3. Keep `theme_color` in `manifest.json` and `layout.tsx` aligned with primary blue.

---

## Dashboard role accents (separate from public brand)

Logged-in dashboards (`seller`, `buyer`, `admin`, `super-admin`) use **role-specific accent colors** in `packages/ui-dashboard/src/styles/themes.css`. These do **not** change the public marketplace primary blue.

| Role | Accent (HEX) | Notes |
|------|----------------|-------|
| **Seller** | `#059669` (emerald/teal) | Create listing, seller nav highlights |
| **Buyer** | `#3B82F6` (blue) | Buyer dashboard |
| **Admin** | `#64748B` (slate) | Admin panel |
| **Super Admin** | `#9333EA` (purple) | Super-admin panel |

Public visitors always see the blue primary brand; dashboards tint by role for wayfinding.

---

## Where tokens live (file map)

| Concern | File |
|---------|------|
| Brand CSS variables & typography utilities | `apps/web/src/app/globals.css` |
| Tailwind brand extensions | `apps/web/tailwind.config.ts` |
| Shadcn UI color system | `packages/ui/src/styles/globals.css` |
| Dashboard role themes | `packages/ui-dashboard/src/styles/themes.css` |
| Logo React component | `apps/web/src/components/brand/logo.tsx` |
| Favicon (generated) | `apps/web/src/app/icon.tsx` |
| Favicon / PWA SVG | `apps/web/public/icons/icon.svg` |
| PWA manifest | `apps/web/public/manifest.json` |
| App name & locale constants | `packages/config/src/constants.ts`, `platform.ts` |

---

## Quick copy-paste (design tools)

```
Primary:    #2563EB
Secondary:  #F97316
Accent:     #22C55E
Neutral:    #F9FAFB
Text:       #0F172A (approx. --foreground)
Border:     #E5E7EB (approx. gray-200)

Font:       Inter, 400 / 500 / 600 / 700
Radius:     8px (sm), 12px (md)
```

---

## Related docs

- [Component library](./component-library.md) — `Logo`, `DealBlock`, `HeroSection`, navbar
- [Public pages](./public-pages.md) — Where brand components appear on `/`
