import { fileURLToPath } from 'node:url';

export const tokenSource = (pattern) => fileURLToPath(new URL(`../src/${pattern}`, import.meta.url));
export const tokenBuildArtifact = (path) => fileURLToPath(new URL(`../build/${path}`, import.meta.url));
