<script>
  import { AesirButton, AesirDropdown, AesirIcon, AesirInput, AesirKbd, AesirPopover, AesirTextarea, AesirTooltip } from '@aesir/svelte';
  import { tick } from 'svelte';
  import TeamChatEmojiPicker from './team-chat-emoji-picker.svelte';
  import TeamChatQuote from './team-chat-quote.svelte';
  import TeamChatText from './team-chat-text.svelte';
  import TeamChatScheduleSend from './team-chat-schedule-send.svelte';
  import { formatChatSelection, safeChatLink } from './team-chat-formatting.js';
  import AtSign from '@lucide/svelte/icons/at-sign';
  import Bold from '@lucide/svelte/icons/bold';
  import Italic from '@lucide/svelte/icons/italic';
  import Underline from '@lucide/svelte/icons/underline';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import List from '@lucide/svelte/icons/list';
  import TextQuote from '@lucide/svelte/icons/text-quote';
  import Code from '@lucide/svelte/icons/code';
  import SquareCode from '@lucide/svelte/icons/square-code';
  import Link from '@lucide/svelte/icons/link';
  import CaseSensitive from '@lucide/svelte/icons/case-sensitive';
  import Eye from '@lucide/svelte/icons/eye';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  let {
    value = $bindable(''),
    preview = $bindable(false),
    label = 'Message',
    placeholder = 'Write a message…',
    people = [],
    replyTo,
    replyPerson,
    oncancelreply,
    onreplyprofile,
    onreplymessage,
    onquote,
    onsend,
    onschedule,
    sendLabel = 'Send',
    sendWith = 'enter',
    sendDisabled = false,
    mobile = false,
    oncancel
  } = $props();
  let form;
  let expandedFor = $state();
  const expanded = $derived(!mobile || expandedFor === label || Boolean(replyTo) || Boolean(oncancel));
  let formattingVisible = $state();
  const showFormatting = $derived(formattingVisible ?? !mobile);
  let linkOpen = $state(false);
  let linkText = $state('');
  let linkUrl = $state('');
  let linkError = $state('');
  let formatError = $state('');
  let linkSelection;
  const formats = [
    { id: 'bold', label: 'Bold', icon: Bold, shortcut: 'B' },
    { id: 'italic', label: 'Italic', icon: Italic, shortcut: 'I' },
    { id: 'underline', label: 'Underline', icon: Underline, shortcut: 'U' },
    { id: 'strike', label: 'Strikethrough', icon: Strikethrough },
    { id: 'ordered', label: 'Numbered list', icon: ListOrdered },
    { id: 'bullet', label: 'Bulleted list', icon: List },
    { id: 'quote', label: 'Block quote', icon: TextQuote },
    { id: 'code', label: 'Inline code', icon: Code },
    { id: 'codeblock', label: 'Code block', icon: SquareCode }
  ];
  async function applyEdit(edit) {
    if (!edit) return;
    if (edit.value.length > 4000) {
      formatError = 'Formatting would exceed the 4,000-character message limit.';
      return;
    }
    value = edit.value;
    preview = false;
    formatError = '';
    await tick();
    const input = form?.querySelector('textarea');
    input?.focus();
    input?.setSelectionRange(edit.start, edit.end);
  }
  function formatSelection(format) {
    const input = form?.querySelector('textarea');
    applyEdit(formatChatSelection(value, input?.selectionStart ?? value.length, input?.selectionEnd ?? value.length, format));
  }
  async function setLinkOpen(open) {
    if (open) {
      const input = form?.querySelector('textarea');
      linkSelection = { start: input?.selectionStart ?? value.length, end: input?.selectionEnd ?? value.length };
      linkText = value.slice(linkSelection.start, linkSelection.end);
      linkUrl = '';
      linkError = '';
    }
    linkOpen = open;
    if (open) {
      await tick();
      form?.ownerDocument.querySelector('.chat-link-editor input')?.focus();
    }
  }
  async function insertLink(close) {
    const href = safeChatLink(linkUrl);
    if (!href) {
      linkError = 'Enter an http, https, or mailto URL.';
      return;
    }
    const { start, end } = linkSelection;
    const text = (linkText.trim() || href).replaceAll('[', '\\[').replaceAll(']', '\\]');
    const draft = value.slice(0, start) + text + value.slice(end);
    const edit = formatChatSelection(draft, start, start + text.length, 'link', href);
    if (edit.value.length > 4000) {
      linkError = 'This link would exceed the 4,000-character message limit.';
      return;
    }
    close({ skipMotion: true });
    await applyEdit(edit);
  }
  function submitLinkOnEnter(event, close) {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      insertLink(close);
    }
  }
  async function cancelLink(close) {
    close({ skipMotion: true });
    await tick();
    const input = form?.querySelector('textarea');
    input?.focus();
    if (linkSelection) input?.setSelectionRange(linkSelection.start, linkSelection.end);
  }
  async function insertEmoji(emoji) {
    const input = form?.querySelector('textarea');
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;
    if (value.length - (end - start) + emoji.length > 4000) return;
    value = value.slice(0, start) + emoji + value.slice(end);
    preview = false;
    await tick();
    const editor = form?.querySelector('textarea');
    editor?.focus();
    editor?.setSelectionRange(start + emoji.length, start + emoji.length);
  }
  const mentionItems = $derived(people.map((person) => ({ value: person.name, label: person.name, icon: 'user' })));
  function collapse() {
    expandedFor = undefined;
    formattingVisible = undefined;
    form?.querySelector('textarea')?.blur();
    form?.closest('.conversation')?.querySelector('[data-conversation-heading]')?.focus({ preventScroll: true });
  }
  const send = () => {
    if (!sendDisabled && value.trim()) {
      preview = false;
      onsend?.();
      if (mobile) collapse();
    }
  };
