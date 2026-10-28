import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  ssr: {
    noExternal: ['@lucide/svelte']
  },
  test: {
    environment: 'node',
    include: ['tests/ssr-render.test.js']
  }
});
