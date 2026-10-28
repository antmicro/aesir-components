import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { ACCENT_PALETTES, DESIGN_TOOL_THEMES, buildModeThemePalette, buildThemeSemantic } from '@aesir/tokens/internal/design-tools';
import { registerTokenFormats } from '@aesir/tokens/internal/formats';
import { tokenSource } from '@aesir/tokens/internal/source';

registerTokenFormats({ StyleDictionary });

const outputDirectory = fileURLToPath(new URL('./dist/', import.meta.url));
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
const excludesAccentTokens = (token) => !(token.path[0] === 'color' && /^accent(?:-|$)/.test(token.path[1]));

const globalTokens = new StyleDictionary({
  // Motion is intentionally web-only: Penpot cannot represent duration or
  // cubic-bezier tokens. Composite styles are shared canonical definitions
  // serialized separately for Penpot and the web packages.
  source: [tokenSource('shared/foundations.json'), tokenSource('composites/**/*.json')],
  platforms: {
    penpotGlobal: {
      transformGroup: 'js',
      buildPath: outputDirectory,
      files: [
        {
          destination: 'AESIR/global.json',
          format: 'json/dtcg-nested-penpot',
          filter: excludesAccentTokens,
          options: { outputReferences: true }
        },
        { destination: '$themes.json', format: 'json/penpot-themes' },
        { destination: '$metadata.json', format: 'json/penpot-metadata' }
      ]
    }
  }
});

const paletteTokens = (mode, source) =>
  new StyleDictionary({
    source: [tokenSource(`${source}/**/*.json`)],
    platforms: {
      [`penpotPalette${mode}`]: {
        transformGroup: 'js',
        buildPath: outputDirectory,
        files: [{ destination: `AESIR/mode/${mode.toLowerCase()}.json`, format: 'json/dtcg-nested-penpot' }]
      }
    }
  });

const semanticColorTokens = new StyleDictionary({
  source: [tokenSource('light/**/*.json'), tokenSource('semantic/**/*.json')],
  platforms: {
    penpotColors: {
      transformGroup: 'js',
      buildPath: outputDirectory,
      files: [
        {
          destination: 'AESIR/semantic.json',
          format: 'json/dtcg-nested-penpot',
          filter: (token) => token.path[0] === 'color' && token.path.length === 2 && excludesAccentTokens(token),
          options: { outputReferences: true }
        }
      ]
    }
  }
});

await globalTokens.buildAllPlatforms();
await paletteTokens('Light', 'light').buildAllPlatforms();
await paletteTokens('Dark', 'dark').buildAllPlatforms();
await semanticColorTokens.buildAllPlatforms();

const presets = JSON.parse(await readFile(tokenSource('themes/presets.json'), 'utf8'));
const semanticOutput = JSON.parse(await readFile(new URL('./dist/AESIR/semantic.json', import.meta.url), 'utf8'));
for (const mode of ['light', 'dark']) {
  const url = new URL(`./dist/AESIR/mode/${mode}.json`, import.meta.url);
  const palette = JSON.parse(await readFile(url, 'utf8'));
  await writeFile(url, `${JSON.stringify({ ...palette, ...buildModeThemePalette(presets, mode) }, null, 2)}\n`);
}
await mkdir(new URL('./dist/AESIR/theme/', import.meta.url), { recursive: true });
await Promise.all(
  DESIGN_TOOL_THEMES.map((theme) => writeFile(new URL(`./dist/AESIR/theme/${theme}.json`, import.meta.url), `${JSON.stringify(buildThemeSemantic(semanticOutput, presets, theme), null, 2)}\n`))
);

const accentTokenReferences = {
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
    const color = Object.fromEntries(Object.entries(accentTokenReferences).map(([name, reference]) => [name, { $value: reference(palette), $type: 'color' }]));
    return writeFile(new URL(`${palette}.json`, accentOutputDirectory), `${JSON.stringify({ color }, null, 2)}\n`);
  })
);
