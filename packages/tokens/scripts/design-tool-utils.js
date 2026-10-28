const SPACING_ORDER = ['0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '12', '14', '16', '20', '24', '32', '40', '48', '56', '64', '72', '80', '96'];
const FONT_SIZE_ORDER = ['xxs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];
const FONT_WEIGHT_ORDER = ['normal', 'medium', 'semibold', 'bold'];
const LETTER_SPACING_ORDER = ['tight', 'normal', 'wide'];
const SHADOW_ORDER = ['none', 'sm', 'md', 'lg', 'xl'];

const TOP_LEVEL_ORDER = {
  color: 1,
  'color-palette': 2,
  spacing: 3,
  sizing: 4,
  opacity: 5,
  filter: 6,
  'border-radius': 7,
  'font-family': 8,
  'font-size': 9,
  'font-weight': 10,
  'letter-spacing': 11,
  'line-height': 12,
  grid: 13,
  breakpoint: 14
};

export const ACCENT_PALETTES = ['blue', 'purple', 'pink', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan'];
export const DESIGN_TOOL_THEMES = ['default', 'mist', 'protan-deutan', 'tritan'];
export const PENPOT_ACCENT_SET_NAMES = ACCENT_PALETTES.map((palette) => `AESIR/accent/${palette}`);
const PENPOT_GLOBAL_SET = 'AESIR/global';
const PENPOT_SEMANTIC_SET = 'AESIR/semantic';
const PENPOT_LIGHT_SET = 'AESIR/mode/light';
const PENPOT_DARK_SET = 'AESIR/mode/dark';
const PENPOT_THEME_SET_NAMES = DESIGN_TOOL_THEMES.map((theme) => `AESIR/theme/${theme}`);

export const PENPOT_THEMES = [
  {
    id: 'mode-light',
    name: 'Light',
    group: 'Mode',
    description: '',
    isSource: false,
    selectedTokenSets: { [PENPOT_GLOBAL_SET]: 'enabled', [PENPOT_SEMANTIC_SET]: 'enabled', [PENPOT_LIGHT_SET]: 'enabled' }
  },
  {
    id: 'mode-dark',
    name: 'Dark',
    group: 'Mode',
    description: '',
    isSource: false,
    selectedTokenSets: { [PENPOT_GLOBAL_SET]: 'enabled', [PENPOT_SEMANTIC_SET]: 'enabled', [PENPOT_DARK_SET]: 'enabled' }
  },
  ...DESIGN_TOOL_THEMES.map((theme) => ({
    id: `theme-${theme}`,
    name: theme === 'default' ? 'Default' : theme === 'mist' ? 'Mist' : theme === 'tritan' ? 'Tritanopia' : 'Protanopia / deuteranopia',
    group: 'Theme',
    description: '',
    isSource: false,
    selectedTokenSets: { [`AESIR/theme/${theme}`]: 'enabled' }
  })),
  ...ACCENT_PALETTES.map((palette) => ({
    id: `accent-${palette}`,
    name: palette[0].toUpperCase() + palette.slice(1),
    group: 'Accent',
    description: '',
    isSource: false,
    selectedTokenSets: { [`AESIR/accent/${palette}`]: 'enabled' }
  }))
];
export const PENPOT_METADATA = {
  tokenSetOrder: [PENPOT_GLOBAL_SET, PENPOT_SEMANTIC_SET, PENPOT_LIGHT_SET, PENPOT_DARK_SET, ...PENPOT_THEME_SET_NAMES, ...PENPOT_ACCENT_SET_NAMES],
  activeThemes: ['Mode/Light', 'Theme/Default', 'Accent/Blue'],
  activeSets: [PENPOT_GLOBAL_SET, PENPOT_SEMANTIC_SET, PENPOT_LIGHT_SET, 'AESIR/theme/default', 'AESIR/accent/blue']
};

export const tokenValue = (token) => token.original?.$value ?? token.original?.value ?? token.$value ?? token.value;

const parseOklch = (value) => {
  const m = String(value).match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
  if (!m) return null;
  const l = m[1].endsWith('%') ? Number(m[1].slice(0, -1)) / 100 : Number(m[1]);
  const [c, h] = [Number(m[2]), Number(m[3])];
  const alpha = m[4] ? (m[4].endsWith('%') ? Number(m[4].slice(0, -1)) / 100 : Number(m[4])) : 1;
  return [l, c, h, alpha].some(Number.isNaN) ? null : { l, c, h, alpha };
};

const linearToSrgb = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);

const oklchToHex = ({ l, c, h, alpha }) => {
  const hr = (h * Math.PI) / 180;
  const [a, b] = [c * Math.cos(hr), c * Math.sin(hr)];
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const [l3, m3, s3] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const toHex = (n) =>
    Math.round(Math.max(0, Math.min(1, linearToSrgb(n))) * 255)
      .toString(16)
      .padStart(2, '0');
  const rgb = `#${toHex(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3)}${toHex(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3)}${toHex(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3)}`;
  return alpha === 1
    ? rgb
    : `${rgb}${Math.round(Math.max(0, Math.min(1, alpha)) * 255)
        .toString(16)
        .padStart(2, '0')}`;
};

export const normalizePenpotValue = (token) => {
  const value = token.$value ?? token.value;
  const type = token.$type ?? token.type;
  if (type === 'color') {
    const p = parseOklch(value);
    return p ? oklchToHex(p) : value;
  }
  if (type === 'letterSpacing' && typeof value === 'string' && value.trim().endsWith('em')) {
    const em = Number.parseFloat(value);
    if (!Number.isNaN(em)) return String(Math.round(em * 50));
  }
  if (type === 'fontSize' && typeof value === 'string' && value.trim().endsWith('rem')) {
    const rem = Number.parseFloat(value);
    if (!Number.isNaN(rem)) return `${rem * 16}px`;
  }
  return value;
};

export const buildModeThemePalette = (presets, mode, colorValue = (value) => value) => ({
  'theme-palette': {
    mist: Object.fromEntries(
      Object.entries(presets.theme.mist[mode]).map(([name, value]) => [name, { $value: colorValue(normalizePenpotValue({ $value: value, $type: 'color' }), value), $type: 'color' }])
    )
  }
});

export const buildThemeSemantic = (semantic, presets, theme) => {
  const output = structuredClone(semantic);
  output['theme-accent-foreground'] = {
    $value: theme === 'mist' ? '{theme-palette.mist.accent-foreground}' : '{color-palette.fixed.white}',
    $type: 'color'
  };
  if (theme === 'default') return output;
  const overrides = presets.theme[theme];
  const values = theme === 'mist' ? { ...overrides.light, ...overrides.dark } : { ...overrides.all };
  for (const [name, value] of Object.entries(values)) {
    if (name.startsWith('accent-')) continue;
    const path = toPenpotReference(`{color.${name}}`).slice(1, -1).split('.');
    let node = output;
    for (const segment of path.slice(0, -1)) node = node[segment] ??= {};
    const reference = theme === 'mist' ? `{theme-palette.mist.${name}}` : value.replace(/^var\(--ds-([a-z]+)-(\d+)\)$/, '{color-palette.$1.$2}');
    if (reference === value) throw new Error(`Unsupported ${theme} theme value: ${name}=${value}`);
    node[path.at(-1)] = { $value: reference, $type: 'color' };
  }
  return output;
};

const mapPenpotPath = (path) => {
  if (path[0] === 'font') {
    const map = { family: 'font-family', size: 'font-size', weight: 'font-weight', 'letter-spacing': 'letter-spacing', 'line-height': 'line-height' };
    if (map[path[1]]) return [map[path[1]], path[2]];
  }
  if (path[0] === 'radius') return ['border-radius', path[1]];
  if (path[0] === 'color') {
    if (path[1] === 'fixed' && path.length === 3) return ['color-palette', 'fixed', path[2]];
    if (path.length === 3 && /^\d+$/.test(path[2])) return ['color-palette', path[1], path[2]];
    if (path.length === 2) {
      const name = path[1];
      const grouped = name.match(/^(surface|border|emphasis)(?:-(hover|active))?(?:-(.+))?$/);
      if (grouped) return grouped[3] ? ['color', grouped[1], grouped[3], grouped[2] ?? 'default'] : ['color', grouped[1], grouped[2] ?? 'default'];
      const foreground = name.match(/^foreground(?:-(muted|inverted))?(?:-(.+))?$/);
      if (foreground) return foreground[2] ? ['color', 'foreground', foreground[2], foreground[1] ?? 'default'] : ['color', 'foreground', foreground[1] ?? 'default'];
      const background = name.match(/^background(?:-(.+))?$/);
      if (background) return ['color', 'background', background[1] ?? 'default'];
      const accent = name.match(/^accent(?:-(.+))?$/);
      if (accent) return ['color', 'accent', ...(accent[1]?.split('-') ?? ['default'])];
      return ['color', ...name.split('-')];
    }
  }
  return path;
};

export const toPenpotReference = (value) => {
  const match = typeof value === 'string' ? value.trim().match(/^\{([^}]+)\}$/) : null;
  if (!match) return value;
  return `{${mapPenpotPath(match[1].split('.')).join('.')}}`;
};

const orderIdx = (order, value) => {
  const i = order.indexOf(String(value));
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};
const normSeg = (v) => String(v).replaceAll('.', '_');
const penpotScaleName = (value) => {
  const raw = String(value);
  return /^\d$/.test(raw) ? raw.padStart(2, '0') : normSeg(raw);
};

const fmtPxName = (value) => {
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^(-?\d*\.?\d+)px$/i);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) ? `${Number.isInteger(n) ? n : n}px` : null;
};

