<script>
  import { cubicOut } from 'svelte/easing';
  import { AesirButton, AesirIcon, AesirScrollArea, AesirPill } from '@aesir/svelte';
  import RequirementTaskTable from './requirement-task-table.svelte';
  import { formatEstimate, findRequirement } from './requirements-model.js';
  let { item, requirements, statusMeta, tasks = [], estimateUnit, onclose, onopen } = $props();
  const slidePanel = (node, { closing = false } = {}) => {
    const styles = getComputedStyle(node);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const overlay = styles.position === 'absolute' || styles.position === 'fixed';
    const duration = Number.parseFloat(styles.getPropertyValue(closing ? '--ds-motion-duration-fast' : '--ds-motion-duration-slow'));

    return {
      duration: reduceMotion || !overlay ? 0 : duration || (closing ? 140 : 240),
      easing: cubicOut,
      css: (t) => `transform: translateX(${(1 - t) * 100}%);`
    };
  };
</script>

<aside class="detail-panel" in:slidePanel out:slidePanel={{ closing: true }} aria-label={`Requirement ${item.id}`}>
  <header class="detail-panel__header">
    <div class="drawer-heading">
      <span>{item.id}</span>
      <strong>{item.title}</strong>
    </div>
    <AesirButton variant="ghost" size="icon-sm" aria-label="Close details" onclick={onclose}><AesirIcon name="x" size={16} /></AesirButton>
  </header>
  <AesirScrollArea class="requirement-details">
    <section class="detail-section">
      <span class="detail-label">Overview</span>
      <p>{item.description}</p>
      <dl class="detail-grid">
        <div>
          <dt>Status</dt>
          <dd><AesirIcon name={statusMeta[item.status].icon} size={14} /> {statusMeta[item.status].label}</dd>
        </div>
        <div>
          <dt>Estimate</dt>
          <dd>{formatEstimate(item.estimate, estimateUnit)}</dd>
        </div>
        <div>
          <dt>Linked tasks</dt>
          <dd>{item.issueCount ?? item.issues.length}</dd>
        </div>
        <div>
          <dt>Spent time</dt>
          <dd>{formatEstimate(tasks.reduce((total, task) => total + task.hours, 0) / 40, estimateUnit)}</dd>
        </div>
      </dl>
    </section>
    {#if item.links?.length}
      <section class="detail-section">
        <span class="detail-label">Links · {item.links.length}</span>
        <div class="drawer-links">
          {#each item.links as link (link.href)}
            <AesirPill size="xs" href={link.href}><AesirIcon name="link" size={12} /> {link.label}</AesirPill>
          {/each}
        </div>
      </section>
    {/if}
    {#if item.blockedBy?.length}
      <section class="detail-section detail-section--dependencies">
        <span class="detail-label">Blocked by · {item.blockedBy.length}</span>
        <div class="drawer-dependencies">
          {#each item.blockedBy as blocker (blocker.id)}
            {@const blockerRequirement = findRequirement(requirements, blocker.id)}
            <button type="button" class="drawer-dependency" disabled={!blockerRequirement} onclick={() => blockerRequirement && onopen(blockerRequirement)}>
              <AesirIcon name="circle-minus" size={15} class="drawer-dependency__icon" />
              <span class="drawer-dependency__copy">
                <span>{blocker.id}</span>
                <strong>{blocker.title}</strong>
              </span>
              <span class="drawer-dependency__meta">
                <span><AesirIcon name={statusMeta[blocker.status].icon} size={14} /> {statusMeta[blocker.status].label}</span>
              </span>
              <AesirIcon name="chevron-right" size={14} />
            </button>
          {/each}
        </div>
      </section>
    {/if}
    {#if item.notes?.length}
      <section class="detail-section detail-section--notes">
        <span class="detail-label">Notes</span>
        <div class="requirement-notes">
          {#each item.notes as note, index (`${note.type}-${index}`)}
            <div class="requirement-note" data-type={note.type}>
              <AesirIcon name={note.type === 'remark' ? 'triangle-alert' : 'message-square-more'} size={15} class="requirement-note-icon" />
              <div>
                <strong>{note.type === 'remark' ? 'Remark' : 'Comment'}</strong>
                <p>{note.text}</p>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
    <section class="detail-section">
      <span class="detail-label">Tasks · {item.issueCount ?? item.issues.length}</span>
      <RequirementTaskTable {tasks} {estimateUnit} variant="drawer" />
    </section>
  </AesirScrollArea>
</aside>

<style>
  .detail-panel {
    box-sizing: border-box;
    display: flex;
    width: clamp(20rem, 42%, 32rem);
    min-width: 0;
    height: 100%;
    max-height: 100%;
    flex: 0 0 auto;
    flex-direction: column;
    align-self: flex-start;
    overflow: hidden;
    border-left: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
  }
  .detail-panel__header {
    display: flex;
    min-height: var(--ds-spacing-12);
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .detail-grid {
    display: grid;
    margin: 0;
    gap: var(--ds-spacing-2);
  }
  .detail-grid > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
  }
  .detail-grid dt {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .detail-grid dd {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-1-5);
    margin: 0;
    font-size: var(--ds-font-size-xs);
  }
  .drawer-heading {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-0-5);
  }
  .drawer-heading span {
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
  }
  .drawer-heading strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.requirement-details) {
    min-height: 0;
    flex: 1;
  }
  .detail-section {
    display: grid;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .detail-section p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
  .drawer-links {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    gap: var(--ds-spacing-1-5);
  }
  .drawer-links :global(.aesir-pill) {
    max-width: 100%;
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-regular);
  }
  .requirement-notes {
    display: grid;
    gap: var(--ds-spacing-2);
  }
  .drawer-dependencies {
    display: grid;
    gap: var(--ds-spacing-1);
  }
  .drawer-dependency {
    display: grid;
    min-width: 0;
    grid-template-columns: var(--ds-spacing-5) minmax(8rem, 1fr) auto var(--ds-spacing-4);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-2-5);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-hover-red);
    color: var(--ds-foreground);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .drawer-dependency:hover {
    background: var(--ds-surface-active-red);
  }
  .drawer-dependency:focus-visible {
    outline: var(--ds-spacing-px) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-px);
  }
  :global(.drawer-dependency__icon) {
    color: var(--ds-foreground-muted-red);
  }
  .drawer-dependency__copy {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-0-5);
  }
  .drawer-dependency__copy > span {
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
  }
  .drawer-dependency__copy strong {
    overflow: hidden;
    font-size: var(--ds-font-size-sm);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .drawer-dependency__meta {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .drawer-dependency__meta > span {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-1);
    white-space: nowrap;
  }
  .requirement-note {
    display: grid;
    grid-template-columns: var(--ds-spacing-5) minmax(0, 1fr);
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-2-5);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background-secondary);
    color: var(--ds-foreground-muted);
  }
  :global(.requirement-note-icon) {
    margin-top: var(--ds-spacing-0-5);
  }
  .requirement-note > div {
    display: grid;
    gap: var(--ds-spacing-1);
  }
  .requirement-note strong {
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }
  .requirement-note[data-type='remark'] {
    background: var(--ds-surface-hover-orange);
    color: var(--ds-foreground-muted-orange);
  }
  .requirement-note[data-type='remark'] strong,
  .requirement-note[data-type='remark'] p {
    color: var(--ds-foreground-muted-orange);
  }
  .detail-label {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  @media (max-width: 56rem) {
    .detail-panel {
      width: 34%;
      min-width: 10rem;
    }
  }
  @media (max-width: 40rem) {
    .detail-panel {
      position: fixed;
      inset: var(--header-height) 0 0 auto;
      z-index: 2;
      width: min(32rem, 92%);
      min-width: 0;
      height: calc(100dvh - var(--header-height));
      box-shadow: calc(var(--ds-spacing-2) * -1) 0 var(--ds-spacing-6) color-mix(in oklch, var(--ds-fixed-black) 14%, transparent);
    }
  }
</style>
