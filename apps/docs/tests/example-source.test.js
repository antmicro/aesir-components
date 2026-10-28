import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { htmlExampleWithStyles, trimExampleSource } from '../../../tools/docs/example-source.mjs';

describe('documentation example sources', () => {
  const componentPages = [
    'src/routes/docs/button/+page.svx',
    'src/routes/docs/icons/+page.svx',
    ...readdirSync('src/routes/docs/components', { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join('src/routes/docs/components', entry.name, '+page.svx'))
      .filter(existsSync)
  ];

  test.each(componentPages)('%s gives every Svelte code block an HTML counterpart', (page) => {
    const source = readFileSync(page, 'utf8');
    const examples = [...source.matchAll(/examples\/([^'"?]+)\.svelte\?example/g)].map((match) => match[1]);
    const svelteOnly = /^platforms:\s*svelte\s*$/m.test(source);

    for (const example of examples) {
      if (svelteOnly) {
        expect(source, `${page} must not advertise an unavailable HTML example`).not.toContain(`examples/${example}.html?example`);
        continue;
      }
      expect(existsSync(`src/lib/components/docs/examples/${example}.html`), `${example}.html is missing`).toBe(true);
      expect(source, `${page} does not import the HTML source for ${example}`).toContain(`examples/${example}.html?example`);
    }
  });

  test('removes display-only leading and trailing whitespace', () => {
    expect(trimExampleSource('\n<button>Save</button>\n')).toBe('<button>Save</button>');
  });

  test('adds the matching Svelte example CSS to HTML examples', () => {
    const html = '<div class="example"></div>';
    const svelte = '<div class="example"></div><style>.example :global(svg) { color: red; }</style>';

    expect(htmlExampleWithStyles(html, svelte)).toContain('<style>\n.example svg { color: red; }\n</style>');
  });

  test('keeps explicit HTML-specific styles instead of duplicating Svelte styles', () => {
    const html = '<div></div>\n<style>div { display: grid; }</style>';
    expect(htmlExampleWithStyles(html, '<style>div { display: flex; }</style>')).toBe(html);
  });

  test('the Snippet HTML example mirrors all three preview variants', () => {
    const source = readFileSync('src/lib/components/docs/examples/snippet-example.html', 'utf8');
    expect(source.match(/<aesir-snippet\b/g)).toHaveLength(3);
    expect(source).toContain('<aesir-tabs');
    expect(source).toContain('pnpm add @aesir/svelte');
  });
});
