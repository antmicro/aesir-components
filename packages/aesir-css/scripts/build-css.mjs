import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { ACCENT_PALETTES } from '@aesir/tokens/internal/design-tools';
import { tokenBuildArtifact, tokenSource } from '@aesir/tokens/internal/source';

const GENERATED_HEADER = '/**\n * Do not edit directly, this file was auto-generated.\n */';
const stripHeader = (css) => css.replace(/^\/\*\*[\s\S]*?\*\/\s*/, '').trim();
const namespacePublicVariables = (css) => css.replaceAll('--color-', '--ds-').replace(/--(breakpoint|filter|font|grid|motion|opacity|radius|sizing|spacing)-/g, '--ds-$1-');

const [lightCss, darkCss, motionCss, compositeSource, themeSource, typographyRules] = await Promise.all([
  readFile(tokenBuildArtifact('token-fragments/light.css'), 'utf8'),
  readFile(tokenBuildArtifact('token-fragments/dark.css'), 'utf8'),
  readFile(resolve('src/aesir-motion.css'), 'utf8'),
  readFile(tokenSource('composites/styles.json'), 'utf8'),
  readFile(tokenSource('themes/presets.json'), 'utf8'),
  readFile(resolve('scripts/templates/aesir-typography-rules.css'), 'utf8')
]);
const compositeTokens = JSON.parse(compositeSource);
const themes = JSON.parse(themeSource).theme;

const cssReference = (value) => {
  const match = typeof value === 'string' ? value.match(/^\{([^}]+)\}$/) : null;
  return match ? `var(--ds-${match[1].replaceAll('.', '-')})` : value;
};

