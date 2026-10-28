import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { PenpotClient } from './client.mjs';
import { diffBundles, loadGeneratedBundle, normalizeBundle, stableJson } from './tokens.mjs';

const { values } = parseArgs({ options: { write: { type: 'boolean', default: false } } });
const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const baseUrl = required('PENPOT_BASE_URL');
const fileId = required('PENPOT_FILE_ID');
const accessToken = required('PENPOT_ACCESS_TOKEN');
const artifactDirectory = resolve(process.env.PENPOT_ARTIFACT_DIR ?? 'artifacts/penpot');
const client = new PenpotClient({ baseUrl, fileId, accessToken });

await mkdir(artifactDirectory, { recursive: true });
const targetRaw = await loadGeneratedBundle();
const target = normalizeBundle(targetRaw);
const file = await client.getFile();
if (!file?.permissions?.canEdit) throw new Error('The Penpot access token does not have edit permission for the target file');

const remoteRaw = file.data?.tokensLib ?? { $themes: [], $metadata: {} };
const remote = normalizeBundle(remoteRaw);
const diff = diffBundles(remote, target);

await Promise.all([
  writeFile(resolve(artifactDirectory, 'remote-before.json'), stableJson(remote)),
  writeFile(resolve(artifactDirectory, 'target.json'), stableJson(target)),
  writeFile(resolve(artifactDirectory, 'diff.json'), stableJson(diff))
]);

console.log(`Penpot token diff: +${diff.created.length} ~${diff.updated.length} -${diff.deleted.length}; configuration ${diff.configurationChanged ? 'changed' : 'unchanged'}`);
if (!diff.changed) {
  console.log('Penpot tokens are already synchronized.');
  process.exit(0);
}
if (!values.write) {
  console.log('Dry run complete. Pass --write to update Penpot.');
  process.exit(0);
}

await client.updateTokens(file, targetRaw);
const verifiedFile = await client.getFile();
const verified = normalizeBundle(verifiedFile.data?.tokensLib ?? {});
await writeFile(resolve(artifactDirectory, 'remote-after.json'), stableJson(verified));

const verificationDiff = diffBundles(verified, target);
await writeFile(resolve(artifactDirectory, 'verification-diff.json'), stableJson(verificationDiff));
if (stableJson(verified) !== stableJson(target)) throw new Error('Penpot accepted the update, but read-back verification did not match the generated token bundle');

console.log('Penpot tokens synchronized and verified.');
