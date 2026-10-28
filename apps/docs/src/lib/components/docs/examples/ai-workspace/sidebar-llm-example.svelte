<script>
  import { AesirBadge, AesirButton, AesirCommandMenu, AesirDialog, AesirDropdown, AesirInput, AesirIcon, AesirScrollArea, AesirSidebar, AesirTooltip } from '@aesir/svelte';
  import ThumbsDown from '@lucide/svelte/icons/thumbs-down';
  import ThumbsUp from '@lucide/svelte/icons/thumbs-up';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import GitCompareArrows from '@lucide/svelte/icons/git-compare-arrows';
  import { onDestroy } from 'svelte';
  import LlmComposer from './llm-composer.svelte';

  let { autofocus = false, typeToFocus = false } = $props();
  let sections = $state(
    [
      {
        title: 'Projects',
        action: { label: 'Browse projects', icon: 'plus' },
        items: [
          { value: 'growth', label: 'Growth campaign', icon: 'folder', items: [{ value: 'growth-chat', label: 'Campaign planning' }] },
          { value: 'content', label: 'Content engine', icon: 'folder', items: [{ value: 'content-chat', label: 'Content ideas' }] },
          { value: 'automation', label: 'Automation flow', icon: 'folder', items: [{ value: 'automation-chat', label: 'Workflow setup' }] },
          { value: 'research', label: 'User research', icon: 'folder', items: [{ value: 'research-chat', label: 'Research notes' }] }
        ]
      },
      {
        title: 'Recents',
        items: [
          { value: 'spacing', label: 'Fix spacing on cards' },
          { value: 'empty-state', label: 'Need a better empty state' },
          { value: 'sidebar', label: 'Update sidebar structure', status: 'unread' },
          { value: 'mobile', label: 'Mobile nav feels cramped' },
          { value: 'simplify', label: 'Can we simplify this?' },
          { value: 'onboarding', label: 'Generate onboarding copy' }
        ]
      }
    ].map((section) => ({
      ...section,
      items: section.items
    }))
  );

  const allItems = $derived(sections.flatMap((section) => section.items.flatMap((item) => [item, ...(item.items ?? [])])));
  const titles = $derived(Object.fromEntries(allItems.map((item) => [item.value, item.label])));
  let expanded = $state(['growth']);
  let renameOpen = $state(false);
  let renameTarget = $state(null);
  let renameValue = $state('');
  const examplePrompt = 'Create a responsive application sidebar with projects and recent conversations. Keep it compact, accessible and consistent with the Aesir design system.';
  let chatMessages = $state({
    'growth-chat': 'Create a campaign plan for the STM32F103C8T6 launch.',
    'content-chat': 'Draft a concise component overview for the product page.',
    'automation-chat': 'Review the test workflow and identify missing checks.',
    'research-chat': 'Summarize the key findings from the latest component research.',
    spacing: 'Can you tighten the spacing in the card layout?',
    'empty-state': 'Design a clearer empty state for projects.',
    sidebar: examplePrompt,
    mobile: 'How can we make the mobile navigation less cramped?',
    simplify: 'Can we simplify this workspace without losing important actions?',
    onboarding: 'Generate concise onboarding copy for a hardware engineer.'
  });
  let messageContexts = $state({
    'growth-chat': [
      {
        id: 'stm32f103',
        label: 'STM32F103C8T6',
        image: 'https://openhardware.antmicro.com/imported/components/lqfp-48-7x7mm-p0-5mm-stmicroelectronics-stm32f103c8t6/previews/topT.webp'
      }
    ],
    sidebar: [{ id: 'sidebar-api', label: 'Aesir Sidebar' }]
  });
  let chatDrafts = $state({});
  const newChat = (project) => {
    selectItem({ value: project?.value ?? 'new' });
    prompt = '';
    lastMessage = '';
  };
  const removeChat = (item) => {
    for (const section of sections) {
      section.items = section.items.filter((entry) => entry.value !== item.value);
      for (const project of section.items) if (project.items) project.items = project.items.filter((entry) => entry.value !== item.value);
    }
    delete chatMessages[item.value];
    delete messageContexts[item.value];
    delete chatDrafts[item.value];
    if (selected === item.value) selectItem({ value: 'new' });
  };
  const activityItems = [
    { icon: 'search', label: 'Inspected sidebar component' },
    { icon: 'file', label: 'Read design tokens and interaction guidelines' },
    { icon: 'check', label: 'Updated 3 files' }
  ];
  const responseParts = [
    'The sidebar now uses full-width navigation items, separates projects from recent chats, and keeps the conversation area focused.',
    'Context can be attached from the top bar or directly from the composer.',
    'The layout uses semantic Aesir surfaces and foreground roles, so it follows the selected light or dark theme without one-off color overrides.'
  ];
  const sequenceTiming = { instant: 100, fast: 140, moderate: 180, slow: 240 };
  const suggestions = [
    { title: 'Find a datasheet', text: 'Find the STM32F407 datasheet and summarize its interfaces and supply requirements.', icon: 'file' },
    { title: 'Identify a resistor', text: 'Help me identify the resistor used in an LED circuit. What schematic or board details do you need?', icon: 'search' },
    { title: 'Compare components', text: 'Compare two voltage regulators for a battery-powered sensor. Which specifications should I check?', icon: GitCompareArrows }
  ];
  const projectCatalogue = [
    { id: 'sensor-board', label: 'Sensor board', icon: 'file' },
    { id: 'motor-controller', label: 'Motor controller', icon: 'file' },
    { id: 'power-monitor', label: 'Power monitor', icon: 'file' }
  ];
  const projectGroups = $derived([{ label: 'Available demo projects', items: projectCatalogue.filter((project) => !sections[0].items.some((item) => item.value === project.id)) }]);
  let projectsOpen = $state(false);
  let selected = $state('new');
  const activeProject = $derived(sections[0].items.find((project) => project.value === selected));
  const currentProject = $derived(activeProject ?? sections[0].items.find((project) => project.items?.some((chat) => chat.value === selected)));
  const projectOptions = $derived([
    { value: 'no-project', label: 'No project', role: 'menuitemradio', checked: !currentProject },
    { type: 'separator' },
    ...sections[0].items.map((project) => ({ value: project.value, label: project.label, role: 'menuitemradio', checked: currentProject?.value === project.value }))
  ]);
  const changeProject = (item) => {
    const draft = prompt;
    selectItem({ value: item.value === 'no-project' ? 'new' : item.value });
    prompt = draft;
  };
  const isNewChat = $derived(!lastMessage && (selected === 'new' || Boolean(activeProject) || selected.includes('chat')));
  let prompt = $state('');
  let collapsed = $state(false);
  let lastMessage = $state('');
  let feedback = $state(null);
  let phase = $state('complete');
  let visibleActivities = $state(activityItems.length);
  let visibleResponseParts = $state(responseParts.length);
  let streamedResponse = $state(responseParts.join('\n\n'));
  let responseKey = $state(0);
  let conversationViewport = $state();
  let copiedMessage = $state(false);
  let filesOpen = $state(false);
  const conversationFiles = $derived(
    selected === 'new'
      ? []
      : selected === 'content-chat'
        ? [
            { name: 'component-overview.md', size: '2.4 KB' },
            { name: 'datasheet.pdf', size: '1.8 MB' }
          ]
        : [
            { name: 'notes.md', size: '1.2 KB' },
            { name: 'references.txt', size: '840 B' }
          ]
  );
  const conversationContext = $derived(messageContexts[selected] ?? []);
  let runId = 0;
  let copyTimer;

  const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

  const selectItem = (item) => {
    runId += 1;
    if (item.status === 'unread') item.status = undefined;
    chatDrafts[selected] = prompt;
    selected = item.value;
    prompt = chatDrafts[item.value] ?? '';
    lastMessage = chatMessages[item.value] ?? '';
    phase = 'complete';
    visibleActivities = activityItems.length;
    visibleResponseParts = responseParts.length;
    streamedResponse = responseParts.join('\n\n');
    if (item.value === 'new') {
      runId += 1;
      prompt = '';
      lastMessage = '';
      feedback = null;
      phase = 'complete';
      visibleActivities = activityItems.length;
      visibleResponseParts = responseParts.length;
      streamedResponse = responseParts.join('\n\n');
      selected = 'new';
    }
  };

  const addProject = () => {
    projectsOpen = true;
  };

  const sendMessage = async (message, context = []) => {
    if (selected === 'new' || activeProject) {
      const item = { value: `chat-${crypto.randomUUID()}`, label: message.slice(0, 42) };
      if (activeProject) {
        activeProject.items.push(item);
        expanded = [...new Set([...expanded, activeProject.value])];
      } else sections[1].items.unshift(item);
      selected = item.value;
    }
    chatMessages[selected] = message;
    messageContexts[selected] = context.map((item) => ({ ...item }));
    const responseChatValue = selected;
    const chat = allItems.find((item) => item.value === selected);
    if (chat?.label === 'New chat') chat.label = message.slice(0, 42);
    const currentRun = ++runId;
    lastMessage = message;
    prompt = '';
    feedback = null;
    visibleActivities = 0;
    visibleResponseParts = 0;
    streamedResponse = '';
    phase = 'queued';
    responseKey += 1;

    await wait(sequenceTiming.slow);
    if (currentRun !== runId) return;
    phase = 'thinking';

    await wait(sequenceTiming.slow);
    if (currentRun !== runId) return;
    phase = 'working';

    for (let index = 0; index < activityItems.length; index += 1) {
      await wait(sequenceTiming.moderate);
      if (currentRun !== runId) return;
      visibleActivities = index + 1;
    }

    phase = 'answering';
    const completeResponse = responseParts.join('\n\n');
    for (let index = 0; index < completeResponse.length; index += 3) {
      await wait(12);
      if (currentRun !== runId) return;
      streamedResponse = completeResponse.slice(0, index + 3);
    }
    streamedResponse = completeResponse;
    const completedChat = allItems.find((item) => item.value === responseChatValue);
    if (completedChat && completedChat.value !== selected) completedChat.status = 'unread';
    phase = 'complete';
  };

  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message);
      copiedMessage = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copiedMessage = false), 1600);
    } catch {
      copiedMessage = false;
    }
  };

  onDestroy(() => {
    runId += 1;
    clearTimeout(copyTimer);
  });

  $effect(() => {
    phase;
    visibleActivities;
    visibleResponseParts;
    streamedResponse;
    if (!lastMessage) return;
    queueMicrotask(() => {
      if (conversationViewport) conversationViewport.scrollTop = conversationViewport.scrollHeight;
    });
  });
