<script>
  import { AesirIcon } from '@aesir/svelte';
  import File from '@lucide/svelte/icons/file';
  import Mail from '@lucide/svelte/icons/mail';
  import Scan from '@lucide/svelte/icons/scan';
  import User from '@lucide/svelte/icons/user';
</script>

<div class="combined-icon-example">
  <div class="combined-icon-example__item">
    <AesirIcon icon={Scan} size={40} label="Scan user">
      <AesirIcon icon={User} size={12} x={6} y={6} absoluteStrokeWidth />
    </AesirIcon>
    <span>Nested icons</span>
  </div>

  <div class="combined-icon-example__item">
    <AesirIcon icon={Mail} size={40} label="Unread messages">
      <circle r="3" cx="20" cy="5" stroke="var(--ds-background)" fill="var(--ds-emphasis-red)" />
    </AesirIcon>
    <span>Native SVG</span>
  </div>

  <div class="combined-icon-example__item">
    <AesirIcon icon={File} size={40} label="JavaScript file">
      <text x="6.5" y="18" font-size="7" font-family="var(--ds-font-family-mono)" stroke-width="0.75">JS</text>
    </AesirIcon>
    <span>SVG text</span>
  </div>
</div>

<style>
  .combined-icon-example {
    display: grid;
    width: min(100%, var(--ds-sizing-md));
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--ds-spacing-4);
  }

  .combined-icon-example__item {
    display: grid;
    place-items: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-5);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    color: var(--ds-foreground);
  }

  .combined-icon-example__item span {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  @media (max-width: 479px) {
    .combined-icon-example {
      grid-template-columns: 1fr;
    }
  }
</style>
