<script>
  import * as ContextMenu from '@aesir/svelte/components/aesir-context-menu';
  import { copyToClipboard } from '$lib/components/docs/copy.js';

  let { palettes = ['gray', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'purple', 'pink'] } = $props();

  const colorShades = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
  const semanticByGrayShade = {
    '100': 'surface',
    '200': 'surface-hover',
    '300': 'border',
    '400': 'border-hover',
    '500': 'border-active',
    '600': 'emphasis',
    '700': 'emphasis-hover',
    '800': 'foreground-muted',
    '900': 'foreground',
    '950': 'foreground'
  };
  const semanticByColorShade = {
    '100': 'surface',
    '200': 'surface-hover',
    '300': 'border',
    '400': 'border-hover',
    '500': 'border-active',
    '600': 'emphasis',
    '700': 'emphasis-hover',
    '800': 'foreground-muted',
    '900': 'foreground'
  };

  const titleCase = (v) => v[0].toUpperCase() + v.slice(1);
  const semanticName = (palette, shade) => {
    if (palette === 'gray') return `--ds-${semanticByGrayShade[shade]}`;
    return `--ds-${semanticByColorShade[shade]}-${palette}`;
  };
  const primitiveName = (palette, shade) => `--ds-${palette}-${shade}`;
  const sortedShades = [...colorShades].sort((a, b) => Number(a) - Number(b));
  const shadesForPalette = (palette) => (palette === 'gray' ? sortedShades : sortedShades);
  const backgrounds = [
    { semantic: '--ds-background', primitive: '--ds-gray-0' },
    { semantic: '--ds-background-secondary', primitive: '--ds-gray-50' }
  ];
  const fixedColors = [
    { label: 'Black', primitive: '--ds-fixed-black' },
    { label: 'White', primitive: '--ds-fixed-white' }
  ];
  const cssValue = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const rgbToHex = (rgb) => {
    const parts = rgb
      .replace(/rgba?\(/, '')
      .replace(/\)/, '')
      .replace(/\//g, ' ')
      .replace(/,/g, ' ')
      .trim()
      .split(/\s+/)
      .map(Number)
      .slice(0, 3);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return '';
    return `#${parts
      .map((n) =>
        Math.max(0, Math.min(255, Math.round(n)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')}`;
  };

  const parseOklch = (value) => {
    const match = value.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*[\d.]+%?)?\s*\)/i);
    if (!match) return null;
    const lRaw = match[1];
    const c = Number(match[2]);
    const h = Number(match[3]);
    const l = lRaw.endsWith('%') ? Number(lRaw.slice(0, -1)) / 100 : Number(lRaw);
    if ([l, c, h].some((n) => Number.isNaN(n))) return null;
    return { l, c, h };
  };

  const linearToSrgb = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);

  const oklchToHex = ({ l, c, h }) => {
    const hr = (h * Math.PI) / 180;
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;

    const l3 = l_ ** 3;
    const m3 = m_ ** 3;
    const s3 = s_ ** 3;

    const rLin = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

    const r = Math.max(0, Math.min(1, linearToSrgb(rLin)));
    const g = Math.max(0, Math.min(1, linearToSrgb(gLin)));
    const bl = Math.max(0, Math.min(1, linearToSrgb(bLin)));

    return `#${[r, g, bl]
      .map((channel) =>
        Math.round(channel * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')}`;
  };

  const hexFromPrimitive = (primitive) => {
    const value = cssValue(primitive);
    const parsed = parseOklch(value);
    if (parsed) return oklchToHex(parsed);
    return rgbToHex(value);
  };
  const oklchValue = (primitive) => cssValue(primitive);
  const hexValue = (primitive) => hexFromPrimitive(primitive);
  const menuItems = (semantic, primitive) => [
    {
      icon: 'swatch-book',
      label: 'Copy OKLCH value',
      value: () => oklchValue(primitive),
      toast: 'OKLCH value copied'
    },
    {
      icon: 'copy',
      label: 'Copy HEX fallback',
      value: () => hexValue(primitive),
      toast: 'HEX value copied'
    },
    {
      icon: 'variable',
      label: 'Copy primitive name',
      value: () => primitive,
      toast: 'Primitive name copied'
    },
    ...(semantic
      ? [
          {
            icon: 'copy',
            label: 'Copy semantic name',
            value: () => semantic,
            toast: 'Semantic name copied'
          }
        ]
      : [])
  ];

  const copy = (value, label = 'Copied') =>
    copyToClipboard(value, {
      successLabel: label,
      emptyDescription: 'No value available for this token.'
    });
