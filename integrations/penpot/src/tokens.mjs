import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPE_ALIASES = {
  fontFamily: 'fontFamilies',
  fontSize: 'fontSizes',
  fontWeight: 'fontWeights'
};

const COMPOSITE_KEYS = {
  fontFamily: 'fontFamilies',
  fontSize: 'fontSizes',
  fontWeight: 'fontWeights',
  lineHeight: 'lineHeights'
};

const splitFontFamilies = (value) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : value;

const normalizeToken = (token) => {
  const type = TYPE_ALIASES[token.$type] ?? token.$type;
  let value = token.$value;

  if (type === 'fontFamilies') value = splitFontFamilies(value);
  if (type === 'typography' && value && typeof value === 'object' && !Array.isArray(value)) {
    value = Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => {
        const normalizedKey = COMPOSITE_KEYS[key] ?? key;
        return [normalizedKey, normalizedKey === 'fontFamilies' ? splitFontFamilies(childValue) : childValue];
      })
    );
  }
  if (type === 'shadow' && value && typeof value === 'object') {
    const shadows = Array.isArray(value) ? value : [value];
    value = shadows.map((shadow) => ({ ...shadow, inset: shadow.inset ?? false }));
  }

  return {
    $type: type,
    $value: value,
    ...(token.$description ? { $description: token.$description } : {})
  };
};

const normalizeNode = (node) => {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return node;
  if ('$value' in node) return normalizeToken(node);
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, normalizeNode(value)]));
};

const normalizeThemes = (themes = []) =>
  [...themes]
    .map((theme) => ({
      id: theme.id,
      name: theme.name,
      group: theme.group ?? '',
      description: theme.description ?? '',
      isSource: theme.isSource ?? false,
      selectedTokenSets: Object.fromEntries(Object.entries(theme.selectedTokenSets ?? {}).sort(([a], [b]) => a.localeCompare(b)))
    }))
    .sort((a, b) => `${a.group}/${a.name}`.localeCompare(`${b.group}/${b.name}`));

export const normalizeBundle = (bundle) => {
  const sets = Object.fromEntries(
    Object.entries(bundle)
      .filter(([key]) => !key.startsWith('$'))
      .map(([key, value]) => [key, normalizeNode(value)])
  );
  const metadata = bundle.$metadata ?? {};
  return {
    ...sets,
    $themes: normalizeThemes(bundle.$themes),
    $metadata: {
      tokenSetOrder: metadata.tokenSetOrder ?? Object.keys(sets),
      activeThemes: [...(metadata.activeThemes ?? [])].sort(),
      activeSets: [...(metadata.activeSets ?? [])].sort()
    }
  };
};

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])])
  );
};

export const stableJson = (value) => `${JSON.stringify(stableValue(value), null, 2)}\n`;

export const loadGeneratedBundle = async (directory = fileURLToPath(new URL('../dist/', import.meta.url))) => {
  const readJson = async (name) => JSON.parse(await readFile(resolve(directory, name), 'utf8'));
  const [themes, metadata] = await Promise.all([readJson('$themes.json'), readJson('$metadata.json')]);
  const setNames = metadata.tokenSetOrder ?? [];
  const sets = await Promise.all(setNames.map(async (name) => [name, await readJson(`${name}.json`)]));
  return { ...Object.fromEntries(sets), $themes: themes, $metadata: metadata };
};

const flattenTokens = (bundle) => {
  const tokens = new Map();
  const visit = (setName, node, path = []) => {
    if (!node || typeof node !== 'object') return;
    if ('$value' in node) {
      tokens.set(`${setName}:${path.join('.')}`, node);
      return;
    }
    for (const [key, value] of Object.entries(node)) visit(setName, value, [...path, key]);
  };
  for (const [setName, set] of Object.entries(bundle)) {
    if (!setName.startsWith('$')) visit(setName, set);
  }
  return tokens;
};

export const diffBundles = (before, after) => {
  const previous = flattenTokens(before);
  const next = flattenTokens(after);
  const created = [...next.keys()].filter((key) => !previous.has(key)).sort();
  const deleted = [...previous.keys()].filter((key) => !next.has(key)).sort();
  const updated = [...next.keys()].filter((key) => previous.has(key) && stableJson(previous.get(key)) !== stableJson(next.get(key))).sort();
  const configurationChanged = stableJson({ $themes: before.$themes, $metadata: before.$metadata }) !== stableJson({ $themes: after.$themes, $metadata: after.$metadata });
  return {
    created,
    updated,
    deleted,
    configurationChanged,
    changed: created.length + updated.length + deleted.length > 0 || configurationChanged
  };
};
