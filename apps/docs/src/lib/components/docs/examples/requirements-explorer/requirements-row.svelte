<script>
  import {
    AesirAvatar,
    AesirButton,
    AesirContextMenu,
    AesirDropdown,
    AesirIcon,
    AesirPill,
    AesirPopover,
    AesirTooltip,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSubmenu,
    ContextMenuTrigger
  } from '@aesir/svelte';
  import { formatEstimate } from './requirements-model.js';
  let {
    item,
    tasks = [],
    ownTasks = tasks,
    totalTasks = tasks,
    assignee,
    assigneeOptions = [],
    statusMeta,
    estimateUnit = 'days',
    group = false,
    hasChildren = false,
    folded = false,
    last = false,
    selected = false,
    readOnly = false,
    mode,
    fields,
    onopen,
    onedit,
    ontoggle,
    onstatus,
    onaction,
    oncopy
  } = $props();
  const counts = $derived({ closed: tasks.filter((task) => task.closed).length, open: tasks.filter((task) => !task.closed).length });
  const spent = $derived(ownTasks.reduce((total, task) => total + task.hours, 0) / 40);
  const totalSpent = $derived(totalTasks.reduce((total, task) => total + task.hours, 0) / 40);
  const metaColumns = $derived([fields.includes('links') && '3rem', fields.includes('tasks') && 'var(--requirement-tasks-width)', fields.includes('spent') && '6.5rem'].filter(Boolean));
  const wideMetaColumns = $derived([fields.includes('tasks') && 'var(--requirement-tasks-width)', fields.includes('spent') && '6.5rem'].filter(Boolean));
</script>

