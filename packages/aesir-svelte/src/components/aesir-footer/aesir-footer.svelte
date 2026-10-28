<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirButton } from '../aesir-button/index.js';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { AesirSeparator } from '../aesir-separator/index.js';
  import { AesirTooltip } from '../aesir-tooltip/index.js';

  type FooterLink = { href: string; label: string; target?: string; rel?: string; external?: boolean; icon?: string };
  type FooterColumn = { label: string; links?: FooterLink[] };
  type FooterProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style'> & {
    class?: string;
    style?: string;
    variant?: 'columns' | 'compact' | 'minimal';
    label?: string;
    brand?: string;
    description?: string;
    columns?: FooterColumn[];
    socials?: FooterLink[];
    legalLinks?: FooterLink[];
    copyright?: string;
    brandContent?: Snippet;
    children?: Snippet;
  };
  let {
    class: className = '',
    style: rootStyle,
    variant = 'columns',
    label = 'Footer',
    brand = 'Aesir',
    description,
    columns = [],
    socials = [],
    legalLinks = [],
    copyright,
    brandContent,
    children,
    ...restProps
  }: FooterProps = $props();

  const linkTarget = (link: FooterLink) => link.target ?? (link.external ? '_blank' : undefined);
  const linkRel = (link: FooterLink) => link.rel ?? (linkTarget(link) === '_blank' ? 'noreferrer' : undefined);
</script>

