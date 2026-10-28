# Aesir HTML

The complete Aesir Custom Elements bundle. Load it once to register all components.

## Installation

Add this distribution to your application's public assets directory:

```sh
git submodule add -b distribution/html https://github.com/antmicro/aesir-components.git public/vendor/aesir-html
git submodule update --init --recursive
```

## Usage

```html
<script type="module">
  import '/vendor/aesir-html/aesir-icons.min.js';
  import '/vendor/aesir-html/aesir-html.min.js';
</script>

<aesir-button variant="accent">Deploy</aesir-button>
```

The bundle includes component styles, design tokens, and fonts. The icon registry must load before components that use dynamic icon names; omit it if your page does not need those icons.

To apply Aesir typography to page content, optionally load:

```html
<link rel="stylesheet" href="/vendor/aesir-html/aesir-typography.css" />
```

Use one bundle mode per page. For individual component modules, see the [`distribution/html-modular` branch](https://github.com/antmicro/aesir-components/tree/distribution/html-modular).

## Updating

```sh
git submodule update --remote public/vendor/aesir-html
```

Commit the updated submodule reference in your application. Adjust the path if you installed the submodule elsewhere.
