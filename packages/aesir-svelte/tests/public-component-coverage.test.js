import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = dirname(testDirectory);
const sourceIndex = readFileSync(join(packageDirectory, 'src/index.js'), 'utf8');
const componentDirectories = [...sourceIndex.matchAll(/\.\/components\/(aesir-[a-z0-9-]+)\//g)].map((match) => match[1]);
const testSources = readdirSync(testDirectory)
  .filter((file) => file.endsWith('.test.js') && file !== basename(fileURLToPath(import.meta.url)))
  .map((file) => readFileSync(join(testDirectory, file), 'utf8'))
  .concat(
    readdirSync(join(testDirectory, 'fixtures'))
      .filter((file) => file.endsWith('.svelte'))
      .map((file) => readFileSync(join(testDirectory, 'fixtures', file), 'utf8'))
  )
  .join('\n');

const componentName = (directory) =>
  directory
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
describe('public component test coverage', () => {
  test.each(componentDirectories)('%s has a component-level behavior test', (directory) => {
    expect(testSources.includes(componentName(directory)) || testSources.includes(`/components/${directory}/`)).toBe(true);
  });
});
