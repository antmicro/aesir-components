import { PENPOT_METADATA, PENPOT_THEMES, normalizePenpotValue, sortPenpotTokens, tokenValue, toPenpotPath, toPenpotReference } from './design-tool-utils.js';

const figmaDecimalTokenRoots = new Set(['spacing', 'sizing']);
const isRef = (v) => typeof v === 'string' && /^\{[^}]+\}$/.test(v.trim());

const parsePx = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return { value, unit: 'px' };
  const m = typeof value === 'string' ? value.trim().match(/^(-?\d*\.?\d+)px$/i) : null;
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) ? { value: n, unit: 'px' } : null;
};

export const hexToFigmaColor = (value) => {
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^#([a-f0-9]{6}|[a-f0-9]{8})$/i);
  if (!m) return null;
  const n = m[1].toLowerCase();
  const rgb = n.length === 8 ? n.slice(0, 6) : n;
  const alphaHex = n.length === 8 ? n.slice(6) : 'ff';
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(rgb.slice(i, i + 2), 16) / 255);
  return { colorSpace: 'srgb', components: [r, g, b], alpha: Number.parseInt(alphaHex, 16) / 255, hex: `#${rgb.toUpperCase()}` };
};

const compositeShadowToCss = ({ color, offsetX, offsetY, blur }) => {
  if (![color, offsetX, offsetY, blur].every((value) => typeof value === 'string')) return null;
  const blackAlpha = color.match(/^#000000([a-f\d]{2})$/i);
  let cssColor = color;
  if (blackAlpha) {
    const alpha = Number.parseInt(blackAlpha[1], 16) / 255;
    cssColor = alpha === 0 ? 'transparent' : `oklch(0 0 0 / ${Number(alpha.toFixed(2))})`;
  }
  return [offsetX === '0px' ? '0' : offsetX, offsetY === '0px' ? '0' : offsetY, blur === '0px' ? '0' : blur, cssColor].join(' ');
};

const normalizeFigmaTypeAndValue = (token, options) => {
  const type = token.$type ?? token.type;
  const orig = tokenValue(token);
  const resolved = normalizePenpotValue(token);

  if (type === 'color') {
    const reference = isRef(String(orig ?? '')) ? (options?.colorStructure === 'web-ui' ? toPenpotReference(orig) : orig) : null;
    return { type: 'color', value: reference ?? hexToFigmaColor(resolved) ?? resolved };
  }

  if (type === 'dimension' || type === 'fontSize' || type === 'borderRadius') {
    if (isRef(String(orig ?? ''))) return { type: 'dimension', value: orig };
    const p = parsePx(resolved);
    return p ? { type: 'dimension', value: p } : null;
  }

  if (type === 'lineHeight') {
    if (isRef(String(orig ?? ''))) return { type: 'number', value: orig };
    const p = parsePx(resolved);
    if (p) return { type: 'number', value: p.value };
    const n = Number(resolved);
    return Number.isFinite(n) ? { type: 'number', value: n } : null;
  }

  if (type === 'typography') return !options?.excludeTypography && typeof orig === 'object' && orig !== null ? { type: 'typography', value: orig } : null;
  if (type === 'shadow') {
    const value = compositeShadowToCss(resolved);
    return value ? { type: 'string', value } : null;
  }

  if (type === 'letterSpacing') {
    if (isRef(String(orig ?? ''))) return { type: 'number', value: orig };
    if (typeof orig === 'string') {
      const em = orig.trim().match(/^(-?\d*\.?\d+)em$/i);
      if (em) return { type: 'number', value: Number(em[1]) * 100 };
      const px = orig.trim().match(/^(-?\d*\.?\d+)px$/i);
      if (px) return { type: 'number', value: Number(px[1]) };
    }
    if (typeof orig === 'number' && Number.isFinite(orig)) return { type: 'number', value: orig };
    return null;
  }

  if (['number', 'opacity', 'fontWeight'].includes(type)) {
    if (isRef(String(orig ?? ''))) return { type: 'number', value: orig };
    if (typeof resolved === 'number' && Number.isFinite(resolved)) return { type: 'number', value: resolved };
    if (typeof resolved === 'string') {
      const em = resolved.trim().match(/^(-?\d*\.?\d+)em$/i);
      if (em) return { type: 'number', value: Number(em[1]) };
      const n = Number(resolved.trim());
      if (Number.isFinite(n)) return { type: 'number', value: n };
    }
  }

  if (type === 'fontFamily') return { type: 'fontFamily', value: resolved };
  if (type === 'string') return { type: 'string', value: resolved };

  return null;
};

const toFigmaPath = (path) => {
  if (path.length === 3 && figmaDecimalTokenRoots.has(path[0])) {
    const [g, l, r] = path;
    if (/^\d+$/.test(String(l)) && /^\d+$/.test(String(r)) && String(r).length === 1) return [g, `${l}_${r}`];
  }
  return path;
};

const FIGMA_SEMANTIC_GROUPS = ['accent', 'background', 'surface', 'foreground', 'border', 'emphasis'];

// Subgroups that get an extra nesting level in the Figma output.
// For foreground/muted: only colored variants (foreground-muted-*) go in the subgroup;
// the base foreground-muted token stays at the group level.
// For all other subgroups (hover/active): both base and colored variants go in the subgroup.
const FIGMA_SEMANTIC_SUBGROUPS = {
  surface: ['hover', 'active'],
  border: ['hover', 'active'],
  emphasis: ['hover'],
  foreground: ['muted']
};

const toFigmaColorsPath = (path) => {
  if (path[0] === 'color' && path.length === 2) {
    const name = path[1];
    const group = FIGMA_SEMANTIC_GROUPS.find((g) => name === g || name.startsWith(`${g}-`));
    if (group) {
      const subgroups = FIGMA_SEMANTIC_SUBGROUPS[group] ?? [];
      // foreground-muted (base) stays at group level; only foreground-muted-{color} goes in subgroup.
      // For all other groups, both base (e.g. surface-hover) and colored (surface-hover-blue) go in subgroup.
      const sub = subgroups.find((s) => (group === 'foreground' ? name.startsWith(`${group}-${s}-`) : name === `${group}-${s}` || name.startsWith(`${group}-${s}-`)));
      if (sub) return ['semantic', group, sub, name];
      return ['semantic', group, name];
    }
  }
  return toFigmaPath(path);
};

const toPenpotType = (token) => {
  const p = token.path ?? [];
  if (p[0] === 'spacing' || p[0] === 'sizing') return p[0];
  return token.$type ?? token.type;
};

const normalizePenpotTypography = (value) => {
  if (typeof value !== 'object' || value === null) return value;
  const fontSize = typeof value.fontSize === 'string' ? value.fontSize.trim() : '';
  const letterSpacing = typeof value.letterSpacing === 'string' ? value.letterSpacing.trim() : '';
  const fontSizeMatch = fontSize.match(/^(-?\d*\.?\d+)(px|rem)$/i);
  const letterSpacingMatch = letterSpacing.match(/^(-?\d*\.?\d+)em$/i);
  if (!fontSizeMatch || !letterSpacingMatch) return value;
  const fontSizePx = Number(fontSizeMatch[1]) * (fontSizeMatch[2].toLowerCase() === 'rem' ? 16 : 1);
  const letterSpacingPx = fontSizePx * Number(letterSpacingMatch[1]);
  return { ...value, letterSpacing: `${Number(letterSpacingPx.toFixed(4))}px` };
};

const normalizePenpotLetterSpacing = (value) => {
  if (typeof value !== 'string') return value;
  const match = value.trim().match(/^(-?\d*\.?\d+)em$/i);
  if (!match) return value;
  return `${Number((Number(match[1]) * 16).toFixed(4))}px`;
};

const toPenpotEntry = (token) => {
  const type = token.$type ?? token.type;
  // Penpot has no standalone line-height token type. Line heights are
  // represented inside the canonical composite typography tokens instead.
  if (type === 'lineHeight') return null;
  const originalValue = tokenValue(token);
  const value = isRef(originalValue) ? toPenpotReference(originalValue) : type === 'letterSpacing' ? normalizePenpotLetterSpacing(originalValue) : normalizePenpotValue(token);
  return { $value: type === 'typography' ? normalizePenpotTypography(value) : value, $type: toPenpotType(token) };
};

const buildNestedJson = (tokens, pathFn, valueFn) => {
  const root = {};
  for (const token of tokens) {
    const entry = valueFn(token);
    if (entry == null) continue;
    const path = pathFn(token);
    let node = root;
    for (const seg of path.slice(0, -1)) {
      node[seg] ??= {};
      node = node[seg];
    }
    node[path[path.length - 1]] = entry;
  }
  return root;
};

export const registerTokenFormats = ({ StyleDictionary }) => {
  StyleDictionary.registerFormat({
    name: 'json/dtcg-nested',
    format: ({ dictionary }) =>
      JSON.stringify(
        buildNestedJson(
          dictionary.allTokens,
          (t) => t.path,
          (t) => ({ $value: tokenValue(t), $type: t.$type ?? t.type })
        ),
        null,
        2
      ) + '\n'
  });

  StyleDictionary.registerFormat({
    name: 'json/dtcg-nested-penpot',
    format: ({ dictionary }) => JSON.stringify(buildNestedJson(sortPenpotTokens(dictionary.allTokens), toPenpotPath, toPenpotEntry), null, 2) + '\n'
  });

  StyleDictionary.registerFormat({
    name: 'json/dtcg-nested-figma',
    format: ({ dictionary, options }) => {
      const pathFn = (token) => {
        if ((token.$type ?? token.type) === 'shadow') return ['filter', 'drop-shadow', token.path.at(-1)];
        if (options?.colorStructure) {
          const path = toPenpotPath(token);
          return path;
        }
        return options?.semanticGroups ? toFigmaColorsPath(token.path) : toFigmaPath(token.path);
      };
      const root = buildNestedJson(dictionary.allTokens, pathFn, (t) => {
        const f = normalizeFigmaTypeAndValue(t, options);
        return f ? { $value: f.value, $type: f.type } : null;
      });
      if (options?.modeName) root.$extensions = { 'com.figma.modeName': options.modeName };
      return JSON.stringify(root, null, 2) + '\n';
    }
  });

  StyleDictionary.registerFormat({ name: 'json/penpot-themes', format: () => JSON.stringify(PENPOT_THEMES, null, 2) + '\n' });
  StyleDictionary.registerFormat({ name: 'json/penpot-metadata', format: () => JSON.stringify(PENPOT_METADATA, null, 2) + '\n' });
  StyleDictionary.registerFormat({
    name: 'json/tokens-studio',
    format: ({ dictionary }) =>
      JSON.stringify(
        buildNestedJson(
          dictionary.allTokens,
          (t) => t.path,
          (t) => {
            const type = t.$type ?? t.type;
            const orig = tokenValue(t);
            const value = type === 'color' && !isRef(String(orig ?? '')) ? normalizePenpotValue(t) : orig;
            return { value, type };
          }
        ),
        null,
        2
      ) + '\n'
  });
};