<footer class={`aesir-footer ${className}`.trim()} data-variant={variant} aria-label={label} style={rootStyle} {...restProps}>
  <!-- Consumer-provided URLs cannot use SvelteKit's compile-time resolve helper. -->
  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  {#if variant === 'minimal'}
    <div class="aesir-footer__minimal">
      <div class="aesir-footer__minimal-copy">
        {#if brandContent}{@render brandContent()}{:else if brand}<strong>{brand}</strong>{/if}
        {#if copyright}<span>{copyright}</span>{/if}
      </div>
      {#if legalLinks.length}
        <nav class="aesir-footer__legal" aria-label="Legal">
          {#each legalLinks as link (link)}
            <a href={link.href} target={linkTarget(link)} rel={linkRel(link)}>{link.label}</a>
          {/each}
        </nav>
      {/if}
      {#if socials.length}<div class="aesir-footer__socials">
          {#each socials as social (social)}
            <AesirTooltip content={social.label}>
              {#snippet trigger(props)}
                <AesirButton {...props} href={social.href} target={linkTarget(social)} rel={linkRel(social)} variant="ghost" size="icon-sm" aria-label={social.label}>
                  <AesirIcon name={social.icon ?? 'link'} size={16} />
                </AesirButton>
              {/snippet}
            </AesirTooltip>
          {/each}
        </div>{/if}
    </div>
  {:else}
    <div class="aesir-footer__main">
      <div class="aesir-footer__brand">
        {#if brandContent}{@render brandContent()}{:else if brand}<strong>{brand}</strong>{/if}
        {#if description}<p>{description}</p>{/if}
        {#if socials.length}<div class="aesir-footer__socials">
            {#each socials as social (social)}
              <AesirTooltip content={social.label}>
                {#snippet trigger(props)}
                  <AesirButton {...props} href={social.href} target={linkTarget(social)} rel={linkRel(social)} variant="ghost" size="icon-sm" aria-label={social.label}>
                    <AesirIcon name={social.icon ?? 'link'} size={16} />
                  </AesirButton>
                {/snippet}
              </AesirTooltip>
            {/each}
          </div>{/if}
      </div>
      <nav class="aesir-footer__columns" aria-label="Footer navigation">
        {#each columns as column (column)}
          <div class="aesir-footer__column">
            <h2>{column.label}</h2>
            <ul>
              {#each column.links ?? [] as link (link)}
                <li><a href={link.href} target={linkTarget(link)} rel={linkRel(link)}>{link.label}</a></li>
              {/each}
            </ul>
          </div>
        {/each}
      </nav>
    </div>
    {#if copyright || legalLinks.length || children}
      <AesirSeparator />
      <div class="aesir-footer__bottom">
        {#if copyright}<span>{copyright}</span>{/if}
        {@render children?.()}
        {#if legalLinks.length}
          <nav class="aesir-footer__legal" aria-label="Legal">
            {#each legalLinks as link (link)}
              <a href={link.href} target={linkTarget(link)} rel={linkRel(link)}>{link.label}</a>
            {/each}
          </nav>
        {/if}
      </div>
    {/if}
  {/if}
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
</footer>

<style>
  :global {
    .aesir-footer {
      box-sizing: border-box;
      width: 100%;
      container-type: inline-size;
      border-top: var(--ds-spacing-px) solid var(--ds-border);
      background: var(--ds-background);
      color: var(--ds-foreground);
    }
    .aesir-footer__main {
      display: grid;
      grid-template-columns: minmax(var(--ds-sizing-3xs), 0.8fr) minmax(0, 2fr);
      gap: var(--ds-spacing-12);
      padding: var(--ds-spacing-12) var(--ds-spacing-8);
    }
    .aesir-footer[data-variant='compact'] .aesir-footer__main {
      gap: var(--ds-spacing-8);
      padding: var(--ds-spacing-8) var(--ds-spacing-6);
    }
    .aesir-footer__brand {
      display: grid;
      align-content: start;
      justify-items: start;
      gap: var(--ds-spacing-3);
    }
    .aesir-footer__brand > strong,
    .aesir-footer__minimal-copy > strong {
      font-size: var(--ds-font-size-base);
      font-weight: var(--ds-font-weight-medium);
    }
    .aesir-footer .aesir-footer__brand p {
      max-width: var(--ds-sizing-xs);
      margin: 0;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }
    .aesir-footer__columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(var(--ds-spacing-48), 1fr));
      gap: var(--ds-spacing-8) var(--ds-spacing-10);
    }
    .aesir-footer[data-variant='compact'] .aesir-footer__columns {
      gap: var(--ds-spacing-5) var(--ds-spacing-6);
    }
    .aesir-footer .aesir-footer__column h2 {
      margin: 0 0 var(--ds-spacing-4);
      color: var(--ds-foreground);
      font-family: var(--ds-font-family-mono);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-xs);
      text-transform: uppercase;
    }
    .aesir-footer[data-variant='compact'] .aesir-footer__column h2 {
      margin-bottom: var(--ds-spacing-2);
    }
    .aesir-footer .aesir-footer__column ul {
      display: grid;
      gap: var(--ds-spacing-2-5);
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .aesir-footer[data-variant='compact'] .aesir-footer__column ul {
      gap: var(--ds-spacing-1-5);
    }
    .aesir-footer a {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
      text-decoration: none;
      transition: color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }
    .aesir-footer a:hover {
      color: var(--ds-foreground);
    }
    .aesir-footer a:focus-visible {
      border-radius: var(--ds-radius-sm);
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
      outline-offset: var(--ds-spacing-1);
    }
    .aesir-footer__socials,
    .aesir-footer__legal,
    .aesir-footer__bottom,
    .aesir-footer__minimal,
    .aesir-footer__minimal-copy {
      display: flex;
      align-items: center;
    }
    .aesir-footer__socials {
      gap: var(--ds-spacing-1);
    }
    .aesir-footer__bottom,
    .aesir-footer__minimal {
      min-height: var(--ds-spacing-14);
      justify-content: space-between;
      gap: var(--ds-spacing-4);
      padding: var(--ds-spacing-3) var(--ds-spacing-8);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
    }
    .aesir-footer[data-variant='compact'] .aesir-footer__bottom {
      min-height: var(--ds-spacing-12);
      padding: var(--ds-spacing-2) var(--ds-spacing-6);
    }
    .aesir-footer__minimal-copy,
    .aesir-footer__legal {
      flex-wrap: wrap;
      gap: var(--ds-spacing-4);
    }
    .aesir-footer__legal a {
      font-size: inherit;
    }
    @container (max-width: 48rem) {
      .aesir-footer__main {
        grid-template-columns: 1fr;
        gap: var(--ds-spacing-8);
        padding: var(--ds-spacing-8) var(--ds-spacing-5);
      }
      .aesir-footer[data-variant='compact'] .aesir-footer__main {
        gap: var(--ds-spacing-6);
        padding: var(--ds-spacing-6) var(--ds-spacing-4);
      }
      .aesir-footer__columns {
        grid-template-columns: 1fr;
      }
      .aesir-footer__bottom,
      .aesir-footer__minimal {
        align-items: flex-start;
        flex-direction: column;
        padding: var(--ds-spacing-4) var(--ds-spacing-5);
      }
      .aesir-footer[data-variant='compact'] .aesir-footer__bottom {
        padding: var(--ds-spacing-3) var(--ds-spacing-4);
      }
    }
  }
</style>
