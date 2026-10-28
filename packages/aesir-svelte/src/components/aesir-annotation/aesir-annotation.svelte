<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cubicOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';

  import AesirAvatar from '../aesir-avatar/aesir-avatar.svelte';
  import AesirButton from '../aesir-button/aesir-button.svelte';
  import AesirDropdown from '../aesir-dropdown/aesir-dropdown.svelte';
  import type { DropdownItem } from '../aesir-dropdown/types.js';
  import AesirIcon from '../aesir-icon/aesir-icon.svelte';
  import AesirTooltip from '../aesir-tooltip/aesir-tooltip.svelte';

  type AnnotationAuthor = { name: string; src?: string; fallback?: string };
  type AnnotationMessage = { author: AnnotationAuthor; time?: string; text: string; editable?: boolean };
  type DiffLine = { type?: string; text: string };
  type AnnotationProps = Omit<HTMLAttributes<HTMLElement>, 'class' | 'id' | 'style'> & {
    class?: string;
    style?: string;
    id?: string;
    kind?: 'comment' | 'suggestion';
    author: AnnotationAuthor;
    time?: string;
    text?: string;
    messages?: AnnotationMessage[];
    diff?: DiffLine[];
    active?: boolean;
    editable?: boolean;
    onactivate?: (active: boolean) => void;
    onresolve?: () => void;
    onremovemessage?: (index: number) => void;
    onedit?: (index: number, text: string) => void;
    onaccept?: () => void;
    onreject?: () => void;
    onreply?: (text: string) => void;
  };
  let {
    class: className = '',
    style,
    id,
    kind = 'comment',
    author,
    time,
    text = '',
    messages,
    diff = [],
    active = false,
    editable = false,
    onactivate,
    onresolve,
    onremovemessage,
    onedit,
    onaccept,
    onreject,
    onreply,
    ...restProps
  }: AnnotationProps = $props();

  const items = $derived(messages ?? [{ author, time, text, editable }]);
  const threadItems = $derived(kind === 'comment' ? items : (messages ?? []));

  let editingMessage = $state.raw<AnnotationMessage | null>(null);
  let replyExpanded = $state(false);
  let draftText = $state('');
  let replyText = $state('');

  const messageActions = (item: AnnotationMessage): DropdownItem[] => [
    ...(item.editable !== false ? [{ label: 'Edit comment', value: 'edit', icon: 'edit' }] : []),
    { label: 'Remove comment', value: 'remove', icon: 'trash-2', variant: 'destructive' }
  ];

  const startEdit = (item: AnnotationMessage) => {
    editingMessage = item;
    draftText = item.text;
  };
  const saveEdit = (index: number) => {
    onedit?.(index, draftText);
    editingMessage = null;
  };

  const deactivate = () => onactivate?.(false);
  const submitReply = (event: SubmitEvent) => {
    event.preventDefault();
    if (!replyText.trim()) return;
    onreply?.(replyText);
    replyText = '';
    replyExpanded = false;
  };

  $effect(() => {
    if (!active) {
      replyExpanded = false;
      editingMessage = null;
    }
  });
</script>

<article
  {id}
  data-annotation-id={id}
  class={`aesir-annotation ${kind === 'suggestion' ? 'aesir-annotation--suggestion' : ''} ${active ? 'aesir-annotation--active' : ''} ${className}`.trim()}
  {style}
  {...restProps}
