import assert from 'node:assert/strict';
import test from 'node:test';
import { ACCENT_PALETTES, DESIGN_TOOL_THEMES, PENPOT_METADATA, PENPOT_THEMES, toPenpotPath, toPenpotReference } from '@aesir/tokens/internal/design-tools';
import { diffBundles, normalizeBundle } from './tokens.mjs';

test('keeps source scale names alongside Penpot spacing and sizing values', () => {
  assert.deepEqual(toPenpotPath({ path: ['spacing', '4'], original: { $value: '16px' } }), ['spacing', '0016px-04']);
  assert.deepEqual(toPenpotPath({ path: ['spacing', '0', '5'], original: { $value: '2px' } }), ['spacing', '0002px-0_5']);
  assert.deepEqual(toPenpotPath({ path: ['sizing', 'md'], original: { $value: '448px' } }), ['sizing', '0448px-md']);
  assert.deepEqual(toPenpotPath({ path: ['sizing', '5xl'], original: { $value: '1024px' } }), ['sizing', '1024px-5xl']);
});

test('uses value-prefixed names for every numeric foundation scale Penpot sorts alphabetically', () => {
  assert.deepEqual(toPenpotPath({ path: ['opacity', '5'], original: { $value: 0.05, $type: 'opacity' } }), ['opacity', '005-05']);
  assert.deepEqual(toPenpotPath({ path: ['filter', 'backdrop-blur', 'lg'], original: { $value: '12px', $type: 'dimension' } }), ['filter', 'backdrop-blur', '0012px-lg']);
  assert.deepEqual(toPenpotPath({ path: ['radius', '2xl'], original: { $value: '16px', $type: 'borderRadius' } }), ['border-radius', '0016px-2xl']);
  assert.deepEqual(toPenpotPath({ path: ['font', 'size', 'xxs'], original: { $value: '0.675rem', $type: 'fontSize' } }), ['font-size', '0010_8px-xxs']);
  assert.deepEqual(toPenpotPath({ path: ['font', 'weight', 'medium'], original: { $value: 500, $type: 'fontWeight' } }), ['font-weight', '0500-medium']);
  assert.deepEqual(toPenpotPath({ path: ['grid', 'columns', 'mobile'], original: { $value: 4, $type: 'number' } }), ['grid', 'columns', '0004-mobile']);
  assert.deepEqual(toPenpotPath({ path: ['breakpoint', 'lg'], original: { $value: '1024px', $type: 'dimension' } }), ['breakpoint', '1024px-lg']);
});

test('groups semantic colors and rewrites palette references for Penpot', () => {
  assert.deepEqual(toPenpotPath({ path: ['color', 'background-secondary'] }), ['color', 'background', 'secondary']);
  assert.deepEqual(toPenpotPath({ path: ['color', 'border-hover'] }), ['color', 'border', 'hover']);
  assert.deepEqual(toPenpotPath({ path: ['color', 'surface-hover-blue'] }), ['color', 'surface', 'blue', 'hover']);
  assert.deepEqual(toPenpotPath({ path: ['color', 'fixed', 'white'] }), ['color-palette', 'fixed', 'white']);
  assert.equal(toPenpotReference('{color.blue.700}'), '{color-palette.blue.700}');
});

test('normalizes Penpot round-trip token types and composites', () => {
  const bundle = normalizeBundle({
    global: {
      family: { $type: 'fontFamily', $value: "'Inter', sans-serif" },
      body: {
        $type: 'typography',
        $value: { fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 400, lineHeight: '24px' }
      },
      shadow: { $type: 'shadow', $value: { color: '#00000024', offsetX: '0px', offsetY: '1px', blur: '2px', spread: '0px' } }
    }
  });
  assert.deepEqual(bundle.global.family, { $type: 'fontFamilies', $value: ["'Inter'", 'sans-serif'] });
  assert.deepEqual(bundle.global.body.$value, {
    fontFamilies: ["'Inter'", 'sans-serif'],
    fontSizes: '16px',
    fontWeights: 400,
    lineHeights: '24px'
  });
  assert.equal(bundle.global.shadow.$value[0].inset, false);
});

test('reports created, updated and deleted tokens', () => {
  const before = normalizeBundle({ global: { old: { $type: 'number', $value: 1 }, changed: { $type: 'number', $value: 1 } } });
  const after = normalizeBundle({ global: { added: { $type: 'number', $value: 1 }, changed: { $type: 'number', $value: 2 } } });
  assert.deepEqual(diffBundles(before, after), {
    created: ['global:added'],
    updated: ['global:changed'],
    deleted: ['global:old'],
    configurationChanged: false,
    changed: true
  });
});

test('reports theme and token-set configuration changes', () => {
  const before = normalizeBundle({ global: {}, $themes: [] });
  const after = normalizeBundle({
    global: {},
    $themes: [{ id: 'theme-1', name: 'Light', selectedTokenSets: { global: 'enabled' } }]
  });
  assert.deepEqual(diffBundles(before, after), {
    created: [],
    updated: [],
    deleted: [],
    configurationChanged: true,
    changed: true
  });
});

test('keeps foundations and semantics shared while switching color modes', () => {
  const modes = PENPOT_THEMES.filter((theme) => theme.group === 'Mode');
  const themes = PENPOT_THEMES.filter((theme) => theme.group === 'Theme');
  assert.deepEqual(
    modes.map((theme) => theme.name),
    ['Light', 'Dark']
  );
  assert.equal(themes.length, DESIGN_TOOL_THEMES.length);
  assert.deepEqual(PENPOT_METADATA.tokenSetOrder, [
    'AESIR/global',
    'AESIR/semantic',
    'AESIR/mode/light',
    'AESIR/mode/dark',
    ...DESIGN_TOOL_THEMES.map((theme) => `AESIR/theme/${theme}`),
    ...ACCENT_PALETTES.map((palette) => `AESIR/accent/${palette}`)
  ]);
  assert.deepEqual(PENPOT_METADATA.activeThemes, ['Mode/Light', 'Theme/Default', 'Accent/Blue']);
  for (const theme of modes) {
    assert.equal(theme.selectedTokenSets['AESIR/global'], 'enabled');
    assert.equal(theme.selectedTokenSets['AESIR/semantic'], 'enabled');
    assert.equal(Object.keys(theme.selectedTokenSets).filter((set) => set.startsWith('AESIR/mode/')).length, 1);
  }
  assert.equal(
    PENPOT_THEMES.some((theme) => theme.group === 'Drawing'),
    false
  );
});
