<!--
@component
Reusable task list for expanded requirements and drawers. No demo-data dependency.

Tasks: { id, title, assignee?, initials?, closed, hours, status: { key, label, icon }, href? }.
`hours` is spent time; `estimateUnit` controls display only (40 hours = 1 person-week).
Use `variant="drawer"` to show both Open/Closed groups without collapsing.
Override `taskHref(task)` for your site's routes; `onopen(event, task)` can prevent navigation.

Usage: <RequirementTaskTable {tasks} estimateUnit="days" taskHref={(task) => `/issues/${task.id}`} />
-->
<script>
  import { AesirAvatar, AesirIcon, AesirTooltip } from '@aesir/svelte';
  import { formatEstimate } from './requirements-model.js';

  let { tasks = [], estimateUnit = 'weeks', variant = 'expanded', taskHref = (task) => task.href ?? `#issue-${task.id.replace('#', '')}`, onopen } = $props();
  let closedOpen = $state(false);
  const openTasks = $derived(tasks.filter((task) => !task.closed));
  const closedTasks = $derived(tasks.filter((task) => task.closed));
</script>

<!-- The host app supplies taskHref, including external URLs and fragments. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet rows(items)}
  {#each items as task (task.id)}
    <a
      class="task"
      href={taskHref(task)}
      onclick={(event) => {
        event.stopPropagation();
        onopen?.(event, task);
      }}
    >
      <span class="task__assignee">
        {#if task.assignee}
          <AesirTooltip content={task.assignee} contentStyle="max-width: none; white-space: nowrap;">
            {#snippet trigger(props)}
              <AesirAvatar fallback={task.initials} size="2xs" gradient aria-label={task.assignee} {...props} />
            {/snippet}
          </AesirTooltip>
        {/if}
      </span>
      <span class="task__id">{task.id}</span>
      <span class="task__status" data-status={task.status.key}>
        <AesirIcon name={task.status.icon} size={13} />
        <span>{task.status.label}</span>
      </span>
      <span class="task__title">{task.title}</span>
      <span class="task__time">{formatEstimate(task.hours / 40, estimateUnit)}</span>
    </a>
  {/each}
{/snippet}
<!-- eslint-enable svelte/no-navigation-without-resolve -->

<div class="task-table" data-variant={variant} aria-label={`${tasks.length} linked tasks`}>
  {#if openTasks.length}
    <section class="task-group" aria-label="Open tasks">
      {#if variant === 'drawer'}<div class="task-heading">
          Open <span>{openTasks.length}</span>
        </div>{/if}
      <div class="task-rows">{@render rows(openTasks)}</div>
    </section>
  {/if}
  {#if closedTasks.length}
    <section class="task-group" aria-label="Closed tasks">
      {#if variant === 'drawer'}
        <div class="task-heading">
          Closed <span>{closedTasks.length}</span>
        </div>
      {:else}
        <button
          type="button"
          class="task-toggle"
          aria-expanded={closedOpen}
          onclick={(event) => {
            event.stopPropagation();
            closedOpen = !closedOpen;
          }}
        >
          <AesirIcon name="chevron-down" size={16} /> Closed issues
          <span>{closedTasks.length}</span>
        </button>
      {/if}
      {#if variant === 'drawer' || closedOpen}<div class="task-rows">{@render rows(closedTasks)}</div>{/if}
    </section>
  {/if}
</div>

<style>
  .task-table {
    container: requirement-tasks / inline-size;
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-2);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
  }
  .task-group {
    min-width: 0;
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
  }
  .task {
    display: grid;
    min-height: var(--ds-spacing-9);
    grid-template-columns: var(--ds-spacing-5) 9ch 7rem minmax(0, 1fr) max-content;
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: 0 var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    color: inherit;
    text-decoration: none;
  }
  .task:last-child {
    border-bottom: 0;
  }
  .task:hover {
    background: var(--ds-surface-hover);
  }
  .task:focus-visible,
  .task-toggle:focus-visible {
    outline: var(--ds-spacing-px) solid var(--ds-accent-ring);
    outline-offset: calc(-1 * var(--ds-spacing-px));
  }
  .task__assignee {
    display: inline-flex;
  }
  .task__id {
    font-family: var(--ds-font-family-mono);
  }
  .task__id,
  .task__time {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .task__status {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-1);
    color: var(--ds-emphasis-blue);
    white-space: nowrap;
  }
  .task__status[data-status='todo'] {
    color: var(--ds-foreground-muted);
  }
  .task__status[data-status='done'] {
    color: var(--ds-emphasis-green);
  }
  .task__status > span,
  .task__time {
    color: var(--ds-foreground-muted);
  }
  .task__title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: var(--ds-font-weight-medium);
  }
  .task__time {
    text-align: right;
  }
  .task-toggle,
  .task-heading {
    display: flex;
    min-height: var(--ds-spacing-8);
    align-items: center;
    gap: var(--ds-spacing-1-5);
    padding: 0 var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font: inherit;
  }
  .task-toggle {
    width: 100%;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .task-toggle:hover,
  .task-toggle :global(svg) {
    color: var(--ds-foreground);
  }
  .task-toggle[aria-expanded='false'] :global(svg) {
    transform: rotate(-90deg);
  }
  .task-toggle > span,
  .task-heading > span {
    font-family: var(--ds-font-family-mono);
  }
  [data-variant='drawer'] {
    gap: var(--ds-spacing-3);
  }
  [data-variant='drawer'] .task-group {
    border: 0;
    background: transparent;
  }
  [data-variant='drawer'] .task {
    min-height: var(--ds-spacing-10);
    padding: var(--ds-spacing-1-5) var(--ds-spacing-2);
    border: 0;
    border-radius: var(--ds-radius-md);
  }
  [data-variant='drawer'] .task-heading {
    padding-inline: var(--ds-spacing-2);
  }
  @container requirement-tasks (max-width: 48rem) {
    .task {
      align-content: center;
      row-gap: var(--ds-spacing-1);
      grid-template-columns: var(--ds-spacing-5) 9ch minmax(0, 1fr) max-content;
      padding-block: var(--ds-spacing-2);
    }
    .task__assignee,
    .task__id,
    .task__time {
      grid-row: 1 / span 2;
    }
    .task__status {
      grid-column: 3;
      grid-row: 2;
    }
    .task__title {
      grid-column: 3;
      grid-row: 1;
    }
    .task__time {
      grid-column: 4;
    }
  }
</style>
