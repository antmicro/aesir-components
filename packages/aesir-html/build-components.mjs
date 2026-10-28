import { readdir } from 'node:fs/promises';
import { build } from 'vite';
import { elementRoot } from './vite.shared.js';
import { createComponentConfig, createRuntimeConfig } from './vite.components.config.js';

const tags = (await readdir(elementRoot))
  .filter((file) => file.endsWith('.svelte'))
  .map((file) => file.slice(0, -'.svelte'.length))
  .sort();

const requiredRuntimeExports = new Set();
for (const tag of tags) await build(createComponentConfig(tag, requiredRuntimeExports));
await build(createRuntimeConfig(requiredRuntimeExports));

console.log(`Built ${tags.length} modular Aesir HTML component modules.`);
