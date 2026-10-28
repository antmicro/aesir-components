# Aesir for Svelte

Typed Svelte 5 components distributed as source.

```sh
npm install @aesir/svelte @aesir/css @lucide/svelte
```

Import the shared styles once at the application root:

```js
import '@aesir/css/aesir-global.css';
import '@aesir/css/aesir-motion.css';
```

Then import from the package root or a component subpath:

```svelte
<script>
  import { AesirButton } from '@aesir/svelte';
</script>

<AesirButton variant="accent">Deploy</AesirButton>
```

## Git submodule

```sh
git submodule add -b distribution/svelte https://github.com/antmicro/aesir-components.git src/lib/aesir
git submodule update --init
npm install @lucide/svelte
```

Keep the submodule under `src/lib` so SvelteKit can serve bundled fonts without an additional Vite allow-list. Update it explicitly with `git submodule update --remote src/lib/aesir`.

Do not edit the generated `distribution/svelte` branch directly.
