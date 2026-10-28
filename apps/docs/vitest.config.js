import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ['browser'] },
  ssr: { noExternal: ['@aesir/svelte', '@lucide/svelte'] },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'], restoreMocks: true }
});