const fmtSortableValue = (value, width = 4) => {
  const match = String(value)
    .trim()
    .match(/^(\d+)(?:\.(\d+))?([a-z%]*)$/i);
  if (!match) return null;
  const [, integer, fraction, unit] = match;
  return `${integer.padStart(width, '0')}${fraction ? `_${fraction}` : ''}${unit}`;
};

const sortableValueName = (token, sourceName, width = 4) => {
  const type = token.original?.$type ?? token.original?.type ?? token.$type ?? token.type;
  const normalized = normalizePenpotValue({ $value: tokenValue(token), $type: type });
  const valueLabel = fmtSortableValue(normalized, width);
  return valueLabel ? `${valueLabel}-${penpotScaleName(sourceName)}` : null;
};

const sortableSeg = (group, segment) => {
  const raw = String(segment);
  const orders = {
    spacing: SPACING_ORDER,
    sizing: SPACING_ORDER,
    'font-size': FONT_SIZE_ORDER,
    'font-weight': FONT_WEIGHT_ORDER,
    'letter-spacing': LETTER_SPACING_ORDER,
    shadow: SHADOW_ORDER
  };
  const order = orders[group];
  if (!order) return normSeg(raw);
  const i = order.indexOf(raw);
  return i === -1 ? normSeg(raw) : `${String(i + 1).padStart(2, '0')}-${normSeg(raw)}`;
};

