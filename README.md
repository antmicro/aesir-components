# Aesir HTML Modular

Individual Aesir Custom Element modules. Load the shared stylesheet once and import only the components your page uses.

## Installation

Add this distribution to your application's public assets directory:

```sh
git submodule add -b distribution/html-modular https://github.com/antmicro/aesir-components.git public/vendor/aesir-html
git submodule update --init --recursive
```

## Usage

```html
<link rel="stylesheet" href="/vendor/aesir-html/aesir-core.css" />

<script type="module">
  import '/vendor/aesir-html/components/aesir-button.min.js';
</script>

<aesir-button variant="accent">Deploy</aesir-button>
```

Keep the entire `components/runtime/` directory alongside the component files. Components import the shared runtime automatically; you do not need a separate script tag for it.

### Optional fonts and typography

```html
<link rel="stylesheet" href="/vendor/aesir-html/aesir-fonts.css" /> <link rel="stylesheet" href="/vendor/aesir-html/aesir-typography.css" />
```

Keep the `fonts/` directory alongside these stylesheets when using the bundled fonts.

### Icons

For components that use dynamic icon names, import the icon registry before the component:

```html
<script type="module">
  import '/vendor/aesir-html/aesir-icons.min.js';
  import '/vendor/aesir-html/components/aesir-icon.min.js';
  import '/vendor/aesir-html/components/aesir-button.min.js';
</script>

<aesir-button><aesir-icon name="check"></aesir-icon> Deploy</aesir-button>
```

Use one bundle mode per page. For the complete bundle, see the [`distribution/html` branch](https://github.com/antmicro/aesir-components/tree/distribution/html).

## Updating

```sh
git submodule update --remote public/vendor/aesir-html
```

Commit the updated submodule reference in your application. Adjust the path if you installed the submodule elsewhere.
