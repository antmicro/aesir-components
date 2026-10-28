<script>
  import { AesirButton, AesirCodeWindow, AesirDropdown, AesirIcon, AesirTabs } from '@aesir/svelte';
  import { toast } from '@aesir/svelte/components/aesir-toast';
  import highlighted from './code-window-highlight.js?highlight';

  const variants = {
    javascript: { label: 'JavaScript', filename: 'greeting.js', code: 'export function greet(name) {\n  return `Hello, ${name}!`;\n}' },
    typescript: { label: 'TypeScript', filename: 'greeting.ts', code: 'export function greet(name: string): string {\n  return `Hello, ${name}!`;\n}' }
  };
  const languageItems = Object.entries(variants).map(([value, variant]) => ({ value, label: variant.label }));
  const changedCode = 'export function greet(name) {\n  return `Hi, ${name}`;\n  return `Hello, ${name}!`;\n}';
  const bareCode = 'const answer = 42;\nconsole.log(answer);';
  const longCode = [
    'const endpoint = "https://example.com/api/v1/projects/alpha/releases/2026-09-21/artifacts/code-window-preview?include=metadata,checksums,dependencies";',
    ...Array.from({ length: 36 }, (_, index) => `const item${index + 1} = ${index + 1};`)
  ].join('\n');
  let dropdownLanguage = $state('javascript');
  let tabLanguage = $state('javascript');
  const notifyCopied = () => toast.success('Code copied');
  const notifyCopyError = () => toast.error('Copy failed', 'Clipboard is not available in this context.');
</script>

<div class="code-window-examples">
  <AesirCodeWindow label="Highlighted greeting function" filename="greeting.js" code={highlighted.code} highlightedLinesNumbers={[2]} oncopied={notifyCopied} oncopyerror={notifyCopyError}>
    {#snippet fileIcon()}<AesirIcon name="file" size={16} />{/snippet}
    {#snippet renderLine(line, number)}
      <!-- eslint-disable svelte/no-at-html-tags -->
      <span class="highlight-light">{@html highlighted.lightLines[number - 1] ?? line}</span>
      <!-- eslint-disable svelte/no-at-html-tags -->
      <span class="highlight-dark">{@html highlighted.darkLines[number - 1] ?? line}</span>
    {/snippet}
  </AesirCodeWindow>

  <AesirCodeWindow label="Updated greeting function" filename="greeting.js" code={changedCode} removedLinesNumbers={[2]} addedLinesNumbers={[3]} oncopied={notifyCopied} oncopyerror={notifyCopyError}>
    {#snippet fileIcon()}<AesirIcon name="file" size={16} />{/snippet}
  </AesirCodeWindow>

  <AesirCodeWindow label="Code without a filename" code={bareCode} oncopied={notifyCopied} oncopyerror={notifyCopyError} />

  <AesirCodeWindow label="Language switcher" filename={variants[dropdownLanguage].filename} code={variants[dropdownLanguage].code} oncopied={notifyCopied} oncopyerror={notifyCopyError}>
    {#snippet fileIcon()}<AesirIcon name="file" size={16} />{/snippet}
    {#snippet controls()}
      <AesirDropdown items={languageItems} label="Choose code language" onselect={(item) => (dropdownLanguage = item.value)}>
        {#snippet trigger(props)}
          <AesirButton variant="ghost" size="sm" {...props}>{variants[dropdownLanguage].label} <AesirIcon name="chevron-down" size={16} /></AesirButton>
        {/snippet}
      </AesirDropdown>
    {/snippet}
  </AesirCodeWindow>

  <div class="tabbed-code">
    <AesirTabs bind:value={tabLanguage} items={languageItems} label="Code language" />
    <AesirCodeWindow label="Tabbed language switcher" filename={variants[tabLanguage].filename} code={variants[tabLanguage].code} oncopied={notifyCopied} oncopyerror={notifyCopyError}>
      {#snippet fileIcon()}<AesirIcon name="file" size={16} />{/snippet}
    </AesirCodeWindow>
  </div>

  <AesirCodeWindow
    label="Code with horizontal and vertical scrolling"
    filename="many-lines.js"
    code={longCode}
    highlightedLinesNumbers={[1, 12, 29]}
    style="--aesir-code-window-max-height: 16rem"
    oncopied={notifyCopied}
    oncopyerror={notifyCopyError}
  />
</div>

<style>
  .code-window-examples {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-5);
  }
  .tabbed-code {
    display: grid;
    gap: var(--ds-spacing-3);
  }
  .highlight-dark {
    display: none;
  }
  :global(html.dark) .highlight-light {
    display: none;
  }
  :global(html.dark) .highlight-dark {
    display: inline;
  }
</style>
