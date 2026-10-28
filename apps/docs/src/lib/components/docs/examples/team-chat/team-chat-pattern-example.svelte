<script>
  import { tick, untrack } from 'svelte';
  import { AesirAlertDialog, AesirAvatar, AesirButton, AesirDialog, AesirIcon, AesirInput, AesirKbd, AesirScrollArea, AesirSidebar } from '@aesir/svelte';
  import Hash from '@lucide/svelte/icons/hash';
  import Pin from '@lucide/svelte/icons/pin';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Clock from '@lucide/svelte/icons/clock';
  import BellOff from '@lucide/svelte/icons/bell-off';
  import Users from '@lucide/svelte/icons/users';
  import SquarePen from '@lucide/svelte/icons/square-pen';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Search from '@lucide/svelte/icons/search';
  import FilePenLine from '@lucide/svelte/icons/file-pen-line';
  import TeamChatMobile from './team-chat-mobile.svelte';
  import TeamChatNavigation from './team-chat-navigation.svelte';
  import TeamChatSidebarHeader from './team-chat-sidebar-header.svelte';
  import { mobileChatActivity } from './team-chat-mobile-model.js';
  import TeamChatDrafts from './team-chat-drafts.svelte';
  import TeamChatNewMessage from './team-chat-new-message.svelte';
  import TeamChatComposer from './team-chat-composer.svelte';
  import TeamChatMessage from './team-chat-message.svelte';
  import TeamChatMembers from './team-chat-members.svelte';
  import TeamChatChannelDetails from './team-chat-channel-details.svelte';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import TeamChatSearch from './team-chat-search.svelte';
  import TeamChatProfile from './team-chat-profile.svelte';
  import TeamChatAccountMenu from './team-chat-account-menu.svelte';
  import TeamChatPreferences from './team-chat-preferences.svelte';
  import { defaultChatPreferences } from './team-chat-preferences.js';
  import TeamChatChannelMenu from './team-chat-channel-menu.svelte';
  import TeamChatText from './team-chat-text.svelte';
  import TeamChatQuote from './team-chat-quote.svelte';
  import { createScheduledMessage, deliverScheduledMessage, formatScheduleTime, partitionScheduledMessages, scheduleDateTime } from './team-chat-scheduling.js';
  import { plainChatText } from './team-chat-formatting.js';
  import { people as initialPeople, conversations, initialMessages, presenceLabels } from './team-chat-demo.js';
  import {
    createChatMessage,
    createForwardedChatMessage,
    deleteOwnChatMessage,
    editOwnChatMessage,
    filterChatSidebarSections,
    findChatMessage,
    getChatMessageReference,
    updateChatConversation,
    resolveDirectConversation,
    toggleChatReaction,
    toggleChatPin
  } from './team-chat-model.js';

  let { focusOnMount = false } = $props();
  const sidebarIcons = { clock: Clock, 'bell-off': BellOff, users: Users, 'file-pen-line': FilePenLine };
  let people = $state(structuredClone(initialPeople));
  let rooms = $state(structuredClone(conversations));
  let messages = $state(structuredClone(initialMessages));
  let scheduled = $state([]);
  let scheduledNotice = $state();
  let selected = $state('design-system');
  let newMessageRecipients = $state([]);
  let newMessageDraft = $state('');
  let newMessageReturn = 'design-system';
  const newMessageView = $derived(selected === 'new-message');
  let drafts = $state(Object.fromEntries(conversations.map((room) => [room.id, ''])));
  let replyTargets = $state({});
  let composerPreview = $state(false);
  let forwardMessageId = $state('');
  let forwardQuery = $state('');
  let forwardOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let sidebarWidth = $state(320);
  let sidebarQuery = $state('');
  let compact = $state(false);
  let mobileTab = $state('home');
  let mobileConversation = $state(false);
  let mobileDraftReturn = $state(false);
  const mobileTitle = $derived({ home: 'Home', dms: 'DMs', activity: 'Activity', more: 'More', search: 'Search' }[mobileTab]);
  const navigationUnread = $derived({
    home: preferences.showUnread && rooms.some((entry) => entry.type === 'channel' && entry.unread),
    dms: preferences.showUnread && rooms.some((entry) => entry.type !== 'channel' && entry.unread),
    activity: preferences.showUnread && mobileChatActivity(rooms, messages).some((entry) => entry.unread)
  });
  let searchOpen = $state(false);
  let preferencesOpen = $state(false);
  let preferences = $state(defaultChatPreferences());
  let membersOpen = $state(false);
  let detailsTab = $state('members');
  let memberState = $state({ query: '', filter: 'all', scrollTop: 0 });
  let detailsTrigger = $state.raw();
  let editingId = $state('');
  let editText = $state('');
  let deleteOpen = $state(false);
  let deleteId = $state('');
  const deleteTarget = $derived(findChatMessage(messages, deleteId));
  let profileOpen = $state(false);
  let profilePerson = $state.raw();
  let profileTrigger = $state.raw();
  let profileOrigin = '';
  let profileInitialEdit = $state('');
  let channelMenuOpen = $state(false);
  let channelMenuId = $state('');
  let channelMenuAnchor = $state.raw();
  const channelMenuRoom = $derived(rooms.find((entry) => entry.id === channelMenuId));
  let pinnedOnly = $state(false);
  let highlightedId = $state('');
  let highlightTimer;
  let announcement = $state('');
  let feedViewport = $state();
  let workspace;
  let pointerInWorkspace = false;
  const room = $derived(rooms.find((entry) => entry.id === selected));
  const recipient = $derived(room?.type === 'direct' ? people[room.members.find((id) => id !== 'you')] : undefined);
  const savedView = $derived(selected === 'saved');
  const scheduledView = $derived(selected === 'scheduled');
  const draftsView = $derived(selected === 'drafts');
  const draftEntries = $derived.by(() => {
    const entries = rooms.flatMap((entry) => {
      const text = drafts[entry.id] ?? '';
      const reply = findChatMessage(messages, replyTargets[entry.id]);
      return text.trim() || reply ? [{ id: entry.id, room: entry, text, reply }] : [];
    });
    if (newMessageDraft.trim() || newMessageRecipients.length) entries.unshift({ id: 'new-message', text: newMessageDraft, recipients: newMessageRecipients });
    return entries;
  });
  const scheduledMessages = $derived(scheduled.toSorted((a, b) => a.sendAt - b.sendAt));
  const title = $derived(newMessageView ? 'New message' : draftsView ? 'Drafts' : scheduledView ? 'Scheduled messages' : savedView ? 'Saved messages' : (room?.name ?? 'Conversation'));
  const replyTo = $derived(findChatMessage(messages, replyTargets[selected]));
  const forwardSource = $derived(findChatMessage(messages, forwardMessageId));
  const allMessages = $derived(messages);
  const visibleMessages = $derived(savedView ? allMessages.filter((message) => message.saved) : messages.filter((message) => message.conversation === selected && (!pinnedOnly || message.pinned)));
  const sections = $derived([
    {
      items: [
        { value: 'drafts', label: 'Drafts', icon: 'file-pen-line', badge: draftEntries.length || undefined },
        { value: 'saved', label: 'Saved messages', icon: 'inbox', badge: allMessages.filter((message) => message.saved).length || undefined },
        { value: 'scheduled', label: 'Scheduled messages', icon: 'clock', badge: scheduled.length || undefined }
      ]
    },
    {
      title: 'Channels',
      items: rooms
        .filter((entry) => entry.type === 'channel')
        .toSorted((a, b) => Number(Boolean(b.starred)) - Number(Boolean(a.starred)))
        .map((entry) => ({
          value: entry.id,
          label: `# ${entry.name}`,
          icon: entry.starred ? 'star' : entry.notifications === 'muted' ? 'bell-off' : 'message-square-more',
          badge: preferences.showUnread ? entry.unread || undefined : undefined
        }))
    },
    {
      title: 'Direct messages',
      action: { label: 'Open a direct message', icon: 'plus' },
      items: rooms
        .filter((entry) => entry.type === 'direct' || entry.type === 'group')
        .map((entry) => ({ value: entry.id, label: entry.name, icon: entry.type === 'group' ? 'users' : undefined, badge: preferences.showUnread ? entry.unread || undefined : undefined }))
    }
  ]);
  const filteredSections = $derived(filterChatSidebarSections(sections, sidebarQuery));
  const forwardSections = $derived(
    filterChatSidebarSections(
      [
        {
          title: 'People',
          items: Object.entries(people)
            .filter(([id]) => id !== 'you')
            .map(([id, person]) => ({ value: `person:${id}`, personId: id, label: person.name }))
        },
        { title: 'Channels', items: sections.find((section) => section.title === 'Channels').items },
        { title: 'Group messages', items: rooms.filter((entry) => entry.type === 'group').map((entry) => ({ value: entry.id, label: entry.name })) }
      ],
      forwardQuery
    )
  );
  function rememberTypingScope(event) {
    pointerInWorkspace = Boolean(workspace && event.composedPath().includes(workspace));
  }
  function onWorkspaceKeydown(event) {
    if (!workspace || event.defaultPrevented || event.isComposing) return;
    if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
      const ownerDocument = workspace.ownerDocument;
      const active = ownerDocument.activeElement;
      // Repeating the shortcut must not close or stack the existing search.
      if (searchOpen && active?.closest('.chat-search')) {
        event.preventDefault();
        return;
      }
      const inWorkspace = workspace.contains(active) || ((pointerInWorkspace || focusOnMount) && (active === ownerDocument.body || active === ownerDocument.documentElement));
      if (!inWorkspace || ownerDocument.documentElement.dataset.overlayOpen === 'true' || ownerDocument.querySelector('[role="menu"], [role="dialog"], [role="alertdialog"]')) return;
      event.preventDefault();
      void openSearch();
      return;
    }
    void typeIntoConversation(event);
  }
  async function typeIntoConversation(event) {
    if (!workspace || event.defaultPrevented || event.isComposing || event.metaKey) return;
    const altGraph = event.getModifierState('AltGraph');
    const character = Array.from(event.key).length === 1;
    const composing = event.key === 'Dead' || event.key === 'Process';
    if ((event.ctrlKey && !altGraph) || (event.altKey && !altGraph && !composing)) return;
    if (!character && !composing) return;
    const ownerDocument = workspace.ownerDocument;
    const active = ownerDocument.activeElement;
    const origin = event.composedPath()[0];
    const editorSelector = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]';
    if (active?.closest(editorSelector) || origin?.closest?.(editorSelector)) return;
    const inWorkspace = workspace.contains(active) || (pointerInWorkspace && (active === ownerDocument.body || active === ownerDocument.documentElement));
    if (!inWorkspace || (compact && (!mobileConversation || profileOpen))) return;
    if (ownerDocument.documentElement.dataset.overlayOpen === 'true' || ownerDocument.querySelector('[role="menu"], [role="dialog"], [role="alertdialog"]')) return;
    // Space must still activate focused buttons rather than start a draft.
    if (event.key === ' ' && active?.closest('button, a, [role="button"], [role="checkbox"], [role="switch"]')) return;
    const selector = editingId ? '.chat-message__editor textarea' : newMessageView ? '.new-message textarea' : '.conversation-composer textarea';
    if ((!room && !newMessageView) || (!workspace.querySelector(selector) && !composerPreview)) return;
    const conversationId = selected;
    if (character) event.preventDefault();
    if (composerPreview && !editingId) {
      composerPreview = false;
      await tick();
    }
    if (selected !== conversationId) return;
    const input = workspace.querySelector(selector);
    if (!input || input.disabled || input.readOnly || input.closest('[hidden], [inert]')) return;
    input.focus({ preventScroll: true });
    // Let the browser continue dead-key/IME composition in the focused editor.
    if (!character) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    if (input.maxLength >= 0 && input.value.length - (end - start) + event.key.length > input.maxLength) return;
    input.setRangeText(event.key, start, end, 'end');
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: event.key }));
  }
  function observeWorkspace(node) {
    workspace = node;
    const shouldFocusOnEntry = untrack(() => focusOnMount);
    let measured = false;
    const observer = new ResizeObserver(([entry]) => {
      compact = entry.contentRect.width < 760;
      if (!measured) {
        measured = true;
        if (shouldFocusOnEntry && !compact) void focusConversation(selected);
      }
    });
    observer.observe(node);
    const timer = setInterval(deliverDueMessages, 1000);
    const onVisibility = () => {
      if (!document.hidden) deliverDueMessages();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      clearInterval(timer);
      clearHighlight();
      document.removeEventListener('visibilitychange', onVisibility);
      workspace = undefined;
    };
  }
  function selectRoom(id) {
    mobileDraftReturn = false;
    editingId = '';
    editText = '';
    channelMenuOpen = false;
    profileOpen = false;
    profileOrigin = '';
    selected = id;
    composerPreview = false;
    const next = rooms.find((entry) => entry.id === id);
    if (next) next.unread = 0;
    pinnedOnly = false;
    clearHighlight();
    if (compact) mobileConversation = true;
  }
  async function mobileBack() {
    if (mobileDraftReturn) {
      await openConversation('drafts');
      return;
    }
    if (newMessageView) selectRoom(newMessageReturn);
    profileOpen = false;
    channelMenuOpen = false;
    mobileConversation = false;
    await tick();
    workspace?.querySelector('[data-mobile-heading]')?.focus({ preventScroll: true });
  }
  async function openSearch() {
    if (compact) {
      mobileTab = 'search';
      mobileConversation = false;
      profileOpen = false;
      await tick();
      workspace?.querySelector('[aria-label="Search messages, people, and channels"]')?.focus();
    } else searchOpen = true;
  }
  async function selectDesktopDestination(destination) {
    mobileTab = destination;
    sidebarCollapsed = false;
    channelMenuOpen = false;
    await tick();
    workspace?.querySelector(destination === 'home' ? '.sidebar-header input' : '.desktop-navigation-panel [data-mobile-heading]')?.focus({ preventScroll: true });
  }
  async function focusConversation(id, compose = false) {
    await tick();
    if (selected !== id) return;
    const editor = !compact || compose ? workspace?.querySelector('.conversation-composer textarea') : undefined;
    (editor ?? workspace?.querySelector('[data-conversation-heading]'))?.focus({ preventScroll: true });
  }
  async function openConversation(id, compose = false) {
    selectRoom(id);
    await focusConversation(id, compose);
    if (compact && feedViewport) feedViewport.scrollTop = feedViewport.scrollHeight;
  }
  async function openNewMessage() {
    const returnToDrafts = compact && mobileConversation && draftsView;
    if (!newMessageView) newMessageReturn = selected;
    selectRoom('new-message');
    mobileDraftReturn = returnToDrafts;
    await tick();
    workspace?.querySelector('[aria-label="Choose people or a channel"]')?.focus();
  }
  function resumeDraft(id) {
    const opening = id === 'new-message' ? openNewMessage() : openConversation(id, true);
    mobileDraftReturn = compact;
    return opening;
  }
  async function sendNewMessage() {
    const message = createChatMessage(newMessageDraft);
    if (!message) return;
    const destination = resolveDirectConversation(rooms, people, newMessageRecipients);
    if (!destination) return;
    const returnToDrafts = mobileDraftReturn;
    if (!rooms.some((entry) => entry.id === destination.id)) {
      rooms.push(destination);
      drafts[destination.id] = '';
    }
    messages.push({ ...message, conversation: destination.id });
    newMessageDraft = '';
    newMessageRecipients = [];
    announcement = 'Message sent';
    await openConversation(destination.id);
    mobileDraftReturn = returnToDrafts;
    if (feedViewport) feedViewport.scrollTop = feedViewport.scrollHeight;
  }
  async function handleSidebarSearch(event) {
    if (event.isComposing) return;
    if (event.key === 'Escape' && sidebarQuery) {
      event.preventDefault();
      event.stopPropagation();
      sidebarQuery = '';
    } else if (event.key === 'Enter') {
      const first = filteredSections.flatMap((section) => section.items)[0];
      if (!first) return;
      event.preventDefault();
      await openConversation(first.value);
    }
  }
  const findMessage = (id) => findChatMessage(messages, id);
  function react(id, emoji) {
    const message = findMessage(id);
    if (!message) return;
    toggleChatReaction(message, emoji);
    announcement = 'Reaction updated';
  }
  function toggleSaved(id) {
    const message = findMessage(id);
    if (!message) return;
    message.saved = !message.saved;
    announcement = message.saved ? 'Message saved' : 'Message removed from saved';
  }
  async function togglePinned(id) {
    const message = findMessage(id);
    if (!toggleChatPin(message)) return;
    announcement = message.pinned ? 'Message pinned' : 'Message unpinned';
    if (pinnedOnly && !message.pinned && !savedView && selected === message.conversation) {
      await tick();
      (workspace?.querySelector('[aria-label="Show all messages"]') ?? workspace?.querySelector('[data-conversation-heading]'))?.focus({ preventScroll: true });
    }
  }
  async function startEdit(message) {
    if (message.author !== 'you') return;
    editingId = message.id;
    editText = message.text;
    await tick();
    workspace?.querySelector('.chat-message__editor textarea')?.focus();
  }
  async function finishEdit(save = false) {
    const id = editingId;
    if (save && !editOwnChatMessage(findMessage(id), editText)) return;
    editingId = '';
    editText = '';
    announcement = save ? 'Message updated' : 'Edit cancelled';
    await tick();
    workspace?.querySelector(`[data-message-id="${id}"] [aria-label="More message options"]`)?.focus();
  }
  function askDelete(message) {
    if (message.author !== 'you') return;
    deleteId = message.id;
    deleteOpen = true;
  }
  async function deleteMessage() {
    if (deleteTarget?.author !== 'you') return;
    const id = deleteId;
    messages = deleteOwnChatMessage(messages, id);
    for (const conversation of Object.keys(replyTargets)) {
      if (replyTargets[conversation] === id) replyTargets[conversation] = undefined;
    }
    if (editingId === id) {
      editingId = '';
      editText = '';
    }
    announcement = 'Message deleted';
    deleteOpen = false;
    await focusConversation(selected);
  }
  function showDetails(tab, trigger) {
    detailsTrigger = trigger ?? workspace?.querySelector('[data-conversation-heading]');
    detailsTab = tab;
    memberState = { query: '', filter: 'all', scrollTop: 0 };
    membersOpen = true;
  }
  function renameConversation(name) {
    if (!updateChatConversation(room, 'name', name)) return false;
    announcement = `Conversation renamed to ${room.name}.`;
    return true;
  }
  function updateConversationDetails(field, value) {
    if (!updateChatConversation(room, field, value)) return false;
    announcement = `${field === 'topic' ? 'Topic' : 'Description'} ${room[field] ? 'updated' : 'cleared'}.`;
    return true;
  }
  async function startReply(message) {
    if (selected !== message.conversation) selectRoom(message.conversation);
    replyTargets[selected] = message.id;
    composerPreview = false;
    await tick();
    workspace?.querySelector('.conversation-composer textarea')?.focus();
  }
  function openForward(message) {
    forwardMessageId = message.id;
    forwardQuery = '';
    forwardOpen = true;
  }
  function openProfile(person, event, initialEdit = '') {
    profileOrigin = forwardOpen ? 'forward' : membersOpen ? 'members' : '';
    forwardOpen = false;
    membersOpen = false;
    profilePerson = person;
    profileInitialEdit = initialEdit;
    profileTrigger = event.currentTarget;
    profileOpen = true;
  }
  async function closeProfile() {
    const origin = profileOrigin;
    profileOrigin = '';
    profileOpen = false;
    await tick();
    let trigger = profileTrigger;
    if (origin) {
      if (origin === 'forward') forwardOpen = true;
      else {
        detailsTrigger?.focus({ preventScroll: true });
        membersOpen = true;
      }
      await tick();
      const context = workspace?.ownerDocument.querySelector(origin === 'forward' ? '.forward-picker' : '.chat-members');
      trigger = [...(context?.querySelectorAll('button') ?? [])].find(
        (node) =>
          node.getAttribute('aria-label') === `View ${profilePerson.name}'s profile` &&
          (origin !== 'forward' || node.classList.contains('forward-author-name') === profileTrigger?.classList.contains('forward-author-name'))
      );
    }
    (trigger?.isConnected ? trigger : (workspace?.querySelector('.conversation-composer textarea') ?? workspace?.querySelector('[data-conversation-heading]')))?.focus({ preventScroll: true });
  }
  function ensureDirectRoom(person) {
    const personId = Object.keys(people).find((id) => people[id] === person);
    if (!personId || personId === 'you') return;
    const directRoom = resolveDirectConversation(rooms, people, [personId]);
    if (!rooms.some((entry) => entry.id === directRoom.id)) {
      rooms.push(directRoom);
      drafts[directRoom.id] = '';
    }
    return directRoom;
  }
  async function messagePerson(person) {
    const directRoom = ensureDirectRoom(person);
    if (!directRoom) return;
    await openConversation(directRoom.id);
  }
  function messageProfile() {
    return messagePerson(profilePerson);
  }
  function addChannelMembers(ids) {
    if (room?.type !== 'channel') return;
    const newMembers = [...new Set(ids)].filter((id) => people[id] && !room.members.includes(id));
    if (!newMembers.length) return;
    room.members.push(...newMembers);
    announcement = `Added ${newMembers.map((id) => people[id].name).join(', ')} to # ${room.name}.`;
  }
  function showChannelMenu(id, anchor) {
    channelMenuId = id;
    channelMenuAnchor = anchor;
    channelMenuOpen = true;
  }
  function observeChannelItem(node) {
    if (!node.dataset.channel) return;
    const entry = node.closest('button');
    if (!entry) return;
    const contextmenu = (event) => {
      event.preventDefault();
      showChannelMenu(node.dataset.channel, entry);
    };
    const keydown = (event) => {
      if (event.defaultPrevented || event.isComposing || (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10'))) return;
      event.preventDefault();
      showChannelMenu(node.dataset.channel, entry);
    };
    entry.addEventListener('contextmenu', contextmenu);
    entry.addEventListener('keydown', keydown);
    return () => {
      entry.removeEventListener('contextmenu', contextmenu);
      entry.removeEventListener('keydown', keydown);
    };
  }
  async function selectChannelAction(action, channel) {
    if (!channel) return;
    if (action === 'about' || action === 'members') {
      await openConversation(channel.id);
      showDetails(action);
    } else if (action === 'copy-name') {
      try {
        await navigator.clipboard.writeText(`#${channel.name}`);
        announcement = 'Channel name copied';
      } catch {
        announcement = 'Could not copy the channel name. Select and copy it from the conversation header.';
      }
    } else if (action === 'star') {
      channel.starred = !channel.starred;
      announcement = channel.starred ? 'Channel starred' : 'Channel unstarred';
    } else if (action === 'unread') {
      channel.unread = Math.max(channel.unread, 1);
      announcement = 'Channel marked as unread';
    } else if (['all', 'mentions', 'muted'].includes(action)) {
      channel.notifications = action;
      announcement = action === 'muted' ? 'Channel muted' : `Channel notifications set to ${action === 'all' ? 'all new posts' : 'just mentions'}`;
    }
  }
  function clearHighlight() {
    clearTimeout(highlightTimer);
    highlightTimer = undefined;
    highlightedId = '';
  }
  async function jumpToMessage(message) {
    if (!message) return;
    selectRoom(message.conversation);
    highlightedId = message.id;
    highlightTimer = setTimeout(() => {
      highlightedId = '';
      highlightTimer = undefined;
    }, 2500);
    await tick();
    if (!workspace || highlightedId !== message.id || selected !== message.conversation) return;
    const target = [...(workspace?.querySelectorAll('[data-message-id]') ?? [])].find((node) => node.dataset.messageId === message.id);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'center' });
    announcement = `Message from ${people[message.author].name} at ${message.time}`;
  }
  async function sendMessage() {
    if (!room) return;
    const message = createChatMessage(drafts[selected], { replyToId: replyTo?.id });
    if (!message) return;
    messages.push({ ...message, conversation: selected });
    drafts[selected] = '';
    replyTargets[selected] = undefined;
    pinnedOnly = false;
    clearHighlight();
    announcement = message.replyToId ? 'Reply sent' : 'Message sent';
    await tick();
    if (feedViewport) feedViewport.scrollTop = feedViewport.scrollHeight;
  }
  function scheduleMessage(sendAt) {
    if (!room) return false;
    const entry = createScheduledMessage(drafts[selected], selected, sendAt, { replyToId: replyTo?.id });
    if (!entry) return false;
    scheduled.push(entry);
    scheduledNotice = entry;
    drafts[selected] = '';
    replyTargets[selected] = undefined;
    composerPreview = false;
    announcement = `Message scheduled for ${formatScheduleTime(sendAt)}`;
    return true;
  }
  async function focusScheduledList() {
    if (!scheduledView) return;
    await tick();
    (workspace?.querySelector('.scheduled-message__actions button') ?? workspace?.querySelector('[data-conversation-heading]'))?.focus();
  }
  function sendScheduled(entry) {
    if (!scheduled.some((item) => item.id === entry.id)) return;
    scheduled = scheduled.filter((item) => item.id !== entry.id);
    messages.push(deliverScheduledMessage(entry));
    if (scheduledNotice?.id === entry.id) scheduledNotice = undefined;
    announcement = `Message sent to ${rooms.find((item) => item.id === entry.conversation)?.name}`;
    void focusScheduledList();
  }
  function cancelScheduled(entry) {
    scheduled = scheduled.filter((item) => item.id !== entry.id);
    if (scheduledNotice?.id === entry.id) scheduledNotice = undefined;
    announcement = 'Scheduled message cancelled';
    void focusScheduledList();
  }
  function deliverDueMessages() {
    const { due, pending } = partitionScheduledMessages(scheduled);
    if (!due.length) return;
    scheduled = pending;
    messages.push(...due.map((entry) => deliverScheduledMessage(entry)));
    if (due.some((entry) => entry.id === scheduledNotice?.id)) scheduledNotice = undefined;
    announcement = `${due.length} scheduled ${due.length === 1 ? 'message sent' : 'messages sent'}`;
  }
  function forwardTo(id) {
    if (!forwardSource) return;
    const destination = id.startsWith('person:') ? ensureDirectRoom(people[id.slice(7)]) : rooms.find((entry) => entry.id === id);
    if (!destination) return;
    const message = createForwardedChatMessage(forwardSource, destination.id);
    if (!message) return;
    messages.push(message);
    forwardOpen = false;
    announcement = `Message forwarded to ${destination.name}`;
  }
