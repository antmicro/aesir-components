<script>
  import { afterNavigate } from '$app/navigation';
  import { onMount, tick } from 'svelte';
  import { AesirScrollArea } from '@aesir/svelte';
  import InternalLink from '$lib/components/internal-link.svelte';

  let items = $state([]);
  let activeId = $state('');
  let observer;
  let mutationObserver;

  const slugify = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

  const getUniqueId = (heading, used) => {
    const base = heading.id || slugify(heading.textContent || '');
    let id = base;
    let i = 1;
    while (used.includes(id)) id = `${base}-${i++}`;
    used.push(id);
    heading.id = id;
    return id;
  };

  const getItems = (content) => {
    const used = [];
    return [...content.querySelectorAll('h2, h3')]
      .filter((heading) => !heading.closest('[data-docs-toc-ignore], .docs-example, .code-example'))
      .map((heading) => {
        const label = heading.textContent?.trim();
        if (!label) return null;
        const id = getUniqueId(heading, used);
        return {
          href: `${window.location.pathname}#${id}`,
          id,
          label,
          depth: heading.tagName === 'H3' ? 3 : 2
        };
      })
      .filter(Boolean);
  };

  const setupObserver = () => {
    observer?.disconnect();
    const headings = items.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!headings.length) {
      activeId = '';
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) activeId = visible[0].target.id;
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 }
    );

    for (const heading of headings) observer.observe(heading);
    if (!activeId) activeId = headings[0].id;
  };

  const collectHeadings = async () => {
    await tick();
    const content = document.querySelector('[data-docs-content]');
    items = content ? getItems(content) : [];
    activeId = items[0]?.id ?? '';
    setupObserver();
  };

  onMount(() => {
    collectHeadings();
    afterNavigate(() => collectHeadings());
    const content = document.querySelector('[data-docs-content]');
    if (content) {
      mutationObserver = new MutationObserver(() => collectHeadings());
      mutationObserver.observe(content, { childList: true, subtree: true });
    }
    return () => {
      observer?.disconnect();
      mutationObserver?.disconnect();
    };
  });
</script>

<aside class="docs-toc">
  <AesirScrollArea class="docs-toc__scroll">
    <p class="docs-toc__title">On this page</p>
    <ul class="docs-toc__list">
      {#each items as item (item.href)}
        <li>
          <InternalLink href={item.href} class="docs-toc__link" data-active={item.id === activeId} data-depth={item.depth}>
            {item.label}
          </InternalLink>
        </li>
      {/each}
    </ul>
  </AesirScrollArea>
</aside>

<style>
  .docs-toc {
    position: sticky;
    top: var(--ds-spacing-24);
    display: none;
    height: calc(100dvh - var(--header-height));
    align-self: start;
  }

  :global(.docs-toc__scroll) {
    height: 100%;
    padding-left: var(--ds-spacing-4);
  }

  .docs-toc__title {
    margin: 0 0 var(--ds-spacing-4);
    padding-inline: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .docs-toc__list {
    display: grid;
    gap: var(--ds-spacing-1);
    margin: 0;
    padding: 0 0 var(--ds-spacing-8);
    list-style: none;
  }

  :global(.docs-toc__link) {
    display: block;
    padding: var(--ds-spacing-1) var(--ds-spacing-2);
    border-radius: var(--ds-radius-md);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    text-decoration: none;
    transition: color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  :global(.docs-toc__link[data-depth='3']) {
    padding-left: var(--ds-spacing-6);
  }

  :global(.docs-toc__link:hover) {
    color: var(--ds-foreground);
  }

  :global(.docs-toc__link[data-active='true']) {
    color: var(--ds-accent-text-muted);
  }

  @media (min-width: 1280px) {
    .docs-toc {
      display: block;
    }
  }
</style>
