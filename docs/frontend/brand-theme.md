# Brand & Theme Guide

Reference for **SellNearby** colors, typography, logo, favicon, and where each token is defined in the codebase.

| Token | Value |
|-------|-------|
| **Product name** | SellNearby / SellNearby.ie |
| **Primary** | Teal `#0D9488` (`packages/config` `BRAND_COLORS.primary`) |
| **Accent (CTA / wordmark)** | Coral `#F97316` |
| **Trust / success** | `#16A34A` |

---

## Brand identity

| Item | Value |
|------|--------|
| **Product name** | SellNearby / SellNearby.ie |
| **Short name (PWA)** | SellNearby |
| **Tagline** | Buy and sell nearby in Ireland |
| **Market** | Ireland (`en-IE`, EUR, Europe/Dublin) |

**Source:** `packages/config/src/constants.ts`, `packages/config/src/brand.ts`, `packages/config/src/platform.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/manifest.ts`

---

## Color system (public marketplace)

1. **Shadcn UI tokens** (`primary`, `secondary`, etc.) — buttons, links, forms  
2. **Brand tokens** (`--brand-*`) — marketing surfaces, badges, shadows  
3. **Server / email tokens** — `packages/config` `BRAND_COLORS` (keep hex in sync with CSS)

| Role | Token | HEX | Use |
|------|-------|-----|-----|
| **Primary** | `--brand-primary` / `primary` | `#0D9488` | Logo, CTAs, links, prices, `theme-color` |
| **Secondary / accent CTA** | `--brand-secondary` / coral | `#F97316` | Sale badges, promotional emphasis |
| **Trust** | `BRAND_COLORS.trust` | `#16A34A` | Positive / savings feedback |
| **Neutral** | page / card surfaces | `#FAFAFA` / `#FFFFFF` | Section backgrounds |

### Primary

| Format | Value |
|--------|--------|
| **HEX** | `#0D9488` |
| **CSS** | `--brand-primary`, `--primary` |
| **Tailwind** | `bg-primary`, `text-primary` |

### Secondary (coral)

| Format | Value |
|--------|--------|
| **HEX** | `#F97316` |
| **CSS** | `--brand-secondary` |

### Supporting UI (shadcn)

Defined in `packages/ui` / `apps/web` globals — `background`, `foreground`, `muted`, `destructive`, `border`.

---

## Typography

| Style | Size | Weight | Usage |
|-------|------|--------|--------|
| **H1** | 32px | Bold (700) | Hero |
| **H2** | 24px | Semibold (600) | Sections |
| **H3** | 20px | Medium (500) | Subsections |
| **Body** | 16px | Regular (400) | Paragraphs |
| **Small** | 14px | Regular (400) | Captions |

**Font:** [Inter](https://fonts.google.com/specimen/Inter) via `next/font/google` (`--font-inter`, `font-sans` on `<body>`).

**Source:** `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`

---

## Radius & shadows

| Token | Value |
|-------|--------|
| Default radius | `0.5rem` (8px) |
| Brand medium | ~12px |
| Shadows | `shadow-brand-sm` / `md` / `lg` where defined |

---

## Logo

SVG lockups under `apps/web/public/brand/sellnearby/` — rendered by `apps/web/src/components/brand/logo.tsx` (beacon mark).

```tsx
import { Logo } from '@/components/brand/logo';

<Logo />
<Logo size="sm" />
```

Do not describe the mark as a blue rounded square — primary brand color is **teal**.

---

## Favicon & PWA

| Asset | Path |
|-------|------|
| App icon | `apps/web/src/app/icon.tsx` |
| Static SVG | `apps/web/public/icons/icon.svg` (keep aligned with teal primary) |
| Manifest | `apps/web/src/app/manifest.ts` — `theme_color` / name from config |
| Viewport theme | `apps/web/src/app/layout.tsx` |

Keep `themeColor` aligned with `#0D9488`.

---

## Dashboard role accents

Logged-in dashboards use role accents in `packages/ui-dashboard/src/styles/themes.css`. These do **not** replace the public SellNearby teal.

| Role | Accent (approx) |
|------|-----------------|
| Seller | Emerald / teal |
| Buyer | Blue |
| Admin | Slate |
| Super Admin | Purple |

Canonical hub routes: `/account`, `/admin`, `/super-admin`.

---

## Where tokens live

| Concern | File |
|---------|------|
| Brand hex (server/email) | `packages/config/src/brand.ts` |
| App name / locale | `packages/config/src/constants.ts`, `platform.ts` |
| Web CSS variables | `apps/web/src/app/globals.css` |
| Logo | `apps/web/src/components/brand/logo.tsx` |
| PWA manifest | `apps/web/src/app/manifest.ts` |
| Dashboard themes | `packages/ui-dashboard/src/styles/themes.css` |

---

## Quick copy-paste

```
Primary:    #0D9488
Secondary:  #F97316
Trust:      #16A34A
Neutral:    #FAFAFA
Text:       #1C1917
Border:     #E4E4E7
Font:       Inter
Brand:      SellNearby / SellNearby.ie
```

---

## Related

- [Component library](./component-library.md)
- [Public pages](./public-pages.md)
