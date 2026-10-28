<script>
  import RequirementToolbar from './requirement-toolbar.svelte';
  import RequirementsBreadcrumb from './requirements-breadcrumb.svelte';
  import RequirementsVersionSelector from './requirements-version-selector.svelte';
  import RequirementsRow from './requirements-row.svelte';
  import RequirementsDetails from './requirements-details.svelte';
  import RequirementsDrawer from './requirements-drawer.svelte';
  import RequirementsSaveReview from './requirements-save-review.svelte';
  import RequirementsSourceEditor from './requirements-source-editor.svelte';
  import RequirementsTreeLine from './requirements-tree-line.svelte';
  import { MediaQuery, SvelteURL } from 'svelte/reactivity';
  import { createClipboard } from '@aesir/svelte/utilities/clipboard';
  import { AesirAvatar, AesirButton, AesirCommandMenu, AesirIcon, AesirKbd, AesirScrollArea, AesirSidebar, toast } from '@aesir/svelte';
  import requirementsSource from './requirements.md?raw';
  import { ESTIMATE_UNITS, filterRequirementGroups, findRequirement, requirementAssignee, requirementTasks, groupTasks, totalEstimate as calculateTotalEstimate } from './requirements-model.js';
  import {
    initialDocument,
    documentVersions,
    projectName,
    assigneeOptions,
    taskTitles,
    unlinkedIssuesData,
    exampleSidebarSections,
    statusMeta,
    filterOptions,
    sortOptions
  } from './requirements-demo.js';
  import { parseRequirementsSource } from './requirements-parser.js';
  import RequirementsTree from './requirements-tree.svelte';

  let latestRequirements = $state(structuredClone(initialDocument.requirements));
  let selectedVersionId = $state('latest');
  const selectedVersion = $derived(documentVersions.find((version) => version.id === selectedVersionId));
  const readOnly = $derived(selectedVersionId !== 'latest');
  const requirements = $derived(selectedVersion ? parseRequirementsSource(selectedVersion.source).requirements : latestRequirements);

  const tasksFor = (item) => requirementTasks(item, assigneeOptions, taskTitles);
  const rowData = (item, group = false) => ({
    ownTasks: tasksFor(item),
    tasks: group ? groupTasks(item, assigneeOptions, taskTitles) : tasksFor(item),
    totalTasks: group ? groupTasks(findRequirement(requirements, item.id), assigneeOptions, taskTitles) : tasksFor(item),
    assignee: requirementAssignee(item, assigneeOptions),
    assigneeOptions,
    statusMeta,
    readOnly
  });

  function observeListWidth(node) {
    const viewport = node.parentElement;
    const observer = new ResizeObserver(([entry]) => {
      node.dataset.narrow = String(entry.contentRect.width >= 640 && entry.contentRect.width < 800);
      node.dataset.compactLinks = String(entry.contentRect.width < 1200);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }

  let query = $state('');
  let unlinkedIssues = $state(structuredClone(unlinkedIssuesData));
  let statusFilters = $state([]);
  let assigneeFilters = $state([]);
  let groupFilters = $state([]);
  let showClosed = $state(true);
  let assignedIssuesOnly = $state(false);
  let excludeTerminalFromTotal = $state(false);
  let estimateUnit = $state('weeks');
  let sortBy = $state('manual');
  let displayMode = $state('compact');
  const mobileScreen = new MediaQuery('(max-width: 40rem)');
  const activeDisplayMode = $derived(mobileScreen.current ? 'compact' : displayMode);
  let visibleFields = $state(['status', 'assignee', 'description', 'links', 'notes', 'tasks', 'spent']);
  let sidebarValue = $state('requirements');
  let sidebarExpanded = $state(['requirements-section', 'machine-ping-sow']);
  let sidebarCollapsed = $state(false);
  let unlinkedCollapsed = $state(true);
  let collapsed = $state([]);
  let searchCollapsed = $state([]);
  const visibleCollapsed = $derived(query.trim() ? searchCollapsed : collapsed);
  const updateSearch = (value) => {
    query = value;
    searchCollapsed = [];
  };
  let selectedId = $state('Q3.COMPONENTS');
  let drawerOpen = $state(false);
  let editorOpen = $state(false);
  let saveDialogOpen = $state(false);
  let markdownDraft = $state(requirementsSource);
  let inlineEditingId = $state('');
  let notice = $state('');
  let linkCommandOpen = $state(false);
  let linkingIssueId = $state('');
  const clipboard = createClipboard();

  const hasActiveFilters = $derived(Boolean(statusFilters.length || assigneeFilters.length || groupFilters.length || !showClosed || assignedIssuesOnly));
  const filterMenuItems = $derived([
    { value: 'visibility:closed', label: 'Show closed', icon: 'check', role: 'menuitemcheckbox', checked: showClosed },
    { value: 'visibility:assigned', label: 'Assigned issues only', icon: 'user', role: 'menuitemcheckbox', checked: assignedIssuesOnly },
    { type: 'separator' },
    {
      value: 'filter-status',
      label: 'Status',
      icon: 'circle-dot',
      items: filterOptions.map((option) => ({ ...option, value: `status:${option.value}`, role: 'menuitemcheckbox', checked: statusFilters.includes(option.value) }))
    },
    {
      value: 'filter-assignee',
      label: 'Assignee',
      icon: 'user',
      items: assigneeOptions.map((option) => ({ ...option, value: `assignee:${option.value}`, role: 'menuitemcheckbox', checked: assigneeFilters.includes(option.value) }))
    },
    {
      value: 'filter-group',
      label: 'Requirement group',
      icon: 'folder-tree',
      items: requirements.map((group) => ({ value: `group:${group.id}`, label: group.id, icon: 'folder', role: 'menuitemcheckbox', checked: groupFilters.includes(group.id) }))
    }
  ]);
  const viewMenuItems = $derived([
    {
      value: 'view-fields',
      label: 'Visible fields',
      icon: 'eye',
      items: [
        { value: 'field:status', label: 'Status', icon: 'circle-dot' },
        { value: 'field:assignee', label: 'Assignee', icon: 'user' },
        { value: 'field:description', label: 'Description', icon: 'align-left' },
        { value: 'field:links', label: 'Links', icon: 'link' },
        { value: 'field:notes', label: 'Notes', icon: 'message-square-more' },
        { value: 'field:tasks', label: 'Tasks', icon: 'circle-check' },
        { value: 'field:spent', label: 'Spent time', icon: 'clock-3' }
      ].map((item) => ({ ...item, role: 'menuitemcheckbox', checked: visibleFields.includes(item.value.slice(6)) }))
    },
    {
      value: 'view-sort',
      label: 'Sort by',
      icon: 'arrow-up-down',
      items: sortOptions.map((option) => ({ ...option, value: `sort:${option.value}`, role: 'menuitemradio', checked: option.value === sortBy }))
    }
  ]);
  const calculationMenuItems = $derived([
    {
      value: 'total:exclude-terminal',
      label: 'Exclude done and rejected',
      icon: 'circle-minus',
      role: 'menuitemcheckbox',
      checked: excludeTerminalFromTotal
    },
    { type: 'separator' },
    {
      value: 'unit',
      label: 'Estimate unit',
      icon: 'ruler',
      items: Object.entries(ESTIMATE_UNITS).map(([value, unit]) => ({
        value: `unit:${value}`,
        label: unit.label,
        icon: unit.icon,
        role: 'menuitemradio',
        checked: estimateUnit === value
      }))
    }
  ]);
  const totalEstimate = $derived(calculateTotalEstimate(requirements, excludeTerminalFromTotal));
  const normalizedQuery = $derived(query.trim().toLowerCase());
  const visibleGroups = $derived(
    filterRequirementGroups(
      requirements,
      {
        query: normalizedQuery,
        statuses: statusFilters,
        assignees: assigneeFilters,
        groups: groupFilters,
        showClosed,
        assignedIssuesOnly,
        sortBy
      },
      assigneeOptions,
      statusMeta
    )
  );
  const selectedRequirement = $derived(findRequirement(requirements, selectedId));
  const hasUnsavedChanges = $derived(markdownDraft !== requirementsSource);
  const linkingIssue = $derived(unlinkedIssues.find((issue) => issue.id === linkingIssueId));
  const linkCommandGroups = $derived(
    requirements.map((group) => ({
      label: group.id,
      items: [group, ...group.children].map((requirement) => ({
        id: requirement.id,
        label: requirement.title,
        description: statusMeta[requirement.status].label,
        keywords: [requirement.id, requirement.title, statusMeta[requirement.status].label],
        icon: statusMeta[requirement.status].icon,
        status: requirement.status,
        action: () => {
          const issue = unlinkedIssues.find((entry) => entry.id === linkingIssueId);
          if (issue) linkIssue(issue, requirement);
        }
      }))
    }))
  );

  const toggleGroup = (id) => {
    const next = visibleCollapsed.includes(id) ? visibleCollapsed.filter((value) => value !== id) : [...visibleCollapsed, id];
    if (query.trim()) searchCollapsed = next;
    else collapsed = next;
  };
  const toggleStatusFilter = (status) => {
    statusFilters = statusFilters.includes(status) ? statusFilters.filter((value) => value !== status) : [...statusFilters, status];
  };
  const toggleAssigneeFilter = (assignee) => {
    assigneeFilters = assigneeFilters.includes(assignee) ? assigneeFilters.filter((value) => value !== assignee) : [...assigneeFilters, assignee];
  };
  const toggleGroupFilter = (group) => {
    groupFilters = groupFilters.includes(group) ? groupFilters.filter((value) => value !== group) : [...groupFilters, group];
  };
  const selectFilter = (item) => {
    const [type, value] = item.value.split(':');
    if (type === 'visibility' && value === 'closed') showClosed = !showClosed;
    if (type === 'visibility' && value === 'assigned') assignedIssuesOnly = !assignedIssuesOnly;
    if (type === 'status') toggleStatusFilter(value);
    if (type === 'assignee') toggleAssigneeFilter(value);
    if (type === 'group') toggleGroupFilter(value);
  };
  const selectView = (item) => {
    const [type, value] = item.value.split(':');
    if (type === 'mode') {
      displayMode = value;
      drawerOpen = false;
      inlineEditingId = '';
      return;
    }
    if (type === 'field') {
      visibleFields = visibleFields.includes(value) ? visibleFields.filter((field) => field !== value) : [...visibleFields, value];
    }
    if (type === 'sort') sortBy = value;
  };
  const selectCalculationSetting = (item) => {
    const [type, value] = item.value.split(':');
    if (type === 'total' && value === 'exclude-terminal') excludeTerminalFromTotal = !excludeTerminalFromTotal;
    if (type === 'unit' && ESTIMATE_UNITS[value]) estimateUnit = value;
  };
  const setStatus = (item, status) => {
    if (readOnly) return;
    const requirement = findRequirement(requirements, item.id);
    if (!requirement || !statusMeta[status] || requirement.status === status) return;
    requirement.status = status;
    notice = `${item.id} moved to ${statusMeta[status].label}`;
    toast.success('Status updated', `${item.id} · ${item.title} → ${statusMeta[status].label}`);
  };
  const openDetails = (item) => {
    selectedId = item.id;
    editorOpen = false;
    if (activeDisplayMode === 'expanded') {
      drawerOpen = false;
      return;
    }
    drawerOpen = true;
  };
  const editRequirements = () => {
    if (readOnly) return;
    drawerOpen = false;
    inlineEditingId = '';
    editorOpen = true;
    notice = 'Editing requirements';
  };
  const handleWorkspaceShortcut = (event) => {
    const modifierPressed = event.metaKey || event.ctrlKey;
    if (event.key.toLowerCase() !== 'e' || !event.shiftKey || !modifierPressed || event.altKey || event.repeat || saveDialogOpen || linkCommandOpen) return;
    event.preventDefault();
    if (editorOpen) {
      editorOpen = false;
      return;
    }
    editRequirements();
  };
  const editInlineRequirement = (event, item) => {
    event?.stopPropagation();
    if (readOnly) return;
    selectedId = item.id;
    drawerOpen = false;
    editorOpen = false;
    inlineEditingId = inlineEditingId === item.id ? '' : item.id;
  };
  const closeInlineEditor = (event) => {
    event?.stopPropagation();
    inlineEditingId = '';
  };
  const runAction = (item, action) => {
    if (readOnly) return;
    notice = `${action}: ${item.id}`;
  };
  const selectVersion = (id) => {
    if (id !== 'latest' && !documentVersions.some((version) => version.id === id)) return;
    if (id === selectedVersionId) return;
    selectedVersionId = id;
    editorOpen = false;
    inlineEditingId = '';
    drawerOpen = false;
    linkCommandOpen = false;
    notice = id === 'latest' ? 'Viewing latest document' : `Viewing ${id}, read-only`;
  };

  const copyRequirementLink = async (item) => {
    const url = new SvelteURL(window.location.href);
    url.hash = `requirement-${encodeURIComponent(item.id)}`;
    const copied = await clipboard.copy(url.toString(), item.id);
    if (copied) {
      notice = `Copied link to ${item.id}`;
      toast.success('Link copied', `${item.id} · ${item.title}`);
    } else {
      toast.error('Could not copy link', 'Clipboard access is unavailable.');
    }
  };

  const linkIssue = (issue, requirement) => {
    if (readOnly) return;
    const source = findRequirement(requirements, requirement.id);
    if (!source || source.issues.includes(issue.id)) return;
    const count = source.issueCount ?? source.issues.length;
    source.issues.push(issue.id);
    source.issueCount = count + 1;
    unlinkedIssues = unlinkedIssues.filter((entry) => entry.id !== issue.id);
    notice = `#${issue.id} linked to ${requirement.id}`;
    toast.success('Issue linked', `#${issue.id} → ${requirement.id} · ${requirement.title}`);
  };

  const openLinkCommand = (event, issue) => {
    event.preventDefault();
    linkingIssueId = issue.id;
    linkCommandOpen = true;
  };

  const handleUnlinkedKeydown = (event, issue) => {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) openLinkCommand(event, issue);
  };
</script>

<svelte:window onkeydown={handleWorkspaceShortcut} />

{#snippet requirementCommandItem(item)}
  <span class="command-requirement">
    <span class="command-requirement-status" data-status={item.status}><AesirIcon name={item.icon} size={14} /></span>
    <span class="command-requirement-id">{item.id}</span>
    <span class="command-requirement-title">{item.label}</span>
    <span class="command-requirement-label">{item.description}</span>
  </span>
{/snippet}

<section class="explorer" aria-label="Requirements explorer">
  <AesirSidebar
    class="requirements-sidebar"
    title={projectName}
    label={`${projectName} navigation`}
    variant="app"
    mode="desktop"
    sections={exampleSidebarSections}
    resizable
    collapsible
    collapseTrigger="external"
    bind:value={sidebarValue}
    bind:expanded={sidebarExpanded}
    bind:collapsed={sidebarCollapsed}
    style="--aesir-sidebar-height: 100%;"
  />

  <div class="explorer__workspace">
    <header class="workspace-topbar">
      <div class="workspace-topbar__path">
        <AesirButton
          class="workspace-topbar__nav-toggle"
          variant="outline"
          size="icon-sm"
          aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!sidebarCollapsed}
          onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
        >
          <AesirIcon name={sidebarCollapsed ? 'panel-left-open' : 'panel-left-close'} size={16} />
        </AesirButton>
        <div class="explorer__breadcrumbs">
          <RequirementsBreadcrumb>
            {#snippet currentItem()}
              <RequirementsVersionSelector documentName="Machine Ping Sow" versions={documentVersions} value={selectedVersionId} onchange={selectVersion} />
            {/snippet}
          </RequirementsBreadcrumb>
        </div>
        <div class="workspace-topbar__actions">
          {#if !readOnly}
            <AesirButton
              class="workspace-topbar__edit"
              size="sm"
              variant="outline"
              onclick={() => (editorOpen ? (editorOpen = false) : editRequirements())}
              aria-label={editorOpen ? 'Close requirements' : 'Edit requirements'}
              aria-keyshortcuts="Meta+Shift+E Control+Shift+E"
            >
              <AesirIcon name={editorOpen ? 'x' : 'edit'} size={14} />
              <span class="workspace-topbar__edit-label">{editorOpen ? 'Close' : 'Edit'}</span>
              <AesirKbd shift meta small>E</AesirKbd>
            </AesirButton>
          {/if}
        </div>
      </div>
    </header>

    {#if readOnly && selectedVersion}
      <div class="document-version-notice" role="status">
        <AesirIcon name="history" size={14} />
        <span>Viewing {selectedVersion.label} · Read-only</span>
        <AesirButton size="sm" variant="ghost" onclick={() => selectVersion('latest')}>Back to latest</AesirButton>
      </div>
    {/if}

    {#if hasUnsavedChanges && !readOnly}
      <div class="unsaved-changes" role="status">
        <AesirIcon name="triangle-alert" size={14} />
        <span>Source has unsaved changes</span>
      </div>
    {/if}

    {#if editorOpen}
      <div class="requirements-layout">
        <RequirementsSourceEditor bind:value={markdownDraft} dirty={hasUnsavedChanges} onsave={() => (saveDialogOpen = true)} onclose={() => (editorOpen = false)} />
      </div>
    {:else}
      {#snippet requirementsPane()}
        <div class="requirements-content">
          {#if !readOnly && unlinkedIssues.length}
            <section class="unlinked-section" data-collapsed={unlinkedCollapsed || undefined} aria-labelledby="unlinked-issues-heading">
              <button class="unlinked-section__heading" type="button" aria-expanded={!unlinkedCollapsed} aria-controls="unlinked-issues-list" onclick={() => (unlinkedCollapsed = !unlinkedCollapsed)}>
                <AesirIcon name="chevron-down" size={14} />
                <AesirIcon name="unlink" size={15} />
                <strong id="unlinked-issues-heading">Unlinked issues</strong>
                <span>{unlinkedIssues.length}</span>
              </button>
              {#if !unlinkedCollapsed}
                <div class="unlinked-list" id="unlinked-issues-list">
                  {#each unlinkedIssues as issue (issue.id)}
                    <div class="unlinked-issue">
                      <button
                        class="unlinked-issue__action"
                        type="button"
                        onclick={(event) => openLinkCommand(event, issue)}
                        oncontextmenu={(event) => openLinkCommand(event, issue)}
                        onkeydown={(event) => handleUnlinkedKeydown(event, issue)}
                        aria-label={`Link issue #${issue.id} to a requirement`}
                      >
                        <AesirAvatar fallback={issue.assignee.initials} size="2xs" gradient aria-label={issue.assignee.name} />
                        <span class="unlinked-issue__id">#{issue.id}</span>
                        <span class="unlinked-issue__status" data-status={issue.status}><AesirIcon name={statusMeta[issue.status].icon} size={15} /></span>
                        <strong>{issue.title}</strong>
                      </button>
                      <AesirButton
                        class="unlinked-issue__external"
                        variant="ghost"
                        size="icon-sm"
                        href={`#issue-${issue.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open issue #${issue.id} in a new tab`}
                        title="Open issue"
                      >
                        <AesirIcon name="external-link" size={14} />
                      </AesirButton>
                    </div>
                  {/each}
                </div>
              {/if}
            </section>
          {/if}

          <RequirementToolbar
            {query}
            {updateSearch}
            {excludeTerminalFromTotal}
            {estimateUnit}
            {totalEstimate}
            {calculationMenuItems}
            {selectCalculationSetting}
            {filterMenuItems}
            {selectFilter}
            {hasActiveFilters}
            {viewMenuItems}
            {selectView}
            {displayMode}
          />

          {#if hasActiveFilters}
            <div class="filter-bar" aria-label="Active filters">
              {#if !showClosed}
                <div class="filter-rule">
                  <span class="filter-rule__field"><AesirIcon name="check" size={14} /> Closed</span>
                  <span class="filter-rule__operator">is</span>
                  <span class="filter-rule__value">hidden</span>
                  <button class="filter-rule__remove" type="button" aria-label="Show closed requirements" onclick={() => (showClosed = true)}><AesirIcon name="x" size={14} /></button>
                </div>
              {/if}
              {#if assignedIssuesOnly}
                <div class="filter-rule">
                  <span class="filter-rule__field"><AesirIcon name="user" size={14} /> Issues</span>
                  <span class="filter-rule__operator">are</span>
                  <span class="filter-rule__value">assigned</span>
                  <button class="filter-rule__remove" type="button" aria-label="Show unassigned issues" onclick={() => (assignedIssuesOnly = false)}><AesirIcon name="x" size={14} /></button>
                </div>
              {/if}
              {#if statusFilters.length}
                <div class="filter-rule">
                  <span class="filter-rule__field"><AesirIcon name="circle-dot" size={14} /> Status</span>
                  <span class="filter-rule__operator">is any of</span>
                  <span class="filter-rule__value">{statusFilters.length} {statusFilters.length === 1 ? 'status' : 'statuses'}</span>
                  <button class="filter-rule__remove" type="button" aria-label="Remove status filter" onclick={() => (statusFilters = [])}><AesirIcon name="x" size={14} /></button>
                </div>
              {/if}
              {#if assigneeFilters.length}
                <div class="filter-rule">
                  <span class="filter-rule__field"><AesirIcon name="user" size={14} /> Assignee</span>
                  <span class="filter-rule__operator">is any of</span>
                  <span class="filter-rule__value">{assigneeFilters.length} selected</span>
                  <button class="filter-rule__remove" type="button" aria-label="Remove assignee filter" onclick={() => (assigneeFilters = [])}><AesirIcon name="x" size={14} /></button>
                </div>
              {/if}
              {#if groupFilters.length}
                <div class="filter-rule">
                  <span class="filter-rule__field"><AesirIcon name="folder-tree" size={14} /> Group</span>
                  <span class="filter-rule__operator">is any of</span>
                  <span class="filter-rule__value">{groupFilters.join(', ')}</span>
                  <button class="filter-rule__remove" type="button" aria-label="Remove group filter" onclick={() => (groupFilters = [])}><AesirIcon name="x" size={14} /></button>
                </div>
              {/if}
            </div>
          {/if}

          <div class="explorer__body">
            <AesirScrollArea class="explorer__list" orientation="vertical">
              <div class="requirements-grid" {@attach observeListWidth} data-mode={activeDisplayMode} role="treegrid" aria-label="Product requirements" aria-colcount="4">
                {#each visibleGroups as group (group.id)}
                  <div class="requirement-group" role="rowgroup">
                    <div class="requirement-group__header" data-sticky={group.children.length ? true : undefined}>
                      <RequirementsRow
                        item={group}
                        {...rowData(group, true)}
                        {estimateUnit}
                        group
                        hasChildren={group.childTree.length > 0}
                        folded={visibleCollapsed.includes(group.id)}
                        selected={drawerOpen && selectedId === group.id}
                        mode={activeDisplayMode}
                        fields={visibleFields}
                        onopen={openDetails}
                        onedit={editInlineRequirement}
                        ontoggle={toggleGroup}
                        onstatus={setStatus}
                        onaction={runAction}
                        oncopy={copyRequirementLink}
                      />
                    </div>

                    {#if inlineEditingId === group.id}
                      <RequirementsSourceEditor bind:value={markdownDraft} requirementId={group.id} dirty={hasUnsavedChanges} onsave={() => (saveDialogOpen = true)} onclose={closeInlineEditor} />
                    {/if}

                    {#if activeDisplayMode === 'expanded'}
                      {#if group.children.length > 0 && !visibleCollapsed.includes(group.id)}
                        <div class="requirement-group__details">
                          <RequirementsTreeLine />
                          <RequirementsDetails item={group} tasks={tasksFor(group)} fields={visibleFields} {estimateUnit} />
                        </div>
                      {:else}
                        <RequirementsDetails item={group} tasks={tasksFor(group)} fields={visibleFields} {estimateUnit} />
                      {/if}
                    {/if}

                    {#if !visibleCollapsed.includes(group.id)}
                      <RequirementsTree nodes={group.childTree} collapsed={visibleCollapsed} expanded={activeDisplayMode === 'expanded'} sticky>
                        {#snippet row(item, index, hasChildren)}
                          <RequirementsRow
                            {item}
                            {...rowData(item)}
                            {estimateUnit}
                            {hasChildren}
                            last={index === group.children.length - 1 || (group.children[index + 1]?.depth ?? 1) < (item.depth ?? 1)}
                            folded={visibleCollapsed.includes(item.id)}
                            selected={drawerOpen && selectedId === item.id}
                            mode={activeDisplayMode}
                            fields={visibleFields}
                            onopen={openDetails}
                            onedit={editInlineRequirement}
                            ontoggle={toggleGroup}
                            onstatus={setStatus}
                            onaction={runAction}
                            oncopy={copyRequirementLink}
                          />
                        {/snippet}
                        {#snippet details(item)}
                          {#if inlineEditingId === item.id}
                            <RequirementsSourceEditor bind:value={markdownDraft} requirementId={item.id} dirty={hasUnsavedChanges} onsave={() => (saveDialogOpen = true)} onclose={closeInlineEditor} />
                          {/if}
                          {#if activeDisplayMode === 'expanded'}
                            <RequirementsDetails {item} tasks={tasksFor(item)} fields={visibleFields} {estimateUnit} />
                          {/if}
                        {/snippet}
                      </RequirementsTree>
                    {/if}
                  </div>
                {:else}
                  <div class="empty-result">
                    <AesirIcon name="search" size={18} />
                    <span>No requirements match this view.</span>
                    <button
                      type="button"
                      onclick={() => {
                        query = '';
                        statusFilters = [];
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                {/each}
              </div>
            </AesirScrollArea>

            {#if activeDisplayMode === 'compact' && drawerOpen && selectedRequirement}
              <RequirementsDrawer
                item={selectedRequirement}
                tasks={tasksFor(selectedRequirement)}
                {statusMeta}
                {requirements}
                {estimateUnit}
                onclose={() => (drawerOpen = false)}
                onopen={openDetails}
              />
            {/if}
          </div>
        </div>
      {/snippet}

      <div class="requirements-layout">
        {@render requirementsPane()}
      </div>
    {/if}
    <span class="sr-only" aria-live="polite">{notice}</span>
  </div>
</section>

<RequirementsSaveReview bind:open={saveDialogOpen} />

<AesirCommandMenu
  bind:open={linkCommandOpen}
  groups={linkCommandGroups}
  shortcut={false}
  label="Link issue to requirement"
  title={linkingIssue ? `Link #${linkingIssue.id}` : 'Link issue'}
  placeholder="Search by requirement ID, title or status…"
  emptyText="No matching requirements."
  itemContent={requirementCommandItem}
  showFooter
/>

<style>
  .explorer {
    display: flex;
    width: 100%;
    height: 100%;
    max-height: 100%;
    overflow: hidden;
    overscroll-behavior: contain;
    background: var(--ds-background-secondary);
    color: var(--ds-foreground);
  }

  .explorer__workspace {
    container: requirements-workspace / inline-size;
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  .requirements-layout,
  .requirements-content {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }

  .unsaved-changes {
    display: flex;
    min-height: var(--ds-spacing-7);
    flex: none;
    align-items: center;
    gap: var(--ds-spacing-1-5);
    padding-inline: var(--ds-spacing-3);
    background: var(--ds-surface-orange);
    color: var(--ds-foreground-muted-orange);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }

  .requirements-content {
    container-type: inline-size;
    flex-direction: column;
  }

  .workspace-topbar {
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
  }

  .workspace-topbar__path {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: 0 var(--ds-spacing-3);
  }

  .workspace-topbar__path {
    min-height: var(--ds-spacing-12);
    padding-block: var(--ds-spacing-2);
  }

  .workspace-topbar__path :global(.workspace-topbar__nav-toggle),
  .workspace-topbar__path :global(svg) {
    flex-shrink: 0;
  }

  .workspace-topbar__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--ds-spacing-2);
    margin-left: auto;
  }

  .explorer__breadcrumbs {
    min-width: 0;
    flex: 1;
    overflow: hidden;
  }
  .document-version-notice {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-1) var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .document-version-notice :global(button) {
    margin-left: auto;
    font-size: var(--ds-font-size-xs);
  }
  @container requirements-workspace (max-width: 56rem) {
    .workspace-topbar__actions :global(.workspace-topbar__edit kbd) {
      display: none;
    }
  }
  @container requirements-workspace (max-width: 40rem) {
    .workspace-topbar__edit-label {
      display: none;
    }
    .workspace-topbar__actions :global(.workspace-topbar__edit) {
      width: var(--ds-spacing-8);
      padding-inline: 0;
    }
  }

  .filter-bar {
    display: flex;
    min-height: var(--ds-spacing-10);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-1) var(--ds-spacing-3);
    background: var(--ds-background-secondary);
  }

  .filter-rule {
    display: inline-flex;
    height: var(--ds-spacing-8);
    align-items: stretch;
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
  }

  .filter-rule__field,
  .filter-rule__operator,
  .filter-rule__value,
  .filter-rule__remove {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-1-5);
    padding: 0 var(--ds-spacing-2-5);
    border: 0;
    border-right: var(--ds-spacing-px) solid var(--ds-border);
    background: transparent;
    color: var(--ds-foreground);
    font: inherit;
    font-size: var(--ds-font-size-xs);
    white-space: nowrap;
  }

  .filter-rule__operator {
    color: var(--ds-foreground-muted);
  }

  .filter-rule__remove {
    cursor: pointer;
  }

  .filter-rule__remove:hover {
    background: var(--ds-surface);
  }

  .filter-rule__remove {
    border-right: 0;
    color: var(--ds-foreground-muted);
  }

  .explorer__body {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 0;
    align-items: stretch;
    flex: 1;
    overflow: hidden;
  }

  :global(.explorer__list) {
    min-width: 0;
    min-height: 0;
    flex: 1;
  }

  :global(.explorer__list > [data-slot='scroll-area-viewport']) {
    position: relative;
    z-index: 0;
  }

  .unlinked-section {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-0-5);
    margin: var(--ds-spacing-2);
    padding: var(--ds-spacing-1);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
  }

  .unlinked-section__heading {
    display: flex;
    width: 100%;
    min-height: var(--ds-spacing-7);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: 0 var(--ds-spacing-2);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .unlinked-section__heading:hover {
    background: var(--ds-surface);
  }

  .unlinked-section__heading:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: calc(var(--ds-spacing-0-5) * -1);
  }

  .unlinked-section__heading > :global(svg:first-child) {
    color: var(--ds-foreground-muted);
    transition: transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .unlinked-section[data-collapsed] .unlinked-section__heading > :global(svg:first-child) {
    transform: rotate(-90deg);
  }

  .unlinked-section__heading strong {
    font-size: var(--ds-font-size-sm);
  }

  .unlinked-section__heading span {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .unlinked-list {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-0-5);
  }

  .unlinked-issue {
    display: grid;
    width: 100%;
    box-sizing: border-box;
    grid-template-columns: minmax(0, 1fr) var(--ds-spacing-8);
    min-height: var(--ds-spacing-8);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: 0 var(--ds-spacing-2);
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: inherit;
    font-size: var(--ds-font-size-xs);
  }

  .unlinked-issue:hover,
  .unlinked-issue:focus-within {
    background: var(--ds-surface);
  }

  .unlinked-issue:focus-within {
    box-shadow: inset 0 0 0 var(--ds-spacing-px) var(--ds-accent-ring);
  }

  .unlinked-issue__action {
    display: grid;
    min-width: 0;
    min-height: var(--ds-spacing-8);
    grid-template-columns: var(--ds-spacing-5) 9ch var(--ds-spacing-5) minmax(8rem, 1fr);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  :global(.unlinked-issue__external) {
    opacity: 0;
  }

  .unlinked-issue:hover :global(.unlinked-issue__external),
  .unlinked-issue:focus-within :global(.unlinked-issue__external) {
    opacity: 1;
  }

  .unlinked-issue__status {
    color: var(--ds-foreground-muted);
  }

  .unlinked-issue__id {
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
  }

  .unlinked-issue__action > strong {
    overflow: hidden;
    font-weight: var(--ds-font-weight-medium);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .command-requirement {
    display: grid;
    width: 100%;
    min-width: 0;
    grid-template-columns: var(--ds-spacing-5) 9rem minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  .command-requirement-status {
    display: inline-flex;
    color: var(--ds-foreground-muted);
  }

  .command-requirement-id {
    overflow: hidden;
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .command-requirement-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .command-requirement-label {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    white-space: nowrap;
  }

  .requirements-grid {
    --tree-row-padding: var(--ds-spacing-2);
    --tree-axis: calc(var(--tree-row-padding) + var(--ds-spacing-7) + var(--ds-spacing-2));
    --tree-row-height: var(--ds-spacing-10);
    display: grid;
    width: 100%;
    min-width: 0;
    gap: 0;
    padding-top: var(--ds-spacing-1);
  }

  .requirement-group {
    display: grid;
    width: 100%;
    min-width: 0;
    gap: 0;
  }

  .requirement-group__header[data-sticky] {
    position: sticky;
    z-index: 20;
    top: 0;
    min-width: 0;
    background: var(--ds-background-secondary);
  }

  .requirement-group :global(.context-menu-root),
  .requirement-group :global(.requirement-context-trigger) {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .requirement-group__details {
    position: relative;
  }

  .empty-result {
    display: flex;
    min-height: 12rem;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }

  .empty-result button {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ds-accent-text);
    font: inherit;
    cursor: pointer;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    padding: 0;
    margin: -1px;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @container (max-width: 28rem) {
    .requirements-grid {
      --tree-row-padding: var(--ds-spacing-2);
    }
  }

  @container (max-width: 72rem) {
    .explorer__body :global(.detail-panel) {
      position: absolute;
      z-index: 30;
      inset: 0 0 0 auto;
      width: min(32rem, 90%);
      min-width: 0;
      height: 100%;
    }
  }

  @container (max-width: 40rem) {
    .explorer__body :global(.detail-panel) {
      width: 100%;
    }

    .requirements-grid :global(.requirements-tree__node[data-sticky]) {
      position: static;
    }
  }

  :global(.requirement-menu) {
    min-width: 13.5rem;
  }

  @media (max-width: 56rem) {
    .explorer {
      overflow: hidden;
    }
  }

  @media (max-width: 40rem) {
    :global(.requirements-sidebar) {
      display: none;
    }

    .workspace-topbar__path {
      min-width: 0;
      padding-inline: var(--ds-spacing-2);
    }

    .workspace-topbar__path :global(.workspace-topbar__nav-toggle) {
      display: none;
    }

    .explorer__breadcrumbs {
      flex: 1;
    }

    .workspace-topbar__actions {
      flex: none;
      gap: var(--ds-spacing-1);
    }

    .workspace-topbar__actions :global(.workspace-topbar__edit) {
      width: var(--ds-spacing-8);
      padding-inline: 0;
    }

    .workspace-topbar__edit-label,
    .workspace-topbar__actions :global(.workspace-topbar__edit kbd) {
      display: none;
    }

    .unlinked-issue__action {
      grid-template-columns: var(--ds-spacing-5) minmax(0, 1fr) var(--ds-spacing-5);
      grid-template-rows: auto auto;
      padding-block: var(--ds-spacing-1);
    }

    .unlinked-issue__action > strong {
      grid-column: 1 / -1;
      overflow: visible;
      text-overflow: clip;
      white-space: normal;
    }
  }
</style>