{#snippet issuePreview(tasks, total)}
  <div class="issue-preview">
    <div class="issue-preview__heading">
      <strong>Issues</strong>
      <span>{total}</span>
    </div>
    <div class="issue-preview__list">
      {#each tasks.slice(0, 5) as task (task.id)}
        <div class="issue-preview__item">
          <AesirAvatar fallback={task.initials} size="2xs" gradient aria-label={task.assignee} />
          <span class="issue-preview__id">{task.id}</span>
          <AesirIcon name={task.status.icon} size={13} />
          <span class="issue-preview__title">{task.title}</span>
        </div>
      {/each}
    </div>
    {#if total > 5}
      <div class="issue-preview__more">+{total - 5} more</div>
    {/if}
  </div>
{/snippet}

{#snippet statusControl(item)}
  {#if readOnly}
    <span class="status-icon status-icon--readonly" data-status={item.status} role="img" aria-label={`${item.id}: ${statusMeta[item.status].label}`} title={statusMeta[item.status].label}>
      <AesirIcon name={statusMeta[item.status].icon} size={15} />
    </span>
  {:else}
    <AesirDropdown
      label={`Change status of ${item.id}`}
      items={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label, icon: meta.icon, role: 'menuitemradio', checked: item.status === value }))}
      onselect={(entry) => onstatus(item, entry.value)}
    >
      {#snippet trigger(props)}
        <button
          {...props}
          class="status-icon"
          data-status={item.status}
          type="button"
          aria-label={`${item.id}: ${statusMeta[item.status].label}`}
          title={statusMeta[item.status].label}
          onclick={(event) => {
            event.stopPropagation();
            props.onclick?.(event);
          }}
        >
          <AesirIcon name={statusMeta[item.status].icon} size={15} />
        </button>
      {/snippet}
    </AesirDropdown>
  {/if}
{/snippet}

{#snippet fullLinks()}
  {#if fields.includes('links') && item.links?.length}
    <div class="full-links">
      {#each item.links as link (link.href)}
        <AesirPill size="xs" href={link.href} onclick={(event) => event.stopPropagation()}>
          <AesirIcon name="link" size={11} />{link.label}
        </AesirPill>
      {/each}
    </div>
  {/if}
{/snippet}

{#snippet issueCounts(tasks, counts)}
  {#snippet countPreview()}
    {@render issuePreview(tasks, counts.open + counts.closed)}
  {/snippet}
  <AesirTooltip content={countPreview} contentClass="issue-preview-tooltip" placement="top" delay={180}>
    {#snippet trigger(props)}
      <span {...props} class="issue-counts" aria-label={`${counts.open} open issues, ${counts.closed} closed issues`}>
        <AesirIcon name="circle-dot" size={13} />
        <span>{counts.open}</span>
        <AesirIcon name="check" size={13} />
        <span>{counts.closed}</span>
      </span>
    {/snippet}
  </AesirTooltip>
{/snippet}

{#snippet requirementMenu(item)}
  <ContextMenuContent class="requirement-menu" aria-label={`Actions for ${item.id}`}>
    <div class="menu-heading">
      <span>{item.id}</span>
      <small>{item.title}</small>
    </div>
    {#if !readOnly}
      <ContextMenuSubmenu label="Status" icon="circle-dot" shortcut="s">
        {#each Object.entries(statusMeta) as [value, meta] (value)}
          <ContextMenuItem icon={meta.icon} shortcut={String(meta.order)} role="menuitemradio" aria-checked={item.status === value} onclick={() => onstatus(item, value)}>
            <span class="menu-status" data-status={value}>{meta.label}</span>
            {#if item.status === value}<AesirIcon name="check" size={14} class="menu-check" />{/if}
          </ContextMenuItem>
        {/each}
      </ContextMenuSubmenu>
      <ContextMenuSubmenu label="Assignee" icon="user" shortcut="a">
        <ContextMenuItem icon="circle-user-round" onclick={() => onaction(item, 'Unassigned')}>No assignee</ContextMenuItem>
        {#each assigneeOptions.filter((option) => option.value !== 'unassigned') as option (option.value)}
          <ContextMenuItem icon="user" onclick={() => onaction(item, `Assigned to ${option.label}`)}>{option.label}</ContextMenuItem>
        {/each}
      </ContextMenuSubmenu>
      <div class="menu-divider"></div>
      <ContextMenuItem icon="edit" shortcut="e" onclick={() => onedit(undefined, item)}>Edit requirement</ContextMenuItem>
    {/if}
    {#if mode === 'compact'}<ContextMenuItem icon="panel-left-open" shortcut="Enter" onclick={() => onopen(item)}>Open details</ContextMenuItem>{/if}
    <ContextMenuItem icon="copy" shortcut="c" onclick={() => oncopy(item)}>Copy link</ContextMenuItem>
    {#if !readOnly}
      <div class="menu-divider"></div>
      <ContextMenuItem icon="trash-2" variant="destructive" onclick={() => onaction(item, 'Deleted')}>Delete requirement</ContextMenuItem>
    {/if}
  </ContextMenuContent>
{/snippet}

{#snippet assigneeAvatar(name, initials)}
  <AesirTooltip content={name} contentStyle="max-width: none; white-space: nowrap;">
    {#snippet trigger(props)}
      <AesirAvatar fallback={initials} size="2xs" gradient aria-label={name} {...props} />
    {/snippet}
  </AesirTooltip>
{/snippet}

{#snippet requirementAvatar()}
  {#if fields.includes('assignee')}
    <span class="requirement-assignee">
      {#if assignee && assignee.value !== 'unassigned'}
        {@render assigneeAvatar(assignee.label, assignee.initials)}
      {:else}
        <AesirAvatar fallback="" size="2xs" aria-label="No assignee" />
      {/if}
    </span>
  {/if}
{/snippet}
<AesirContextMenu>
  <ContextMenuTrigger class="requirement-context-trigger">
    <div
      class={`requirement-row ${group ? 'requirement-row--group' : 'requirement-row--child'}`}
      data-mode={mode}
      class:is-selected={mode === 'compact' && selected}
      role="row"
      aria-level={group ? 1 : (item.depth ?? 1) + 1}
      aria-expanded={hasChildren ? !folded : undefined}
      data-status={item.status}
      style:--tree-indent={`${(group ? 0 : (item.depth ?? 1)) * 1.5}rem`}
      tabindex={mode === 'compact' ? 0 : undefined}
      onclick={mode === 'compact' ? () => onopen(item) : undefined}
      onkeydown={(event) => {
        if (mode === 'compact' && event.key === 'Enter') onopen(item);
      }}
    >
      {#if !readOnly}
        <AesirButton class="requirement-row__edit" variant="ghost" size="icon-sm" aria-label={`Edit ${item.id}`} title="Edit requirement" onclick={(event) => onedit(event, item)}>
          <AesirIcon name="edit" size={13} />
        </AesirButton>
      {/if}
      {#if !group && (item.depth ?? 1) > 0}
        {#each Array.from(Array(item.depth ?? 1).keys()) as level (level)}
          {@const currentLevel = level === (item.depth ?? 1) - 1}
          <span class={`tree-branch${currentLevel ? ' tree-branch--current' : ''}`} style:--tree-offset={`${level * 1.5}rem`} data-last={(currentLevel && last) || undefined} aria-hidden="true"></span>
        {/each}
      {/if}
      <span class="status-slot">
        <span class="requirement-fold-slot">
          {#if hasChildren}
            <button
              class="requirement-row__toggle"
              type="button"
              aria-label={`${folded ? 'Expand' : 'Collapse'} ${item.id}`}
              onclick={(event) => {
                event.stopPropagation();
                ontoggle(item.id);
              }}
            >
              <AesirIcon name="chevron-down" size={14} />
            </button>
          {/if}
        </span>
        {#if !group && fields.includes('status')}
          {@render statusControl(item)}
        {/if}
      </span>
      {#if group}
        <div class="requirement-row__identity" role="rowheader">
          {#if fields.includes('status')}{@render statusControl(item)}{/if}
          {@render requirementAvatar()}
          <strong>{item.id}</strong>
          {#if item.notes?.length}<AesirIcon
              name={item.notes.some((note) => note.type === 'remark') ? 'triangle-alert' : 'message-square-more'}
              size={13}
              class="requirement-info-icon"
              aria-label={`${item.id} has notes`}
            />{/if}
          {@render fullLinks()}
        </div>
      {:else}
        <div class="requirement-row__identity" role="rowheader">
          <span class="requirement-id" title={item.id}>{item.id}</span>
          {@render requirementAvatar()}
          <span class="requirement-copy">
            <strong>{item.title}</strong>
            {#if item.notes?.length}<AesirIcon
                name={item.notes.some((note) => note.type === 'remark') ? 'triangle-alert' : 'message-square-more'}
                size={13}
                class="requirement-info-icon"
                aria-label={`${item.id} has notes`}
              />{/if}
            {#if item.blockedBy?.length}
              {#snippet blockerDetails()}
                <div class="dependency-card">
                  {#each item.blockedBy as blocker (blocker.id)}
                    <div class="dependency-card__heading">
                      <span>Blocked by {blocker.id}</span>
                      <strong>{blocker.title}</strong>
                    </div>
                    <div class="dependency-card__meta">
                      <span><AesirIcon name={statusMeta[blocker.status].icon} size={14} /> {statusMeta[blocker.status].label}</span>
                    </div>
                  {/each}
                </div>
              {/snippet}
              <AesirTooltip content={blockerDetails} contentClass="dependency-tooltip" placement="top" delay={180}>
                {#snippet trigger(props)}
                  <span {...props} class="dependency-indicator" aria-label={`Blocked by ${item.blockedBy.length} requirement${item.blockedBy.length === 1 ? '' : 's'}`}>
                    <AesirIcon name="circle-minus" size={14} />
                    {item.blockedBy.length}
                  </span>
                {/snippet}
              </AesirTooltip>
            {/if}
          </span>
          {@render fullLinks()}
        </div>
      {/if}
      <div
        class="requirement-row__meta"
        role="gridcell"
        style:--requirement-meta-columns={metaColumns.join(' ') || 'none'}
        style:--requirement-meta-wide-columns={wideMetaColumns.join(' ') || 'none'}
        style:--requirement-meta-inset={metaColumns.length ? 'var(--ds-spacing-3)' : '0px'}
        style:--requirement-meta-wide-inset={wideMetaColumns.length ? 'var(--ds-spacing-3)' : '0px'}
      >
        {#if fields.includes('links')}<div class="link-pills">
            {#if item.links?.length}
              <AesirPopover align="end">
                {#snippet trigger(props)}
                  <button
                    {...props}
                    type="button"
                    class="aesir-pill link-pill--compact"
                    data-variant="outline"
                    data-size="xs"
                    aria-label={`Show ${item.links.length} linked ${item.links.length === 1 ? 'document' : 'documents'}`}
                    onclick={(event) => {
                      event.stopPropagation();
                      props.onclick(event);
                    }}
                  >
                    <AesirIcon name="link" size={11} />
                    {item.links.length}
                  </button>
                {/snippet}
                {#snippet content({ close })}
                  <div class="requirement-links" aria-label="Linked documents">
                    {#each item.links as link (link.href)}
                      <AesirButton
                        class="requirement-link"
                        href={link.href}
                        variant="ghost"
                        size="sm"
                        onclick={(event) => {
                          event.stopPropagation();
                          close();
                        }}
                      >
                        <AesirIcon name="link" size={13} />
                        {link.label}
                      </AesirButton>
                    {/each}
                  </div>
                {/snippet}
              </AesirPopover>
            {/if}
          </div>{/if}
        {#if fields.includes('tasks')}
          {@render issueCounts(tasks, counts)}
        {/if}
        {#if fields.includes('spent')}
          <span class="estimate" aria-label={`Own spent time ${formatEstimate(spent, estimateUnit)}${group ? `, total spent time ${formatEstimate(totalSpent, estimateUnit)}` : ''}`}>
            <span title="Own spent time" class:estimate--exceeded={spent > item.estimate}>{formatEstimate(spent, estimateUnit)}</span>
            {#if group}
              <span title="Spent time including all descendants">TOTAL {formatEstimate(totalSpent, estimateUnit)}</span>
            {/if}
          </span>
        {/if}
      </div>
    </div>
  </ContextMenuTrigger>
  {@render requirementMenu(item)}
</AesirContextMenu>

<style>
  .requirement-row {
    display: grid;
    grid-template-columns: var(--ds-spacing-7) max-content minmax(0, 1fr) max-content;
    align-items: center;
  }
  .requirement-row {
    position: relative;
    width: 100%;
    box-sizing: border-box;
    min-height: var(--ds-spacing-10);
    padding: 0 var(--tree-row-padding);
    outline: none;
    font-size: var(--ds-font-size-xs);
  }
  .requirement-row--group {
    grid-template-columns: var(--ds-spacing-7) var(--ds-spacing-4) minmax(0, 1fr) max-content;
    min-height: var(--tree-row-height);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background-secondary);
    cursor: pointer;
  }
  .requirement-row--group:hover {
    background: var(--ds-surface-hover);
  }
  .requirement-row--group.is-selected {
    background: var(--ds-surface);
  }
  .requirement-row--group:focus-visible {
    z-index: 1;
    box-shadow: inset 0 0 0 var(--ds-spacing-px) var(--ds-accent-ring);
  }
  .requirement-row--child {
    cursor: pointer;
  }
  :global(.requirements-grid[data-narrow='true']) .requirement-row[data-mode='compact'] .requirement-row__meta {
    --requirement-tasks-width: 3.5rem;
  }
  :global(.requirements-grid[data-narrow='true']) .requirement-row[data-mode='compact'] .issue-counts {
    grid-template-columns: var(--ds-spacing-3-5) 3ch;
  }
  :global(.requirements-grid[data-narrow='true']) .requirement-row[data-mode='compact'] .issue-counts > :global(:nth-child(n + 3)) {
    display: none;
  }
  .requirement-row--child[data-status='rejected'] {
    opacity: var(--ds-opacity-60);
  }
  .requirement-row--child:hover,
  .requirement-row--child.is-selected {
    background: var(--ds-surface);
  }
  :global(.requirement-context-trigger[data-state='open']) .requirement-row {
    background: var(--ds-surface);
  }
  .requirement-row[data-status='problem']:not(.is-selected) {
    background: color-mix(in srgb, var(--ds-surface-hover-red) 32%, var(--ds-background-secondary));
  }
  .requirement-row[data-status='problem']:not(.is-selected):hover {
    background: color-mix(in srgb, var(--ds-surface-hover-red) 48%, var(--ds-background-secondary));
  }
  .requirement-row--child:focus-visible {
    z-index: 1;
    box-shadow: inset 0 0 0 var(--ds-spacing-px) var(--ds-accent-ring);
  }
  .requirement-row__toggle {
    display: grid;
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-6);
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: var(--ds-radius-full);
    background: transparent;
    color: var(--ds-foreground-muted);
    cursor: pointer;
  }
  .requirement-row[aria-expanded='false'] .requirement-row__toggle :global(svg) {
    transform: rotate(-90deg);
  }
  .requirement-row__toggle:hover {
    color: var(--ds-foreground);
  }
  .requirement-row__toggle:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
  }
  .requirement-row__identity {
    display: flex;
    grid-column: 3;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
    overflow: hidden;
  }
  .requirement-row--group .requirement-row__identity strong {
    font-size: var(--ds-font-size-sm);
  }
  .requirement-id {
    width: 7.5rem;
    min-width: 7.5rem;
    overflow: hidden;
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .requirement-copy {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-1-5);
  }
  .requirement-copy strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .requirement-copy strong {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
  :global(.requirement-info-icon) {
    flex: none;
    color: var(--ds-foreground-muted);
  }
  .tree-branch {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--tree-axis) + var(--tree-offset));
    width: var(--ds-spacing-5);
    border-left: var(--ds-spacing-px) solid var(--ds-border);
    pointer-events: none;
  }
  .tree-branch--current::after {
    position: absolute;
    top: calc(50% - var(--ds-spacing-px) / 2);
    left: 0;
    width: var(--ds-spacing-5);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
    content: '';
  }
  .tree-branch--current[data-last] {
    border-left: 0;
    background: linear-gradient(var(--ds-border), var(--ds-border)) left top / var(--ds-spacing-px) 50% no-repeat;
  }
  :global(.requirements-grid[data-mode='expanded'] .requirements-tree__node:not([data-sticky])) .tree-branch {
    border-left: 0;
    background: none;
  }
  .status-slot {
    display: inline-flex;
    grid-column: 2;
    align-items: center;
    margin-right: var(--ds-spacing-1);
    padding-left: var(--tree-indent);
  }
  .requirement-fold-slot {
    display: inline-flex;
    width: var(--ds-spacing-4);
    flex: none;
  }
  .requirement-assignee {
    display: inline-flex;
    flex: none;
  }
  .requirement-row__meta {
    --requirement-tasks-width: 6rem;
    display: grid;
    min-width: 0;
    grid-column: 4;
    grid-template-columns: var(--requirement-meta-columns);
    align-items: center;
    gap: var(--ds-spacing-3);
    padding-left: var(--requirement-meta-inset);
  }
  .link-pills {
    display: flex;
    min-width: 0;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--ds-spacing-1);
    overflow: visible;
  }
  .requirement-links {
    display: grid;
    gap: var(--ds-spacing-1);
  }
  .requirement-links :global(.requirement-link) {
    width: 100%;
    justify-content: flex-start;
  }
  .full-links {
    display: flex;
    flex: none;
    gap: var(--ds-spacing-1);
    margin-left: auto;
  }
  :global(.requirements-grid[data-compact-links='false']) .requirement-row__meta {
    grid-template-columns: var(--requirement-meta-wide-columns);
    padding-left: var(--requirement-meta-wide-inset);
  }
  .link-pills {
    display: none;
  }
  :global(.requirements-grid[data-compact-links='true']) .full-links {
    display: none;
  }
  :global(.requirements-grid[data-compact-links='true']) .link-pills {
    display: flex;
  }
  :global(.requirement-row__edit) {
    grid-column: 1;
    justify-self: start;
    opacity: 0;
    color: var(--ds-foreground-muted);
    pointer-events: none;
  }
  .requirement-row:hover :global(.requirement-row__edit),
  .requirement-row:focus-within :global(.requirement-row__edit) {
    opacity: 1;
    pointer-events: auto;
  }
  .requirement-row__meta > :global(.aesir-tooltip__anchor),
  .requirement-row__meta > .issue-counts {
    justify-self: end;
  }
  .link-pills :global(.aesir-pill) {
    flex: none;
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-regular);
  }
  .link-pills :global(.link-pill--full) {
    display: none;
  }
  .link-pills :global(.link-pill--compact) {
    display: inline-flex;
  }
  .dependency-indicator {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-1);
    color: var(--ds-foreground-muted-red);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    font-variant-numeric: tabular-nums;
  }
  :global(.dependency-tooltip) {
    width: 17rem;
    max-width: 17rem;
    padding: 0;
    border: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
    color: var(--ds-foreground);
    box-shadow: var(--ds-shadow-lg);
  }
  :global(.issue-preview-tooltip) {
    width: 22rem;
    max-width: min(22rem, calc(100vw - var(--ds-spacing-6)));
    padding: 0;
    border: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
    color: var(--ds-foreground);
    box-shadow: var(--ds-shadow-lg);
  }
  .issue-preview {
    display: grid;
  }
  .issue-preview__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ds-spacing-2) var(--ds-spacing-2-5);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .issue-preview__heading strong {
    font-size: var(--ds-font-size-xs);
  }
  .issue-preview__heading span,
  .issue-preview__more {
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-regular);
  }
  .issue-preview__list {
    display: grid;
    padding: var(--ds-spacing-1);
  }
  .issue-preview__item {
    display: grid;
    min-height: var(--ds-spacing-7);
    grid-template-columns: var(--ds-spacing-5) 7ch var(--ds-spacing-4) minmax(0, 1fr);
    align-items: center;
    gap: var(--ds-spacing-1-5);
    padding: 0 var(--ds-spacing-1-5);
    border-radius: var(--ds-radius-sm);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-regular);
  }
  .issue-preview__id {
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
  }
  .issue-preview__title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .issue-preview__more {
    padding: var(--ds-spacing-1-5) var(--ds-spacing-2-5) var(--ds-spacing-2);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }
  .dependency-card {
    display: grid;
  }
  .dependency-card__heading {
    display: grid;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-3);
  }
  .dependency-card__heading span {
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-regular);
  }
  .dependency-card__heading strong {
    font-size: var(--ds-font-size-sm);
  }
  .dependency-card__meta {
    display: flex;
    align-items: center;
    padding: var(--ds-spacing-2-5) var(--ds-spacing-3);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-regular);
  }
  .dependency-card__meta span {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-1-5);
  }
  .issue-counts {
    display: grid;
    grid-template-columns: var(--ds-spacing-3-5) 3ch var(--ds-spacing-3-5) 3ch;
    box-sizing: border-box;
    min-width: 0;
    align-items: center;
    justify-content: end;
    gap: var(--ds-spacing-1);
    padding-inline: 0;
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .issue-counts > span {
    text-align: left;
  }
  .estimate {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: var(--ds-spacing-1-5);
    color: var(--ds-foreground-muted);
    white-space: nowrap;
  }
  .status-icon {
    display: grid;
    width: var(--ds-spacing-7);
    height: var(--ds-spacing-7);
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: var(--ds-radius-full);
    background: transparent;
    color: var(--ds-foreground-muted);
    cursor: pointer;
  }
  .status-icon:hover {
    background: var(--ds-surface-active);
  }
  .status-icon--readonly,
  .status-icon--readonly:hover {
    background: transparent;
    cursor: default;
  }
  .status-icon[data-status='done'] {
    color: var(--ds-emphasis-green);
  }
  .status-icon[data-status='problem'] {
    color: var(--ds-emphasis-red);
  }
  .status-icon[data-status='wip'] {
    color: var(--ds-emphasis-blue);
  }
  .status-icon[data-status='mvp'] {
    color: var(--ds-emphasis-purple);
  }
  .status-icon[data-status='estimate'] {
    color: var(--ds-emphasis-orange);
  }
  .status-icon:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: 1px;
  }
  .estimate {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    gap: var(--ds-spacing-4);
  }
  .estimate--exceeded {
    color: var(--ds-foreground-muted-red);
  }
  .requirement-row__meta .estimate {
    min-width: 0;
    justify-self: end;
    justify-content: flex-end;
    text-align: right;
  }
  .requirement-row--group .estimate {
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
    line-height: var(--ds-font-line-height-xs);
  }
  .menu-heading {
    display: grid;
    gap: 1px;
    padding: var(--ds-spacing-2) var(--ds-spacing-2-5) var(--ds-spacing-2-5);
  }
  .menu-heading span {
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }
  .menu-heading small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .menu-heading small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @container (max-width: 28rem) {
    .requirement-row__identity {
      gap: var(--ds-spacing-1);
    }
  }
  @container (max-width: 40rem) {
    .requirement-row,
    .requirement-row--group,
    .requirement-row[data-mode='compact'],
    :global(.requirements-grid[data-narrow='true']) .requirement-row[data-mode='compact'],
    :global(.requirements-grid[data-narrow='true']) .requirement-row--group[data-mode='compact'] {
      grid-template-columns: max-content minmax(0, 1fr) var(--ds-spacing-7);
      gap: var(--ds-spacing-1) var(--ds-spacing-2);
      align-items: start;
      padding-block: var(--ds-spacing-2);
    }
    :global(.requirement-row__edit) {
      grid-column: 3;
      grid-row: 1;
      opacity: 1;
      pointer-events: auto;
    }
    .status-slot {
      grid-column: 1;
      grid-row: 1;
      margin: 0;
      padding: 0;
    }
    .requirement-row__identity {
      grid-column: 2;
      grid-row: 1;
      flex-wrap: wrap;
      overflow: visible;
    }
    .requirement-id {
      width: auto;
      min-width: 0;
      max-width: 100%;
    }
    .requirement-copy {
      flex-basis: 100%;
    }
    .requirement-copy strong {
      overflow: visible;
      text-overflow: clip;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .tree-branch {
      display: none;
    }
    .requirement-row__meta {
      display: flex;
      grid-column: 2 / 4;
      grid-row: 2;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: var(--ds-spacing-1) var(--ds-spacing-3);
      padding-left: 0;
    }
    .link-pills {
      display: flex;
    }
    .requirement-row__meta > :global(.aesir-tooltip__anchor),
    .requirement-row__meta > .issue-counts,
    .requirement-row__meta .estimate {
      grid-column: auto;
      justify-self: auto;
    }
    .requirement-row__meta .estimate {
      margin-left: auto;
    }
  }
  .menu-divider {
    height: var(--ds-spacing-px);
    margin: var(--ds-spacing-1-5) calc(var(--ds-spacing-1-5) * -1);
    background: var(--ds-border);
  }
  .menu-status {
    flex: 1;
  }
  :global(.requirement-menu .menu-check) {
    margin-left: auto;
    color: var(--ds-accent-text);
  }
  .requirement-row[data-mode='expanded'] {
    cursor: default;
  }
</style>
