<script>
  import { AesirSnippet, AesirTabs } from '@aesir/svelte';
  const buttonCode = '<AesirButton variant="accent">Save</AesirButton>';
  const packageCommands = { npm: 'npm install @aesir/svelte', pnpm: 'pnpm add @aesir/svelte' };
  let packageManager = $state('npm');
</script>

<div class="examples">
  <AesirSnippet text="npm install @aesir/svelte" prompt label="Copy install command" />
  <AesirSnippet text={buttonCode} label="Copy Svelte snippet" />
  <div class="package-example">
    <AesirTabs
      size="sm"
      bind:value={packageManager}
      items={[
        { value: 'npm', label: 'npm' },
        { value: 'pnpm', label: 'pnpm' }
      ]}
      label="Package manager"
    />
    <AesirSnippet text={packageCommands[packageManager]} prompt label="Copy install command" />
  </div>
</div>

<style>
  .examples {
    display: grid;
    width: min(100%, var(--ds-sizing-md));
    gap: var(--ds-spacing-3);
  }
  .package-example {
    display: grid;
    gap: var(--ds-spacing-2);
  }
</style>