</script>

{#snippet projectSelector(heading = false)}
  <AesirDropdown items={projectOptions} label="Choose project" align="end" placement={heading ? 'bottom' : 'top'} onselect={changeProject}>
    {#snippet trigger(props)}
      <AesirButton {...props} type="button" variant={heading || !currentProject ? 'ghost' : 'outline'} size="sm" aria-label={`Choose project: ${currentProject?.label ?? 'No project'}`}>
        <span class="project-picker-label">{currentProject?.label ?? 'Project'}</span>
        <AesirIcon name="chevron-down" size={14} />
      </AesirButton>
    {/snippet}
  </AesirDropdown>
{/snippet}

<div class="llm-example">
  <AesirSidebar
    class="llm-sidebar"
    title="Aesir AI"
    label="AI workspace navigation"
    variant="app"
    mode="responsive"
    mobileTrigger="header"
    width={264}
    minWidth={224}
    maxWidth={400}
    resizable
    collapsible
    collapseTrigger="external"
    {sections}
    value={selected}
    bind:expanded
    bind:collapsed
    onselect={selectItem}
    onsectionaction={addProject}
    sticky={false}
  >
    {#snippet header()}
      <div class="new-chat-action">
        <AesirButton variant="outline" width="full" onclick={() => selectItem({ value: 'new' })}><AesirIcon name="plus" size={16} />New chat</AesirButton>
      </div>
    {/snippet}
    {#snippet headerActions()}
      <AesirButton variant={filesOpen ? 'secondary' : 'ghost'} size="icon-sm" aria-label={filesOpen ? 'Close files' : 'Open files'} aria-expanded={filesOpen} onclick={() => (filesOpen = !filesOpen)}>
        <AesirIcon name="folder" size={16} />
      </AesirButton>
    {/snippet}
    {#snippet itemActions(item)}
      {#if item.items}
        <AesirButton variant="ghost" size="icon-sm" aria-label={`New chat in ${item.label}`} onclick={() => newChat(item)}><AesirIcon name="plus" size={14} /></AesirButton>
      {:else}
        <AesirDropdown
          label="Chat actions"
          items={[
            { value: 'rename', label: 'Rename' },
            { value: 'remove', label: 'Remove', variant: 'destructive' }
          ]}
          onselect={(action) => {
            if (action.value === 'remove') removeChat(item);
            else {
              renameTarget = item;
              renameValue = item.label;
              renameOpen = true;
            }
          }}
        >
          {#snippet trigger(props)}<AesirButton {...props} variant="ghost" size="icon-sm" aria-label={`Actions for ${item.label}`}><AesirIcon icon={Ellipsis} size={14} /></AesirButton>{/snippet}
        </AesirDropdown>
      {/if}
    {/snippet}
  </AesirSidebar>

  <section class="conversation" aria-labelledby="conversation-title">
    <header class="conversation__header">
      <div class="conversation__title">
        <AesirButton
          class="desktop-sidebar-toggle"
          variant="outline"
          size="icon-sm"
          aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
          aria-expanded={!collapsed}
          onclick={() => (collapsed = !collapsed)}
        >
          <AesirIcon name={collapsed ? 'panel-left-open' : 'panel-left-close'} size={16} />
        </AesirButton>
        <span id="conversation-title">{selected === 'new' ? 'New chat' : titles[selected]}</span>
      </div>
      <AesirButton variant={filesOpen ? 'secondary' : 'ghost'} size="icon-sm" aria-label={filesOpen ? 'Close files' : 'Open files'} aria-expanded={filesOpen} onclick={() => (filesOpen = !filesOpen)}>
        <AesirIcon name="folder" size={16} />
      </AesirButton>
    </header>

    <div class="conversation__main" class:conversation__main--new={isNewChat}>
      {#if !isNewChat}
        <AesirScrollArea class="conversation-scroll" bind:viewportRef={conversationViewport}>
          <div class="conversation__thread">
            {#key lastMessage || 'example'}
              <div class="user-message-row">
                <div class:user-message--generated={lastMessage} class="user-message">{lastMessage || examplePrompt}</div>
                {#if lastMessage && messageContexts[selected]?.length}
                  <div class="message-context" aria-label="Context sent with this message">
                    {#each messageContexts[selected] as context (context.id)}
                      <AesirBadge variant="outline">
                        {#if context.image}<img src={context.image} alt="" />{:else}<AesirIcon name="file" size={14} />{/if}
                        {context.label}
                      </AesirBadge>
                    {/each}
                  </div>
                {/if}
                <div class="message-toolbar" aria-label="Message actions">
                  <AesirTooltip content={copiedMessage ? 'Copied' : 'Copy message'}>
                    {#snippet trigger(props)}
                      <AesirButton {...props} variant="ghost" size="icon-sm" aria-label={copiedMessage ? 'Message copied' : 'Copy message'} onclick={() => copyMessage(lastMessage || examplePrompt)}>
                        <AesirIcon name={copiedMessage ? 'check' : 'copy'} size={15} />
                      </AesirButton>
                    {/snippet}
                  </AesirTooltip>
                </div>
              </div>
            {/key}

            {#key responseKey}
              {#if !lastMessage || phase !== 'queued'}
                <article class="assistant-message" aria-live="polite">
                  {#if lastMessage && phase === 'thinking'}
                    <div class="thinking">
                      <span class="thinking__dot"></span>
                      <span>Thinking…</span>
                    </div>
                  {:else}
                    <p>I’ll update the workspace pattern and keep the existing component APIs intact.</p>

                    <div class="activity" aria-label="Work completed">
                      {#each activityItems.slice(0, visibleActivities) as item (item.label)}
                        <div class:activity-item--generated={lastMessage}>
                          <AesirIcon name={item.icon} size={14} />
                          <span>{item.label}</span>
                        </div>
                      {/each}
                    </div>

                    <p class="streamed-response">{lastMessage ? streamedResponse : responseParts.join(' ')}</p>

                    {#if phase === 'complete'}
                      <footer class="response-actions" aria-label="Response actions">
                        <span>Was this response helpful?</span>
                        <AesirButton variant="ghost" size="icon-sm" aria-label="Helpful" aria-pressed={feedback === 'helpful'} onclick={() => (feedback = feedback === 'helpful' ? null : 'helpful')}>
                          <AesirIcon icon={ThumbsUp} size={15} />
                        </AesirButton>
                        <AesirButton
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Not helpful"
                          aria-pressed={feedback === 'not-helpful'}
                          onclick={() => (feedback = feedback === 'not-helpful' ? null : 'not-helpful')}
                        >
                          <AesirIcon icon={ThumbsDown} size={15} />
                        </AesirButton>
                        {#if feedback}<span class="feedback-confirmation" aria-live="polite">Thanks for the feedback</span>{/if}
                      </footer>
                    {/if}
                  {/if}
                </article>
              {/if}
            {/key}
          </div>
        </AesirScrollArea>
      {/if}
      <div class="conversation__composer">
        {#if isNewChat}
          <div class="welcome-title">
            {#if currentProject}<h1>Explore</h1>
              {@render projectSelector(true)}{:else}<h1>What would you like to explore?</h1>{/if}
          </div>
        {/if}
        <LlmComposer bind:value={prompt} onsubmit={sendMessage} {autofocus} typeToFocus={typeToFocus && !projectsOpen && !renameOpen}>
          {#snippet projectPicker()}{@render projectSelector()}{/snippet}
        </LlmComposer>
        {#if isNewChat}
          <div class="prompt-suggestions" aria-label="Suggested questions">
            {#each suggestions as suggestion (suggestion.title)}
              <button class="prompt-suggestion" onclick={() => (prompt = suggestion.text)}>
                <AesirIcon
                  name={typeof suggestion.icon === 'string' ? suggestion.icon : undefined}
                  icon={typeof suggestion.icon === 'string' ? undefined : suggestion.icon}
                  color="var(--ds-foreground-muted)"
                  size={16}
                />
                <strong>{suggestion.title}</strong>
                <span>{['Datasheets & specifications', 'Values & markings', 'Specs & alternatives'][suggestions.indexOf(suggestion)]}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </section>
  <aside class="files-drawer" data-open={filesOpen || undefined} aria-label="Conversation files and context" aria-hidden={!filesOpen} inert={!filesOpen}>
    <header>
      <strong>Conversation resources</strong>
      <AesirButton variant="ghost" size="icon-sm" aria-label="Close files" onclick={() => (filesOpen = false)}><AesirIcon name="x" size={14} /></AesirButton>
    </header>
    <section class="files-section" aria-labelledby="conversation-files-title">
      <h3 id="conversation-files-title">Files</h3>
      {#if conversationFiles.length}
        <ul>
          {#each conversationFiles as file (file.name)}<li>
              <span><AesirIcon name="file" size={14} />{file.name}</span>
              <small>{file.size}</small>
            </li>{/each}
        </ul>
      {:else}<p class="files-empty">No files in this conversation yet.</p>{/if}
    </section>
    <section class="files-section" aria-labelledby="conversation-context-title">
      <h3 id="conversation-context-title">Context</h3>
      {#if conversationContext.length}
        <ul>
          {#each conversationContext as context (context.id)}
            <li class="context-resource">
              <span>
                {#if context.image}<img src={context.image} alt="" />{:else}<AesirIcon name="file" size={14} />{/if}
                {context.label}
              </span>
            </li>
          {/each}
        </ul>
      {:else}<p class="files-empty">No context attached to this conversation.</p>{/if}
    </section>
  </aside>
</div>

<AesirCommandMenu
  bind:open={projectsOpen}
  groups={projectGroups}
  shortcut={false}
  title="Add a project"
  placeholder="Search available projects…"
  onselect={(item) => {
    sections[0].items = [...sections[0].items, { value: item.id, label: item.label, icon: 'folder', items: [] }];
    selectItem({ value: item.id });
    projectsOpen = false;
  }}
/>

<AesirDialog bind:open={renameOpen} title="Rename chat">
  <form
    onsubmit={(event) => {
      event.preventDefault();
      if (renameTarget && renameValue.trim()) {
        renameTarget.label = renameValue.trim();
        renameOpen = false;
      }
    }}
  >
    <AesirInput aria-label="Chat name" bind:value={renameValue} />
    <div class="rename-actions">
      <AesirButton type="button" variant="outline" onclick={() => (renameOpen = false)}>Cancel</AesirButton>
      <AesirButton type="submit" disabled={!renameValue.trim()}>Save</AesirButton>
    </div>
  </form>
</AesirDialog>

<style>
  .project-picker-label {
    display: block;
    max-width: min(28vw, var(--ds-spacing-40));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .message-context {
    display: flex;
    gap: var(--ds-spacing-2);
    max-width: 100%;
    overflow-x: auto;
    padding-block: var(--ds-spacing-2);
  }
  .message-context :global(.aesir-badge) {
    flex-shrink: 0;
  }
  .message-context img {
    width: var(--ds-spacing-5);
    height: var(--ds-spacing-5);
    object-fit: contain;
  }
  .welcome-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-1);
    flex-wrap: wrap;
    min-height: var(--ds-spacing-9);
  }
  .welcome-title h1 {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
  }
  .rename-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-spacing-2);
    margin-top: var(--ds-spacing-4);
  }
  .conversation__main--new {
    justify-content: center;
    overflow-y: auto;
  }
  .welcome-title {
    margin: 0 0 var(--ds-spacing-6);
    text-align: center;
    font-size: var(--ds-font-size-xl);
    font-weight: 400;
    line-height: 1.2;
  }
  .prompt-suggestions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--ds-spacing-3);
    margin-top: var(--ds-spacing-5);
  }
  .prompt-suggestion {
    transition:
      background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-3);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    color: var(--ds-foreground);
    text-align: left;
    cursor: pointer;
  }
  @media (hover: hover) and (pointer: fine) {
    .prompt-suggestion:hover {
      background: var(--ds-surface);
      border-color: var(--ds-border-hover);
    }
    .prompt-suggestion:active:not(:focus-visible) {
      transform: scale(0.98);
    }
  }
  .prompt-suggestion:focus-visible {
    transition: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .prompt-suggestion {
      transition: none;
    }
    .prompt-suggestion:active {
      transform: none;
    }
  }
  .prompt-suggestion:focus-visible {
    outline: 2px solid var(--ds-accent-ring);
    outline-offset: 2px;
  }
  .prompt-suggestion span {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: 1.5;
  }
  .prompt-suggestion strong {
    font-size: var(--ds-font-size-sm);
    font-weight: 500;
  }
  @media (max-width: 48rem) {
    .prompt-suggestions {
      grid-template-columns: 1fr;
    }
  }
  .llm-example {
    position: relative;
    display: flex;
    width: 100%;
    height: 42rem;
    min-width: 0;
    overflow: hidden;
    background: var(--ds-background);
    --aesir-sidebar-height: 100%;
  }

  .conversation {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    container-type: inline-size;
  }

  .conversation__header {
    display: flex;
    min-height: var(--ds-spacing-12);
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
    padding-inline: var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    font-size: var(--ds-font-size-sm);
  }

  .files-drawer {
    position: absolute;
    inset: var(--ds-spacing-12) 0 0 auto;
    z-index: 3;
    width: min(20rem, 85%);
    min-width: 13rem;
    border-left: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background);
    box-shadow: var(--ds-shadow-lg);
    visibility: hidden;
    transform: translateX(100%);
    transition:
      transform var(--ds-motion-duration-slow) var(--ds-motion-easing-out),
      visibility 0s linear var(--ds-motion-duration-slow);
  }
  .files-drawer[data-open] {
    visibility: visible;
    transform: translateX(0);
    transition-delay: 0s;
  }
  .files-drawer header,
  .files-drawer li,
  .files-drawer li span {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .files-drawer header {
    min-height: var(--ds-spacing-12);
    justify-content: space-between;
    padding-inline: var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    font-size: var(--ds-font-size-sm);
  }
  .files-section {
    padding-block: var(--ds-spacing-3);
  }
  .files-section + .files-section {
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }
  .files-section h3 {
    margin: 0;
    padding: 0 var(--ds-spacing-4) var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: 500;
  }
  .files-drawer ul {
    display: grid;
    gap: var(--ds-spacing-1);
    margin: 0;
    padding: 0 var(--ds-spacing-2);
    list-style: none;
  }
  .files-drawer li {
    justify-content: space-between;
    min-width: 0;
    padding: var(--ds-spacing-2);
    border-radius: var(--ds-radius-md);
    font-size: var(--ds-font-size-xs);
  }
  .files-drawer li:hover {
    background: var(--ds-surface);
  }
  .files-drawer li span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .context-resource img {
    width: var(--ds-spacing-6);
    height: var(--ds-spacing-6);
    flex: none;
    object-fit: contain;
  }
  .files-drawer small,
  .files-empty {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xxs);
  }
  .files-empty {
    padding: var(--ds-spacing-4);
  }

  .conversation__title {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .conversation__title > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .conversation__header > :global(button) {
    flex: none;
  }

  .conversation__main {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
  }

  :global(.conversation-scroll) {
    flex: 1;
  }

  .conversation__thread {
    display: grid;
    width: min(100%, 58rem);
    gap: var(--ds-spacing-6);
    margin-inline: auto;
    padding: var(--ds-spacing-8) var(--ds-spacing-6) var(--ds-spacing-12);
  }

  .user-message,
  .assistant-message p {
    margin: 0;
  }

  .user-message-row {
    display: grid;
    justify-items: end;
    gap: var(--ds-spacing-1);
  }

  .user-message {
    max-width: 85%;
    justify-self: end;
    padding: var(--ds-spacing-3) var(--ds-spacing-4);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-surface);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-base);
  }

  .user-message--generated {
    opacity: 1;
    transform: translateY(0) scale(1);
    transform-origin: bottom right;
    transition:
      opacity var(--ds-motion-duration-slow) var(--ds-motion-easing-out),
      transform var(--ds-motion-duration-slow) var(--ds-motion-easing-out);
  }

  .message-toolbar {
    display: flex;
    min-height: var(--ds-spacing-8);
    align-items: center;
    opacity: 0;
    pointer-events: none;
    transform: translateY(calc(var(--ds-spacing-1) * -1));
    transition:
      opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .user-message-row:focus-within .message-toolbar {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  @media (hover: hover) and (pointer: fine) {
    .user-message-row:hover .message-toolbar {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
  }

  @media (hover: none), (pointer: coarse) {
    .message-toolbar {
      opacity: 1;
      pointer-events: auto;
      transform: none;
    }
  }

  .assistant-message {
    display: grid;
    gap: var(--ds-spacing-4);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-base);
  }

  .streamed-response {
    white-space: pre-line;
  }

  .response-actions,
  .activity div {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  .activity-item--generated {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity var(--ds-motion-duration-moderate) var(--ds-motion-easing-out),
      transform var(--ds-motion-duration-moderate) var(--ds-motion-easing-out);
  }

  .activity {
    display: grid;
    gap: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .thinking {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .thinking__dot {
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    border-radius: var(--ds-radius-full);
    background: var(--ds-accent);
    animation: thinking-pulse calc(var(--ds-motion-duration-slow) * 4) var(--ds-motion-easing-in-out) infinite;
  }

  .response-actions {
    flex-wrap: wrap;
    min-height: var(--ds-spacing-8);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .response-actions :global([aria-pressed='true']) {
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text-muted);
  }

  .response-actions :global([aria-pressed='true'] svg) {
    transform: scale(1.1);
  }

  .response-actions :global(svg) {
    transform: scale(1);
    transition: transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .feedback-confirmation {
    margin-left: var(--ds-spacing-1);
    opacity: 1;
    transform: translateX(0);
    transition:
      opacity var(--ds-motion-duration-moderate) var(--ds-motion-easing-out),
      transform var(--ds-motion-duration-moderate) var(--ds-motion-easing-out);
  }

  .conversation__composer {
    width: min(100%, 58rem);
    margin: 0 auto;
    padding: 0 var(--ds-spacing-6) var(--ds-spacing-5);
  }

  @media (max-width: 48rem) {
    .conversation__thread,
    .conversation__composer {
      padding-inline: var(--ds-spacing-4);
    }

    .user-message {
      max-width: 100%;
    }
    .files-drawer {
      min-width: 0;
    }
  }

  @media (max-width: 63.9375rem) {
    .llm-example {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
    }
    :global(.llm-sidebar) {
      min-height: 0;
      flex-basis: auto;
    }
    .conversation {
      min-height: 0;
      overflow: hidden;
    }
    .conversation__header {
      display: none;
    }
    .files-drawer {
      inset-block-start: var(--ds-spacing-14);
    }
    :global(.desktop-sidebar-toggle) {
      display: none;
    }
  }

  @container (max-width: 32rem) {
    .feedback-confirmation {
      flex-basis: 100%;
      margin-left: 0;
    }
  }

  @starting-style {
    .user-message--generated {
      opacity: 0;
      transform: translateY(var(--ds-spacing-2)) scale(0.98);
    }

    .activity-item--generated {
      opacity: 0;
      transform: translateY(var(--ds-spacing-2));
    }

    .feedback-confirmation {
      opacity: 0;
      transform: translateX(calc(var(--ds-spacing-1) * -1));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .user-message--generated,
    .activity-item--generated,
    .feedback-confirmation {
      transform: none;
      transition-duration: var(--ds-motion-duration-instant);
      transition-delay: 0ms;
    }

    .response-actions :global(svg),
    .response-actions :global([aria-pressed='true'] svg) {
      transform: none;
      transition-duration: var(--ds-motion-duration-instant);
    }

    .thinking__dot {
      animation: none;
    }

    .message-toolbar,
    .user-message-row:hover .message-toolbar,
    .user-message-row:focus-within .message-toolbar {
      transform: none;
      transition-duration: var(--ds-motion-duration-instant);
    }

    .files-drawer,
    .files-drawer[data-open] {
      transition-duration: var(--ds-motion-duration-instant);
    }
  }

  @keyframes thinking-pulse {
    0%,
    100% {
      opacity: var(--ds-opacity-50);
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
