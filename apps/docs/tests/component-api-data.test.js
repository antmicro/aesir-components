import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { componentApiByRoute, componentApiForPlatform } from '../src/lib/docs/component-api-data.js';

describe('component API platform views', () => {
  test.each(['svelte', 'html'])('documents all table densities and compatibility aliases for %s', (platform) => {
    const density = componentApiForPlatform('/docs/components/table/', platform)
      .flatMap((group) => group.rows)
      .find((entry) => entry.name === 'density');
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl', 'default', 'compact']) expect(density.type).toContain(`'${size}'`);
    expect(density.description).toContain('default = lg; compact = sm');
  });

  test.each(Object.keys(componentApiByRoute))('%s has API data for its declared platforms', (route) => {
    expect(componentApiForPlatform(route, 'svelte').length).toBeGreaterThan(0);
    const page = readFileSync(`src/routes${route}+page.svx`, 'utf8');
    const svelteOnly = /^platforms:\s*svelte\s*$/m.test(page);
    expect(componentApiForPlatform(route, 'html').length > 0).toBe(!svelteOnly);
  });

  test('covers every public component documentation page', () => {
    const slugs = readdirSync('src/routes/docs/components', { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    expect(slugs.filter((slug) => !componentApiByRoute[`/docs/components/${slug}/`])).toEqual([]);
  });

  test('documents the Svelte-only components and their distinguishing contracts', () => {
    const names = (route) =>
      componentApiForPlatform(route, 'svelte')
        .flatMap((group) => group.rows)
        .map((entry) => (typeof entry.name === 'string' ? entry.name : entry.name.value));

    expect(names('/docs/components/alert-dialog/')).toContain('onconfirm');
    expect(names('/docs/components/hover-card/')).toContain('content');
    expect(names('/docs/components/select/')).toEqual(expect.arrayContaining(['options', 'multiple', 'selectedContent']));
    expect(componentApiForPlatform('/docs/components/segmented-fields/', 'svelte').map((group) => group.title)).toEqual([
      'AesirSegmentedField',
      'AesirDateField / AesirTimeField',
      'AesirDateRangeField / AesirTimeRangeField'
    ]);
  });

  test('does not leak Svelte-only terminology into Custom Elements descriptions', () => {
    const descriptions = Object.keys(componentApiByRoute).flatMap((route) => componentApiForPlatform(route, 'html').flatMap((group) => [group.note, ...group.rows.map((entry) => entry.description)]));

    expect(descriptions.filter(Boolean).filter((description) => /\bSvelte\b/i.test(description))).toEqual([]);
  });

  test('maps Svelte prop names, snippets, callbacks, and bindings to Custom Elements terminology', () => {
    const htmlRows = componentApiForPlatform('/docs/components/accordion/', 'html').flatMap((group) => group.rows);
    expect(htmlRows.find((entry) => entry.name === 'heading-level')).toBeTruthy();
    expect(htmlRows.find((entry) => entry.name === 'item-content slot')?.type).toBe('slot');
    expect(htmlRows.find((entry) => entry.name === 'value')?.name).toBe('value');
    expect(htmlRows.find((entry) => entry.name === 'value-change')?.type).toBe('CustomEvent');
  });

  test('uses the explicit Custom Elements contract when its API differs from Svelte', () => {
    const rows = componentApiForPlatform('/docs/components/dropdown/', 'html').flatMap((group) => group.rows);
    expect(rows.find((entry) => entry.name === 'mobile-layout')?.default).toBe("'compact'");
    expect(rows.find((entry) => entry.name === 'mobile-breakpoint')?.default).toBe('640');
    expect(rows.find((entry) => entry.name === 'width')).toBeTruthy();
    expect(rows.find((entry) => entry.name === 'trigger slot')).toBeUndefined();
  });

  test('does not expose Svelte-only table callbacks and snippets as HTML attributes', () => {
    const names = componentApiForPlatform('/docs/components/table/', 'html')
      .flatMap((group) => group.rows)
      .map((entry) => (typeof entry.name === 'string' ? entry.name : entry.name.value));

    expect(names).not.toContain('get-row-key');
    expect(names).not.toContain('cell slot');
    expect(names).not.toContain('row-actions slot');
    expect(names).toContain('sortchange');
  });

  test('documents the distinct Svelte and Custom Elements icon contracts', () => {
    const svelteGroups = componentApiForPlatform('/docs/icons/', 'svelte');
    const htmlGroups = componentApiForPlatform('/docs/icons/', 'html');
    const names = (groups) => groups.flatMap((group) => group.rows).map((entry) => (typeof entry.name === 'string' ? entry.name : entry.name.value));

    expect(svelteGroups.map((group) => group.title)).toEqual(['AesirIcon', 'AesirIconSwap']);
    expect(htmlGroups.map((group) => group.title)).toEqual(['aesir-icon', 'aesir-icon-swap']);
    expect(names(svelteGroups)).toContain('icon');
    expect(names(svelteGroups)).toContain('children');
    expect(names(htmlGroups)).not.toContain('icon');
    expect(names(htmlGroups)).toContain('stroke-width');
  });
});
