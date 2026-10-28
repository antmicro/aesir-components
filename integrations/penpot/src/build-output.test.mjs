import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ACCENT_PALETTES, DESIGN_TOOL_THEMES } from '@aesir/tokens/internal/design-tools';

const readOutput = async (filename) => JSON.parse(await readFile(new URL(`../dist/${filename}`, import.meta.url), 'utf8'));
const tokenValues = (node) => {
  if (!node || typeof node !== 'object') return [];
  if ('$value' in node) return [node.$value];
  return Object.values(node).flatMap(tokenValues);
};
const accentTokenNames = [
  'accent',
  'accent-hover',
  'accent-foreground',
  'accent-surface',
  'accent-surface-hover',
  'accent-surface-active',
  'accent-text',
  'accent-text-muted',
  'accent-border',
  'accent-border-hover',
  'accent-ring'
].sort();
const alphabeticallySortedValues = (tokens) =>
  Object.keys(tokens)
    .sort()
    .map((name) => tokens[name].$value);
const numericValue = (value) => (typeof value === 'number' ? value : Number.parseFloat(value));

test('keeps accent tokens out of mode token sets', async () => {
  for (const filename of ['AESIR/global.json', 'AESIR/semantic.json', 'AESIR/mode/light.json', 'AESIR/mode/dark.json']) {
    const output = await readOutput(filename);
    const accentTokens = Object.keys(output.color ?? {}).filter((name) => name === 'accent' || name.startsWith('accent-'));
    assert.deepEqual(accentTokens, [], filename);
  }
});

test('separates foundations, semantic aliases, and light/dark primitives', async () => {
  const [global, semantic, light, dark] = await Promise.all(['AESIR/global.json', 'AESIR/semantic.json', 'AESIR/mode/light.json', 'AESIR/mode/dark.json'].map(readOutput));

  assert.equal(global.color, undefined);
  assert.equal(light['color-palette'].fixed.black.$value, '#000000');
  assert.equal(light['color-palette'].fixed.white.$value, '#ffffff');
  assert.notEqual(light['color-palette'].gray[0].$value, dark['color-palette'].gray[0].$value);
  assert.equal(dark['color-palette'].fixed.black.$value, '#000000');
  assert.equal(dark['color-palette'].fixed.white.$value, '#ffffff');
  assert.equal(semantic.color.background.default.$value, '{color-palette.gray.0}');
  assert.equal(semantic.color.border.hover.$value, '{color-palette.gray.500}');
  assert.equal(semantic.color.surface.blue.hover.$value, '{color-palette.blue.200}');
  assert.equal(
    tokenValues(semantic).every((value) => /^\{color-palette\.[^}]+\}$/.test(value)),
    true
  );
});

test('keeps numeric foundation scales in value order when Penpot alphabetizes their names', async () => {
  const global = await readOutput('AESIR/global.json');
  for (const tokens of [
    global.spacing,
    global.sizing,
    global.opacity,
    global.filter['backdrop-blur'],
    global['border-radius'],
    global['font-size'],
    global['font-weight'],
    global.grid.columns,
    global.grid.gutter,
    global.grid.margin,
    global.breakpoint
  ]) {
    const values = alphabeticallySortedValues(tokens).map(numericValue);
    assert.deepEqual(
      values,
      [...values].sort((a, b) => a - b)
    );
  }

  assert.deepEqual(
    Object.keys(global.shadow)
      .sort()
      .map((name) => name.replace(/^\d+-/, '')),
    ['none', 'sm', 'md', 'lg', 'xl']
  );
});

test('exports independent theme mappings backed by both color modes', async () => {
  const [semantic, light, dark] = await Promise.all(['AESIR/semantic.json', 'AESIR/mode/light.json', 'AESIR/mode/dark.json'].map(readOutput));
  for (const theme of DESIGN_TOOL_THEMES) {
    const output = await readOutput(`AESIR/theme/${theme}.json`);
    assert.deepEqual(Object.keys(output.color), Object.keys(semantic.color), theme);
  }
  const mist = await readOutput('AESIR/theme/mist.json');
  assert.equal(mist.color.background.default.$value, '{theme-palette.mist.background}');
  assert.equal(mist['theme-accent-foreground'].$value, '{theme-palette.mist.accent-foreground}');
  assert.match(light['theme-palette'].mist.border.$value, /^#[\da-f]{8}$/);
  assert.match(dark['theme-palette'].mist.border.$value, /^#[\da-f]{8}$/);
  assert.notEqual(light['theme-palette'].mist.background.$value, dark['theme-palette'].mist.background.$value);
  const accessible = await readOutput('AESIR/theme/protan-deutan.json');
  assert.equal(accessible.color.surface.red.default.$value, '{color-palette.orange.100}');
});

test('emits a complete token set for every accent theme', async () => {
  for (const palette of ACCENT_PALETTES) {
    const output = await readOutput(`AESIR/accent/${palette}.json`);
    assert.deepEqual(Object.keys(output.color ?? {}).sort(), accentTokenNames, palette);
    assert.equal(output.color.accent.$value, `{color.emphasis.${palette}.default}`);
    assert.equal(output.color['accent-foreground'].$value, '{theme-accent-foreground}');
  }
});
