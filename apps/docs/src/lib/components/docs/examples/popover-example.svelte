<script>
  import { AesirButton, AesirCheckbox, AesirIcon, AesirPopover, AesirSeparator } from '@aesir/svelte';
</script>

<div class="popover-trigger-row">
  <AesirPopover align="center" openOnHover>
    {#snippet trigger(props)}
      <AesirButton variant="outline" {...props}>Display options</AesirButton>
    {/snippet}

    {#snippet content({ close })}
      <div class="popover-example">
        <header>
          <span class="popover-example__icon" aria-hidden="true"><AesirIcon name="sliders-horizontal" /></span>
          <span>
            <strong>Display options</strong>
            <small>Choose what appears in the status overview.</small>
          </span>
        </header>

        <AesirSeparator class="popover-example__separator" />

        <div class="popover-example__controls">
          <AesirCheckbox checked label="Latency" />
          <AesirCheckbox checked label="Availability" />
          <AesirCheckbox label="Region" />
        </div>

        <footer>
          <AesirButton variant="ghost" size="sm" onclick={close}>Cancel</AesirButton>
          <AesirButton size="sm" onclick={close}>Apply</AesirButton>
        </footer>
      </div>
    {/snippet}
  </AesirPopover>
</div>

<style>
  .popover-trigger-row {
    display: flex;
    width: 100%;
    justify-content: center;
  }

  .popover-example {
    display: grid;
    gap: var(--ds-spacing-4);
  }

  .popover-example header {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
  }

  .popover-example header > span:last-child {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-0-5);
  }

  .popover-example__icon {
    display: grid;
    width: var(--ds-spacing-10);
    height: var(--ds-spacing-10);
    flex: 0 0 auto;
    place-items: center;
    border-radius: var(--ds-radius-full);
    background: var(--ds-surface);
    color: var(--ds-foreground);
  }

  .popover-example strong,
  .popover-example small {
    display: block;
    margin: 0;
  }

  .popover-example strong {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }

  .popover-example small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
  }

  .popover-example__controls {
    display: grid;
    gap: var(--ds-spacing-3);
  }

  .popover-example :global(.popover-example__separator) {
    width: calc(100% + var(--ds-spacing-8));
    margin-inline: calc(var(--ds-spacing-4) * -1);
  }

  .popover-example footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-spacing-2);
    padding-top: var(--ds-spacing-1);
  }
</style>
