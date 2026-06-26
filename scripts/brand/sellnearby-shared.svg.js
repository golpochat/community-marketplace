/** Shared SVG fragments for SellNearby brand exports */

export const BRAND = {
  primary: '#3A6DFF',
  primaryLight: '#4D7CFF',
  trust: '#2ECC71',
  text: '#2F3542',
  white: '#FFFFFF',
  bg: '#F1F2F6',
  amber: '#FFC048',
  coral: '#FF6B6B',
  font: "Inter, Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const WORDMARK = 'SellNearby';
const PIN_PATH =
  'M256 448s-168-152.8-168-272c0-92.8 75.2-168 168-168s168 75.2 168 168c0 119.2-168 272-168 272z';
const CHECK_PATH = 'M196 176l44 44 76-76';

/** Resolve colours for each logo theme — single source of truth. */
export function resolveTheme({ dark = false, mono = null } = {}) {
  if (mono === 'white') {
    return {
      pin: BRAND.white,
      pinInner: null,
      check: BRAND.white,
      wordmarkFill: BRAND.white,
      shadow: false,
      mono: true,
      maskId: 'sn-mono-white',
    };
  }
  if (mono === 'black') {
    return {
      pin: BRAND.text,
      pinInner: null,
      check: BRAND.text,
      wordmarkFill: BRAND.text,
      shadow: false,
      mono: true,
      maskId: 'sn-mono-black',
    };
  }
  if (dark) {
    return {
      pin: BRAND.primary,
      pinInner: BRAND.primaryLight,
      check: BRAND.trust,
      wordmarkFill: BRAND.white,
      shadow: false,
      mono: false,
      maskId: null,
    };
  }
  return {
    pin: BRAND.primary,
    pinInner: BRAND.primaryLight,
    check: BRAND.trust,
    wordmarkFill: BRAND.text,
    shadow: true,
    mono: false,
    maskId: null,
  };
}

/** Pin + check icon (viewBox 0 0 512 512). */
export function iconMarkSvg(themeOrOptions = {}) {
  const theme =
    themeOrOptions.pin !== undefined || themeOrOptions.mono !== undefined
      ? themeOrOptions
      : resolveTheme(themeOrOptions);

  if (theme.mono) {
    const maskId = theme.maskId ?? 'sn-mono';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" role="img" aria-label="${WORDMARK}">
  <defs>
    <mask id="${maskId}">
      <rect width="512" height="512" fill="white"/>
      <path d="${CHECK_PATH}" stroke="black" stroke-width="52" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </mask>
  </defs>
  <path mask="url(#${maskId})" d="${PIN_PATH}" fill="${theme.pin}"/>
</svg>`;
  }

  const shadowFilter = theme.shadow
    ? `<filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
         <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${theme.pin}" flood-opacity="0.18"/>
       </filter>`
    : '';
  const shadowAttr = theme.shadow ? ' filter="url(#soft-shadow)"' : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" role="img" aria-label="${WORDMARK}">
  <defs>${shadowFilter}</defs>
  <path${shadowAttr} d="${PIN_PATH}" fill="${theme.pin}"/>
  <circle cx="256" cy="176" r="108" fill="${theme.pinInner}"/>
  <path d="${CHECK_PATH}" stroke="${theme.check}" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

/** Wordmark — SellNearby only (no domain extension). */
export function wordmarkText({
  x,
  y,
  fill = BRAND.text,
  size = 72,
  textAnchor = 'start',
}) {
  const anchorAttr = textAnchor !== 'start' ? ` text-anchor="${textAnchor}"` : '';

  return `<g class="wordmark">
  <text x="${x}" y="${y}"${anchorAttr} font-family="${BRAND.font}" font-size="${size}" font-weight="700" fill="${fill}">${WORDMARK}</text>
</g>`;
}

const HORIZONTAL_LAYOUT = {
  /** Standard marketing / footer lockup */
  full: { w: 640, h: 160, iconScale: 0.28, iconOffset: 8, textX: 168, textY: 108, fontSize: 72, textAnchor: 'start' },
  /** Navbar — larger icon + type for legibility at ~44px display height */
  compact: { w: 560, h: 152, iconScale: 0.30, iconOffset: 8, textX: 168, textY: 104, fontSize: 68, textAnchor: 'start' },
};

const STACKED_LAYOUT = {
  w: 400,
  h: 400,
  iconScale: 0.54,
  iconX: 44,
  iconY: 0,
  textX: 200,
  textY: 340,
  fontSize: 72,
  textAnchor: 'middle',
};

function embedIcon(theme, { iconScale, iconOffset = 0, iconX = iconOffset, iconY = iconOffset, maskSuffix = '' } = {}) {
  const iconTheme = theme.mono && maskSuffix ? { ...theme, maskId: `${theme.maskId}-${maskSuffix}` } : theme;
  const icon = iconMarkSvg(iconTheme);
  const iconInner = icon.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})">${iconInner}</g>`;
}

function logoSvg({ layout, theme, label = WORDMARK }) {
  const { w, h, textX, textY, fontSize, textAnchor } = layout;
  const iconBlock =
    layout.iconX !== undefined
      ? embedIcon(theme, { iconScale: layout.iconScale, iconX: layout.iconX, iconY: layout.iconY, maskSuffix: 'stacked' })
      : embedIcon(theme, { iconScale: layout.iconScale, iconOffset: layout.iconOffset, maskSuffix: 'horizontal' });

  const textBlock = wordmarkText({
    x: textX,
    y: textY,
    fill: theme.wordmarkFill,
    size: fontSize,
    textAnchor,
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-label="${label}">
  ${iconBlock}
  ${textBlock}
</svg>`;
}

export function horizontalLogoSvg({ compact = false, dark = false, mono = null } = {}) {
  const layout = compact ? HORIZONTAL_LAYOUT.compact : HORIZONTAL_LAYOUT.full;
  const theme = resolveTheme({ dark, mono });
  return logoSvg({ layout, theme });
}

export function stackedLogoSvg({ dark = false, mono = null } = {}) {
  const theme = resolveTheme({ dark, mono });
  return logoSvg({ layout: STACKED_LAYOUT, theme });
}

/** All logo variants for export. */
export const LOGO_VARIANTS = [
  { name: 'logo-horizontal-full', fn: () => horizontalLogoSvg() },
  { name: 'logo-horizontal-compact', fn: () => horizontalLogoSvg({ compact: true }) },
  { name: 'logo-stacked', fn: () => stackedLogoSvg() },
  { name: 'logo-dark-mode', fn: () => horizontalLogoSvg({ dark: true }) },
  { name: 'logo-stacked-dark-mode', fn: () => stackedLogoSvg({ dark: true }) },
  { name: 'logo-monochrome-white', fn: () => horizontalLogoSvg({ mono: 'white' }) },
  { name: 'logo-monochrome-black', fn: () => horizontalLogoSvg({ mono: 'black' }) },
  { name: 'logo-stacked-monochrome-white', fn: () => stackedLogoSvg({ mono: 'white' }) },
  { name: 'logo-stacked-monochrome-black', fn: () => stackedLogoSvg({ mono: 'black' }) },
];

/** ViewBox dimensions for raster export (2×). */
export const LOGO_RASTER_SIZES = {
  'logo-horizontal-full': { w: 1280, h: 320 },
  'logo-horizontal-compact': { w: 1120, h: 304 },
  'logo-stacked': { w: 800, h: 800 },
  'logo-dark-mode': { w: 1280, h: 320 },
  'logo-stacked-dark-mode': { w: 800, h: 800 },
  'logo-monochrome-white': { w: 1280, h: 320 },
  'logo-monochrome-black': { w: 1280, h: 320 },
  'logo-stacked-monochrome-white': { w: 800, h: 800 },
  'logo-stacked-monochrome-black': { w: 800, h: 800 },
};
