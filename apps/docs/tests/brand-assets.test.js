import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { brandDownloadHref } from '../src/lib/components/docs/brand-downloads.js';

const brandAssetsDirectory = resolve('static/assets/brand');

describe('brand asset downloads', () => {
  test('uses links relative to the brand page so nested deployments keep their prefix', () => {
    expect(brandDownloadHref('antmicro-logotype.zip')).toBe('../assets/brand/antmicro-logotype.zip');
    expect(new URL(brandDownloadHref('antmicro-logotype.zip'), 'https://example.test/repository/docs/docs/brand.html').pathname).toBe('/repository/docs/assets/brand/antmicro-logotype.zip');
  });

  test.each(readdirSync(brandAssetsDirectory).filter((filename) => filename.endsWith('.zip')))('%s has a ZIP file signature', (filename) => {
    const archive = readFileSync(resolve(brandAssetsDirectory, filename));
    expect(archive.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  });
});
