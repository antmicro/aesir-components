import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { ACCENT_PALETTES, DESIGN_TOOL_THEMES } from '@aesir/tokens/internal/design-tools';
import { AESIR_FLUTTER_TRANSFORM_GROUP, dartColor, registerFlutterTransforms } from '@aesir/tokens/internal/flutter';
import { tokenSource } from '@aesir/tokens/internal/source';
import packageMetadata from './package.json' with { type: 'json' };
import { emitBarrel, emitColors, emitMotion, emitPubspec, emitShadows, emitTheme, emitTypography } from './src/dart.mjs';

registerFlutterTransforms({ StyleDictionary });

const outputDirectory = fileURLToPath(new URL('./dist/', import.meta.url));
const sourceDirectory = `${outputDirectory}lib/src/`;
const semanticDirectory = tokenSource('semantic');
const readTokenFile = async (pattern) => JSON.parse(await readFile(tokenSource(pattern), 'utf8'));
const isLineHeightOrLetterSpacing = (token) => ['lineHeight', 'letterSpacing'].includes(token.$type ?? token.type);
const dartHeader = (defaultMessage) => [...defaultMessage, 'ignore_for_file: constant_identifier_names'];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(sourceDirectory, { recursive: true });

const platformFor = (source, files) =>
  new StyleDictionary({
    source,
    platforms: { flutter: { transformGroup: AESIR_FLUTTER_TRANSFORM_GROUP, buildPath: sourceDirectory, files } }
  });
const classFile = (destination, className, extra = {}) => ({ destination, format: 'flutter/class.dart', options: { className, fileHeader: dartHeader }, ...extra });

// Line height and letter spacing depend on the font size, so they only exist
// in the composite AesirTypography styles rather than as loose constants.
await platformFor([tokenSource('shared/foundations.json')], [classFile('aesir_foundations.dart', 'AesirFoundations', { filter: (token) => !isLineHeightOrLetterSpacing(token) })]).buildAllPlatforms();
for (const mode of ['light', 'dark']) {
  await platformFor([tokenSource(`${mode}/**/*.json`)], [classFile(`aesir_palette_${mode}.dart`, `AesirPalette${mode[0].toUpperCase()}${mode.slice(1)}`)]).buildAllPlatforms();
}

const resolveMode = async (mode) => {
  const dictionary = platformFor([tokenSource(`${mode}/**/*.json`), tokenSource('semantic/**/*.json')], []);
  const { allTokens } = await dictionary.getPlatformTokens('flutter');
  const byPath = new Map(allTokens.map((token) => [token.path.join('.'), token.$value]));
  const semantic = new Map();
  for (const token of allTokens.filter((candidate) => path.relative(semanticDirectory, candidate.filePath).startsWith('..') === false)) {
    const [group, name, ...rest] = token.path;
    if (group !== 'color' || rest.length > 0) throw new Error(`Unexpected semantic token path: ${token.path.join('.')}`);
    if (semantic.has(name)) throw new Error(`Duplicate semantic colour: ${name}`);
    semantic.set(name, token.$value);
  }
  return { byPath, semantic };
};
const modes = { light: await resolveMode('light'), dark: await resolveMode('dark') };
const names = [...modes.light.semantic.keys()];
for (const [mode, { semantic }] of Object.entries(modes)) {
  const missing = names.filter((name) => !semantic.has(name));
  if (missing.length > 0 || semantic.size !== names.length) throw new Error(`${mode} semantic colours differ from light: ${missing.join(', ')}`);
}

const presets = await readTokenFile('themes/presets.json');
const paletteReference = /^var\(--ds-([a-z]+)-(\d+)\)$/;
const themeOverrides = (theme, mode, { byPath }) => {
  if (theme === 'default') return new Map();
  const preset = presets.theme[theme];
  if (!preset) throw new Error(`Unknown theme: ${theme}`);
  const overrides = new Map();
  for (const [name, value] of Object.entries({ ...preset.all, ...preset[mode] })) {
    if (name.startsWith('accent-') && name !== 'accent-foreground') continue;
    const palette = value.match(paletteReference);
    const resolved = palette ? byPath.get(`color.${palette[1]}.${palette[2]}`) : /^oklch\(/.test(value) ? dartColor(value) : null;
    if (!resolved) throw new Error(`Unsupported ${theme} theme value: ${name}=${value}`);
    overrides.set(name, resolved);
  }
  return overrides;
};

const variants = DESIGN_TOOL_THEMES.flatMap((theme) =>
  ['light', 'dark'].map((mode) => {
    const overrides = themeOverrides(theme, mode, modes[mode]);
    const unknown = [...overrides.keys()].filter((name) => !names.includes(name));
    if (unknown.length > 0) throw new Error(`${theme} theme overrides unknown semantic colours: ${unknown.join(', ')}`);
    return { theme, mode, values: new Map(names.map((name) => [name, overrides.get(name) ?? modes[mode].semantic.get(name)])) };
  })
);

const accentFields = [
  ['accent', (palette) => `emphasis-${palette}`],
  ['accent-hover', (palette) => `emphasis-hover-${palette}`],
  ['accent-surface', (palette) => `surface-${palette}`],
  ['accent-surface-hover', (palette) => `surface-hover-${palette}`],
  ['accent-surface-active', (palette) => `surface-active-${palette}`],
  ['accent-text', (palette) => `foreground-${palette}`],
  ['accent-text-muted', (palette) => `foreground-muted-${palette}`],
  ['accent-border', (palette) => `border-${palette}`],
  ['accent-border-hover', (palette) => `border-hover-${palette}`],
  ['accent-ring', (palette) => `border-active-${palette}`]
];

const [foundations, composites, motion] = await Promise.all([readTokenFile('shared/foundations.json'), readTokenFile('composites/styles.json'), readTokenFile('shared/motion.json')]);
const generated = {
  'aesir_colors.dart': emitColors({
    names,
    themes: DESIGN_TOOL_THEMES,
    accents: ACCENT_PALETTES,
    accentFields,
    variants
  }),
  'aesir_theme.dart': emitTheme(),
  'aesir_typography.dart': emitTypography({ foundations, composites }),
  'aesir_shadows.dart': emitShadows({ composites }),
  'aesir_motion.dart': emitMotion({ motion })
};
await Promise.all(Object.entries(generated).map(([file, content]) => writeFile(`${sourceDirectory}${file}`, content)));

await writeFile(`${outputDirectory}lib/aesir.dart`, emitBarrel((await readdir(sourceDirectory)).sort()));
await writeFile(`${outputDirectory}pubspec.yaml`, emitPubspec({ name: 'aesir', version: packageMetadata.version }));
await writeFile(`${outputDirectory}.gitignore`, '.dart_tool\npubspec.lock\n');
