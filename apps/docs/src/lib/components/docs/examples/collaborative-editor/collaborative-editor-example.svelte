<script>
  import { onMount } from 'svelte';
  import {
    AesirAnnotation,
    AesirAvatar,
    AesirButton,
    AesirCommandMenu,
    AesirDialog,
    AesirDropdown,
    AesirIcon,
    AesirToggle,
    AesirToggleGroup,
    AesirToggleGroupItem,
    AesirTooltip,
    toast
  } from '@aesir/svelte';
  let editorElement;
  let fullscreen = $state(false);
  let richLinksRefreshing = $state(false);
  let transformsOpen = $state(false);
  let taskMenuOpen = $state(false);
  let mergeRequestMenuOpen = $state(false);
  let documentMenuOpen = $state(false);
  let suggestionMode = $state(false);
  let view = $state('inline');
  let showComments = $state(true);
  let showToc = $state(false);
  let activeAnnotation = $state(null);
  let composing = $state(false);
  let tocItems = $state([]);

  let threads = $state({
    comment: {
      id: 'annotation-comment-river',
      kind: 'comment',
      open: true,
      messages: [
        { author: 0, time: '12 min ago', text: 'Could we keep the river reference here? It gives Bookmarksgrove a stronger sense of place.', editable: true },
        { author: 1, time: '5 min ago', text: 'Agreed, it also sets up the landmark later in the doc.', editable: false }
      ]
    },
    secondaryComment: {
      id: 'annotation-comment-landmark',
      kind: 'comment',
      open: true,
      editable: false,
      author: 2,
      time: '2 min ago',
      text: 'Could we use a more concrete landmark here? It would make the journey easier to picture.'
    },
    suggestion: {
      id: 'annotation-suggestion-semoliki',
      kind: 'suggestion',
      open: true,
      author: 1,
      time: '5 min ago',
      diff: [
        { type: 'del', text: 'devious Semikoli' },
        { type: 'ins', text: 'devious semicolons' }
      ]
    },
    additionSuggestion: {
      id: 'annotation-suggestion-patience',
      kind: 'suggestion',
      open: true,
      author: 0,
      time: '1 min ago',
      diff: [{ type: 'ins', text: 'with unusual patience,' }]
    }
  });
  const focusOnMount = (node) => node.focus();

  const openCommentComposer = () => {
    activeAnnotation = null;
    showComments = true;
    composing = true;
  };

  const refreshRichLinks = () => {
    if (richLinksRefreshing) return;
    richLinksRefreshing = true;
    setTimeout(() => {
      richLinksRefreshing = false;
      toast.success('Rich link refreshed');
    }, 900);
  };

  const activateAnnotation = (key, active) => {
    composing = false;
    activeAnnotation = active ? key : null;
  };

  const openThread = (key) => {
    showComments = true;
    threads[key].open = true;
  };

  const layoutAnnotations = (node) => {
    let frame;
    let cards = [];
    const tokenPixels = (name) => {
      const raw = getComputedStyle(node).getPropertyValue(name).trim();
      if (raw.endsWith('rem')) return Number.parseFloat(raw) * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      return Number.parseFloat(raw) || 0;
    };
    const update = () => {
      frame = undefined;
      const gap = tokenPixels('--ds-spacing-2');
      let railBottom = Number.NEGATIVE_INFINITY;
      for (const card of cards) {
        if (getComputedStyle(card).position !== 'absolute') {
          card.style.setProperty('--annotation-shift', '0px');
          continue;
        }
        const anchor = card.closest('.line')?.offsetTop ?? 0;
        const shift = Math.max(0, railBottom + gap - anchor);
        card.style.setProperty('--annotation-shift', `${shift}px`);
        railBottom = anchor + shift + card.offsetHeight;
      }
    };
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(schedule);
    const syncCards = () => {
      resizeObserver.disconnect();
      cards = [...node.querySelectorAll('.aesir-annotation, .composer')];
      resizeObserver.observe(node);
      cards.forEach((card) => resizeObserver.observe(card));
      schedule();
    };
    const mutationObserver = new MutationObserver(syncCards);
    mutationObserver.observe(node, { childList: true, subtree: true });
    syncCards();
    return {
      destroy: () => {
        if (frame !== undefined) cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      }
    };
  };

  const collectHeadings = (node) => {
    let frame;
    const update = () => {
      frame = undefined;
      tocItems = [...node.querySelectorAll('h1, h2')].map((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        return { id, text: heading.textContent, level: heading.tagName === 'H1' ? 1 : 2 };
      });
    };
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(node, { childList: true, subtree: true, characterData: true });
    schedule();
    return {
      destroy: () => {
        if (frame !== undefined) cancelAnimationFrame(frame);
        observer.disconnect();
      }
    };
  };
  const scrollToHeading = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await editorElement?.requestFullscreen();
  };

  onMount(() => {
    const syncFullscreen = () => (fullscreen = document.fullscreenElement === editorElement);
    const clearActiveAnnotation = (event) => {
      if (event.target.closest('.aesir-annotation')) return;
      activeAnnotation = null;
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('pointerdown', clearActiveAnnotation);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('pointerdown', clearActiveAnnotation);
    };
  });

  const menus = [
    {
      label: 'Document',
      items: [
        { label: 'Submit', value: 'save', icon: 'check', shortcut: 'Ctrl+S' },
        { label: 'Export as PDF', value: 'pdf', icon: 'download' }
      ]
    },
    {
      label: 'Templates',
      items: [
        { label: 'Research article', value: 'research', icon: 'file' },
        { label: 'Project proposal', value: 'proposal', icon: 'file' },
        { label: 'Technical report', value: 'report', icon: 'file' }
      ]
    },
    {
      label: 'Settings',
      items: [
        { label: 'Autocomplete Markdown', value: 'autocomplete', role: 'menuitemcheckbox', checked: true },
        { label: 'Autoclose brackets', value: 'brackets', role: 'menuitemcheckbox', checked: true },
        { label: 'Open links in new tabs', value: 'links', role: 'menuitemcheckbox', checked: true },
        { label: 'Editor preferences…', value: 'preferences', icon: 'settings' }
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'Transform examples', value: 'transforms', icon: 'sparkles', action: () => (transformsOpen = true) },
        { label: 'Custom syntax guide', value: 'syntax', icon: 'circle-question-mark' },
        { label: 'Directives and roles', value: 'directives', icon: 'info' },
        { label: 'Keyboard shortcuts', value: 'shortcuts', icon: 'command' }
      ]
    }
  ];
  const documentMenuItems = menus.map((menu) => ({ ...menu, value: menu.label.toLowerCase() }));
  const sourceDocument = `# The Little Blind Text

Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.

## Bookmarksgrove

Separated they live in Bookmarksgrove, right at the coast of the Semantics, a large language ocean. A small river named Duden flows by their place and supplies it with the necessary regelialia.

:::{note}
Bookmarksgrove stands where language, geography, and imagination meet. It is a useful landmark for this demonstration document.
:::

It is a paradisematic country, in which roasted parts of sentences fly into your mouth. Even the all-powerful Pointing has no control over the blind texts.

## The World of Grammar

One day, however, a small line of blind text by the name of Lorem Ipsum decided to leave for the far World of Grammar.

The Big Oxmox advised her not to do so, because there were thousands of bad Commas, wild Question Marks, and devious Semikoli. The Little Blind Text did not listen.

She packed her seven versalia, put her initial into the belt, and made herself on the way.

## Across the Italic Mountains

When she reached the first hills of the Italic Mountains, she had one last view of the skyline of Bookmarksgrove, the headline of Alphabet Village, and the subline of Line Lane.

:::{note}
The repeated place names make this passage useful for reviewing long-form edits, comments, and suggestions.
:::

A rhetorical question ran over her cheek, then she continued on her way. There she met a copy.

## The Copy's Warning

The copy warned the Little Blind Text that where it came from, it had been rewritten a thousand times. Everything left of its origin was the word “and”. She should turn around and return to her own safe country.

But nothing the copy said could convince her. Before long, a few insidious Copy Writers ambushed her, made her drunk with Longe and Parole, and dragged her into their agency, where they used her for their projects again and again.

And if she has not been rewritten, they are still using her.`;
  const sourceLines = sourceDocument.split('\n');
  const documentLines = [
    { type: 'heading', level: 1, text: 'The Little Blind Text' },
    { type: 'blank' },
    { type: 'lead', text: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.' },
    { type: 'blank' },
    { type: 'heading', level: 2, text: 'Bookmarksgrove' },
    {
      type: 'anchored',
      thread: 'comment',
      sourceMatch: 'Separated they live in Bookmarksgrove',
      before: 'Separated they live in Bookmarksgrove, right at the coast of the Semantics, ',
      anchorText: 'a large language ocean',
      after: '. A small river named Duden flows by their place and supplies it with the necessary regelialia.'
    },
    { type: 'blank' },
    { type: 'note', text: 'Bookmarksgrove stands where language, geography, and imagination meet. It is a useful landmark for this demonstration document.' },
    { type: 'blank' },
    { type: 'heading', level: 2, text: 'The World of Grammar' },
    {
      type: 'selection',
      active: true,
      before: 'One day, however, a small line of blind text by the name of ',
      selected: 'Lorem Ipsum',
      after: ' decided to leave for the far World of Grammar.'
    },
    { type: 'blank' },
    { type: 'heading', level: 2, text: 'The Warning' },
    {
      type: 'diff',
      thread: 'suggestion',
      sourceMatch: 'devious Semikoli',
      before: 'The Big Oxmox advised her not to go, because there were thousands of bad Commas, wild Question Marks, and ',
      deleted: 'devious Semikoli',
      inserted: 'devious semicolons',
      after: '. The Little Blind Text did not listen.'
    },
    { type: 'text', text: 'She packed her seven versalia, put her initial into the belt, and made herself on the way.' },
    { type: 'text', text: 'She left Bookmarksgrove despite every warning from the Big Oxmox.' },
    { type: 'blank' },
    { type: 'heading', level: 2, text: 'Across the Italic Mountains' },
    {
      type: 'anchored',
      thread: 'secondaryComment',
      sourceMatch: 'headline of Alphabet Village',
      before: 'When she reached the first hills of the Italic Mountains, she had one last view of the skyline of Bookmarksgrove, the ',
      anchorText: 'headline of Alphabet Village',
      after: ', and the subline of Line Lane.'
    },
    { type: 'text', text: 'A rhetorical question ran over her cheek, then she continued on her way. There she met a copy.' },
    { type: 'blank' },
    { type: 'heading', level: 2, text: "The Copy's Warning" },
    {
      type: 'insert',
      thread: 'additionSuggestion',
      sourceMatch: 'The copy warned the Little Blind Text',
      before: 'The copy, ',
      inserted: 'with unusual patience,',
      after: ' warned the Little Blind Text that where it came from, it had been rewritten a thousand times. Everything left of its origin was the word “and”.'
    },
    { type: 'text', text: 'She should turn around and return to her own safe country, but nothing the copy said could convince her.' },
    { type: 'blank' },
    { type: 'note', text: 'The repeated place names make this passage useful for reviewing long-form edits, comments, and suggestions.' },
    { type: 'blank' },
    {
      type: 'text',
      text: 'Before long, a few insidious Copy Writers ambushed her, made her drunk with Longe and Parole, and dragged her into their agency, where they used her for their projects again and again.'
    }
  ];
  const sourceRowLines = new Map(
    documentLines
      .filter((line) => line.sourceMatch)
      .map((line) => [sourceLines.findIndex((raw) => raw.includes(line.sourceMatch)), line])
      .filter(([index]) => index !== -1)
  );
  const transformExamples = [
    { label: 'Issue in this repo', syntax: '#1', result: 'Issue #1' },
    { label: 'PR in this repo', syntax: '!2', result: 'Merge request !2' },
    { label: 'Issue in another repo', syntax: 'github/docs#30828', result: 'github/docs · Issue #30828' },
    { label: 'PR in another repo', syntax: 'github/docs!100', result: 'github/docs · PR !100' },
    { label: 'Person or organization', syntax: '@antmicro', result: 'antmicro' }
  ];
  const collaborators = [
    { name: 'John Doe', src: 'https://avatars.jakerunzer.com/John%20Doe', fallback: 'JD' },
    { name: 'Jane Smith', src: 'https://avatars.jakerunzer.com/Jane%20Smith', fallback: 'JS' },
    { name: 'Morgan Brown', src: 'https://avatars.jakerunzer.com/Morgan%20Brown', fallback: 'MB' },
    { name: 'Alice Kim', src: 'https://avatars.jakerunzer.com/Alice%20Kim', fallback: 'AK' },
    { name: 'Ben Turner', src: 'https://avatars.jakerunzer.com/Ben%20Turner', fallback: 'BT' }
  ];
  const visibleCollaborators = collaborators.slice(0, 3);
  const overflowCollaborators = collaborators.slice(3);
  const taskGroups = [
    {
      label: 'Open tasks',
      items: [
        { id: 'task-1', reference: '#1', label: 'Add review states to the document toolbar', keywords: ['#1', 'John Doe'], assignee: collaborators[0] },
        { id: 'task-14', reference: '#14', label: 'Keep annotations aligned while scrolling', keywords: ['#14', 'Jane Smith'], assignee: collaborators[1] },
        { id: 'task-27', reference: '#27', label: 'Document custom MyST transforms', keywords: ['#27', 'Morgan Brown'], assignee: collaborators[2] },
        { id: 'task-42', reference: '#42', label: 'Improve keyboard navigation in inline mode', keywords: ['#42', 'John Doe'], assignee: collaborators[0] }
      ]
    }
  ];
  const mergeRequestGroups = [
    {
      label: 'Merge requests',
      items: [
        { id: 'mr-2', reference: '!2', label: 'Add collaborative editing prototype', keywords: ['!2', 'Jane Smith'], assignee: collaborators[1] },
        { id: 'mr-18', reference: '!18', label: 'Render rich links for repository references', keywords: ['!18', 'Morgan Brown'], assignee: collaborators[2] },
        { id: 'mr-31', reference: '!31', label: 'Refine comment and suggestion layout', keywords: ['!31', 'John Doe'], assignee: collaborators[0] }
      ]
    }
  ];
  const views = [
    { value: 'inline', icon: 'align-left', label: 'Inline view' },
    { value: 'preview', icon: 'eye', label: 'Preview view' },
    { value: 'split', icon: 'panels-top-left', label: 'Split view' },
    { value: 'source', icon: 'terminal', label: 'Source view' }
  ];
  const editingModes = $derived([
    { label: 'Editing', description: 'Edit document directly', value: 'editing', icon: 'edit', role: 'menuitemradio', checked: !suggestionMode },
    { label: 'Suggesting', description: 'Edits become suggestions', value: 'suggesting', icon: 'message-square-more', role: 'menuitemradio', checked: suggestionMode }
  ]);
</script>

{#snippet collaboratorAvatar(person)}
  <AesirTooltip content={person.name}>
    {#snippet trigger(props)}
      <span class="avatar-trigger" {...props}><AesirAvatar src={person.src} fallback={person.fallback} size="sm" aria-label={person.name} /></span>
    {/snippet}
  </AesirTooltip>
{/snippet}

{#snippet overflowAvatar(people)}
  <AesirTooltip placement="bottom">
    {#snippet trigger(props)}
      <span class="avatar-trigger" {...props}>
        <AesirAvatar fallback={`+${people.length}`} size="sm" aria-label={`${people.length} more collaborators: ${people.map((person) => person.name).join(', ')}`} />
      </span>
    {/snippet}
    {#snippet content()}
      <ul class="tooltip-people">
        {#each people as person (person.name)}
          <li><AesirAvatar src={person.src} fallback={person.fallback} size="sm" aria-label={person.name} />{person.name}</li>
        {/each}
      </ul>
    {/snippet}
  </AesirTooltip>
{/snippet}

{#snippet repositoryItem(item)}
  <span class="repository-command-item">
    <AesirAvatar src={item.assignee.src} fallback={item.assignee.fallback} size="sm" aria-label={item.assignee.name} />
    <span class="repository-command-reference">{item.reference}</span>
    <span class="repository-command-title">{item.label}</span>
  </span>
{/snippet}

{#snippet sourceView()}
  <div class="lines raw" class:has-comments={showComments} aria-label="MyST source" use:layoutAnnotations>
    {#each sourceLines as raw, index (index)}
      {@const matched = sourceRowLines.get(index)}
      {@render documentRow('raw', index, matched ?? raw, matched?.thread)}
    {/each}
  </div>
{/snippet}

{#snippet noteAside(text)}
  <aside class="document-note">
    <span><AesirIcon name="info" /> Note</span>
    <p>{text}</p>
  </aside>
{/snippet}

{#snippet previewArticle(withThreads)}
  <div class="lines plain" class:has-comments={withThreads && showComments} aria-label="Rendered document" use:layoutAnnotations>
    {#each documentLines as line, index (index)}
      {#if line.type !== 'blank'}
        {@render documentRow('plain', index, line, withThreads ? line.thread : undefined)}
      {/if}
    {/each}
  </div>
{/snippet}

{#snippet iconTool(tool)}
  <AesirTooltip content={tool.label}>
    {#snippet trigger(props)}
      <AesirButton
        variant="outline"
        size="icon-sm"
        aria-label={tool.label}
        disabled={tool.disabled}
        {...props}
        onclick={() => {
          props.onclick();
          tool.onclick?.();
        }}
      >
        <AesirIcon name={tool.icon} />
      </AesirButton>
    {/snippet}
  </AesirTooltip>
{/snippet}

{#snippet commentThread(thread)}
  {#if showComments && thread.open}
    <AesirAnnotation
      id={thread.id}
      kind={thread.kind}
      author={collaborators[thread.author]}
      time={thread.time}
      text={thread.text}
      editable={thread.editable}
      messages={thread.messages?.map((message) => ({ ...message, author: collaborators[message.author] }))}
      diff={thread.diff}
      active={activeAnnotation === thread.id}
      onactivate={(active) => activateAnnotation(thread.id, active)}
      onresolve={() => (thread.open = false)}
      onaccept={() => (thread.open = false)}
      onreject={() => (thread.open = false)}
      onedit={(index, text) => {
        if (thread.messages) thread.messages[index].text = text;
        else thread.text = text;
      }}
      onremovemessage={(index) => {
        if (thread.messages) {
          thread.messages.splice(index, 1);
          if (thread.messages.length === 0) thread.open = false;
        } else {
          thread.open = false;
        }
      }}
      onreply={(text) => {
        if (!text.trim()) return;
        if (!thread.messages) thread.messages = thread.kind === 'comment' ? [{ author: thread.author, time: thread.time, text: thread.text, editable: thread.editable }] : [];
        thread.messages.push({ author: 0, time: 'Just now', text, editable: true });
      }}
    />
  {/if}
{/snippet}

{#snippet lineBody(line, interactive)}
  {#if line.type === 'heading' && line.level === 1}
    <h1>{line.text}</h1>
  {:else if line.type === 'heading'}
    <h2>{line.text}</h2>
  {:else if line.type === 'lead'}
    <p class="lead">{line.text}</p>
  {:else if line.type === 'text'}
    <p>{line.text}</p>
  {:else if line.type === 'note'}
    {@render noteAside(line.text)}
  {:else if line.type === 'anchored'}
    <p>
      {line.before}
      <button
        class="anchor"
        type="button"
        aria-pressed={threads[line.thread].open}
        onclick={(e) => {
          e.stopPropagation();
          openThread(line.thread);
        }}
      >
        {line.anchorText}
      </button>
      {line.after}
    </p>
  {:else if line.type === 'selection' && interactive}
    <code>
      {line.before}
      <span class="selection">
        <mark>{line.selected}</mark>
        <span class="selection-actions">
          <AesirButton
            variant="outline"
            size="icon-sm"
            aria-label="Add comment"
            onclick={(e) => {
              e.stopPropagation();
              openCommentComposer();
            }}
          >
            <AesirIcon name="message-square-more" />
          </AesirButton>
        </span>
      </span>
      {line.after}
    </code>
    {#if showComments && composing}
      <form
        class="comment composer"
        onsubmit={(e) => {
          e.preventDefault();
          composing = false;
        }}
      >
        <label for="comment">Comment on selection</label>
        <textarea id="comment" rows="3" placeholder="Mention someone with @" use:focusOnMount></textarea>
        <footer>
          <AesirButton type="button" variant="ghost" size="sm" onclick={() => (composing = false)}>Cancel</AesirButton><AesirButton type="submit" variant="accent" size="sm">Comment</AesirButton>
        </footer>
      </form>
    {/if}
  {:else if line.type === 'selection'}
    <p>
      {line.before}
      <mark>{line.selected}</mark>
      {line.after}
    </p>
  {:else if line.type === 'diff'}
    <p>
      {line.before}
      <span class="deleted">{line.deleted}</span>
      <span class="inserted">{line.inserted}</span>
      {line.after}
    </p>
  {:else if line.type === 'insert'}
    <p>
      {line.before}
      <span class="inserted">{line.inserted}</span>
      {line.after}
    </p>
  {/if}
{/snippet}

{#snippet documentRow(kind, index, line, thread)}
  <div
    class="line"
    class:heading={line?.type === 'heading' && line.level === 1}
    class:subheading={line?.type === 'heading' && line.level === 2}
    class:note={line?.type === 'note'}
    class:discussed={thread !== undefined}
    class:active={kind === 'inline' && line?.active}
  >
    {#if kind !== 'plain'}<b>{index + 1}</b>{/if}
    <div>
      {#if kind === 'raw' && typeof line === 'string'}
        <code>{line || ' '}</code>
      {:else}
        {@render lineBody(line, kind === 'inline')}
      {/if}
    </div>
    {#if thread}
      {@render commentThread(threads[thread])}
    {/if}
  </div>
{/snippet}

<section bind:this={editorElement} class="editor" aria-label="Collaborative MyST editor prototype">
  <header class="topbar">
    <div class="document-heading">
      <AesirDropdown bind:open={documentMenuOpen} items={documentMenuItems} align="start" label="Document actions" contentClass="editor-document-menu">
        {#snippet trigger(props)}
          <AesirButton variant="ghost" size="icon-sm" aria-label="Open document menu" {...props}><AesirIcon name="menu" /></AesirButton>
        {/snippet}
      </AesirDropdown>
      <div class="title">The Little Blind Text</div>
      <div class="people" aria-label={`${collaborators.length} collaborators`}>
        {#each visibleCollaborators as person (person.name)}
          {@render collaboratorAvatar(person)}
        {/each}
        {#if overflowCollaborators.length}
          {@render overflowAvatar(overflowCollaborators)}
        {/if}
      </div>
    </div>
  </header>
  <div class="toolbar">
    <div class="tools">
      <AesirDropdown items={editingModes} align="start" label="Editing mode" contentClass="editor-mode-menu" onselect={(item) => (suggestionMode = item.value === 'suggesting')}>
        {#snippet trigger(props)}
          <AesirButton variant="ghost" size="sm" {...props}>
            <AesirIcon name={suggestionMode ? 'message-square-more' : 'edit'} />
            {suggestionMode ? 'Suggesting' : 'Editing'}
            <AesirIcon name="chevron-down" />
          </AesirButton>
        {/snippet}
        {#snippet itemContent({ item })}
          <span class="mode-option">
            <AesirIcon name={item.icon} size={18} class="mode-icon" />
            <span>
              <span>{item.label}</span>
              <small>{item.description}</small>
            </span>
            {#if item.checked}<AesirIcon name="check" size={18} class="mode-check" />{/if}
          </span>
        {/snippet}
      </AesirDropdown>
      <i></i>
      <AesirToggle size="icon-sm" aria-label="Bold"><AesirIcon name="bold" /></AesirToggle><AesirToggle size="icon-sm" aria-label="Italic"><AesirIcon name="italic" /></AesirToggle><AesirToggle
        size="icon-sm"
        aria-label="Underline"
      >
        <AesirIcon name="underline" />
      </AesirToggle>
      <i></i>
      <AesirButton variant="ghost" size="icon-sm" aria-label="Insert link"><AesirIcon name="link" /></AesirButton>
      <AesirTooltip content="Link merge request">
        {#snippet trigger(props)}<AesirButton
            variant="ghost"
            size="sm"
            {...props}
            onclick={() => {
              props.onclick();
              mergeRequestMenuOpen = true;
            }}
          >
            <AesirIcon name="git-pull-request" /> MR
          </AesirButton>{/snippet}
      </AesirTooltip>
      <AesirTooltip content="Insert task">
        {#snippet trigger(props)}<AesirButton
            variant="ghost"
            size="sm"
            {...props}
            onclick={() => {
              props.onclick();
              taskMenuOpen = true;
            }}
          >
            <AesirIcon name="square-check-big" /> Task
          </AesirButton>{/snippet}
      </AesirTooltip>
      <AesirTooltip content="View supported transforms">
        {#snippet trigger(props)}<AesirButton
            variant="ghost"
            size="sm"
            {...props}
            onclick={() => {
              props.onclick();
              transformsOpen = true;
            }}
          >
            <AesirIcon name="sparkles" /> Transforms
          </AesirButton>{/snippet}
      </AesirTooltip>
    </div>
    <div class="tools">
      <AesirToggleGroup class="view-modes" type="single" bind:value={view} spacing={0} variant="outline" size="icon-sm" required label="Editor view">
        {#each views as option (option.value)}
          <AesirTooltip content={option.label}>
            {#snippet trigger(props)}<AesirToggleGroupItem value={option.value} aria-label={option.label} {...props}><AesirIcon name={option.icon} /></AesirToggleGroupItem>{/snippet}
          </AesirTooltip>
        {/each}
      </AesirToggleGroup>
      <AesirTooltip content={showToc ? 'Hide table of contents' : 'Show table of contents'}>
        {#snippet trigger(props)}
          <AesirToggle bind:pressed={showToc} variant="outline" size="icon-sm" aria-label={showToc ? 'Hide table of contents' : 'Show table of contents'} {...props}>
            <AesirIcon name="list" />
          </AesirToggle>
        {/snippet}
      </AesirTooltip>
      <AesirTooltip content={showComments ? 'Hide comments' : 'Show comments'}>
        {#snippet trigger(props)}
          <AesirToggle bind:pressed={showComments} variant="outline" size="icon-sm" aria-label={showComments ? 'Hide comments' : 'Show comments'} {...props}>
            <AesirIcon name="message-square-more" />
          </AesirToggle>
        {/snippet}
      </AesirTooltip>
      {@render iconTool({ label: richLinksRefreshing ? 'Refreshing rich links…' : 'Refresh rich links', icon: 'refresh-cw', onclick: refreshRichLinks, disabled: richLinksRefreshing })}
      {@render iconTool({ label: fullscreen ? 'Exit fullscreen' : 'Enter fullscreen', icon: fullscreen ? 'minimize-2' : 'maximize-2', onclick: toggleFullscreen })}
    </div>
  </div>

  <div class="workspace">
    {#if showToc}
      <nav class="toc" aria-label="Table of contents">
        <h2>Contents</h2>
        {#if tocItems.length}
          <ul>
            {#each tocItems as item (item.id)}
              <li class:sub={item.level === 2}>
                <button type="button" onclick={() => scrollToHeading(item.id)}>{item.text}</button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="toc-empty">No headings to show.</p>
        {/if}
      </nav>
    {/if}

    <div class="view-content" use:collectHeadings>
      {#if view === 'source'}
        {@render sourceView()}
      {:else if view === 'preview'}
        {@render previewArticle(true)}
      {:else if view === 'split'}
        <div class="split-view">
          {@render sourceView()}
          {@render previewArticle(false)}
        </div>
      {:else}
        <div class="lines" class:has-comments={showComments} use:layoutAnnotations>
          {#each documentLines as line, index (index)}
            {@render documentRow('inline', index, line, line.thread)}
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <footer class="status">
    <span><AesirIcon name="check" size={12} /> Saved just now</span>
    <span>{view === 'inline' ? 'Ln 11' : view === 'source' || view === 'split' ? 'MyST source' : 'Rendered document'}</span>
    <span>MyST / e0b095a1</span>
    <span>{view === 'inline' ? 'Inline editing' : view === 'source' ? 'Source' : view === 'preview' ? 'Preview' : 'Split view'}</span>
  </footer>
</section>

<AesirCommandMenu bind:open={taskMenuOpen} groups={taskGroups} shortcut={false} label="Insert task" placeholder="Search tasks…" emptyText="No tasks found." showFooter itemContent={repositoryItem} />

<AesirCommandMenu
  bind:open={mergeRequestMenuOpen}
  groups={mergeRequestGroups}
  shortcut={false}
  label="Link merge request"
  placeholder="Search merge requests…"
  emptyText="No merge requests found."
  showFooter
  itemContent={repositoryItem}
/>

<AesirDialog
  bind:open={transformsOpen}
  class="transform-dialog"
  title="Rich link transforms"
  description="These shorthand references are recognized automatically and rendered as navigable rich links."
>
  <div class="transform-list">
    {#each transformExamples as example (example.syntax)}
      <div class="transform-example">
        <div>
          <span>{example.label}</span>
          <code>{example.syntax}</code>
        </div>
        <AesirIcon name="arrow-right" size={16} />
        <span class="transform-result">{example.result}</span>
      </div>
    {/each}
  </div>
  {#snippet footer({ close })}
    <AesirButton onclick={close}>Close</AesirButton>
  {/snippet}
</AesirDialog>

<style>
  :global(.repository-command-item) {
    display: grid;
    min-width: 0;
    width: 100%;
    grid-column: 1 / -1;
    grid-template-columns: auto 6ch minmax(0, 1fr);
    align-items: center;
    gap: var(--ds-spacing-3);
  }
  :global(.repository-command-reference) {
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-sm);
    font-variant-numeric: tabular-nums;
  }
  :global(.repository-command-title) {
    overflow: hidden;
    font-size: var(--ds-font-size-sm);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .editor {
    display: grid;
    width: 100%;
    height: min(48rem, calc(100dvh - var(--ds-spacing-16)));
    min-height: 42rem;
    overflow: hidden;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    color: var(--ds-foreground);
  }
  .editor:fullscreen {
    height: 100dvh;
    min-height: 0;
    border: 0;
    border-radius: 0;
  }
  .topbar,
  .document-heading,
  .toolbar,
  .tools,
  .people,
  .status {
    display: flex;
    align-items: center;
  }
  .topbar {
    display: grid;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-2) var(--ds-spacing-3) var(--ds-spacing-1);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .document-heading {
    min-width: 0;
    gap: var(--ds-spacing-2);
  }
  .title {
    flex: 1;
    overflow: hidden;
    font-size: var(--ds-font-size-xl);
    font-weight: var(--ds-font-weight-medium);
    line-height: var(--ds-font-line-height-xl);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .people {
    padding-left: var(--ds-spacing-2);
  }
  .people :global(.aesir-avatar) {
    margin-left: calc(var(--ds-spacing-2) * -1);
    box-shadow: 0 0 0 var(--ds-spacing-px) var(--ds-background);
  }
  .people :global(.aesir-tooltip__anchor),
  .avatar-trigger {
    display: inline-flex;
  }
  .people :global(.aesir-tooltip__anchor:first-child .aesir-avatar) {
    margin-left: 0;
  }
  .tooltip-people {
    display: grid;
    margin: 0;
    padding: var(--ds-spacing-2);
    gap: var(--ds-spacing-1-5);
    list-style: none;
  }
  .tooltip-people li {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .toolbar {
    min-height: var(--ds-spacing-12);
    justify-content: space-between;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-1-5) var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .tools {
    gap: var(--ds-spacing-1);
  }
  .tools > i {
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-6);
    margin-inline: var(--ds-spacing-1);
    background: var(--ds-border);
  }
  :global(.view-modes > .aesir-tooltip__anchor) {
    display: inline-flex;
    margin-inline-start: calc(var(--ds-spacing-px) * -1);
  }
  :global(.view-modes > .aesir-tooltip__anchor:first-child) {
    margin-inline-start: 0;
  }
  :global(.view-modes > .aesir-tooltip__anchor .aesir-toggle) {
    border-radius: 0;
  }
  :global(.view-modes > .aesir-tooltip__anchor:first-child .aesir-toggle) {
    border-start-start-radius: var(--ds-radius-md);
    border-end-start-radius: var(--ds-radius-md);
  }
  :global(.view-modes > .aesir-tooltip__anchor:last-child .aesir-toggle) {
    border-start-end-radius: var(--ds-radius-md);
    border-end-end-radius: var(--ds-radius-md);
  }
  :global(.view-modes > .aesir-tooltip__anchor .aesir-toggle[data-state='on']),
  :global(.view-modes > .aesir-tooltip__anchor .aesir-toggle:focus-visible) {
    z-index: 1;
  }
  :global(.editor-mode-menu) {
    width: min(var(--ds-sizing-sm), calc(100vw - var(--ds-spacing-4)));
    padding: var(--ds-spacing-1-5);
  }
  :global(.editor-mode-menu button) {
    padding: var(--ds-spacing-2-5);
  }
  :global(.editor-mode-menu .mode-option) {
    display: grid;
    width: 100%;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--ds-spacing-3);
  }
  :global(.editor-mode-menu .mode-option > span) {
    display: grid;
    gap: var(--ds-spacing-0-5);
  }
  :global(.editor-mode-menu .mode-option > span > span) {
    line-height: var(--ds-font-line-height-sm);
  }
  :global(.editor-mode-menu .mode-icon),
  :global(.editor-mode-menu .mode-check) {
    margin-top: var(--ds-spacing-px);
  }
  :global(.editor-mode-menu .mode-option small) {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
  .workspace {
    display: flex;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .toc {
    box-sizing: border-box;
    flex: 0 0 14rem;
    overflow: auto;
    padding: var(--ds-spacing-4) var(--ds-spacing-3);
    border-right: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
  }
  .toc h2 {
    margin: 0 0 var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .toc ul {
    display: grid;
    margin: 0;
    padding: 0;
    gap: var(--ds-spacing-0-5);
    list-style: none;
  }
  .toc li.sub {
    padding-left: var(--ds-spacing-3);
  }
  .toc button {
    width: 100%;
    padding: var(--ds-spacing-1-5) var(--ds-spacing-2);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: var(--ds-foreground);
    font: inherit;
    font-size: var(--ds-font-size-sm);
    text-align: left;
    cursor: pointer;
  }
  .toc button:hover {
    background: var(--ds-surface);
  }
  .toc-empty {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
  .view-content {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }
  .split-view {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    min-width: 0;
    min-height: 0;
    overflow: auto;
  }
  .split-view > :first-child {
    border-right: var(--ds-spacing-px) solid var(--ds-border);
  }
  .split-view > .lines {
    overflow: auto;
  }
  .lines {
    min-width: 0;
    overflow: auto;
    overscroll-behavior: contain;
  }
  .lines.raw {
    background: var(--ds-background-secondary);
  }
  .lines.raw .line {
    min-width: 0;
  }
  .lines.raw .line > b {
    padding-block: var(--ds-spacing-0-5) 0;
  }
  .lines.raw .line > div {
    padding-block: var(--ds-spacing-0-5);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-sm);
  }
  .lines.raw code,
  .lines.raw p {
    display: block;
    margin: 0;
    font-size: var(--ds-font-size-sm);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .lines.plain .line {
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
  }
  .lines.plain.has-comments .line {
    grid-template-columns: minmax(24rem, 1fr) minmax(17rem, 20rem);
  }
  .lines.plain .line > div {
    padding-block: var(--ds-spacing-3);
  }
  .line {
    position: relative;
    display: grid;
    min-width: 48rem;
    grid-template-columns: var(--ds-spacing-14) minmax(0, 1fr);
    align-items: start;
    border-left: var(--ds-spacing-0-5) solid transparent;
  }
  .lines.has-comments .line {
    grid-template-columns: var(--ds-spacing-14) minmax(24rem, 1fr) minmax(17rem, 20rem);
  }
  .line.active {
    border-left-color: var(--ds-accent);
    cursor: text;
  }
  .line.active > b,
  .line.active > div {
    background: var(--ds-accent-surface);
  }
  .line.active > b {
    align-self: stretch;
  }
  .line > b {
    padding: var(--ds-spacing-1) var(--ds-spacing-3) 0 0;
    color: color-mix(in oklch, var(--ds-foreground-muted) 58%, transparent);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    font-weight: 400;
    line-height: var(--ds-font-line-height-base);
    text-align: right;
    user-select: none;
  }
  .line.active > b {
    color: var(--ds-foreground-muted);
  }
  .line > div {
    min-width: 0;
    padding: var(--ds-spacing-1) var(--ds-spacing-5);
  }
  .line h1,
  .line h2,
  .line p {
    margin: 0;
  }
  .line h1 {
    font-size: var(--ds-font-size-3xl);
    line-height: 1.2;
  }
  .line h2 {
    font-size: var(--ds-font-size-xl);
  }
  .line p {
    font-size: var(--ds-font-size-base);
    line-height: 1.65;
  }
  .line .lead {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-lg);
  }
  .line code {
    display: block;
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-base);
    line-height: 1.65;
    white-space: pre-wrap;
  }
  .heading > div,
  .subheading > div {
    padding-block: var(--ds-spacing-2);
  }
  .note > div {
    padding-block: var(--ds-spacing-3);
  }
  .note aside {
    padding: var(--ds-spacing-3) var(--ds-spacing-4);
    border-left: var(--ds-spacing-1) solid var(--ds-accent);
    background: var(--ds-accent-surface);
  }
  .note aside > span {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    color: var(--ds-accent-text-muted);
    font-size: var(--ds-font-size-sm);
  }
  .anchor,
  .inserted {
    display: inline;
    padding: 0 var(--ds-spacing-0-5);
    border: 0;
    border-radius: var(--ds-radius-sm);
    background: var(--ds-accent-surface);
    color: inherit;
    font: inherit;
    text-decoration: underline;
    text-decoration-color: var(--ds-accent-border);
    text-underline-offset: var(--ds-spacing-1);
    cursor: pointer;
  }
  .selection {
    position: relative;
  }
  .selection mark {
    background: color-mix(in oklch, var(--ds-accent) 32%, transparent);
    color: inherit;
  }
  .selection-actions {
    position: absolute;
    bottom: calc(100% + var(--ds-spacing-2));
    left: 50%;
    z-index: 2;
    display: inline-flex;
    box-shadow: 0 var(--ds-spacing-2) var(--ds-spacing-5) color-mix(in oklch, var(--ds-fixed-black) 14%, transparent);
    transform: translateX(-50%);
  }
  .deleted {
    color: var(--ds-foreground-muted-red);
    text-decoration: line-through;
  }
  .inserted {
    background: var(--ds-surface-green);
    color: var(--ds-foreground-muted-green);
    text-decoration-color: var(--ds-border-green);
  }
  .composer {
    position: absolute;
    top: 0;
    right: var(--ds-spacing-3);
    z-index: 2;
    display: grid;
    box-sizing: border-box;
    width: min(18rem, calc(100% - var(--ds-spacing-6)));
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    box-shadow: 0 var(--ds-spacing-1) var(--ds-spacing-4) color-mix(in oklch, var(--ds-fixed-black) 8%, transparent);
    transform: translateY(var(--annotation-shift, 0px));
  }
  .lines :global(.aesir-annotation) {
    position: absolute;
    top: 0;
    right: var(--ds-spacing-3);
    z-index: 2;
    width: min(18rem, calc(100% - var(--ds-spacing-6)));
    max-width: none;
    transform: translateY(var(--annotation-shift, 0px));
    transition: transform var(--ds-motion-duration-moderate) var(--ds-motion-easing-in-out);
  }
  .composer label {
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
  .composer footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-spacing-1);
  }
  .composer textarea {
    box-sizing: border-box;
    width: 100%;
    resize: none;
    padding: var(--ds-spacing-2);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
    color: var(--ds-foreground);
    font: inherit;
    font-size: var(--ds-font-size-sm);
    outline: none;
  }
  .composer textarea:focus-visible {
    border-color: var(--ds-accent-border);
    box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
  }
  :global(.transform-dialog) {
    width: min(100%, var(--ds-sizing-md));
  }
  .transform-list {
    display: grid;
    gap: var(--ds-spacing-1);
  }
  .transform-example {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-2-5) var(--ds-spacing-3);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background-secondary);
  }
  .transform-example > div {
    display: grid;
    gap: var(--ds-spacing-1);
  }
  .transform-example > div > span {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .transform-example code {
    width: fit-content;
    padding: var(--ds-spacing-0-5) var(--ds-spacing-1-5);
    border-radius: var(--ds-radius-sm);
    background: var(--ds-surface);
    color: var(--ds-foreground);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-sm);
  }
  .transform-result {
    color: var(--ds-accent-text-muted);
    font-size: var(--ds-font-size-sm);
  }
  .status {
    min-height: var(--ds-spacing-7);
    justify-content: flex-end;
    gap: var(--ds-spacing-4);
    padding-inline: var(--ds-spacing-3);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .status > span:first-child {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-1);
    margin-right: auto;
  }
  @media (max-width: 64rem) {
    .lines.has-comments .line {
      grid-template-columns: var(--ds-spacing-14) minmax(24rem, 1fr) 17rem;
    }
    .lines :global(.aesir-annotation),
    .composer {
      width: calc(17rem - var(--ds-spacing-6));
    }
  }
  @media (max-width: 48rem) {
    .transform-example {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .transform-result {
      grid-column: 1 / -1;
    }
    .editor {
      height: 44rem;
      min-height: 0;
    }
    .people,
    .tools > i,
    .tools > :global(.aesir-toggle:nth-of-type(n + 2)) {
      display: none;
    }
    .toolbar {
      overflow-x: auto;
    }
    .toc {
      display: none;
    }
    .line,
    .line.discussed,
    .lines.has-comments .line {
      min-width: 0;
      grid-template-columns: var(--ds-spacing-12) minmax(0, 1fr);
    }
    .lines :global(.aesir-annotation),
    .composer {
      position: static;
      width: auto;
      max-width: none;
      margin: var(--ds-spacing-1) var(--ds-spacing-3);
      grid-column: 2;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .composer,
    .lines :global(.aesir-annotation) {
      transition-duration: var(--ds-motion-duration-instant);
    }
  }
</style>
