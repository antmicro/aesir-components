import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { ACCENT_PALETTES, DESIGN_TOOL_THEMES } from '@aesir/tokens/internal/design-tools';
import { dartColor, dartIdentifier, lengthToLogicalPixels, parseFontStack } from '@aesir/tokens/internal/flutter';

const readOutput = (filename) => readFile(new URL(`../dist/${filename}`, import.meta.url), 'utf8');
const constant = (source, name) => source.match(new RegExp(`static const (?:\\w+(?:<\\w+>)? )?${name} = ([^;]+);`))?.[1];
const colorFields = (source, variant) => {
  const body = source.match(new RegExp(`static const AesirColors ${variant} = AesirColors\\(([\\s\\S]*?)\\n  \\);`))?.[1];
  assert.ok(body, `Missing AesirColors.${variant}`);
  return Object.fromEntries([...body.matchAll(/(\w+): (Color\(0x[\dA-F]{8}\)),/g)].map(([, name, value]) => [name, value]));
};

test('converts token values to Dart without the Style Dictionary flutter transforms pitfalls', () => {
  assert.equal(lengthToLogicalPixels('16px'), 16);
  assert.equal(lengthToLogicalPixels('0.675rem'), 10.8);
  assert.equal(dartColor('oklch(1 0 0)'), 'Color(0xFFFFFFFF)');
  assert.equal(dartColor('#00000024'), 'Color(0x24000000)');
  assert.equal(dartColor('oklch(0 0 0 / 0.5)'), 'Color(0x80000000)');
  assert.deepEqual(parseFontStack("'Inter', 'Aptos', sans-serif"), { primary: 'Inter', fallback: ['Aptos'] });
  assert.equal(dartIdentifier(['spacing', '0', '5']), 'spacing0_5');
  assert.equal(dartIdentifier(['opacity', '10']), 'opacity10');
  assert.equal(dartIdentifier(['surface-hover-blue']), 'surfaceHoverBlue');
  assert.throws(() => dartIdentifier(['default']), /reserved word/);
});

test('emits a library barrel that exports every generated file', async () => {
  const [barrel, files, pubspec] = await Promise.all([readOutput('lib/aesir.dart'), readdir(new URL('../dist/lib/src/', import.meta.url)), readOutput('pubspec.yaml')]);
  for (const file of files) assert.match(barrel, new RegExp(`export 'src/${file}';`), file);
  assert.match(pubspec, /^name: aesir$/m);
});

test('emits foundations as logical pixels with Dart-valid values', async () => {
  const foundations = await readOutput('lib/src/aesir_foundations.dart');
  assert.equal(constant(foundations, 'spacing4'), '16.00');
  assert.equal(constant(foundations, 'spacing0_5'), '2.00');
  assert.equal(constant(foundations, 'fontSizeBase'), '16.00');
  assert.equal(constant(foundations, 'fontSizeXxs'), '10.80');
  assert.equal(constant(foundations, 'fontWeightBold'), 'FontWeight.w700');
  assert.equal(constant(foundations, 'fontFamilySans'), "'Inter'");
  assert.equal(constant(foundations, 'radiusMd'), '6.00');
  assert.equal(constant(foundations, 'opacity5'), '0.05');
  assert.equal(foundations.match(/fontLineHeight|fontLetterSpacing/), null, 'Line height and letter spacing live in AesirTypography');
});

