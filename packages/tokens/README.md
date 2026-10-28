# Token sources

The source of truth for Aesir design tokens. Source files use the DTCG shape (`$value`, `$type`) and do not contain framework-specific names or generated CSS.

## Layers

- `src/shared/` - foundations shared by every theme: spacing, sizing, radius, typography, opacity, and breakpoints.
- `src/light/` - the light color palette.
- `src/dark/` - the dark color palette.
- `src/semantic/` - one shared map of usage-level names to palette slots.

Components use semantic variables such as `--ds-surface` and `--ds-foreground`, not palette values.

## Commands

- `npm run tokens:web` generates CSS variables for the component runtime and distributable token files.
- `npm run tokens:design-tools` generates Figma and Penpot import artifacts.
- `npm run tokens` runs both pipelines.

Generator code lives in `scripts/`. `@aesir/css`, Figma, and Penpot consume the generated artifacts. Entrypoints under `@aesir/tokens/internal/*` are monorepo build contracts, not application APIs.
