import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const listDistributionFiles = () =>
  execFileSync(process.execPath, ['tools/distribution/svelte-package.mjs', 'list'], {
    cwd: new URL('../..', import.meta.url),
    encoding: 'utf8'
  })
    .split('\n')
    .filter((line) => line && !line.startsWith('Checked '));

test('Svelte source distribution excludes generated and installed files', () => {
  const files = listDistributionFiles();

  assert.ok(files.includes('package.json'));
  assert.ok(files.includes('src/index.js'));
  assert.ok(files.includes('src/styles/aesir-global.css'));
  assert.doesNotMatch(files.join('\n'), /^(?:\.svelte-kit|dist|node_modules)\//m);
});
