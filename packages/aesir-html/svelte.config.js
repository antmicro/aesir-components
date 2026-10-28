/** @type {import('svelte/compiler').CompileOptions} */
const compilerOptions = {
  customElement: true
};

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
const config = {
  compilerOptions
};

export default config;
