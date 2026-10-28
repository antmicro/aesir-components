<script>
  import { ComponentApi, DocsBreadcrumb, DocsCommand, DocsPageNav, DocsSidebar, DocsToc } from '$lib/components/docs';
  import { setDocsPlatform } from '$lib/docs/platform-context.svelte.js';

  let { children, data } = $props();
  const platform = $state({ value: 'svelte' });
  setDocsPlatform(platform);
</script>

<svelte:head>
  <title>{data.pageTitle}</title>
  <meta name="description" content="Aesir design system documentation, component guidance, and design tokens." />
</svelte:head>

<div class="docs-layout">
  <div class="docs-layout__grid">
    <DocsSidebar sections={data.sidebar} />
    <div class="docs-layout__content">
      <div class="docs-layout__content-inner">
        <DocsCommand pages={data.searchIndex} />
        <div class="docs-layout__article-grid">
          <main id="main-content" class="docs-layout__main" data-docs-content tabindex="-1">
            <div class="docs-content docs-layout__article">
              <div>
                {#if data.breadcrumbs?.length > 1}
                  <div class="docs-layout__breadcrumb">
                    <DocsBreadcrumb items={data.breadcrumbs} />
                  </div>
                {/if}
                <div class="docs-markdown">
                  {@render children?.()}
                  <ComponentApi route={data.currentPage?.href} />
                </div>
              </div>
              <div class="docs-layout__page-nav">
                <DocsPageNav previous={data.previousPage} next={data.nextPage} />
              </div>
            </div>
          </main>
          <DocsToc />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .docs-layout {
    width: 100%;
    padding-inline: var(--ds-spacing-4);
  }

  .docs-layout__grid,
  .docs-layout__article-grid {
    display: grid;
    width: 100%;
    min-height: 0;
  }

  .docs-layout__grid {
    min-height: calc(100dvh - var(--header-height));
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    gap: var(--ds-spacing-8);
  }

  .docs-layout__content,
  .docs-layout__content-inner,
  .docs-layout__article {
    display: flex;
    width: 100%;
    min-height: 0;
    flex-direction: column;
  }

  .docs-layout__content {
    max-width: var(--ds-sizing-7xl);
    height: 100%;
    margin-inline: auto;
  }

  .docs-layout__content-inner {
    box-sizing: border-box;
    height: 100%;
    gap: var(--ds-spacing-6);
    padding-block: var(--ds-spacing-8);
  }

  .docs-layout__article-grid {
    flex: 1;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--ds-spacing-10);
  }

  .docs-layout__main {
    min-width: 0;
    min-height: 0;
  }

  .docs-layout__breadcrumb {
    margin-bottom: var(--ds-spacing-6);
  }

  .docs-layout__page-nav {
    margin-top: auto;
    padding-top: var(--ds-spacing-10);
  }

  @media (min-width: 48rem) {
    .docs-layout {
      padding-inline: var(--ds-spacing-6);
    }
  }

  @media (min-width: 64rem) {
    .docs-layout {
      padding-inline: 0;
    }

    .docs-layout__grid {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .docs-layout__content {
      padding-right: var(--ds-spacing-6);
    }
  }

  @media (min-width: 80rem) {
    .docs-layout__article-grid {
      grid-template-columns: minmax(0, 1fr) 16rem;
    }
  }
</style>