</script>

<div class="color-grid">
  <section class="color-row">
    <p class="color-row__label">Background</p>
    <div class="swatch-grid">
      {#each backgrounds as item (`${item.semantic}-${item.primitive}`)}
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <button type="button" aria-label={`Copy ${item.semantic}`} onclick={() => copy(item.semantic, 'Semantic name copied')} class="color-swatch">
              <span class="color-swatch__color" style={`--color-swatch-value: var(${item.primitive})`}></span>
            </button>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content class="color-context-menu">
              {#each menuItems(item.semantic, item.primitive) as menuItem (menuItem.label)}
                <ContextMenu.Item icon={menuItem.icon} onclick={() => copy(menuItem.value(), menuItem.toast)}>
                  {menuItem.label}
                </ContextMenu.Item>
              {/each}
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      {/each}
    </div>
  </section>

  <section class="color-row">
    <p class="color-row__label">Fixed</p>
    <div class="swatch-grid">
      {#each fixedColors as item (item.primitive)}
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <button type="button" aria-label={`Copy ${item.primitive}`} onclick={() => copy(item.primitive, 'Primitive name copied')} class="color-swatch">
              <span class="color-swatch__color" style={`--color-swatch-value: var(${item.primitive})`}></span>
            </button>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content class="color-context-menu">
              {#each menuItems(null, item.primitive) as menuItem (menuItem.label)}
                <ContextMenu.Item icon={menuItem.icon} onclick={() => copy(menuItem.value(), menuItem.toast)}>
                  {menuItem.label}
                </ContextMenu.Item>
              {/each}
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      {/each}
    </div>
  </section>

  <section class="color-row color-row--shade-labels" aria-hidden="true">
    <span></span>
    <div class="swatch-grid">
      {#each sortedShades as shade (shade)}
        <p class="shade-label">{shade}</p>
      {/each}
    </div>
  </section>

  {#each palettes as palette (palette)}
    <section id={palette} class="color-row">
      <p class="color-row__label">{titleCase(palette)}</p>
      <div class="swatch-grid">
        {#each shadesForPalette(palette) as shade (shade)}
          {@const semantic = semanticName(palette, shade)}
          {@const primitive = primitiveName(palette, shade)}
          <ContextMenu.Root>
            <ContextMenu.Trigger>
              <button type="button" aria-label={`Copy ${semantic}`} onclick={() => copy(semantic, 'Semantic name copied')} class="color-swatch">
                <span class="color-swatch__color" style={`--color-swatch-value: var(${primitive})`}></span>
              </button>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content class="color-context-menu">
                {#each menuItems(semantic, primitive) as item (item.label)}
                  <ContextMenu.Item icon={item.icon} onclick={() => copy(item.value(), item.toast)}>
                    {item.label}
                  </ContextMenu.Item>
                {/each}
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .color-grid {
    display: grid;
    gap: var(--ds-spacing-4);
  }

  .color-row {
    display: grid;
    grid-template-columns: var(--ds-spacing-20) minmax(0, 1fr);
    align-items: center;
    gap: var(--ds-spacing-3);
  }

  .color-row__label,
  .shade-label {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
    letter-spacing: var(--ds-font-letter-spacing-tight);
  }

  .swatch-grid {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: var(--ds-spacing-2);
  }

  .shade-label {
    text-align: center;
  }

  .color-swatch {
    display: block;
    width: 100%;
    min-height: var(--ds-spacing-10);
    overflow: hidden;
    padding: 0;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: transparent;
    text-align: left;
    cursor: copy;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  .color-swatch__color {
    display: block;
    width: 100%;
    height: var(--ds-spacing-10);
    background: var(--color-swatch-value);
  }

  .color-swatch:hover {
    border-color: var(--ds-border-hover);
  }

  .color-swatch:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
  }

  :global(.color-context-menu) {
    width: var(--ds-spacing-56);
  }

  @media (max-width: 40rem) {
    .color-row {
      grid-template-columns: 1fr;
    }

    .color-row--shade-labels {
      display: none;
    }

    .swatch-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .color-swatch {
      transition-duration: var(--ds-motion-duration-instant);
    }
  }
</style>
