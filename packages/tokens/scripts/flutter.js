import { normalizePenpotValue } from './design-tool-utils.js';

export const AESIR_FLUTTER_TRANSFORM_GROUP = 'aesir/flutter';

const DART_RESERVED_WORDS = new Set([
  'abstract',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'else',
  'enum',
  'extends',
  'false',
  'final',
  'finally',
  'for',
  'if',
  'implements',
  'import',
  'in',
  'is',
  'late',
  'new',
  'null',
  'required',
  'rethrow',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'var',
  'void',
  'while',
  'with'
]);
const GENERIC_FONT_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);

const tokenType = (token) => token.$type ?? token.type;
const rawValue = (token) => token.$value ?? token.value;

const rejoinDecimalStep = (path) => {
  const [root, whole, fraction] = path;
  return path.length === 3 && ['spacing', 'sizing'].includes(root) && /^\d+$/.test(whole) && /^\d$/.test(fraction) ? [root, `${whole}.${fraction}`] : path;
};

export const dartIdentifier = (path) => {
  const words = rejoinDecimalStep(path).flatMap((segment) => String(segment).replaceAll('.', '_').split('-'));
  const name = words.map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1))).join('');
  if (!/^[a-z][A-Za-z0-9_]*$/.test(name)) throw new Error(`Cannot derive a Dart identifier from token path: ${path.join('.')}`);
  if (DART_RESERVED_WORDS.has(name)) throw new Error(`Token path ${path.join('.')} collides with the Dart reserved word "${name}"`);
  return name;
};

export const dartColor = (value) => {
  const hex = normalizePenpotValue({ $value: value, $type: 'color' });
  const match = typeof hex === 'string' ? hex.trim().match(/^#([\da-f]{6})([\da-f]{2})?$/i) : null;
  if (!match) throw new Error(`Unsupported colour for Flutter: ${value}`);
  return `Color(0x${(match[2] ?? 'ff').toUpperCase()}${match[1].toUpperCase()})`;
};

export const lengthToLogicalPixels = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = typeof value === 'string' ? value.trim().match(/^(-?\d*\.?\d+)(px|rem)?$/i) : null;
  if (!match) throw new Error(`Unsupported length for Flutter: ${value}`);
  return Number(match[1]) * (match[2]?.toLowerCase() === 'rem' ? 16 : 1);
};

export const dartNumber = (value) => {
  const rounded = Number(value.toFixed(4));
  return Object.is(rounded, -0) ? '0' : String(rounded);
};

export const dartString = (value) => `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('$', '\\$')}'`;

export const dartFontWeight = (value) => {
  const weight = Number(value);
  if (!Number.isInteger(weight / 100) || weight < 100 || weight > 900) throw new Error(`Flutter has no FontWeight for ${value}`);
  return `FontWeight.w${weight}`;
};

export const parseFontStack = (value) => {
  const families = String(value)
    .split(',')
    .map((family) => family.trim().replace(/^(['"])(.*)\1$/, '$2'))
    .filter((family) => family && !GENERIC_FONT_FAMILIES.has(family));
  if (families.length === 0) throw new Error(`Font stack has no named family: ${value}`);
  return { primary: families[0], fallback: families.slice(1) };
};

export const registerFlutterTransforms = ({ StyleDictionary }) => {
  const valueTransforms = {
    color: { types: ['color'], transform: dartColor },
    size: { types: ['dimension', 'fontSize', 'borderRadius'], transform: (value) => lengthToLogicalPixels(value).toFixed(2) },
    fontWeight: { types: ['fontWeight'], transform: dartFontWeight },
    fontFamily: { types: ['fontFamily'], transform: (value) => dartString(parseFontStack(value).primary) }
  };
  StyleDictionary.registerTransform({ name: 'name/aesir-flutter', type: 'name', transform: (token) => dartIdentifier(token.path) });
  for (const [name, { types, transform }] of Object.entries(valueTransforms)) {
    StyleDictionary.registerTransform({ name: `${name}/aesir-flutter`, type: 'value', filter: (token) => types.includes(tokenType(token)), transform: (token) => transform(rawValue(token)) });
  }
  StyleDictionary.registerTransformGroup({
    name: AESIR_FLUTTER_TRANSFORM_GROUP,
    transforms: ['attribute/cti', 'name/aesir-flutter', ...Object.keys(valueTransforms).map((name) => `${name}/aesir-flutter`)]
  });
};
