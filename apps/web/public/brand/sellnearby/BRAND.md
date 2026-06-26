# SellNearby Brand Assets

## Palette

| Token | Hex | Usage |
|-------|-----|--------|
| Primary | `#3A6DFF` | Pin, links, primary CTAs |
| Primary light | `#4D7CFF` | Pin inner circle |
| Trust | `#2ECC71` | Checkmark, verified badges |
| Text | `#2F3542` | Wordmark on light backgrounds |
| White | `#FFFFFF` | Wordmark on dark backgrounds, mono-white assets |
| Background | `#F1F2F6` | Page surfaces |
| Amber | `#FFC048` | Discount badges |
| Coral | `#FF6B6B` | Alerts |

## Typography

- **Wordmark:** Inter, Poppins, system-ui, sans-serif
- **Text:** SellNearby — Bold (700), single colour (no domain extension in the logo)

## Files

### SVG (primary)

| File | Description |
|------|-------------|
| `svg/icon-mark.svg` | Pin + checkmark only |
| `svg/logo-horizontal-full.svg` | Icon + SellNearby (standard) |
| `svg/logo-horizontal-compact.svg` | Icon + SellNearby (navbar) |
| `svg/logo-stacked.svg` | Icon above centred wordmark |
| `svg/logo-dark-mode.svg` | Horizontal, for dark backgrounds |
| `svg/logo-stacked-dark-mode.svg` | Stacked, for dark backgrounds |
| `svg/logo-monochrome-white.svg` | All white (horizontal) |
| `svg/logo-monochrome-black.svg` | All black (horizontal) |
| `svg/logo-stacked-monochrome-white.svg` | All white (stacked) |
| `svg/logo-stacked-monochrome-black.svg` | All black (stacked) |

### PNG / WebP

```bash
node scripts/brand/export-sellnearby.mjs
```

Export script copies favicons to `apps/web/public/icons/`.
