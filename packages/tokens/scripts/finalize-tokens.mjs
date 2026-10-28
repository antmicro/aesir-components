import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [compositeSource, generatedSource] = await Promise.all([readFile(resolve('src/composites/styles.json'), 'utf8'), readFile(resolve('generated/tokens.json'), 'utf8')]);

const compositeTokens = JSON.parse(compositeSource);
const generatedTokens = JSON.parse(generatedSource);

const shadowCssColor = (color) => {
  const match = color.match(/^#000000([a-f\d]{2})$/i);
  if (!match) return color;
  const alpha = Number.parseInt(match[1], 16) / 255;
  if (alpha === 0) return 'transparent';
  return `oklch(0 0 0 / ${Number(alpha.toFixed(2))})`;
};

const shadowCssValue = ({ color, offsetX, offsetY, blur }) => [offsetX === '0px' ? '0' : offsetX, offsetY === '0px' ? '0' : offsetY, blur === '0px' ? '0' : blur, shadowCssColor(color)].join(' ');

generatedTokens.filter ??= {};
generatedTokens.filter['drop-shadow'] = Object.fromEntries(Object.entries(compositeTokens.shadow).map(([name, token]) => [name, shadowCssValue(token.$value)]));

await writeFile(resolve('generated/tokens.json'), `${JSON.stringify(generatedTokens, null, 2)}\n`);
