<script>
  import { AesirIcon } from '@aesir/svelte';
  import RequirementTaskTable from './requirement-task-table.svelte';
  let { item, fields, estimateUnit, tasks = [] } = $props();
</script>

<section class="expanded-requirement" style:--detail-indent={`${(item.depth ?? 0) * 1.5}rem`} aria-label={`Expanded details for ${item.id}`}>
  {#if fields.includes('description') && item.description}
    <div class="expanded-requirement__section">
      <p class="expanded-requirement__description">{item.description}</p>
    </div>
  {/if}
  {#if fields.includes('notes') && item.notes?.length}
    <div class="expanded-requirement__section">
      <div class="expanded-requirement__notes">
        {#each item.notes as note, index (`${note.type}-${index}`)}
          <span data-note={note.type}><AesirIcon name={note.type === 'remark' ? 'triangle-alert' : 'message-square-more'} size={13} /> {note.text}</span>
        {/each}
      </div>
    </div>
  {/if}
  {#if fields.includes('tasks') && tasks.length}
    <RequirementTaskTable {tasks} {estimateUnit} />
  {/if}
</section>

<style>
  .expanded-requirement {
    --expanded-content-inset: calc(7.5rem + var(--ds-spacing-4));

    position: relative;
    display: grid;
    min-width: 0;
    box-sizing: border-box;
    gap: var(--ds-spacing-3);
    margin: 0 var(--ds-spacing-4) var(--ds-spacing-3) calc(var(--ds-spacing-3) + var(--ds-spacing-7) + var(--ds-spacing-6));
    overflow: visible;
    padding: var(--ds-spacing-3) var(--ds-spacing-4) var(--ds-spacing-4) calc(var(--ds-spacing-4) + var(--expanded-content-inset) + var(--detail-indent));
    border-radius: var(--ds-radius-md);
    background: var(--ds-background-secondary);
  }
  .expanded-requirement__section {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-1-5);
  }
  .expanded-requirement__description {
    max-width: 72ch;
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: 1.5rem;
  }
  .expanded-requirement__notes {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .expanded-requirement__notes > span {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-1-5);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .expanded-requirement__notes > span {
    max-width: 72ch;
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
  }
  .expanded-requirement__notes > span[data-note='remark'] {
    width: 100%;
    max-width: none;
    box-sizing: border-box;
    color: var(--ds-foreground-muted-red);
    background: var(--ds-surface-red);
  }
  :global(.requirements-grid[data-mode='expanded']) .expanded-requirement {
    margin-bottom: var(--ds-spacing-6);
  }
  @container (max-width: 48rem) {
    .expanded-requirement {
      --expanded-content-inset: 0px;

      margin-right: var(--ds-spacing-3);
    }
  }
</style>