test('keeps CSS colour syntax out of every generated Dart file', async () => {
  const files = await readdir(new URL('../dist/lib/src/', import.meta.url));
  for (const file of files) assert.doesNotMatch(await readOutput(`lib/src/${file}`), /oklch\(|var\(--|\d+px\b|\d+rem\b/, file);
});

test('emits resolved primitive palettes per mode', async () => {
  const [light, dark] = await Promise.all([readOutput('lib/src/aesir_palette_light.dart'), readOutput('lib/src/aesir_palette_dark.dart')]);
  assert.equal(constant(light, 'colorFixedWhite'), 'Color(0xFFFFFFFF)');
  assert.equal(constant(light, 'colorFixedBlack'), 'Color(0xFF000000)');
  assert.equal([...light.matchAll(/static const (\w+) =/g)].length, [...dark.matchAll(/static const (\w+) =/g)].length);
  assert.notEqual(constant(light, 'colorGray100'), constant(dark, 'colorGray100'));
});

test('emits the same semantic colours for every mode and theme', async () => {
  const colors = await readOutput('lib/src/aesir_colors.dart');
  const variants = DESIGN_TOOL_THEMES.flatMap((theme) => {
    const suffix = theme === 'default' ? '' : theme.replace(/(^|-)([a-z])/g, (_, __, letter) => letter.toUpperCase());
    return [`light${suffix}`, `dark${suffix}`];
  });
  const [reference, ...rest] = variants.map((variant) => colorFields(colors, variant));
  assert.ok(Object.keys(reference).length > 100);
  for (const [index, fields] of rest.entries()) assert.deepEqual(Object.keys(fields), Object.keys(reference), variants[index + 1]);
  for (const field of Object.keys(reference)) {
    assert.match(colors, new RegExp(`final Color ${field};`), field);
    assert.match(colors, new RegExp(`${field}: Color\\.lerp\\(${field}, other\\.${field}, t\\)!,`), field);
  }
});

test('resolves semantic aliases against each mode palette', async () => {
  const [colors, light, dark] = await Promise.all([readOutput('lib/src/aesir_colors.dart'), readOutput('lib/src/aesir_palette_light.dart'), readOutput('lib/src/aesir_palette_dark.dart')]);
  const lightColors = colorFields(colors, 'light');
  const darkColors = colorFields(colors, 'dark');
  assert.equal(lightColors.background, constant(light, 'colorGray0'));
  assert.equal(darkColors.background, constant(dark, 'colorGray0'));
  assert.equal(lightColors.surfaceBlue, constant(light, 'colorBlue100'));
  assert.equal(darkColors.surfaceBlue, constant(dark, 'colorBlue100'));
  assert.equal(lightColors.accent, constant(light, 'colorBlue700'));
  assert.equal(lightColors.accentForeground, constant(light, 'colorFixedWhite'));
});

test('applies theme presets over the default colours', async () => {
  const [colors, light, dark] = await Promise.all([readOutput('lib/src/aesir_colors.dart'), readOutput('lib/src/aesir_palette_light.dart'), readOutput('lib/src/aesir_palette_dark.dart')]);
  const base = colorFields(colors, 'light');
  const protanDeutan = colorFields(colors, 'lightProtanDeutan');
  assert.equal(protanDeutan.surfaceRed, constant(light, 'colorOrange100'));
  assert.equal(protanDeutan.surfaceGreen, constant(light, 'colorBlue100'));
  assert.equal(colorFields(colors, 'darkProtanDeutan').surfaceRed, constant(dark, 'colorOrange100'));
  assert.notEqual(protanDeutan.surfaceRed, base.surfaceRed);
  assert.equal(protanDeutan.background, base.background);

  const mist = colorFields(colors, 'lightMist');
  assert.equal(mist.background, 'Color(0xFFFAFAFA)');
  assert.notEqual(mist.background, colorFields(colors, 'darkMist').background);
});

test('maps every accent palette onto the accent fields', async () => {
  const colors = await readOutput('lib/src/aesir_colors.dart');
  for (const palette of ACCENT_PALETTES) {
    assert.match(colors, new RegExp(`enum AesirAccent \\{[^}]*\\b${palette}\\b`));
    const block = colors.match(new RegExp(`AesirAccent\\.${palette} => copyWith\\(([\\s\\S]*?)\\n      \\),`))?.[1];
    assert.ok(block, palette);
    const capitalized = palette[0].toUpperCase() + palette.slice(1);
    assert.match(block, new RegExp(`accent: emphasis${capitalized},`));
    assert.match(block, new RegExp(`accentRing: borderActive${capitalized},`));
    assert.doesNotMatch(block, /accentForeground/, 'accentForeground belongs to the theme');
  }
});

test('emits composite typography with Flutter text style semantics', async () => {
  const typography = await readOutput('lib/src/aesir_typography.dart');
  const body = typography.match(/static const TextStyle body = TextStyle\(([\s\S]*?)\n {2}\);/)?.[1];
  assert.match(body, /fontFamily: 'Inter',/);
  assert.match(body, /fontFamilyFallback: \['Inter Fallback'/);
  assert.doesNotMatch(body, /sans-serif/);
  assert.match(body, /fontSize: 16,/);
  assert.match(body, /fontWeight: FontWeight\.w400,/);
  assert.match(body, /letterSpacing: -0\.16,/, '-0.01em at 16px');
  assert.match(body, /height: 1\.5,/, '24px line height at 16px');
  assert.match(typography, /static const TextStyle headingH1 = /);
  assert.match(typography, /static const TextStyle code = /);
  assert.match(typography.match(/static const TextStyle code = TextStyle\(([\s\S]*?)\n {2}\);/)[1], /fontFamily: 'Geist Mono',/);
});

test('emits shadows and motion', async () => {
  const [shadows, motion] = await Promise.all([readOutput('lib/src/aesir_shadows.dart'), readOutput('lib/src/aesir_motion.dart')]);
  assert.match(shadows, /static const List<BoxShadow> none = \[\];/);
  assert.match(shadows, /static const List<BoxShadow> md = \[\s+BoxShadow\(\s+color: Color\(0x29000000\),\s+offset: Offset\(0, 4\),\s+blurRadius: 6,\s+spreadRadius: 0,/);
  assert.equal(constant(motion, 'durationFast'), 'Duration(milliseconds: 140)');
  assert.equal(constant(motion, 'easingOut'), 'Cubic(0.23, 1, 0.32, 1)');
});

test('emits a Material theme builder that registers the semantic colours', async () => {
  const theme = await readOutput('lib/src/aesir_theme.dart');
  assert.match(theme, /ThemeData aesirThemeData\(\{/);
  assert.match(theme, /extensions: \[colors\],/);
  assert.match(theme, /AesirColors\.resolve\(brightness: brightness, theme: theme, accent: accent\)/);
});
