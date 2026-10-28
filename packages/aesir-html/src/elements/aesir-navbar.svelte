<svelte:options
  customElement={{
    tag: 'aesir-navbar',
    props: {
      mobileOpen: { type: 'Boolean', reflect: true },
      search: { type: 'Boolean' },
      menuOpenDelay: { type: 'Number', attribute: 'menu-open-delay' },
      menuCloseDelay: { type: 'Number', attribute: 'menu-close-delay' }
    }
  }}
/>

<script>
  import { AesirNavbar } from '@aesir/svelte/components/aesir-navbar';
  import { parseJson } from '../parse.js';
  let {
    brand = {},
    items = [],
    avatar,
    layout = 'contained',
    variant = 'default',
    align = 'start',
    menuTrigger = 'click',
    menuOpenDelay = 90,
    menuCloseDelay = 160,
    brandPosition = 'start',
    search = false,
    searchLabel = 'Search…',
    searchHint,
    mobileOpen = $bindable(false),
    label = 'Main navigation'
  } = $props();
  const host = $host();
  const parsedBrand = $derived(parseJson(brand, {}));
  const parsedItems = $derived(parseJson(items));
  const parsedAvatar = $derived(parseJson(avatar, null));
</script>

<AesirNavbar
  brand={parsedBrand}
  items={parsedItems}
  avatar={parsedAvatar}
  {layout}
  {variant}
  {align}
  {menuTrigger}
  {menuOpenDelay}
  {menuCloseDelay}
  {brandPosition}
  {searchLabel}
  {searchHint}
  onsearch={search ? () => host.dispatchEvent(new CustomEvent('search', { bubbles: true, composed: true })) : undefined}
  bind:mobileOpen
  {label}
  onselect={(item) => host.dispatchEvent(new CustomEvent('select', { detail: item, bubbles: true, composed: true }))}
  onavatarclick={() => host.dispatchEvent(new CustomEvent('avatarclick', { bubbles: true, composed: true }))}
/>
