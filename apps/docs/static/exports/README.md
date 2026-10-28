# Generated exports

Files in this directory are generated from `packages/tokens/src/` and intended for external graphical tools.

The canonical build outputs live in `integrations/figma/dist/` and
`integrations/penpot/dist/`. Documentation builds copy them here so the files
can be downloaded from the static site. The copied directories are not tracked.

- `figma/` - DTCG collections for Figma and Tokens Studio workflows.
- `penpot/` - global and dark token sets with Penpot theme metadata.

Do not edit these files by hand. Run `npm run tokens:design-tools` to regenerate them.
