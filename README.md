# Aesir design system

Aesir is a token-driven design system for Svelte 5 and plain HTML.

## Workspaces

```text
apps/docs/              documentation and examples
packages/tokens/        design-token sources and generators
packages/aesir-css/     generated CSS and webfonts
packages/aesir-svelte/  Svelte components
packages/aesir-html/    Custom Elements distribution
integrations/figma/     Figma Variables export
integrations/flutter/   Dart package with Flutter tokens and ThemeData
integrations/penpot/    Penpot token export
tools/                  repository tooling and distribution checks
```

Tokens are the source of truth. CSS, components, integrations, and docs consume their generated output.

## Development

Use Node.js 24 and npm 11.

```sh
nvm use
npm install
npm run dev
```

## Checks

```sh
npm run check
npm run build
```

Run `npm run tokens` after changing token sources. Use `npm run build:web` or `npm run build:design-tools` when only one part of the repository needs rebuilding.

## Distributions

Distribution branches are generated from committed source:

```sh
npm run distribution:svelte
npm run distribution:flutter
npm run build:html
npm run distribution:html
npm run distribution:html:modular
```

Package-specific usage lives in each package README. Third-party assets are listed in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
