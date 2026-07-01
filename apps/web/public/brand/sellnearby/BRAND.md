# SellNearby Brand Assets

Canonical primary: **#0D9488** (teal). Accent: **#F97316** (coral). All SVGs generated from `scripts/brand/sellnearby-shared.svg.js`.

## Palette

| Token | Hex | Usage |
|-------|-----|--------|
| Primary | `#0D9488` | Beacon mark, links, primary CTAs |
| Primary dark | `#0F766E` | Footer, hover / pressed states |
| Primary light | `#2DD4BF` | Dark mode highlights |
| Accent | `#F97316` | Hub dot, “Nearby” wordmark, secondary CTAs |
| Trust | `#16A34A` | Verified badges |
| Text | `#1C1917` | Body copy on light surfaces |
| Background | `#FAF7F2` | Warm cream page surface |
| Amber | `#FBBF24` | Discount badges |
| Coral | `#EF4444` | Alerts |

## Mark concepts (pick one as default)

| Concept | File | Description |
|---------|------|-------------|
| **Beacon** (default) | `icon-mark.svg` | Proximity arcs + coral hub + storefront awning — **not a map pin** |
| Monogram | `icon-mark-concept-monogram.svg` | **SN** in rounded square |
| Bridge | `icon-mark-concept-bridge.svg` | Twin arches + connection hub |

Horizontal lockups with alternate marks: `logo-horizontal-compact-concept-monogram.svg`, `logo-horizontal-compact-concept-bridge.svg`.

## Wordmark

Split styling: **Sell** (dark) + **Nearby** (teal primary) — Inter/Poppins Bold, `-0.02em` tracking.

## Regenerate assets

```bash
npm run brand:export --workspace=@community-marketplace/web
```

Preview all variants: open `preview.html` in this folder.

## React component

```tsx
<Logo />                          // nav — auto light/dark lockup
<Logo variant="dark" size="footer" /> // dark footer band
<Logo variant="auth" size="auth" />   // login / signup
<Logo variant="icon" size="icon" />   // sidebar mark
```

## Favicons (`apps/web/public/icons/`)

| File | Source |
|------|--------|
| `icon.svg` | Flat beacon mark |
| `icon-app.svg` | Teal rounded square + white mark |
| `favicon-32.png` / `favicon.ico` | Flat beacon |
| PWA PNGs | `icon-app-rounded` |
