# Aesir HTML

Custom Elements built from the Svelte components. Install the npm package or pin a generated Git distribution as a submodule. Choose one bundle mode per page.

## npm package

```sh
npm install @aesir/html
```

### Complete bundle

```js
import '@aesir/html/icons';
import '@aesir/html';
import '@aesir/html/typography.css'; // Optional
```

```html
<aesir-button variant="accent">Deploy</aesir-button>
```

The typography stylesheet is optional. Load the icon registry before components that resolve dynamic icon names.

### Modular bundle

```js
import '@aesir/html/core.css';
import '@aesir/html/fonts.css'; // Optional
import '@aesir/html/components/aesir-button';
```

```html
<aesir-button>Deploy</aesir-button>
```

`aesir-fonts.css` is optional. Each component entry imports the shared runtime automatically.

## Git submodule

If the application uses Git submodules instead of npm, pin one of the generated distribution branches. Put the submodule in the application's public assets directory, for example `public/vendor/aesir-html` in Vite.

For the complete bundle:

```sh
git submodule add -b distribution/html https://github.com/antmicro/aesir-components.git public/vendor/aesir-html
git submodule update --init
```

```html
<link rel="stylesheet" href="/vendor/aesir-html/aesir-typography.css" />

<script type="module" src="/vendor/aesir-html/aesir-icons.min.js"></script>
<script type="module" src="/vendor/aesir-html/aesir-html.min.js"></script>

<aesir-button variant="accent">Deploy</aesir-button>
```

For individual components, use `distribution/html-modular` instead and load the shared stylesheet once:

```sh
git submodule add -b distribution/html-modular https://github.com/antmicro/aesir-components.git public/vendor/aesir-html
git submodule update --init
```

```html
<link rel="stylesheet" href="/vendor/aesir-html/aesir-core.css" />

<link rel="stylesheet" href="/vendor/aesir-html/aesir-fonts.css" />

<script type="module" src="/vendor/aesir-html/components/aesir-button.min.js"></script>

<aesir-button>Deploy</aesir-button>
```

Keep the `components/runtime` directory alongside the modular component files; they import it automatically. After cloning the application, run `git submodule update --init --recursive`. To advance a pinned distribution, run `git submodule update --remote public/vendor/aesir-html` and commit the changed submodule reference. Adjust the path in these commands if your framework uses a different public assets directory.

The typography stylesheet in the complete bundle and the fonts stylesheet in the modular bundle are optional.

Arrays and objects may be assigned as JavaScript properties or passed as JSON attributes:

```html
<aesir-native-select label="Region" options='[{"value":"eu","label":"Europe"}]'></aesir-native-select>
```

Dropdown and command-menu selections emit a bubbling `select` event with the selected value in `event.detail`. Interactive overlays expose a reflected `open` property. Toast helpers are available through `window.Aesir.toast` after `<aesir-toaster>` is registered.
