import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const listDistributionFiles = () =>
  execFileSync(process.execPath, ['tools/distribution/flutter-package.mjs', 'list'], {
    cwd: new URL('../..', import.meta.url),
    encoding: 'utf8'
  })
    .split('\n')
    .filter(Boolean);

test('Flutter distribution is a self-contained Dart package', () => {
  const files = listDistributionFiles();

  assert.ok(files.includes('pubspec.yaml'));
  assert.ok(files.includes('lib/aesir.dart'));
  assert.ok(files.includes('LICENSE'));
  assert.doesNotMatch(files.join('\n'), /node_modules|\.mjs$|\.dart_tool|pubspec\.lock/m);
});