</script>

<svelte:window onpointerdown={rememberTypingScope} onkeydown={onWorkspaceKeydown} />

{#snippet messageRow(message)}
  {@const quotedMessage = getChatMessageReference(messages, message)}
  <div class="message-anchor" data-message-id={message.id} tabindex="-1">
    {#if savedView}<button class="saved-context" type="button" onclick={() => jumpToMessage(message)}>
        <AesirIcon name="arrow-up-right" size={12} />{rooms.find((entry) => entry.id === message.conversation)?.name}
      </button>{/if}
    <TeamChatMessage
      {message}
      mobile={compact}
      showTimestamps={preferences.showTimestamps}
      sendWith={preferences.sendWith}
      person={people[message.author]}
      {quotedMessage}
      quotedPerson={quotedMessage ? people[quotedMessage.author] : undefined}
      highlighted={highlightedId === message.id}
      onprofile={(event) => openProfile(people[message.author], event)}
      onquotedprofile={(event) => openProfile(people[quotedMessage.author], event)}
      onmessage={message.author !== 'you' ? () => messagePerson(people[message.author]) : undefined}
      onquotedmessage={quotedMessage && quotedMessage.author !== 'you' ? () => messagePerson(people[quotedMessage.author]) : undefined}
      onreply={() => startReply(message)}
      onforward={() => openForward(message)}
      onquote={() => jumpToMessage(quotedMessage)}
      onreaction={(emoji) => react(message.id, emoji)}
      onsave={() => toggleSaved(message.id)}
      onpin={() => togglePinned(message.id)}
      editing={editingId === message.id}
      bind:editValue={editText}
      people={Object.values(people).filter((person) => person !== people.you)}
      onedit={() => startEdit(message)}
      oncancelEdit={() => finishEdit()}
      onupdate={() => finishEdit(true)}
      ondelete={() => askDelete(message)}
    />
  </div>
{/snippet}

<section
  class="team-chat"
  data-aesir-accent={preferences.accent}
  data-density={preferences.density}
  data-larger-text={preferences.largerText || undefined}
  data-underline-links={preferences.underlineLinks}
  aria-label="Team chat workspace"
  data-mobile={compact || undefined}
  style:--chat-sidebar-width={`${sidebarWidth}px`}
  {@attach observeWorkspace}
>
  {#if !compact || !mobileConversation}
    <header class="team-chat__topbar">
      {#if compact}<h1 class="mobile-title">{profileOpen ? 'Profile' : mobileTitle}</h1>
        <AesirButton variant="ghost" size="icon" aria-label="Search conversations and messages" aria-keyshortcuts="Meta+K Control+K" onclick={openSearch}>
          <AesirIcon icon={Search} size={21} />
        </AesirButton>
        <AesirButton variant="ghost" size="icon" aria-label="New message" onclick={openNewMessage}><AesirIcon icon={SquarePen} size={21} /></AesirButton>
      {:else}<AesirButton class="workspace-search" variant="outline" size="sm" aria-label="Search conversations and messages" aria-keyshortcuts="Meta+K Control+K" onclick={openSearch}>
          <AesirIcon name="search" size={15} />
          <span class="workspace-search__label">Search conversations and messages</span>
          <AesirKbd class="workspace-search__shortcut" meta small aria-hidden="true">K</AesirKbd>
        </AesirButton>{/if}
      <div class="workspace-account">
        <TeamChatAccountMenu
          person={people.you}
          onprofile={(trigger) => openProfile(people.you, { currentTarget: trigger })}
          onstatus={(trigger) => openProfile(people.you, { currentTarget: trigger }, 'status')}
          onupdate={(changes) => Object.assign(people.you, changes)}
          onpreferences={() => (preferencesOpen = true)}
        />
      </div>
    </header>
  {/if}
  <div class="team-chat__body">
    {#if compact}
      <TeamChatMobile
        bind:tab={mobileTab}
        hidden={mobileConversation || profileOpen}
        children={chatPanels}
        onnavigate={() => {
          mobileConversation = false;
          mobileDraftReturn = false;
          profileOpen = false;
          channelMenuOpen = false;
        }}
        {rooms}
        {messages}
        {people}
        {drafts}
        draftCount={draftEntries.length}
        scheduledCount={scheduled.length}
        showUnread={preferences.showUnread}
        onconversation={openConversation}
        onmessage={jumpToMessage}
        onperson={messagePerson}
        onnewmessage={openNewMessage}
        onpreferences={() => (preferencesOpen = true)}
        onchannelmenu={showChannelMenu}
        onmarkread={() => {
          for (const entry of rooms) entry.unread = 0;
        }}
      />
    {:else}
      <TeamChatNavigation tab={mobileTab === 'search' ? 'home' : mobileTab} unread={navigationUnread} onselect={selectDesktopDestination} />
      {#if mobileTab === 'home' || mobileTab === 'search'}
        <AesirSidebar
          class="chat-sidebar"
          title="Conversations"
          label="Channels and direct messages"
          variant="app"
          mode="desktop"
          sections={filteredSections}
          bind:width={sidebarWidth}
          minWidth={208}
          maxWidth={320}
          resizable
          collapsible
          collapseTrigger="external"
          bind:collapsed={sidebarCollapsed}
          value={selected}
          onselect={(item) => openConversation(item.value)}
          onsectionaction={(section) => {
            if (section.title === 'Direct messages') void openNewMessage();
          }}
          style="--aesir-sidebar-height: 100%;"
        >
          {#snippet itemLeading(item)}
            {@const itemRoom = rooms.find((entry) => entry.id === item.value)}
            <span
              class="sidebar-item-leading"
              data-conversation={itemRoom ? true : undefined}
              data-unread={itemRoom?.unread ? true : undefined}
              data-channel={itemRoom?.type === 'channel' ? itemRoom.id : undefined}
              {@attach observeChannelItem}
            >
              {#if itemRoom?.type === 'direct'}<TeamChatAvatar person={people[itemRoom.members.find((id) => id !== 'you')]} size="2xs" />{:else if item.icon}<AesirIcon
                  icon={sidebarIcons[item.icon]}
                  name={item.icon}
                  size={15}
                />{/if}
            </span>
          {/snippet}
          {#snippet header()}<div class="sidebar-header">
              <TeamChatSidebarHeader title="Conversations" onnewmessage={openNewMessage} />
              <div class="sidebar-search-field">
                <AesirInput
                  size="sm"
                  bind:value={sidebarQuery}
                  trailingVisible={Boolean(sidebarQuery)}
                  aria-label="Filter channels and people"
                  placeholder="Find channels or people…"
                  autocomplete="off"
                  onkeydown={handleSidebarSearch}
                >
                  {#snippet leading()}<AesirIcon name="search" size={15} />{/snippet}
                  {#snippet trailing()}
                    {#if sidebarQuery}<AesirButton
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Clear conversation filter"
                        onclick={(event) => {
                          sidebarQuery = '';
                          event.currentTarget.closest('.aesir-input')?.querySelector('input')?.focus();
                        }}
                      >
                        <AesirIcon name="x" size={13} />
                      </AesirButton>{/if}
                  {/snippet}
                </AesirInput>
                <span class="sr-only" role="status">{sidebarQuery.trim() ? `${filteredSections.reduce((count, section) => count + section.items.length, 0)} conversations found` : ''}</span>
                {#if !filteredSections.length}<p class="sidebar-empty">No channels or people found.</p>{/if}
              </div>
            </div>{/snippet}
        </AesirSidebar>
      {:else}
        <aside class="desktop-navigation-panel" hidden={sidebarCollapsed} aria-label={`${mobileTitle} sidebar`}>
          <TeamChatMobile
            layout="sidebar"
            bind:tab={mobileTab}
            {selected}
            {rooms}
            {messages}
            {people}
            {drafts}
            draftCount={draftEntries.length}
            scheduledCount={scheduled.length}
            showUnread={preferences.showUnread}
            onconversation={openConversation}
            onmessage={jumpToMessage}
            onperson={messagePerson}
            onnewmessage={openNewMessage}
            onpreferences={() => (preferencesOpen = true)}
            onchannelmenu={showChannelMenu}
            onmarkread={() => {
              for (const entry of rooms) entry.unread = 0;
            }}
          />
        </aside>
      {/if}
    {/if}

    {#snippet chatPanels()}
      {#if !compact || mobileConversation || profileOpen}
        <div class="chat-panels" class:chat-panels--profile-open={profileOpen}>
          <section class="conversation" aria-label={newMessageView || savedView || scheduledView || draftsView ? title : `Conversation ${title}`}>
            <header class="conversation-header">
              <AesirButton
                variant="ghost"
                size={compact ? 'icon' : 'icon-sm'}
                aria-label={compact ? `Back to ${mobileDraftReturn ? 'Drafts' : mobileTitle}` : sidebarCollapsed ? 'Expand conversations' : 'Collapse conversations'}
                aria-expanded={compact ? undefined : !sidebarCollapsed}
                onclick={() => {
                  if (compact) void mobileBack();
                  else sidebarCollapsed = !sidebarCollapsed;
                }}
              >
                <AesirIcon icon={compact ? ArrowLeft : undefined} name={compact ? undefined : sidebarCollapsed ? 'panel-left-open' : 'panel-left-close'} size={compact ? 22 : 17} />
              </AesirButton>
              <div class="conversation-heading" tabindex="-1" data-conversation-heading>
                <h2>
                  {#if recipient}<TeamChatAvatar person={recipient} size="xs" preview onclick={(event) => openProfile(recipient, event)} onmessage={() => messagePerson(recipient)} />{:else}<AesirIcon
                      icon={newMessageView ? SquarePen : draftsView ? FilePenLine : scheduledView ? Clock : savedView ? Bookmark : room?.type === 'group' ? Users : Hash}
                      size={19}
                    />{/if}
                  {#if room?.type === 'channel' || room?.type === 'group'}<AesirButton
                      class="channel-title-button conversation-title"
                      variant="ghost"
                      aria-label={`About ${room.type === 'channel' ? '#' : ''}${room.name}`}
                      aria-haspopup="dialog"
                      onclick={(event) => showDetails('about', event.currentTarget)}
                    >
                      {title}
                    </AesirButton>{:else if recipient}<AesirButton
                      class="channel-title-button conversation-title"
                      variant="ghost"
                      aria-label={`View ${recipient.name}'s profile`}
                      onclick={(event) => openProfile(recipient, event)}
                    >
                      {title}
                    </AesirButton>{:else}<span class="conversation-title">{title}</span>{/if}
                </h2>
                {#if !recipient && !newMessageView && !draftsView && room?.type !== 'group'}<p>
                    {scheduledView ? 'Sent automatically while this example is open. Refreshing clears the queue.' : savedView ? 'Keep the useful things close.' : room?.description}
                  </p>{/if}
              </div>
              {#if newMessageView}
                <AesirButton variant="ghost" size={compact ? 'icon' : 'icon-sm'} aria-label="Cancel new message" onclick={() => (compact ? mobileBack() : openConversation(newMessageReturn))}>
                  <AesirIcon name="x" size={16} />
                </AesirButton>
              {:else if room}
                <div class="conversation-header__actions">
                  {#if room.type === 'channel'}
                    <AesirButton
                      variant="ghost"
                      size={compact ? 'icon' : 'icon-sm'}
                      aria-label="Channel options"
                      aria-haspopup="menu"
                      aria-expanded={channelMenuOpen && channelMenuId === room.id}
                      onclick={(event) => showChannelMenu(room.id, event.currentTarget)}
                    >
                      <AesirIcon name="ellipsis" size={16} />
                    </AesirButton>
                  {/if}
                  <AesirButton
                    variant={pinnedOnly ? 'secondary' : 'ghost'}
                    size={compact ? 'icon' : 'icon-sm'}
                    aria-label={pinnedOnly ? 'Show all messages' : 'Show pinned messages'}
                    aria-pressed={pinnedOnly}
                    onclick={() => (pinnedOnly = !pinnedOnly)}
                  >
                    <AesirIcon icon={Pin} size={16} />
                  </AesirButton>
                  {#if room.type !== 'direct'}<AesirButton
                      class="member-count"
                      variant="ghost"
                      size="sm"
                      aria-label={`View ${room.members.length} conversation members`}
                      onclick={(event) => showDetails('members', event.currentTarget)}
                    >
                      <span class="member-avatar-stack" aria-hidden="true">
                        {#each room.members.slice(0, 3) as id (id)}
                          {@const person = people[id]}
                          {@const presenceLabel = presenceLabels[person.presence]}
                          <AesirAvatar gradient size="xs" aria-label={`${person.name}${presenceLabel ? ` · ${presenceLabel}` : ''}`} />
                        {/each}
                      </span>
                      <span>{room.members.length}</span>
                    </AesirButton>{/if}
                </div>
              {/if}
            </header>
            {#if pinnedOnly}<div class="conversation-notice">
                <AesirIcon icon={Pin} size={13} /> Pinned messages <AesirButton variant="ghost" size="sm" onclick={() => (pinnedOnly = false)}>Show all</AesirButton>
              </div>{/if}
            {#if room && scheduledNotice?.conversation === selected}<div class="conversation-notice">
                <AesirIcon icon={Clock} size={13} />
                <span>Scheduled for {formatScheduleTime(scheduledNotice.sendAt)}</span>
                <AesirButton variant="ghost" size="sm" onclick={() => selectRoom('scheduled')}>View scheduled</AesirButton>
              </div>{/if}
            {#if newMessageView}
              <TeamChatNewMessage
                mobile={compact}
                {people}
                {rooms}
                bind:recipients={newMessageRecipients}
                bind:value={newMessageDraft}
                sendWith={preferences.sendWith}
                onchannel={openConversation}
                onsend={sendNewMessage}
              />
            {:else if draftsView}
              <TeamChatDrafts entries={draftEntries} {people} mobile={compact} onresume={resumeDraft} onnewmessage={openNewMessage} />
            {:else}
              <AesirScrollArea class="conversation-scroll" label={`${title} messages`} bind:viewportRef={feedViewport}>
                {#if scheduledView}
                  <div class="scheduled-list">
                    {#each scheduledMessages as entry (entry.id)}
                      {@const destination = rooms.find((item) => item.id === entry.conversation)}
                      {@const quoted = findMessage(entry.replyToId)}
                      <article class="scheduled-message" aria-label={`Scheduled message to ${destination?.name}`}>
                        <div class="scheduled-message__heading">
                          <TeamChatAvatar person={people.you} size="xs" preview onclick={(event) => openProfile(people.you, event)} />
                          <strong>{destination?.type === 'channel' ? '#' : ''}{destination?.name}</strong>
                          <time datetime={scheduleDateTime(entry.sendAt)}>{formatScheduleTime(entry.sendAt)}</time>
                        </div>
                        {#if quoted}<TeamChatQuote
                            message={quoted}
                            person={people[quoted.author]}
                            onprofile={(event) => openProfile(people[quoted.author], event)}
                            onmessage={quoted.author !== 'you' ? () => messagePerson(people[quoted.author]) : undefined}
                            onclick={() => jumpToMessage(quoted)}
                          />{/if}
                        <TeamChatText text={entry.text} />
                        <div class="scheduled-message__actions">
                          <AesirButton variant="outline" size="sm" onclick={() => sendScheduled(entry)}>Send now</AesirButton>
                          <AesirButton variant="ghost" size="sm" onclick={() => cancelScheduled(entry)}>Cancel scheduled message</AesirButton>
                        </div>
                      </article>
                    {:else}<div class="chat-empty">
                        <AesirIcon icon={Clock} size={24} />
                        <span>No scheduled messages</span>
                        <p>Use the arrow next to Send to choose a delivery time.</p>
                      </div>{/each}
                  </div>
                {:else}
                  <div class="date-divider"><span>Thursday, October 8</span></div>
                  <div class="message-list">
                    {#each visibleMessages as message (message.id)}{@render messageRow(message)}{:else}<div class="chat-empty">
                        <AesirIcon icon={savedView ? Bookmark : MessageSquare} size={24} />
                        <span>{savedView ? 'No saved messages yet' : pinnedOnly ? 'No pinned messages in this conversation' : 'Start the conversation'}</span>
                        <p>
                          {savedView
                            ? 'Use the bookmark on a message to keep it here.'
                            : pinnedOnly
                              ? 'Use Pin message in a message’s menu to keep it here.'
                              : 'A small hello is a good place to start.'}
                        </p>
                      </div>{/each}
                  </div>
                {/if}
              </AesirScrollArea>
              {#if room}
                <div class="conversation-composer">
                  <TeamChatComposer
                    mobile={compact}
                    bind:value={drafts[selected]}
                    sendWith={preferences.sendWith}
                    bind:preview={composerPreview}
                    label={`Message ${room?.type === 'channel' ? '#' : ''}${title}`}
                    placeholder={`Message ${room?.type === 'channel' ? '#' : ''}${title}`}
                    people={Object.values(people).filter((person) => person !== people.you)}
                    {replyTo}
                    replyPerson={replyTo ? people[replyTo.author] : undefined}
                    oncancelreply={() => (replyTargets[selected] = undefined)}
                    onreplyprofile={(event) => openProfile(people[replyTo.author], event)}
                    onreplymessage={replyTo && replyTo.author !== 'you' ? () => messagePerson(people[replyTo.author]) : undefined}
                    onquote={() => jumpToMessage(replyTo)}
                    onsend={() => sendMessage()}
                    onschedule={scheduleMessage}
                  />
                </div>
              {/if}
            {/if}
          </section>
          {#if profileOpen && profilePerson}
            {#key profilePerson}
              <TeamChatProfile
                person={profilePerson}
                self={profilePerson === people.you}
                initialEdit={profileInitialEdit}
                onclose={closeProfile}
                onupdate={(changes) => Object.assign(people.you, changes)}
                onmessage={profilePerson !== people.you ? messageProfile : undefined}
              />
            {/key}
          {/if}
        </div>
      {/if}
    {/snippet}
    {#if !compact}{@render chatPanels()}{/if}
  </div>
  <span class="sr-only" aria-live="polite">{announcement}</span>
</section>

<TeamChatSearch bind:open={searchOpen} {rooms} {messages} {people} accent={preferences.accent} onconversation={openConversation} onperson={messagePerson} onmessage={jumpToMessage} />
<TeamChatPreferences bind:open={preferencesOpen} bind:value={preferences} />
<TeamChatChannelMenu bind:open={channelMenuOpen} room={channelMenuRoom} anchor={channelMenuAnchor} onselect={selectChannelAction} />
<AesirDialog
  class={room?.type === 'channel' || room?.type === 'group' ? 'chat-channel-dialog' : ''}
  bind:open={membersOpen}
  data-aesir-accent={preferences.accent}
  title={room?.type === 'channel' ? `# ${room.name}` : room?.type === 'group' ? room.name : 'Conversation members'}
>
  {#if room?.type === 'channel' || room?.type === 'group'}{#key room.id}<TeamChatChannelDetails
        {room}
        {people}
        bind:tab={detailsTab}
        {memberState}
        onprofile={(id, event) => openProfile(people[id], event)}
        onadd={room.type === 'channel' ? addChannelMembers : undefined}
        onrename={renameConversation}
        onupdate={updateConversationDetails}
      />{/key}{:else if room}<TeamChatMembers {room} {people} viewState={memberState} onprofile={(id, event) => openProfile(people[id], event)} />{/if}
</AesirDialog>

<AesirAlertDialog
  bind:open={deleteOpen}
  title="Delete message?"
  description="This cannot be undone. Replies will remain, but the original message will no longer be available."
  confirmLabel="Delete message"
  destructive
  onconfirm={deleteMessage}
>
  {#if deleteTarget}<TeamChatText text={deleteTarget.text} />{/if}
</AesirAlertDialog>

<AesirDialog bind:open={forwardOpen} title="Forward message" data-aesir-accent={preferences.accent}>
  {#if forwardSource}
    {@const original = forwardSource.forwardOfId ? (findMessage(forwardSource.forwardOfId) ?? forwardSource) : forwardSource}
    <div class="forward-picker">
      <div class="forward-preview">
        <div class="forward-preview__author">
          <TeamChatAvatar person={people[original.author]} size="xs" onclick={(event) => openProfile(people[original.author], event)} />
          <AesirButton
            class="forward-author-name"
            variant="ghost"
            size="sm"
            aria-label={`View ${people[original.author].name}'s profile`}
            onclick={(event) => openProfile(people[original.author], event)}
          >
            <strong>{people[original.author].name}</strong>
          </AesirButton>
          <time>{original.time}</time>
        </div>
        <span class="forward-preview__text">{plainChatText(forwardSource.text)}</span>
      </div>
      <AesirInput bind:value={forwardQuery} aria-label="Find a forwarding destination" placeholder="Find a person or channel…" autocomplete="off">
        {#snippet leading()}<AesirIcon name="search" size={15} />{/snippet}
      </AesirInput>
      <AesirScrollArea class="forward-destinations" label="Forwarding destinations">
        {#each forwardSections as section (section.title)}
          <h3 class="forward-section-title">{section.title}</h3>
          {#each section.items as item (item.value)}
            {@const destination = rooms.find((entry) => entry.id === item.value)}
            <AesirButton variant="ghost" width="full" class="forward-destination" aria-label={`Forward to ${item.label}`} onclick={() => forwardTo(item.value)}>
              {#if item.personId}<TeamChatAvatar person={people[item.personId]} size="xs" />{:else}<AesirIcon icon={destination?.type === 'group' ? Users : Hash} size={19} />{/if}
              <span class="forward-destination__label">{item.label}</span>
              <AesirIcon name="arrow-up-right" size={14} />
            </AesirButton>
          {/each}
        {:else}<p>No conversations found.</p>{/each}
      </AesirScrollArea>
    </div>
  {/if}
</AesirDialog>

<style>
  :global(.chat-channel-dialog) {
    width: min(100%, var(--ds-sizing-2xl));
    height: min(var(--ds-sizing-3xl), calc(100dvh - var(--ds-spacing-8)));
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }
  :global(.chat-channel-dialog .aesir-dialog__body) {
    min-height: 0;
    overflow: hidden;
  }
  .team-chat[data-density='compact'] :global(.chat-message) {
    padding-block: var(--ds-spacing-1-5);
  }
  .team-chat[data-larger-text] :global(.chat-text) {
    font-size: var(--ds-font-size-base);
  }
  .team-chat[data-underline-links='false'] :global(.chat-text a:not(:hover, :focus-visible)) {
    text-decoration: none;
  }
  .conversation-heading :global(.channel-title-button) {
    min-width: 0;
    height: auto;
    padding: var(--ds-spacing-1);
    font: inherit;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .scheduled-list {
    display: grid;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-4);
  }
  .scheduled-message {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-3);
    padding-bottom: var(--ds-spacing-4);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    font-size: var(--ds-font-size-sm);
  }
  .scheduled-message__heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .scheduled-message__heading strong {
    overflow-wrap: anywhere;
  }
  .scheduled-message__heading time {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .scheduled-message__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ds-spacing-2);
  }
  .team-chat {
    container: team-chat / inline-size;
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    background: var(--ds-background);
    color: var(--ds-foreground);
  }
  .team-chat__topbar {
    display: grid;
    grid-template-columns: minmax(var(--ds-spacing-10), 1fr) minmax(0, var(--ds-sizing-lg)) minmax(var(--ds-spacing-10), 1fr);
    min-height: var(--ds-spacing-12);
    flex: none;
    align-items: center;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-2) var(--ds-spacing-4);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
  }
  .mobile-title {
    margin: 0 auto 0 0;
    font-size: var(--ds-font-size-xl);
    font-weight: var(--ds-font-weight-semibold);
  }
  .team-chat[data-mobile] .team-chat__topbar {
    display: flex;
    min-height: var(--ds-spacing-16);
    padding-top: max(var(--ds-spacing-2), env(safe-area-inset-top, 0px));
    gap: var(--ds-spacing-1);
    background: var(--ds-background);
  }
  .team-chat[data-mobile] .team-chat__topbar :global(.chat-avatar-trigger) {
    min-width: var(--ds-spacing-12);
    min-height: var(--ds-spacing-12);
  }
  .team-chat[data-mobile] .conversation-header {
    min-height: var(--ds-spacing-14);
    gap: var(--ds-spacing-1);
  }
  .team-chat[data-mobile] .conversation-header__actions :global(.member-count) {
    min-height: var(--ds-spacing-12);
    padding-inline: var(--ds-spacing-2);
  }
  .team-chat[data-mobile] .member-avatar-stack {
    display: none;
  }
  .team-chat[data-mobile] .conversation-header__actions :global(.member-count)::before {
    content: 'Members';
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .team-chat[data-mobile] .conversation-composer {
    padding-bottom: max(var(--ds-spacing-3), env(safe-area-inset-bottom, 0px));
  }
  .team-chat[data-mobile] .chat-panels--profile-open .conversation {
    display: none;
  }
  .team-chat[data-mobile] :global(.chat-profile-panel) {
    width: 100%;
    flex: 1;
    border-left: 0;
  }
  .team-chat :global(.workspace-search) {
    grid-column: 2;
    width: 100%;
    min-width: 0;
    height: var(--ds-spacing-8);
    justify-content: flex-start;
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-normal);
  }
  .team-chat__topbar :global(.chat-avatar-trigger) {
    align-self: center;
  }
  .workspace-search__label {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .team-chat :global(.workspace-search__shortcut) {
    flex: none;
    margin-left: auto;
  }
  .workspace-account {
    display: flex;
    grid-column: 3;
    justify-self: end;
    align-items: center;
  }
  .team-chat__body {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1;
  }
  .desktop-navigation-panel {
    display: flex;
    box-sizing: border-box;
    width: var(--chat-sidebar-width);
    min-width: 0;
    min-height: 0;
    flex: none;
    border-right: var(--ds-spacing-px) solid var(--ds-border);
  }
  .desktop-navigation-panel[hidden] {
    display: none;
  }
  .sidebar-header {
    display: grid;
    width: 100%;
    min-width: 0;
  }
  .team-chat :global(.chat-sidebar[data-variant='app'] .aesir-sidebar__desktop),
  .team-chat :global(.chat-sidebar[data-variant='app'] .aesir-sidebar__header) {
    padding: 0;
  }
  .team-chat :global(.chat-sidebar .aesir-sidebar__scroll-area) {
    padding: var(--ds-spacing-1-5);
  }
  .sidebar-search-field {
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .sidebar-item-leading {
    display: grid;
    width: var(--ds-spacing-5);
    height: var(--ds-spacing-5);
    place-items: center;
  }
  :global(.aesir-sidebar__item):has(.sidebar-item-leading[data-unread]) :global(.aesir-badge) {
    border-color: transparent;
    background: var(--ds-accent-surface-hover);
    color: var(--ds-accent-text-muted);
  }
  :global(.chat-sidebar .aesir-sidebar__item):has(.sidebar-item-leading[data-conversation]) :global(.aesir-sidebar__item-label) {
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-normal);
  }
  :global(.chat-sidebar .aesir-sidebar__item):has(.sidebar-item-leading[data-unread]) :global(.aesir-sidebar__item-label) {
    color: var(--ds-foreground);
    font-weight: var(--ds-font-weight-medium);
  }
  :global(.chat-sidebar .aesir-sidebar__item[aria-current='page']):has(.sidebar-item-leading[data-conversation]),
  :global(.chat-sidebar .aesir-sidebar__item[aria-current='page']):has(.sidebar-item-leading[data-conversation]) :global(.aesir-sidebar__item-label) {
    color: var(--ds-accent-text-muted);
    font-weight: var(--ds-font-weight-medium);
  }
  .sidebar-empty {
    margin: 0;
    padding: var(--ds-spacing-2);
    font-size: var(--ds-font-size-sm);
  }
  .chat-panels {
    container: chat-panels / inline-size;
    display: flex;
    position: relative;
    min-width: 0;
    min-height: 0;
    flex: 1;
  }
  @container chat-panels (max-width: 44rem) {
    .chat-panels--profile-open .conversation {
      display: none;
    }
  }
  .conversation {
    container: conversation / inline-size;
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1;
    flex-direction: column;
  }
  .conversation-header {
    display: flex;
    min-height: var(--ds-spacing-16);
    flex: none;
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-2) var(--ds-spacing-4);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .conversation-heading {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--ds-spacing-3);
    min-width: 0;
  }
  .conversation-heading h2 {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-1-5);
    margin: 0;
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-medium);
  }
  .conversation-heading p {
    min-width: 0;
    flex-shrink: 10;
    overflow: hidden;
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .conversation-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .conversation-header__actions {
    display: flex;
    flex: none;
    align-items: center;
    margin-left: auto;
  }
  .member-avatar-stack {
    display: inline-flex;
    flex: none;
    align-items: center;
    isolation: isolate;
  }
  .member-avatar-stack :global(.aesir-avatar[data-gradient]) {
    border: var(--ds-spacing-0-5) solid var(--ds-background);
  }
  .member-avatar-stack :global(.aesir-avatar + .aesir-avatar) {
    margin-inline-start: calc(-1 * var(--ds-spacing-2));
  }
  .conversation-notice {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    padding-inline: var(--ds-spacing-5);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .conversation-notice :global(button) {
    margin-left: auto;
  }
  .team-chat :global(.conversation-scroll) {
    min-height: 0;
    flex: 1;
  }
  .date-divider {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
    margin: var(--ds-spacing-3) 0;
    font-size: var(--ds-font-size-xs);
    color: var(--ds-foreground-muted);
  }
  .date-divider::before,
  .date-divider::after {
    height: var(--ds-spacing-px);
    flex: 1;
    background: var(--ds-border);
    content: '';
  }
  .date-divider span {
    padding: var(--ds-spacing-1) var(--ds-spacing-3);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-full);
  }
  .message-list {
    padding-bottom: var(--ds-spacing-4);
  }
  .conversation-composer {
    flex: none;
    padding: var(--ds-spacing-3) var(--ds-spacing-5);
  }
  .message-anchor:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: calc(var(--ds-spacing-0-5) * -1);
  }
  .forward-picker {
    display: grid;
    gap: var(--ds-spacing-3);
    min-width: 0;
  }
  .forward-preview {
    display: grid;
    gap: var(--ds-spacing-1);
    margin: 0;
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-left: var(--ds-spacing-0-5) solid var(--ds-border-active);
    font-size: var(--ds-font-size-sm);
  }
  .forward-preview strong {
    font-weight: var(--ds-font-weight-medium);
  }
  :global(.forward-author-name.aesir-button) {
    height: auto;
    padding: 0;
    white-space: normal;
    overflow-wrap: anywhere;
    font-weight: var(--ds-font-weight-medium);
  }
  .forward-preview__author {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ds-spacing-2);
  }
  .forward-preview__author time {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .forward-preview__text {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow-wrap: anywhere;
  }
  .forward-picker :global(.forward-destinations) {
    height: min(20rem, 40dvh);
  }
  .forward-section-title {
    margin: var(--ds-spacing-3) var(--ds-spacing-2) var(--ds-spacing-1);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    color: var(--ds-foreground-muted);
  }
  .forward-picker :global(.forward-destination) {
    justify-content: flex-start;
    height: var(--ds-spacing-10);
    font-weight: var(--ds-font-weight-normal);
  }
  .forward-destination__label {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .forward-picker :global(.forward-destination > svg:last-child) {
    flex: none;
    margin-left: auto;
  }
  .saved-context {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-1);
    margin: var(--ds-spacing-3) var(--ds-spacing-5) 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    cursor: pointer;
  }
  .saved-context:hover {
    color: var(--ds-foreground);
  }
  .saved-context:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-1);
  }
  .chat-empty {
    display: grid;
    justify-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-8) var(--ds-spacing-4);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    text-align: center;
  }
  .chat-empty p {
    margin: 0;
    font-size: var(--ds-font-size-xs);
  }
  .sr-only {
    position: absolute;
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-px);
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @container team-chat (max-width: 47.5rem) {
    .team-chat__topbar {
      gap: var(--ds-spacing-2);
      padding-inline: var(--ds-spacing-3);
    }
  }
  @container conversation (max-width: 28rem) {
    .conversation-header {
      padding-inline: var(--ds-spacing-2);
    }
    .conversation-heading p {
      display: none;
    }
    .conversation-heading h2 {
      font-size: var(--ds-font-size-sm);
      overflow-wrap: anywhere;
    }
    .conversation-composer {
      padding: var(--ds-spacing-3);
    }
  }
</style>
