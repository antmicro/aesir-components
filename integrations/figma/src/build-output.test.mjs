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
const getToken = (outputValue, reference) => reference.split('.').reduce((node, segment) => node?.[segment], outputValue);
const tokenReferences = (node) => tokenValues(node).filter((value) => typeof value === 'string' && /^\{[^}]+\}$/.test(value));
const tokenPaths = (node, prefix = '') =>
  Object.entries(node ?? {}).flatMap(([name, value]) => {
    if (name === '$extensions') return [];
    const path = prefix ? `${prefix}/${name}` : name;
    return value && typeof value === 'object' && '$value' in value ? [`${path}:${value.$type}`] : tokenPaths(value, path);
  });

test('keeps foundations separate from colors', async () => {
  const global = await readOutput('AESIR/global.tokens.json');
  assert.equal(global.color, undefined);
});

test('emits shared semantic aliases and separate light/dark primitives', async () => {
  const [semantic, light, dark] = await Promise.all([readOutput('AESIR/semantic.tokens.json'), readOutput('AESIR/mode/light.tokens.json'), readOutput('AESIR/mode/dark.tokens.json')]);
  for (const [mode, outputValue] of [
    ['Light', light],
    ['Dark', dark]
  ]) {
    assert.equal(outputValue.$extensions['com.figma.modeName'], mode);
    assert.equal(outputValue['color-palette'].fixed.black.$value.hex, '#000000');
    assert.equal(outputValue['color-palette'].fixed.white.$value.hex, '#FFFFFF');
  }
  assert.equal(semantic.color.background.default.$value, '{color-palette.gray.0}');
  assert.equal(semantic.color.surface.blue.hover.$value, '{color-palette.blue.200}');
  assert.equal(semantic.color.accent, undefined);
  assert.deepEqual(tokenPaths(light), tokenPaths(dark));
  assert.notDeepEqual(light['color-palette'].gray[0].$value, dark['color-palette'].gray[0].$value);
  for (const reference of tokenReferences(semantic)) {
    const name = reference.slice(1, -1);
    assert.ok(getToken(light, name), `Missing light token: ${name}`);
    assert.ok(getToken(dark, name), `Missing dark token: ${name}`);
  }
});

test('keeps themes independent of mode and gives each Figma theme mode the same variables', async () => {
  const [light, dark] = await Promise.all([readOutput('AESIR/mode/light.tokens.json'), readOutput('AESIR/mode/dark.tokens.json')]);
  const themes = await Promise.all(DESIGN_TOOL_THEMES.map((theme) => readOutput(`AESIR/theme/${theme}.tokens.json`)));
  for (const [index, outputValue] of themes.entries()) {
    assert.deepEqual(tokenPaths(outputValue), tokenPaths(themes[0]), DESIGN_TOOL_THEMES[index]);
    for (const reference of tokenReferences(outputValue.color)) {
      const name = reference.slice(1, -1);
      assert.ok(getToken(light, name) ?? getToken(outputValue, name), `Missing light theme reference: ${name}`);
      assert.ok(getToken(dark, name) ?? getToken(outputValue, name), `Missing dark theme reference: ${name}`);
    }
  }
  assert.equal(themes[1].color.background.default.$value, '{theme-palette.mist.background}');
  assert.equal(themes[1]['theme-accent-foreground'].$value, '{theme-palette.mist.accent-foreground}');
  assert.deepEqual(themes[1].color.background.default.$extensions['com.figma.aliasData'], {
    targetVariableSetName: 'AESIR Mode',
    targetVariableName: 'theme-palette/mist/background'
  });
  assert.notDeepEqual(light['theme-palette'].mist.background.$value, dark['theme-palette'].mist.background.$value);
  assert.equal(light['theme-palette'].mist.border.$value.alpha, 0.08);
  assert.equal(themes[2].color.surface.red.default.$value, '{color-palette.orange.100}');
});

test('emits each accent as a separate Figma mode', async () => {
  for (const palette of ACCENT_PALETTES) {
    const outputValue = await readOutput(`AESIR/accent/${palette}.tokens.json`);
    assert.equal(outputValue.$extensions['com.figma.modeName'], palette[0].toUpperCase() + palette.slice(1));
    assert.equal(outputValue.color.accent.$value, `{color.emphasis.${palette}.default}`);
    assert.deepEqual(outputValue.color['accent-foreground'].$extensions['com.figma.aliasData'], {
      targetVariableSetName: 'AESIR Theme',
      targetVariableName: 'theme-accent-foreground'
    });
    assert.deepEqual(outputValue.color.accent.$extensions['com.figma.aliasData'], {
      targetVariableSetName: 'AESIR Theme',
      targetVariableName: `color/emphasis/${palette}/default`
    });
    assert.equal(
      tokenValues(outputValue.color).every((value) => /^\{(?:color|color-palette)\.[^}]+\}$/.test(value) || value === '{theme-accent-foreground}'),
      true
    );
    const [semantic, mode, theme] = await Promise.all([readOutput('AESIR/semantic.tokens.json'), readOutput('AESIR/mode/light.tokens.json'), readOutput('AESIR/theme/default.tokens.json')]);
    for (const reference of tokenReferences(outputValue.color)) {
      const name = reference.slice(1, -1);
      assert.ok(getToken(semantic, name) ?? getToken(mode, name) ?? getToken(theme, name), `Missing accent reference: ${name}`);
    }
  }
});
