import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { ACCENT_PALETTES, DESIGN_TOOL_THEMES, buildModeThemePalette, buildThemeSemantic } from '@aesir/tokens/internal/design-tools';
import { hexToFigmaColor, registerTokenFormats } from '@aesir/tokens/internal/formats';
import { tokenSource } from '@aesir/tokens/internal/source';

registerTokenFormats({ StyleDictionary });

const outputDirectory = fileURLToPath(new URL('./dist/', import.meta.url));
const output = (path = '') => fileURLToPath(new URL(`./dist/${path}`, import.meta.url));
const excludesAccentTokens = (token) => !(token.path[0] === 'color' && /^accent(?:-|$)/.test(token.path[1]));
const addCrossCollectionAliases = (node, collection) => {
  if (!node || typeof node !== 'object') return node;
  if (typeof node.$value === 'string' && /^\{[^}]+\}$/.test(node.$value)) {
    const name = node.$value.slice(1, -1);
    const targetCollection =
      name.startsWith('color-palette.') || name.startsWith('theme-palette.') ? 'AESIR Mode' : name.startsWith('color.') || name === 'theme-accent-foreground' ? 'AESIR Theme' : null;
    if (targetCollection && targetCollection !== collection) {
      node.$extensions = {
        ...node.$extensions,
        'com.figma.aliasData': { targetVariableSetName: targetCollection, targetVariableName: name.replaceAll('.', '/') }
      };
    }
    return node;
  }
  for (const value of Object.values(node)) addCrossCollectionAliases(value, collection);
  return node;
};

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const globals = new StyleDictionary({
  source: [tokenSource('shared/**/*.json'), tokenSource('composites/**/*.json')],
  platforms: {
    figmaGlobals: {
      transformGroup: 'js',
      buildPath: output(),
      files: [
        {
          destination: 'AESIR/global.tokens.json',
          format: 'json/dtcg-nested-figma',
          options: { outputReferences: true, excludeTypography: true }
        }
      ]
    }
  }
});

const globalColorMode = (mode, source) =>
  new StyleDictionary({
    source: [tokenSource(`${source}/**/*.json`)],
    platforms: {
      [`figmaGlobalColors${mode}`]: {
        transformGroup: 'js',
        buildPath: output('AESIR/mode/'),
        files: [
          {
            destination: `${mode.toLowerCase()}.tokens.json`,
            format: 'json/dtcg-nested-figma',
            options: { outputReferences: true, modeName: mode, colorStructure: 'web-ui' }
          }
        ]
      }
    }
  });

const semantic = new StyleDictionary({
  source: [tokenSource('light/**/*.json'), tokenSource('semantic/**/*.json')],
  platforms: {
    figmaSemantic: {
      transformGroup: 'js',
      buildPath: output('AESIR/'),
      files: [
        {
          destination: 'semantic.tokens.json',
          format: 'json/dtcg-nested-figma',
          filter: (token) => token.path[0] === 'color' && token.path.length === 2 && excludesAccentTokens(token),
          options: { outputReferences: true, colorStructure: 'web-ui' }
        }
      ]
    }
  }
});

await globals.buildAllPlatforms();
await globalColorMode('Light', 'light').buildAllPlatforms();
await globalColorMode('Dark', 'dark').buildAllPlatforms();
await semantic.buildAllPlatforms();

const presets = JSON.parse(await readFile(tokenSource('themes/presets.json'), 'utf8'));
const semanticOutput = JSON.parse(await readFile(new URL('./dist/AESIR/semantic.tokens.json', import.meta.url), 'utf8'));
await writeFile(new URL('./dist/AESIR/semantic.tokens.json', import.meta.url), `${JSON.stringify(addCrossCollectionAliases(semanticOutput, 'AESIR Semantic'), null, 2)}\n`);
for (const mode of ['light', 'dark']) {
  const url = new URL(`./dist/AESIR/mode/${mode}.tokens.json`, import.meta.url);
  const palette = JSON.parse(await readFile(url, 'utf8'));
  const figmaThemeColor = (hex, source) => {
    const color = hexToFigmaColor(hex);
    const alpha = source.match(/\/\s*([\d.]+)\s*\)$/)?.[1];
    return alpha ? { ...color, alpha: Number(alpha) } : color;
  };
  await writeFile(url, `${JSON.stringify({ ...palette, ...buildModeThemePalette(presets, mode, figmaThemeColor) }, null, 2)}\n`);
}
await mkdir(new URL('./dist/AESIR/theme/', import.meta.url), { recursive: true });
await Promise.all(
  DESIGN_TOOL_THEMES.map((theme) => {
    const outputValue = addCrossCollectionAliases(buildThemeSemantic(semanticOutput, presets, theme), 'AESIR Theme');
    outputValue.$extensions = { 'com.figma.modeName': theme === 'default' ? 'Default' : theme === 'mist' ? 'Mist' : theme === 'tritan' ? 'Tritanopia' : 'Protanopia / deuteranopia' };
    return writeFile(new URL(`./dist/AESIR/theme/${theme}.tokens.json`, import.meta.url), `${JSON.stringify(outputValue, null, 2)}\n`);
  })
);

const accentReferences = {
  accent: (palette) => `{color.emphasis.${palette}.default}`,
  'accent-hover': (palette) => `{color.emphasis.${palette}.hover}`,
  'accent-foreground': () => '{theme-accent-foreground}',
  'accent-surface': (palette) => `{color.surface.${palette}.default}`,
  'accent-surface-hover': (palette) => `{color.surface.${palette}.hover}`,
  'accent-surface-active': (palette) => `{color.surface.${palette}.active}`,
  'accent-text': (palette) => `{color.foreground.${palette}.default}`,
  'accent-text-muted': (palette) => `{color.foreground.${palette}.muted}`,
  'accent-border': (palette) => `{color.border.${palette}.default}`,
  'accent-border-hover': (palette) => `{color.border.${palette}.hover}`,
  'accent-ring': (palette) => `{color.border.${palette}.active}`
};

const accentOutputDirectory = new URL('./dist/AESIR/accent/', import.meta.url);
await mkdir(accentOutputDirectory, { recursive: true });
await Promise.all(
  ACCENT_PALETTES.map((palette) => {
    const color = Object.fromEntries(Object.entries(accentReferences).map(([name, reference]) => [name, { $value: reference(palette), $type: 'color' }]));
    const outputValue = addCrossCollectionAliases({ color, $extensions: { 'com.figma.modeName': palette[0].toUpperCase() + palette.slice(1) } }, 'AESIR Accent');
    return writeFile(new URL(`${palette}.tokens.json`, accentOutputDirectory), `${JSON.stringify(outputValue, null, 2)}\n`);
  })
);
