/** Shared SVG fragments for SellNearby brand exports — single source of truth. */

export const BRAND = {
  /** Teal — local trust, completely new vs previous blue pin */
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#2DD4BF',
  /** Warm coral — CTAs, "Nearby" wordmark accent */
  accent: '#F97316',
  accentDark: '#EA580C',
  trust: '#16A34A',
  text: '#1C1917',
  textMuted: '#78716C',
  white: '#FFFFFF',
  /** Clean neutral page surface (variation A) */
  bg: '#FAFAFA',
  amber: '#FBBF24',
  coral: '#EF4444',
  font: "Inter, Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/** Active mark concept — locked: beacon (Local Beacon). Alternates: monogram | bridge */
export const DEFAULT_MARK = 'beacon';

const WORDMARK = 'SellNearby';

export function resolveTheme({ dark = false, mono = null, shadow = null } = {}) {
  if (mono === 'white') {
    return {
      mark: BRAND.white,
      markInner: null,
      accent: BRAND.white,
      wordmarkFill: BRAND.white,
      wordmarkAccent: BRAND.white,
      shadow: false,
      mono: true,
      maskId: 'sn-mono-white',
    };
  }
  if (mono === 'black') {
    return {
      mark: BRAND.text,
      markInner: null,
      accent: BRAND.text,
      wordmarkFill: BRAND.text,
      wordmarkAccent: BRAND.text,
      shadow: false,
      mono: true,
      maskId: 'sn-mono-black',
    };
  }
  if (dark) {
    return {
      mark: BRAND.primaryLight,
      markInner: BRAND.primary,
      accent: BRAND.accent,
      wordmarkFill: BRAND.white,
      wordmarkAccent: BRAND.primaryLight,
      shadow: shadow ?? false,
      mono: false,
      maskId: null,
    };
  }
  return {
    mark: BRAND.primary,
    markInner: BRAND.primaryDark,
    accent: BRAND.accent,
    wordmarkFill: BRAND.text,
    wordmarkAccent: BRAND.primary,
    shadow: shadow ?? true,
    mono: false,
    maskId: null,
  };
}

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

function shadowFilter(theme, { subtle = false } = {}) {
  if (!theme.shadow) return { defs: '', attr: '' };
  const opacity = subtle ? 0.08 : 0.12;
  const blur = subtle ? 6: 12;
  const dy = subtle ? 4 : 6;
  return {
    defs: `<filter id="soft-shadow" x="-25%" y="-25%" width="150%" height="150%">
         <feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="${BRAND.primaryDark}" flood-opacity="${opacity}"/>
       </filter>`,
    attr: ' filter="url(#soft-shadow)"',
  };
}

/** Concept A — Local Beacon: proximity arcs + hub + storefront awning (NOT a map pin). */
function beaconMarkPaths(theme) {
  const cx = 256;
  const cy = 272;
  const stroke = theme.mark;
  const arcs = [58, 98, 138]
    .map((r, i) => {
      const d = arcPath(cx, cy, r, 215 - i * 2, 325 + i * 2);
      return `<path d="${d}" stroke="${stroke}" stroke-width="26" stroke-linecap="round" fill="none"/>`;
    })
    .join('\n  ');

  const hub = `<circle cx="${cx}" cy="${cy}" r="34" fill="${theme.mono ? theme.mark : theme.accent}"/>`;
  const awning = theme.mono
    ? `<path d="M198 368 L256 328 L314 368 L314 398 L198 398 Z" fill="${theme.mark}"/>`
    : `<path d="M198 368 L256 328 L314 368 L314 398 L198 398 Z" fill="${theme.markInner}"/>
  <rect x="218" y="378" width="76" height="18" rx="4" fill="${theme.mark}"/>`;

  return `${hub}
  ${arcs}
  ${awning}`;
}

/** Concept B — SN monogram in rounded square. */
function monogramMarkPaths(theme) {
  const fill = theme.mark;
  const letter = theme.mono ? fill : BRAND.white;
  return `<rect x="106" y="106" width="300" height="300" rx="88" fill="${fill}"/>
  <text x="256" y="310" font-family="${BRAND.font}" font-size="148" font-weight="800" letter-spacing="-0.04em" fill="${letter}" text-anchor="middle">SN</text>`;
}

/** Concept C — Community Bridge: twin arches + connection hub. */
function bridgeMarkPaths(theme) {
  if (theme.mono) {
    return `<path d="M108 320 Q256 160 404 320" stroke="${theme.mark}" stroke-width="36" stroke-linecap="round" fill="none"/>
  <circle cx="256" cy="268" r="32" fill="${theme.mark}"/>`;
  }
  return `<path d="M108 320 Q256 160 404 320" stroke="${theme.mark}" stroke-width="36" stroke-linecap="round" fill="none"/>
  <path d="M128 340 Q256 200 384 340" stroke="${theme.accent}" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.85"/>
  <circle cx="256" cy="268" r="32" fill="${theme.accent}"/>
  <circle cx="256" cy="268" r="14" fill="${BRAND.white}"/>`;
}

const MARK_RENDERERS = {
  beacon: beaconMarkPaths,
  monogram: monogramMarkPaths,
  bridge: bridgeMarkPaths,
};

export function iconMarkSvg(themeOrOptions = {}, concept = DEFAULT_MARK) {
  const theme =
    themeOrOptions.mark !== undefined || themeOrOptions.mono !== undefined
      ? themeOrOptions
      : resolveTheme(themeOrOptions);

  const subtle = themeOrOptions.subtle === true;
  const renderer = MARK_RENDERERS[concept] ?? MARK_RENDERERS.beacon;
  const { defs, attr } = shadowFilter(theme, { subtle });
  const body = renderer(theme);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" role="img" aria-label="${WORDMARK}">
  <defs>${defs}</defs>
  <g${attr}>${body}</g>
</svg>`;
}

export function iconAppRoundedSvg(concept = DEFAULT_MARK) {
  const theme = resolveTheme({ mono: 'white', shadow: false });
  theme.maskId = 'sn-app';
  const iconInner = iconMarkSvg({ ...theme, mono: 'white' }, concept)
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" role="img" aria-label="${WORDMARK}">
  <rect width="512" height="512" rx="112" fill="${BRAND.primary}"/>
  <g transform="translate(64, 64) scale(0.75)">${iconInner}</g>
</svg>`;
}

export function iconMarkInverseSvg(concept = DEFAULT_MARK) {
  const theme = resolveTheme({ mono: 'white', shadow: false });
  const iconInner = iconMarkSvg(theme, concept).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" role="img" aria-label="${WORDMARK}">
  <circle cx="256" cy="256" r="256" fill="${BRAND.primary}"/>
  <g transform="translate(48, 48) scale(0.8125)">${iconInner}</g>
</svg>`;
}

/** Split wordmark — "Sell" + accent "Nearby". */
export function wordmarkText({
  x,
  y,
  fill = BRAND.text,
  accentFill = BRAND.primary,
  size = 72,
  textAnchor = 'start',
  letterSpacing = '-0.02em',
  split = true,
}) {
  const anchorAttr = textAnchor !== 'start' ? ` text-anchor="${textAnchor}"` : '';

  if (!split) {
    return `<g class="wordmark">
  <text x="${x}" y="${y}"${anchorAttr} font-family="${BRAND.font}" font-size="${size}" font-weight="700" letter-spacing="${letterSpacing}" fill="${fill}">${WORDMARK}</text>
</g>`;
  }

  return `<g class="wordmark">
  <text x="${x}" y="${y}"${anchorAttr} font-family="${BRAND.font}" font-size="${size}" font-weight="700" letter-spacing="${letterSpacing}">
    <tspan fill="${fill}">Sell</tspan><tspan fill="${accentFill}">Nearby</tspan>
  </text>
</g>`;
}

const HORIZONTAL_LAYOUT = {
  full: { w: 640, h: 160, iconScale: 0.28, iconOffset: 8, textX: 168, textY: 108, fontSize: 72, textAnchor: 'start' },
  compact: { w: 580, h: 152, iconScale: 0.30, iconOffset: 8, textX: 168, textY: 104, fontSize: 68, textAnchor: 'start' },
  minimal: { w: 500, h: 128, iconScale: 0.26, iconOffset: 6, textX: 148, textY: 88, fontSize: 58, textAnchor: 'start' },
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

const AUTH_LAYOUT = {
  w: 360,
  h: 320,
  iconScale: 0.48,
  iconX: 52,
  iconY: 0,
  textX: 180,
  textY: 280,
  fontSize: 56,
  textAnchor: 'middle',
};

function embedIcon(theme, concept, { iconScale, iconOffset = 0, iconX = iconOffset, iconY = iconOffset } = {}) {
  const icon = iconMarkSvg(theme, concept);
  const iconInner = icon.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})">${iconInner}</g>`;
}

function logoSvg({ layout, theme, concept, label = WORDMARK }) {
  const { w, h, textX, textY, fontSize, textAnchor } = layout;
  const iconBlock =
    layout.iconX !== undefined
      ? embedIcon(theme, concept, { iconScale: layout.iconScale, iconX: layout.iconX, iconY: layout.iconY })
      : embedIcon(theme, concept, { iconScale: layout.iconScale, iconOffset: layout.iconOffset });

  const textBlock = wordmarkText({
    x: textX,
    y: textY,
    fill: theme.wordmarkFill,
    accentFill: theme.wordmarkAccent,
    size: fontSize,
    textAnchor,
    split: !theme.mono,
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-label="${label}">
  ${iconBlock}
  ${textBlock}
</svg>`;
}

export function wordmarkOnlySvg({ dark = false, mono = null, size = 72, w = 420, h = 96 } = {}) {
  const theme = resolveTheme({ dark, mono });
  const textX = w / 2;
  const textY = h / 2 + size * 0.35;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-label="${WORDMARK}">
  ${wordmarkText({
    x: textX,
    y: textY,
    fill: theme.wordmarkFill,
    accentFill: theme.wordmarkAccent,
    size,
    textAnchor: 'middle',
    split: !theme.mono,
  })}
</svg>`;
}

export function horizontalLogoSvg({ compact = false, minimal = false, dark = false, mono = null, concept = DEFAULT_MARK } = {}) {
  const layout = minimal
    ? HORIZONTAL_LAYOUT.minimal
    : compact
      ? HORIZONTAL_LAYOUT.compact
      : HORIZONTAL_LAYOUT.full;
  const theme = resolveTheme({ dark, mono });
  return logoSvg({ layout, theme, concept });
}

export function stackedLogoSvg({ dark = false, mono = null, auth = false, concept = DEFAULT_MARK } = {}) {
  const theme = resolveTheme({ dark, mono });
  const layout = auth ? AUTH_LAYOUT : STACKED_LAYOUT;
  return logoSvg({ layout, theme, concept });
}

export const LOGO_VARIANTS = [
  { name: 'logo-horizontal-full', fn: () => horizontalLogoSvg() },
  { name: 'logo-horizontal-compact', fn: () => horizontalLogoSvg({ compact: true }) },
  { name: 'logo-horizontal-minimal', fn: () => horizontalLogoSvg({ minimal: true }) },
  { name: 'logo-stacked', fn: () => stackedLogoSvg() },
  { name: 'logo-auth', fn: () => stackedLogoSvg({ auth: true }) },
  { name: 'logo-dark-mode', fn: () => horizontalLogoSvg({ dark: true }) },
  { name: 'logo-dark-mode-compact', fn: () => horizontalLogoSvg({ compact: true, dark: true }) },
  { name: 'logo-stacked-dark-mode', fn: () => stackedLogoSvg({ dark: true }) },
  { name: 'logo-wordmark-only', fn: () => wordmarkOnlySvg() },
  { name: 'logo-wordmark-only-dark', fn: () => wordmarkOnlySvg({ dark: true }) },
  { name: 'logo-monochrome-white', fn: () => horizontalLogoSvg({ mono: 'white' }) },
  { name: 'logo-monochrome-black', fn: () => horizontalLogoSvg({ mono: 'black' }) },
  { name: 'logo-stacked-monochrome-white', fn: () => stackedLogoSvg({ mono: 'white' }) },
  { name: 'logo-stacked-monochrome-black', fn: () => stackedLogoSvg({ mono: 'black' }) },
  { name: 'icon-app-rounded', fn: () => iconAppRoundedSvg() },
  { name: 'icon-mark-inverse', fn: () => iconMarkInverseSvg() },
  { name: 'icon-mark-subtle', fn: () => iconMarkSvg({ ...resolveTheme(), subtle: true }) },
  /* Alternate mark concepts for review */
  { name: 'icon-mark-concept-monogram', fn: () => iconMarkSvg(resolveTheme(), 'monogram') },
  { name: 'icon-mark-concept-bridge', fn: () => iconMarkSvg(resolveTheme(), 'bridge') },
  { name: 'logo-horizontal-compact-concept-monogram', fn: () => horizontalLogoSvg({ compact: true, concept: 'monogram' }) },
  { name: 'logo-horizontal-compact-concept-bridge', fn: () => horizontalLogoSvg({ compact: true, concept: 'bridge' }) },
  { name: 'icon-app-rounded-concept-monogram', fn: () => iconAppRoundedSvg('monogram') },
  { name: 'icon-app-rounded-concept-bridge', fn: () => iconAppRoundedSvg('bridge') },
];

export const LOGO_RASTER_SIZES = {
  'logo-horizontal-full': { w: 1280, h: 320 },
  'logo-horizontal-compact': { w: 1160, h: 304 },
  'logo-horizontal-minimal': { w: 1000, h: 256 },
  'logo-stacked': { w: 800, h: 800 },
  'logo-auth': { w: 720, h: 640 },
  'logo-dark-mode': { w: 1280, h: 320 },
  'logo-dark-mode-compact': { w: 1160, h: 304 },
  'logo-stacked-dark-mode': { w: 800, h: 800 },
  'logo-wordmark-only': { w: 840, h: 192 },
  'logo-wordmark-only-dark': { w: 840, h: 192 },
  'logo-monochrome-white': { w: 1280, h: 320 },
  'logo-monochrome-black': { w: 1280, h: 320 },
  'logo-stacked-monochrome-white': { w: 800, h: 800 },
  'logo-stacked-monochrome-black': { w: 800, h: 800 },
  'icon-app-rounded': { w: 1024, h: 1024 },
  'icon-mark-inverse': { w: 1024, h: 1024 },
  'icon-mark-subtle': { w: 1024, h: 1024 },
  'icon-mark-concept-monogram': { w: 1024, h: 1024 },
  'icon-mark-concept-bridge': { w: 1024, h: 1024 },
  'logo-horizontal-compact-concept-monogram': { w: 1160, h: 304 },
  'logo-horizontal-compact-concept-bridge': { w: 1160, h: 304 },
  'icon-app-rounded-concept-monogram': { w: 1024, h: 1024 },
  'icon-app-rounded-concept-bridge': { w: 1024, h: 1024 },
};