const typographyValue = (name) => compositeTokens.typography[name].$value;
const headingValue = (name) => compositeTokens.typography.heading[name].$value;
const typographyVariables = [
  ['body-font-family', typographyValue('body').fontFamily],
  ['body-font-size', typographyValue('body').fontSize],
  ['body-font-weight', typographyValue('body').fontWeight],
  ['body-line-height', typographyValue('body').lineHeight],
  ['body-letter-spacing', typographyValue('body').letterSpacing],
  [null, null],
  ['heading-font-family', headingValue('h1').fontFamily],
  ['heading-letter-spacing', headingValue('h1').letterSpacing],
  ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].flatMap((name) => {
    const value = headingValue(name);
    return [
      [`${name}-font-size`, value.fontSize],
      [`${name}-font-weight`, value.fontWeight],
      [`${name}-line-height`, value.lineHeight]
    ];
  }),
  [null, null],
  ['strong-font-weight', '{font.weight.semibold}'],
  ...['supporting', 'code', 'quote'].flatMap((name, index, names) => {
    const value = typographyValue(name);
    const properties = name === 'code' ? ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'] : ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];
    const entries = properties.map((property) => [`${name}-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value[property]]);
    return index < names.length - 1 ? [...entries, [null, null]] : entries;
  })
];
const typographyRoot = `:root {\n${typographyVariables.map(([name, value]) => (name ? `\t--ds-typography-${name}: ${cssReference(value)};` : '')).join('\n')}\n}`;
const typographyPath = resolve('dist/aesir-typography.css');
// Keep generated output consistent with the repository formatter after every build.
const semanticTypographyCss = await format(`${typographyRoot}\n\n${typographyRules.trim()}\n`, {
  ...(await resolveConfig(typographyPath)),
  filepath: typographyPath
});

const shadowEntries = Object.entries(compositeTokens.shadow);
const shadowCssColor = (color) => {
  const match = color.match(/^#000000([a-f\d]{2})$/i);
  if (!match) return color;
  const alpha = Number.parseInt(match[1], 16) / 255;
  if (alpha === 0) return 'transparent';
  return `oklch(0 0 0 / ${Number(alpha.toFixed(2))})`;
};
const shadowCssValue = ({ color, offsetX, offsetY, blur }) => [offsetX === '0px' ? '0' : offsetX, offsetY === '0px' ? '0' : offsetY, blur === '0px' ? '0' : blur, shadowCssColor(color)].join(' ');
const shadowVariables = shadowEntries.map(([name, token]) => `  --ds-filter-drop-shadow-${name}: ${shadowCssValue(token.$value)};`).join('\n');

const accentDeclarations = (palette) => `	--ds-accent: var(--ds-emphasis-${palette});
	--ds-accent-hover: var(--ds-emphasis-hover-${palette});
	--ds-accent-surface: var(--ds-surface-${palette});
	--ds-accent-surface-hover: var(--ds-surface-hover-${palette});
	--ds-accent-surface-active: var(--ds-surface-active-${palette});
	--ds-accent-text: var(--ds-foreground-${palette});
	--ds-accent-text-muted: var(--ds-foreground-muted-${palette});
	--ds-accent-border: var(--ds-border-${palette});
	--ds-accent-border-hover: var(--ds-border-hover-${palette});
	--ds-accent-ring: var(--ds-border-active-${palette});`;
const accentPresets = ACCENT_PALETTES.map(
  (palette) => `[data-aesir-accent='${palette}'] {
${accentDeclarations(palette)}
}`
).join('\n\n');

const themeDeclarations = (values) =>
  Object.entries(values)
    .map(([name, value]) => `\t--ds-${name}: ${value};`)
    .join('\n');
const themePresets = Object.entries(themes)
  .map(([name, modes]) => {
    const blocks = [];
    const base = { ...modes.all, ...modes.light };
    if (Object.keys(base).length) {
      blocks.push(`[data-aesir-theme='${name}'] {
${themeDeclarations(base)}
}`);
    }
    if (modes.dark && Object.keys(modes.dark).length) {
      blocks.push(`.dark[data-aesir-theme='${name}'],
[data-aesir-theme='${name}'].dark,
.dark [data-aesir-theme='${name}'],
[data-aesir-theme='${name}'] .dark {
${themeDeclarations(modes.dark)}
}`);
    }
    return blocks.join('\n\n');
  })
  .join('\n\n');

const fontFaces = `@font-face {
	font-family: 'Inter';
	src: local('Inter'), local('Inter Regular'), url('./fonts/Inter.woff2') format('woff2');
	font-weight: 100 900;
	font-style: normal;
	font-display: swap;
}

@font-face {
	font-family: 'Geist Mono';
	src: local('Geist Mono'), local('GeistMono-Regular'), url('./fonts/Mono.woff2') format('woff2');
	font-weight: 400 500;
	font-style: normal;
	font-display: swap;
}`;
const boxSizingReset = `*,
*::before,
*::after {
	box-sizing: border-box;
}`;

const lightVariables = namespacePublicVariables(stripHeader(lightCss)).replace('  --ds-filter-backdrop-blur-2xl: 40px;', `  --ds-filter-backdrop-blur-2xl: 40px;\n${shadowVariables}`);
const globalCss = `${GENERATED_HEADER}\n\n${fontFaces}\n\n${boxSizingReset}\n\n${lightVariables}\n\n${namespacePublicVariables(stripHeader(darkCss))}\n\n${accentPresets}\n`;

const files = [
  { path: 'dist/aesir-global.css', content: globalCss },
  { path: 'dist/aesir-themes.css', content: `${GENERATED_HEADER}\n\n${themePresets}\n` },
  { path: 'dist/aesir-motion.css', content: motionCss },
  { path: 'dist/aesir-typography.css', content: semanticTypographyCss }
];

await Promise.all(
  files.map(async ({ path, content }) => {
    const absolutePath = resolve(path);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
  })
);

const fontSourceDirectory = resolve('src/fonts');
const thirdPartyNotices = resolve('../../THIRD_PARTY_NOTICES.md');
await Promise.all(
  [
    [resolve(fontSourceDirectory, 'Inter.woff2'), 'Inter.woff2'],
    [resolve(fontSourceDirectory, 'Mono.woff2'), 'Mono.woff2'],
    [thirdPartyNotices, 'THIRD_PARTY_NOTICES.md']
  ].map(([source, filename]) => mkdir(resolve('dist/fonts'), { recursive: true }).then(() => copyFile(source, resolve('dist/fonts', filename))))
);