</script>

<form
  class="chat-composer"
  data-mobile={mobile || undefined}
  data-expanded={expanded}
  aria-label={label}
  {@attach (node) => {
    form = node;
    return () => {
      form = undefined;
    };
  }}
  onsubmit={(event) => {
    event.preventDefault();
    send();
  }}
>
  {#if expanded && showFormatting && !preview}
    <div class="chat-composer__formatting" role="group" aria-label="Message formatting">
      {#each formats as format (format.id)}
        <AesirTooltip contentStyle="width: max-content; max-width: calc(100vw - var(--ds-spacing-4));">
          {#snippet content()}
            <span class="chat-format-help">
              <span>{format.label}</span>
              {#if format.shortcut}<AesirKbd meta small>{format.shortcut}</AesirKbd>{/if}
            </span>
          {/snippet}
          {#snippet trigger(props)}<AesirButton
              {...props}
              variant="ghost"
              size="icon-sm"
              aria-label={format.label}
              aria-keyshortcuts={format.shortcut ? `Control+${format.shortcut} Meta+${format.shortcut}` : undefined}
              onpointerdown={(event) => event.preventDefault()}
              onclick={() => formatSelection(format.id)}
            >
              <AesirIcon icon={format.icon} size={16} />
            </AesirButton>{/snippet}
        </AesirTooltip>
        {#if format.id === 'strike'}
          <AesirPopover
            bind:open={() => linkOpen, setLinkOpen}
            placement="top"
            align="start"
            contentClass="chat-link-editor"
            contentStyle="box-sizing: border-box; width: min(var(--ds-sizing-xs), calc(100vw - var(--ds-spacing-8)));"
          >
            {#snippet trigger(props)}<AesirButton {...props} variant="ghost" size="icon-sm" aria-label="Insert link"><AesirIcon icon={Link} size={16} /></AesirButton>{/snippet}
            {#snippet content({ close })}
              <div class="chat-link-fields" role="group" aria-label="Insert link">
                <AesirInput label="Link text" bind:value={linkText} onkeydown={(event) => submitLinkOnEnter(event, close)} />
                <AesirInput label="URL" type="url" placeholder="https://example.com" bind:value={linkUrl} error={linkError} onkeydown={(event) => submitLinkOnEnter(event, close)} />
                <div class="chat-link-actions">
                  <AesirButton variant="ghost" size="sm" onclick={() => cancelLink(close)}>Cancel</AesirButton><AesirButton size="sm" aria-label="Apply link" onclick={() => insertLink(close)}>
                    Insert link
                  </AesirButton>
                </div>
              </div>
            {/snippet}
          </AesirPopover>
        {/if}
      {/each}
    </div>
  {/if}
  {#if replyTo && replyPerson}
    <div class="chat-composer__reply">
      <TeamChatQuote message={replyTo} person={replyPerson} onprofile={onreplyprofile} onmessage={onreplymessage} onclick={onquote} />
      <AesirButton
        variant="ghost"
        size="icon-sm"
        aria-label="Cancel reply"
        onclick={async () => {
          oncancelreply?.();
          preview = false;
          await tick();
          form?.querySelector('textarea')?.focus();
        }}
      >
        <AesirIcon name="x" size={14} />
      </AesirButton>
    </div>
  {/if}
  <div class="chat-composer__editor">
    {#if preview}<div class="chat-composer__preview" aria-label="Message preview">
        {#if value.trim()}<TeamChatText text={value} />{:else}<span>Nothing to preview yet.</span>{/if}
      </div>{:else}<AesirTextarea
        class="chat-composer__input"
        bind:value
        aria-label={label}
        {placeholder}
        resize={mobile && !expanded ? 'none' : 'auto'}
        rows={mobile && !expanded ? 1 : 2}
        maxlength={4000}
        onfocus={() => {
          if (mobile) expandedFor = label;
        }}
        oninput={() => {
          formatError = '';
          if (mobile) expandedFor = label;
        }}
        onkeydown={(event) => {
          if (event.key === 'Escape' && !event.isComposing && oncancel) {
            event.preventDefault();
            event.stopPropagation();
            oncancel();
            return;
          }
          if (mobile && expanded && !replyTo && event.key === 'Escape' && !event.isComposing) {
            event.preventDefault();
            event.stopPropagation();
            collapse();
            return;
          }
          if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.isComposing) {
            const format = { b: 'bold', i: 'italic', u: 'underline' }[event.key.toLowerCase()];
            if (format) {
              event.preventDefault();
              formatSelection(format);
              return;
            }
          }
          const sendShortcut = sendWith === 'modifier-enter' ? event.ctrlKey || event.metaKey : true;
          if (!mobile && event.key === 'Enter' && sendShortcut && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
            event.preventDefault();
            send();
          }
        }}
      />{/if}
    {#if mobile && expanded && !replyTo && !oncancel}
      <AesirButton class="chat-composer__collapse" variant="ghost" size="icon-sm" aria-label="Collapse message input" onclick={collapse}>
        <AesirIcon icon={ChevronDown} size={18} />
      </AesirButton>
    {/if}
  </div>
  {#if formatError}<p class="chat-composer__error" role="alert">{formatError}</p>{/if}
  {#if expanded}<div class="chat-composer__toolbar">
      <AesirButton variant="ghost" size="icon-sm" aria-label="Show formatting" aria-pressed={showFormatting} onclick={() => (formattingVisible = !showFormatting)}>
        <AesirIcon icon={CaseSensitive} size={18} />
      </AesirButton>
      <TeamChatEmojiPicker onselect={insertEmoji} />
      <AesirDropdown items={mentionItems} label="Mention someone" placement="top" onselect={(item) => insertEmoji(`${value && !value.endsWith(' ') ? ' ' : ''}@${item.value} `)}>
        {#snippet trigger(props)}<AesirButton {...props} variant="ghost" size="icon-sm" aria-label="Mention someone"><AesirIcon icon={AtSign} size={16} /></AesirButton>{/snippet}
      </AesirDropdown>
      {#if !mobile}<AesirButton variant="ghost" size="icon-sm" aria-label={preview ? 'Edit message' : 'Preview message'} aria-pressed={preview} onclick={() => (preview = !preview)}>
          <AesirIcon icon={Eye} size={16} />
        </AesirButton>{/if}
      {#if oncancel}<AesirButton class="chat-composer__cancel" variant="outline" size="sm" onclick={oncancel}>Cancel</AesirButton>{/if}
      {#if onschedule}<TeamChatScheduleSend disabled={sendDisabled || !value.trim()} {label} {onschedule} />{:else}<AesirButton
          class="chat-composer__submit"
          size="sm"
          type="submit"
          disabled={sendDisabled || !value.trim()}
        >
          {sendLabel}
        </AesirButton>{/if}
    </div>{/if}
</form>

<style>
  .chat-composer[data-mobile] :global(.chat-composer__input textarea) {
    min-height: var(--ds-spacing-12);
    font-size: var(--ds-font-size-base);
  }
  .chat-composer[data-mobile][data-expanded='false'] :global(.chat-composer__input textarea) {
    height: var(--ds-spacing-12);
    max-height: var(--ds-spacing-12);
    overflow: hidden;
  }
  .chat-composer[data-mobile][data-expanded='true'] :global(.chat-composer__input textarea) {
    min-height: var(--ds-spacing-20);
  }
  .chat-composer__editor {
    display: flex;
    align-items: flex-start;
    min-width: 0;
  }
  .chat-composer__editor :global(.chat-composer__input),
  .chat-composer__preview {
    flex: 1;
    min-width: 0;
  }
  .chat-composer :global(.chat-composer__collapse) {
    flex: none;
    color: var(--ds-foreground-muted);
  }
  .chat-composer[data-mobile] .chat-composer__toolbar :global(button) {
    min-width: var(--ds-spacing-8);
    min-height: var(--ds-spacing-8);
  }
  .chat-composer[data-mobile] .chat-composer__toolbar {
    flex-wrap: wrap;
    gap: var(--ds-spacing-2);
  }
  .chat-composer :global(.chat-composer__cancel),
  .chat-composer :global(.chat-composer__submit) {
    margin-left: auto;
  }
  .chat-composer :global(.chat-composer__cancel + .chat-composer__submit) {
    margin-left: 0;
  }
  .chat-format-help {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .chat-format-help :global(.aesir-kbd) {
    flex: none;
  }
  .chat-composer {
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
  }
  .chat-composer:hover,
  .chat-composer:has(:global(textarea:focus)) {
    border-color: var(--ds-border-hover);
  }
  .chat-composer:has(:global(textarea:focus-visible)) {
    border-color: var(--ds-border-active);
    box-shadow: inset 0 0 0 var(--ds-spacing-px) var(--ds-border-active);
  }
  .chat-composer :global(.chat-composer__input textarea) {
    min-height: var(--ds-spacing-16);
    max-height: 10rem;
    padding: var(--ds-spacing-3);
    border: 0;
    border-radius: 0;
    box-shadow: none;
    outline: none;
    background: transparent;
    font-size: var(--ds-font-size-sm);
  }
  .chat-composer__toolbar {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-1) var(--ds-spacing-2) var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
  }
  .chat-composer__formatting {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ds-spacing-0-5);
    padding: var(--ds-spacing-2) var(--ds-spacing-2) 0;
  }
  .chat-composer__formatting :global(.aesir-tooltip__anchor) {
    display: inline-flex;
  }
  .chat-composer__formatting :global(button),
  .chat-composer__toolbar :global(button[aria-pressed]) {
    color: var(--ds-foreground-muted);
  }
  .chat-composer__toolbar :global(button[aria-pressed='true']) {
    background: var(--ds-surface);
    color: var(--ds-foreground);
  }
  .chat-composer__preview {
    min-height: var(--ds-spacing-16);
    max-height: 10rem;
    overflow: auto;
    padding: var(--ds-spacing-3);
  }
  .chat-link-fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    min-width: 0;
    gap: var(--ds-spacing-3);
  }
  .chat-link-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--ds-spacing-2);
  }
  .chat-composer__error {
    margin: 0;
    padding-inline: var(--ds-spacing-3);
    font-size: var(--ds-font-size-xs);
  }
  .chat-composer__reply {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-2) var(--ds-spacing-2) 0;
  }
  @media (forced-colors: active) {
    .chat-composer:has(:global(textarea:focus-visible)) {
      outline: var(--ds-spacing-0-5) solid Highlight;
      outline-offset: var(--ds-spacing-0-5);
    }
  }
</style>
