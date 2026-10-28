import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const examplesRoot = resolve('src/lib/components/docs/examples');
const features = [
  ['team-chat', 'team-chat-pattern-example.svelte'],
  ['requirements-explorer', 'requirements-explorer-pattern-example.svelte'],
  ['ai-workspace', 'sidebar-llm-example.svelte'],
  ['checkout', 'checkout-example.svelte'],
  ['data-table', 'data-table-pattern-example.svelte'],
  ['collaborative-editor', 'collaborative-editor-example.svelte']
];

describe('large example directories', () => {
  test.each(features)('%s keeps its entry point and local dependencies together', (directory, entryPoint) => {
    const root = join(examplesRoot, directory);
    expect(existsSync(join(root, entryPoint))).toBe(true);

    for (const filename of readdirSync(root)) {
      expect(existsSync(join(examplesRoot, filename)), `${filename} must not be duplicated among component demos`).toBe(false);
      if (!/\.(svelte|js)$/.test(filename)) continue;

      const source = readFileSync(join(root, filename), 'utf8');
      const imports = [...source.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)].map((match) => match[1].split('?')[0]);
      for (const dependency of imports) {
        expect(existsSync(resolve(root, dependency)), `${directory}/${filename} imports missing ${dependency}`).toBe(true);
      }
    }
  });
});
