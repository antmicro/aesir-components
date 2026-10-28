<article class="semantic-typography-showcase" data-docs-toc-ignore>
  <header>
    <small class="semantic-typography-showcase__eyebrow">Design systems · field note</small>
    <h1>Defaults should create momentum, not constraints.</h1>
    <p class="semantic-typography-showcase__intro">A semantic type system gives every document a clear starting point while keeping every decision open to revision.</p>
  </header>

  <section>
    <h2>A hierarchy that works before customization</h2>
    <p>
      Headings establish structure, body text carries the argument, and <strong>strong emphasis</strong>
      marks the details that deserve attention. Authors can still use
      <em>natural emphasis</em>
      ,
      <a href="#semantic-element-defaults">semantic links</a>
      , and inline
      <code>code</code>
      without reaching for utility classes.
    </p>
    <blockquote>
      <p>Good defaults reduce the number of decisions required to publish something clear.</p>
      <small><cite>Typography principle</cite></small>
    </blockquote>
  </section>

  <section>
    <h3>Override at the level the product needs</h3>
    <p>Change a public variable for a theme or container, then use ordinary CSS when a particular composition needs its own voice.</p>

    <pre><code>.editorial &#123;
	--ds-typography-body-line-height: 1.75;
	--ds-typography-h2-font-size: 2.5rem;
&#125;</code></pre>

    <h4>Shared foundations</h4>
    <p>Primitive family, size, weight, tracking, and line-height tokens remain available underneath every semantic choice.</p>

    <h5>Contextual changes</h5>
    <p>Variables inherit, so a localized override can reshape an article without changing the surrounding application.</p>

    <h6>Supporting details</h6>
    <p>
      Captions and small print use the compact <code>sm</code>
      scale while preserving a readable line height.
    </p>
  </section>

  <footer>
    <small>Every example above uses the optional semantic typography values.</small>
  </footer>
</article>

<style>
  .semantic-typography-showcase {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-10);
    padding: var(--ds-spacing-10);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-2xl);
    background: var(--ds-background-secondary);
    color: var(--ds-foreground);
  }

  .semantic-typography-showcase header,
  .semantic-typography-showcase section {
    display: grid;
    gap: var(--ds-spacing-4);
  }

  .semantic-typography-showcase :global(h1),
  .semantic-typography-showcase :global(h2),
  .semantic-typography-showcase :global(h3),
  .semantic-typography-showcase :global(h4),
  .semantic-typography-showcase :global(h5),
  .semantic-typography-showcase :global(h6),
  .semantic-typography-showcase :global(p),
  .semantic-typography-showcase :global(blockquote),
  .semantic-typography-showcase :global(pre) {
    margin: 0;
  }

  .semantic-typography-showcase__intro {
    max-width: 62ch;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-lg);
    line-height: var(--ds-font-line-height-lg);
  }

  .semantic-typography-showcase :global(a) {
    color: var(--ds-accent-text-muted);
    text-decoration: underline;
    text-decoration-color: var(--ds-accent-border);
    text-underline-offset: var(--ds-spacing-1);
  }

  .semantic-typography-showcase :global(:not(pre) > code) {
    padding: var(--ds-spacing-0-5) var(--ds-spacing-1);
    border-radius: var(--ds-radius-md);
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text-muted);
  }

  .semantic-typography-showcase :global(pre) {
    overflow-x: auto;
    padding: var(--ds-spacing-5);
    border-radius: var(--ds-radius-xl);
    background: var(--ds-foreground);
    color: var(--ds-background);
  }

  .semantic-typography-showcase :global(blockquote) {
    display: grid;
    gap: var(--ds-spacing-2);
    padding-inline-start: var(--ds-spacing-5);
    border-inline-start: var(--ds-spacing-1) solid var(--ds-accent-border);
  }

  .semantic-typography-showcase :global(cite),
  .semantic-typography-showcase :global(small) {
    color: var(--ds-foreground-muted);
  }

  .semantic-typography-showcase__eyebrow {
    text-transform: uppercase;
  }

  .semantic-typography-showcase footer {
    padding-top: var(--ds-spacing-5);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }

  @media (max-width: 40rem) {
    .semantic-typography-showcase {
      gap: var(--ds-spacing-8);
      padding: var(--ds-spacing-6);
    }
  }
</style>