const cmpSegs = (a, b, group) => {
  if (group === 'spacing' || group === 'sizing') {
    const am = String(a).match(/^(-?\d*\.?\d+)px$/i),
      bm = String(b).match(/^(-?\d*\.?\d+)px$/i);
    if (am && bm) return Number(am[1]) - Number(bm[1]) || String(a).localeCompare(String(b));
    return orderIdx(SPACING_ORDER, a) - orderIdx(SPACING_ORDER, b) || String(a).localeCompare(String(b));
  }
  const orders = { 'font-size': FONT_SIZE_ORDER, 'font-weight': FONT_WEIGHT_ORDER, 'letter-spacing': LETTER_SPACING_ORDER };
  if (orders[group]) return orderIdx(orders[group], a) - orderIdx(orders[group], b) || String(a).localeCompare(String(b));
  if (group === 'color-palette' && /^\d+$/.test(String(a)) && /^\d+$/.test(String(b))) return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
};

export const sortPenpotTokens = (tokens) =>
  [...tokens].sort((a, b) => {
    const ap = mapPenpotPath(a.path),
      bp = mapPenpotPath(b.path);
    const norm = (path, token) => {
      const p = [...path];
      if ((p[0] === 'spacing' || p[0] === 'sizing') && p.length === 3 && /^\d+$/.test(String(p[1])) && /^\d+$/.test(String(p[2])) && String(p[2]).length === 1) p.splice(1, 2, `${p[1]}.${p[2]}`);
      if (p[0] === 'sizing' && p.length === 2) {
        const s = fmtPxName(tokenValue(token));
        if (s) p[1] = s;
      }
      return p;
    };
    const ac = norm(ap, a),
      bc = norm(bp, b);
    const td = (TOP_LEVEL_ORDER[ac[0]] ?? 99) - (TOP_LEVEL_ORDER[bc[0]] ?? 99);
    if (td !== 0) return td;
    for (let i = 1; i < Math.max(ac.length, bc.length); i++) {
      const [as_, bs_] = [ac[i] ?? '', bc[i] ?? ''];
      if (as_ !== bs_) return cmpSegs(as_, bs_, ac[0]);
    }
    return 0;
  });

export const toPenpotPath = (token) => {
  const mp = mapPenpotPath(token.path);
  if (mp[0] === 'spacing' && mp.length === 3) {
    const valueLabel = fmtSortableValue(tokenValue(token));
    const sourceName = `${mp[1]}.${mp[2]}`;
    const label = valueLabel ? `${valueLabel}-${penpotScaleName(sourceName)}` : normSeg(sourceName);
    return [normSeg(mp[0]), normSeg(label)];
  }
  if (mp[0] === 'spacing' && mp.length === 2) {
    const label = sortableValueName(token, mp[1]);
    return [normSeg(mp[0]), normSeg(label ?? mp[1])];
  }
  if (['sizing', 'border-radius', 'font-size', 'font-weight', 'breakpoint'].includes(mp[0]) && mp.length === 2) {
    const label = sortableValueName(token, mp[1]);
    return [normSeg(mp[0]), normSeg(label ?? mp[1])];
  }
  if (mp[0] === 'opacity' && mp.length === 2) {
    return [mp[0], `${String(mp[1]).padStart(3, '0')}-${penpotScaleName(mp[1])}`];
  }
  if ((mp[0] === 'filter' || mp[0] === 'grid') && mp.length === 3) {
    const label = sortableValueName(token, mp[2]);
    return [normSeg(mp[0]), normSeg(mp[1]), normSeg(label ?? mp[2])];
  }
  return mp.map((seg, i, arr) => {
    if (i === 1 && arr[0] === 'spacing') {
      const valueLabel = fmtPxName(tokenValue(token));
      if (valueLabel) return normSeg(`${valueLabel}-${penpotScaleName(seg)}`);
    }
    return i === 1 ? sortableSeg(arr[0], seg) : normSeg(seg);
  });
};
