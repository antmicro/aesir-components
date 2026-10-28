<script>
  import { AesirButton, AesirComponentPreview, AesirIcon, AesirToggleGroup, AesirToggleGroupItem, AesirTooltip } from '@aesir/svelte';
  import CodeExample from './code-example.svelte';
  import { getDocsPlatform } from '$lib/docs/platform-context.svelte.js';
  import { resolveInternalHref } from '$lib/utils.js';

  let {
    title = 'Example',
    source,
    htmlSource,
    mode = $bindable('preview'),
    language = $bindable('svelte'),
    viewport = $bindable('desktop'),
    contentless = false,
    contentClass = '',
    contentStyle,
    previewLabel = 'Preview',
    codeLabel = 'Code',
    svelteLabel = 'Svelte',
    htmlLabel = 'HTML',
    viewportLabel = 'Preview size',
    openHref,
    height,
    toolbar,
    children,
    class: className = '',
    ...restProps
  } = $props();
  const platform = getDocsPlatform();

  const style = $derived(height ? `--docs-example-height:${typeof height === 'number' ? `${height}px` : height}` : undefined);
  const resolvedHtmlSource = $derived(htmlSource ?? source?.htmlSource);
  const activeLanguage = $derived(resolvedHtmlSource ? platform.value : language);
  const activeSource = $derived(activeLanguage === 'html' && resolvedHtmlSource ? resolvedHtmlSource : source);

  const setViewport = (value) => {
    viewport = value;
    mode = 'preview';
  };
  const setLanguage = (value) => {
    language = value;
    platform.value = value;
  };
</script>

<section class={`docs-example ${className}`.trim()} data-mode={mode} data-viewport={viewport} data-docs-toc-ignore {style} aria-label={title} {...restProps}>
  <header class="docs-example__header">
    <span class="docs-example__title">{title}</span>
    <div class="docs-example__views">
      {#if source || htmlSource}
        <div class="docs-example__view-switcher" role="group" aria-label="Example view">
          <AesirTooltip content={previewLabel}>
            {#snippet trigger(props)}
              <AesirButton {...props} variant={mode === 'preview' ? 'secondary' : 'ghost'} size="sm" aria-label={previewLabel} aria-pressed={mode === 'preview'} onclick={() => (mode = 'preview')}>
                <AesirIcon name="eye" size={16} />
                <span>{previewLabel}</span>
              </AesirButton>
            {/snippet}
          </AesirTooltip>
          <AesirTooltip content={codeLabel}>
            {#snippet trigger(props)}
              <AesirButton {...props} variant={mode === 'code' ? 'secondary' : 'ghost'} size="sm" aria-label={codeLabel} aria-pressed={mode === 'code'} onclick={() => (mode = 'code')}>
                <AesirIcon name="terminal" size={16} />
                <span>{codeLabel}</span>
              </AesirButton>
            {/snippet}
          </AesirTooltip>
        </div>
      {:else}
        <span class="docs-example__visible-title">{title}</span>
      {/if}
    </div>
    <div class="docs-example__controls">
      {@render toolbar?.({ mode, viewport })}
      <AesirToggleGroup type="single" required value={viewport} onvaluechange={setViewport} size="sm" spacing={0} label={viewportLabel}>
        <AesirToggleGroupItem value="desktop" aria-label="Desktop preview"><AesirIcon name="monitor" size={16} /></AesirToggleGroupItem>
        <AesirToggleGroupItem value="mobile" aria-label="Mobile preview"><AesirIcon name="smartphone" size={16} /></AesirToggleGroupItem>
      </AesirToggleGroup>
      {#if openHref}
        <AesirTooltip content="Open full-size example">
          {#snippet trigger(props)}
            <AesirButton {...props} variant="ghost" size="icon-sm" href={resolveInternalHref(openHref)} target="_blank" rel="noreferrer" aria-label="Open full-size example">
              <AesirIcon name="arrow-up-right" size={16} />
            </AesirButton>
          {/snippet}
        </AesirTooltip>
      {/if}
    </div>
  </header>

  <AesirComponentPreview class="docs-example__body" embedded {contentless} contentClass={`docs-example__content ${contentClass}`.trim()} {contentStyle} hidden={mode !== 'preview'}>
    {@render children?.()}
  </AesirComponentPreview>

  {#if activeSource && mode === 'code'}
    <CodeExample source={activeSource} label={`${title} ${activeLanguage} code`} embedded />
    {#if source && resolvedHtmlSource}
      <footer class="docs-example__code-footer">
        <AesirToggleGroup type="single" required value={activeLanguage} onvaluechange={setLanguage} size="sm" spacing={0} label="Component platform">
          <AesirToggleGroupItem value="svelte">{svelteLabel}</AesirToggleGroupItem>
          <AesirToggleGroupItem value="html">{htmlLabel}</AesirToggleGroupItem>
        </AesirToggleGroup>
      </footer>
    {/if}
  {/if}
</section>

<style>
  .docs-example {
    min-width: 0;
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-xl);
    background: var(--ds-background-secondary);
  }

  .docs-example__header,
  .docs-example__views,
  .docs-example__controls {
    display: flex;
    align-items: center;
  }

  .docs-example__view-switcher {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-0-5);
  }

  .docs-example__code-footer {
    display: flex;
    min-height: var(--ds-spacing-12);
    align-items: center;
    justify-content: flex-start;
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background);
  }

  .docs-example__header {
    min-height: var(--ds-spacing-12);
    justify-content: space-between;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-2) var(--ds-spacing-3) var(--ds-spacing-2) var(--ds-spacing-4);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background);
  }

  .docs-example__title {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .docs-example__visible-title {
    min-width: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .docs-example__controls {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--ds-spacing-1);
  }

  :global(.docs-example__body) {
    width: var(--docs-example-viewport-width, 100%);
    max-width: 100%;
    height: var(--docs-example-height, auto);
    margin-inline: auto;
    box-shadow:
      var(--ds-spacing-px) 0 0 var(--ds-border),
      calc(var(--ds-spacing-px) * -1) 0 0 var(--ds-border);
    transition: width var(--ds-motion-duration-slow) var(--ds-motion-easing-in-out);
  }

  .docs-example[data-viewport='mobile'] :global(.docs-example__body) {
    --docs-example-viewport-width: 390px;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.docs-example__body) {
      transition-duration: var(--ds-motion-duration-instant);
    }
  }

  @media (max-width: 40rem) {
    .docs-example__controls {
      margin-inline-start: auto;
    }

    .docs-example__view-switcher :global(button span) {
      display: none;
    }
  }
</style>
