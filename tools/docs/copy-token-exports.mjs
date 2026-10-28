import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const exportsDirectory = resolve(repositoryRoot, 'apps/docs/static/exports');
const integrations = ['figma', 'penpot'];

await mkdir(exportsDirectory, { recursive: true });
await Promise.all(
  integrations.map(async (integration) => {
    const destination = resolve(exportsDirectory, integration);
    await rm(destination, { recursive: true, force: true });
    await cp(resolve(repositoryRoot, 'integrations', integration, 'dist'), destination, { recursive: true });
  })
);

console.log('Copied Figma and Penpot token exports into the documentation assets.');
