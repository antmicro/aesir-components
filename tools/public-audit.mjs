import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((path) => path && existsSync(path));
const forbiddenContent = [
  { label: 'GitHub token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/ },
  { label: 'npm token', pattern: /\bnpm_[A-Za-z0-9]{20,}\b/ }
];
const forbiddenPaths = [/(^|\/)\.env(?:\.|$)/, /\.(?:pem|key|p12|pfx)$/i];
const requiredDistributionFiles = ['LICENSE', 'THIRD_PARTY_NOTICES.md'];
const findings = [];

for (const path of requiredDistributionFiles) {
  if (!trackedFiles.includes(path)) findings.push(`${path}: required public distribution notice is missing`);
}

for (const path of trackedFiles) {
  for (const pattern of forbiddenPaths) {
    if (pattern.test(path)) findings.push(`${path}: forbidden credential-bearing path`);
  }

  const contents = readFileSync(path);
  if (contents.includes(0)) continue;
  const text = contents.toString('utf8');
  for (const { label, pattern } of forbiddenContent) {
    if (pattern.test(text)) findings.push(`${path}: ${label}`);
  }
}

if (findings.length > 0) {
  console.error('Public repository audit failed:\n');
  console.error(findings.map((finding) => `- ${finding}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Public repository audit passed (${trackedFiles.length} tracked files checked).`);
}