>
  <button class="aesir-annotation__open" type="button" aria-label={kind === 'suggestion' ? 'Open suggestion discussion' : 'Reply to comment'} onclick={() => onactivate?.(true)}></button>
  {#if kind === 'suggestion'}
    <header>
      <AesirTooltip content={author.name}>
        {#snippet trigger(props)}
          <span class="aesir-annotation__avatar" {...props}>
            <AesirAvatar src={author.src} fallback={author.fallback} size="sm" aria-label={author.name} />
          </span>
        {/snippet}
      </AesirTooltip>
      <span>
        {author.name}
        <small>{time} · Suggestion</small>
      </span>
      <div class="aesir-annotation__actions">
        <AesirTooltip content="Accept suggestion">
          {#snippet trigger(props)}
            <AesirButton {...props} class="aesir-annotation__accept" variant="ghost" size="icon-sm" aria-label="Accept suggestion" onclick={onaccept}><AesirIcon name="check" /></AesirButton>
          {/snippet}
        </AesirTooltip>
        <AesirTooltip content="Reject suggestion">
          {#snippet trigger(props)}
            <AesirButton {...props} class="aesir-annotation__reject" variant="ghost" size="icon-sm" aria-label="Reject suggestion" onclick={onreject}><AesirIcon name="x" /></AesirButton>
          {/snippet}
        </AesirTooltip>
      </div>
    </header>
    <div class="aesir-annotation__diff" aria-label={diff.length > 1 ? 'Suggested change' : 'Suggested addition'}>
      {#each diff as part, index (index)}
        <span>
          <small aria-hidden="true">{part.type === 'del' ? '−' : '+'}</small>
          {#if part.type === 'del'}<del>{part.text}</del>{:else}<ins>{part.text}</ins>{/if}
        </span>
      {/each}
    </div>
  {/if}

  {#each threadItems as item, index (index)}
    <div class="aesir-annotation__message">
      <header>
        <AesirTooltip placement="bottom" content={item.author.name}>
          {#snippet trigger(props)}
            <span class="aesir-annotation__avatar" {...props}>
              <AesirAvatar src={item.author.src} fallback={item.author.fallback} size="sm" aria-label={item.author.name} />
            </span>
          {/snippet}
        </AesirTooltip>
        <span>
          {item.author.name}
          <small>{item.time}</small>
        </span>
        <div class="aesir-annotation__actions">
          {#if kind === 'comment' && index === 0}
            <AesirTooltip content="Resolve comment">
              {#snippet trigger(props)}
                <AesirButton {...props} variant="ghost" size="icon-sm" aria-label="Resolve comment" onclick={onresolve}><AesirIcon name="check" /></AesirButton>
              {/snippet}
            </AesirTooltip>
          {/if}
          <AesirDropdown
            items={messageActions(item)}
            align="end"
            label="Comment actions"
            onselect={(action) => {
              if (action.value === 'edit') startEdit(item);
              if (action.value === 'remove') onremovemessage?.(index);
            }}
          >
            {#snippet trigger(props)}
              <AesirButton variant="ghost" size="icon-sm" aria-label="Comment actions" {...props}><AesirIcon name="ellipsis" /></AesirButton>
            {/snippet}
          </AesirDropdown>
        </div>
      </header>
      {#if editingMessage === item}
        <textarea class="aesir-annotation__edit" bind:value={draftText} rows="3" aria-label="Edit comment"></textarea>
        <footer class="aesir-annotation__edit-actions">
          <AesirButton variant="ghost" size="sm" onclick={() => (editingMessage = null)}>Cancel</AesirButton>
          <AesirButton variant="accent" size="sm" onclick={() => saveEdit(index)}>Save</AesirButton>
        </footer>
      {:else}
        <p>{item.text}</p>
      {/if}
    </div>
  {/each}

  {#if active}
    <form class="aesir-annotation__reply" data-expanded={replyExpanded || undefined} onsubmit={submitReply} transition:slide={{ duration: 180, easing: cubicOut }}>
      <textarea bind:value={replyText} rows={replyExpanded ? 2 : 1} aria-label="Reply to thread" placeholder="Reply or add others with @" onfocus={() => (replyExpanded = true)}></textarea>
      {#if replyExpanded}
        <footer transition:slide={{ duration: 140, easing: cubicOut }}>
          <AesirButton type="button" variant="ghost" size="sm" onclick={deactivate}>Cancel</AesirButton>
          <AesirButton type="submit" variant="accent" size="sm" disabled={!replyText.trim()}>Reply</AesirButton>
        </footer>
      {/if}
    </form>
  {/if}
</article>

<style>
  .aesir-annotation {
    position: relative;
    display: grid;
    box-sizing: border-box;
    width: 100%;
    max-width: 18rem;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    box-shadow: 0 var(--ds-spacing-1) var(--ds-spacing-4) color-mix(in oklch, var(--ds-fixed-black) 8%, transparent);
  }
  .aesir-annotation--active {
    border-color: var(--ds-accent-border);
    box-shadow:
      0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring),
      0 var(--ds-spacing-1) var(--ds-spacing-4) color-mix(in oklch, var(--ds-fixed-black) 8%, transparent);
  }
  .aesir-annotation--suggestion {
    gap: var(--ds-spacing-1-5);
    padding: var(--ds-spacing-2);
    cursor: pointer;
  }
  .aesir-annotation:has(.aesir-annotation__open:focus-visible) {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
  }
  .aesir-annotation__open {
    position: absolute;
    inset: 0;
    z-index: 0;
    padding: 0;
    border: 0;
    border-radius: inherit;
    background: transparent;
    cursor: pointer;
  }
  .aesir-annotation > header,
  .aesir-annotation > .aesir-annotation__diff,
  .aesir-annotation__message > header,
  .aesir-annotation__message > p {
    position: relative;
    z-index: 1;
    pointer-events: none;
  }
  .aesir-annotation__actions,
  .aesir-annotation__avatar,
  .aesir-annotation__edit,
  .aesir-annotation__edit-actions,
  .aesir-annotation__reply {
    position: relative;
    z-index: 2;
    pointer-events: auto;
  }
  .aesir-annotation header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .aesir-annotation header > span {
    display: grid;
    font-size: var(--ds-font-size-sm);
  }
  .aesir-annotation small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .aesir-annotation p {
    margin: 0;
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
  .aesir-annotation__message {
    display: grid;
    gap: var(--ds-spacing-2);
  }
  .aesir-annotation__message + .aesir-annotation__message {
    padding-top: var(--ds-spacing-3);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }
  .aesir-annotation footer,
  .aesir-annotation__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-spacing-1);
  }
  .aesir-annotation__actions {
    align-items: center;
  }
  :global(.aesir-annotation__accept) {
    color: var(--ds-accent-text);
  }
  :global(.aesir-annotation__reject) {
    color: var(--ds-foreground-muted);
  }
  .aesir-annotation__edit,
  .aesir-annotation__reply textarea {
    box-sizing: border-box;
    width: 100%;
    padding: var(--ds-spacing-2);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
    color: var(--ds-foreground);
    font: inherit;
    font-size: var(--ds-font-size-sm);
    outline: none;
  }
  .aesir-annotation__edit {
    resize: vertical;
  }
  .aesir-annotation__reply {
    display: grid;
    gap: var(--ds-spacing-2);
  }
  .aesir-annotation__reply textarea {
    min-height: var(--ds-spacing-10);
    resize: none;
    line-height: var(--ds-font-line-height-sm);
  }
  .aesir-annotation__reply[data-expanded] textarea {
    min-height: var(--ds-spacing-14);
  }
  .aesir-annotation__edit:focus-visible,
  .aesir-annotation__reply textarea:focus-visible {
    border-color: var(--ds-accent-border);
    box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
  }
  .aesir-annotation__diff {
    display: grid;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-1-5) var(--ds-spacing-2);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
  .aesir-annotation__diff > span {
    display: grid;
    grid-template-columns: var(--ds-spacing-4) minmax(0, 1fr);
    gap: var(--ds-spacing-1);
  }
  .aesir-annotation__diff small {
    padding-top: var(--ds-spacing-0-5);
    font-weight: var(--ds-font-weight-medium);
    text-align: center;
  }
  .aesir-annotation__diff del,
  .aesir-annotation__diff ins {
    padding: var(--ds-spacing-0-5) var(--ds-spacing-1);
    border-radius: var(--ds-radius-sm);
    text-decoration: none;
  }
  .aesir-annotation__diff del {
    background: var(--ds-surface-red);
    color: var(--ds-foreground-muted-red);
    text-decoration: line-through;
  }
  .aesir-annotation__diff ins {
    background: var(--ds-surface-green);
    color: var(--ds-foreground-muted-green);
  }
</style>
