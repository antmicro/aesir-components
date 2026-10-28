<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { getFixedPositionOffset, portal } from '../overlay/overlay.js';
  import { createPresence } from '../overlay/presence.svelte.js';
  import { getEventStart, resolveInterval } from './timeline.js';
  import { getStatusMeta, pluralizeEvents } from './status.js';
  import { buildItems, shortDate, startLabel as formatStartLabel, timeFormatter } from './view-model.js';

  let {
    class: className = '',
    label = 'Service',
    items = [],
    descriptions = {},
    total,
    status,
    statusLabel,
    startLabel,
    endLabel = 'Today',
    tooltipPlacement = 'top',
    tooltip,
    interval,
    startDate,
    defaultStatus = 'unknown',
    getEvent = (item) => item,
    getIntervalColor,
    formatInterval,
    ...restProps
  } = $props();

  const selectedInterval = $derived(resolveInterval(interval));

  let now = $state(Date.now());
  const latestEventTime = $derived(Math.max(0, ...(Array.isArray(items) ? items : []).map((item) => getEventStart(getEvent(item)) ?? 0)));

  function horizontalSlide(node, { x, duration, easing }) {
    const transform = getComputedStyle(node).transform.replace('none', '');
    return {
      duration,
      easing,
      css: (t) => `transform: ${transform} translateX(${(1 - t) * x}px)`
    };
  }

  $effect(() => {
    if (!selectedInterval || startDate != null) return;

    now;

    const timeUntilNextInterval = selectedInterval - (Date.now() % selectedInterval);

    const timeout = setTimeout(
      () => {
        now = Date.now();
      },
      Math.min(timeUntilNextInterval, 1_000)
    );

    return () => clearTimeout(timeout);
  });

  const tooltipTimeFormatter = $derived(timeFormatter(selectedInterval));
  const groupEventsByDay = (events) => {
    const today = new Date().toDateString();
    return events
      .map((event) => {
        const data = getEvent(event) ?? {};
        return { event, data, start: getEventStart(data) };
      })
      .sort((first, second) => (first.start ?? 0) - (second.start ?? 0))
      .reduce((groups, item) => {
        const day = item.start == null ? undefined : new Date(item.start);
        const key = day?.toDateString() ?? 'unknown';
        const group = groups.at(-1);
        if (group?.key === key) group.items.push(item);
        else groups.push({ key, date: day, today: key === today, items: [item] });
        return groups;
      }, []);
  };

  const allItems = $derived(
    buildItems({
      items,
      interval: selectedInterval,
      total,
      endTime: startDate != null ? new Date(startDate).getTime() : Math.max(now, latestEventTime),
      defaultStatus,
      getEvent,
      getIntervalColor,
      formatInterval
    })
  );
  const currentStatus = $derived(status ?? allItems.at(-1)?.status ?? 'unknown');
  const currentMeta = $derived(getStatusMeta(currentStatus));

  let visibleCapacity = $state(Number.POSITIVE_INFINITY);
  let animateSegments = $state(true);
  const segmentMotion = $derived(animateSegments && !prefersReducedMotion.current);
  const displayItems = $derived(allItems.slice(-visibleCapacity));
  const resolvedStartLabel = $derived(startLabel ?? formatStartLabel(displayItems, selectedInterval));
  const tooltipId = $props.id();
  let viewportRef = $state();
  let tokenRulerRef = $state();
  let segmentsRef = $state();
  let tooltipRef = $state();
  let tooltipPositionerRef = $state();
  const itemKey = (item, index) => item.id ?? `${item.start ?? item.label}-${index}`;
  let activeKey = $state.raw();
  const activeItem = $derived(displayItems.find((item, index) => itemKey(item, index) === activeKey));
  let activeTrigger = $state();
  let open = $state(false);
  let instant = $state(false);
  let following = $state(false);
  let positioned = $state(false);
  let tooltipPosition = $state({ x: 0, y: 0, origin: 'center' });
  const presence = createPresence(() => open, 100);

  onMount(() => {
    let frame;
    const updateVisibleCapacity = () => {
      if (!viewportRef || !segmentsRef) return;
      const segment = segmentsRef.querySelector('.aesir-status-bar__segment');
      const tokenSize = tokenRulerRef?.getBoundingClientRect();
      const segmentWidth = tokenSize?.width || segment?.offsetWidth || 10;
      const tokenGap = tokenSize?.height || 4;
      visibleCapacity = Math.max(1, Math.floor((viewportRef.clientWidth + tokenGap) / (segmentWidth + tokenGap)));
    };

    const observer = new ResizeObserver(updateVisibleCapacity);
    observer.observe(viewportRef);
    requestAnimationFrame(updateVisibleCapacity);
    const syncMotion = () => {
      cancelAnimationFrame(frame);
      animateSegments = false;
      if (document.hidden) return;
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => (animateSegments = true));
      });
    };
    document.addEventListener('visibilitychange', syncMotion);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', syncMotion);
    };
  });

  const activeMeta = $derived(getStatusMeta(activeItem?.status));
  const activeDescription = $derived(activeItem?.description ?? descriptions[activeItem?.status] ?? activeMeta.description);

  const updateTooltipPosition = () => {
    if (!activeTrigger || !tooltipRef) return;
    const anchor = activeTrigger.getBoundingClientRect();
    const tooltipWidth = tooltipRef.offsetWidth;
    const tooltipHeight = tooltipRef.offsetHeight;
    const containingBlock = getFixedPositionOffset(tooltipPositionerRef);
    const viewportTop = tooltipPlacement === 'bottom' ? anchor.bottom + 8 : anchor.top - 8;
    const viewportLeft = Math.min(Math.max(anchor.left + (anchor.width - tooltipWidth) / 2, 8), window.innerWidth - tooltipWidth - 8);
    const originX = Math.min(Math.max(anchor.left + anchor.width / 2 - viewportLeft, 0), tooltipWidth);
    const originY = tooltipPlacement === 'bottom' ? 0 : tooltipHeight;
    tooltipPosition = {
      x: viewportLeft - containingBlock.left,
      y: viewportTop - containingBlock.top,
      origin: `${originX}px ${originY}px`
    };
    positioned = true;
  };

  const showTooltip = (item, index, trigger, skipMotion = false) => {
    const wasOpen = open && Boolean(activeItem);
    instant = wasOpen || skipMotion;
    following = wasOpen && !skipMotion;
    if (!wasOpen) positioned = false;
    activeKey = itemKey(item, index);
    activeTrigger = trigger;
    open = true;
  };
  const hideTooltip = (skipMotion = false) => {
    instant = skipMotion;
    open = false;
  };

  $effect(() => {
    if (open && activeKey !== undefined && !activeItem) hideTooltip(true);
  });

  $effect(() => {
    if (open && activeItem) requestAnimationFrame(updateTooltipPosition);
  });

  $effect(() => {
    if (!open) return;
    const onLayout = () => updateTooltipPosition();
    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        hideTooltip(true);
        activeTrigger?.focus();
      }
    };
    const observer = new ResizeObserver(onLayout);
    if (tooltipRef) observer.observe(tooltipRef);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', onKeydown);
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
    };
  });
</script>

<section class={`aesir-status-bar ${className}`.trim()} data-status={currentStatus} aria-label={`${label} status history`} {...restProps}>
  <header class="aesir-status-bar__header">
    <strong>{label}</strong>
    <span>{statusLabel ?? currentMeta.label}</span>
  </header>

  <div bind:this={viewportRef} class="aesir-status-bar__viewport">
    <span bind:this={tokenRulerRef} class="aesir-status-bar__token-ruler" aria-hidden="true"></span>
    <div
      bind:this={segmentsRef}
      class="aesir-status-bar__segments"
      role="list"
      aria-label={`${displayItems.length}-point status history`}
      onfocusout={(event) => {
        if (!segmentsRef?.contains(event.relatedTarget)) hideTooltip(true);
      }}
      onmouseleave={() => hideTooltip()}
    >
      {#each displayItems as item, index (itemKey(item, index))}
        {@const itemMeta = getStatusMeta(item.status)}
        {@const description = item.description ?? descriptions[item.status] ?? itemMeta.description}
        {@const eventSummary = item.events?.length ? pluralizeEvents(item.events.length) : description}
        <span
          class="aesir-status-bar__item"
          role="listitem"
          animate:flip={{ duration: segmentMotion ? 220 : 0, easing: cubicOut }}
          in:horizontalSlide={{ x: segmentMotion ? 24 : 0, duration: segmentMotion ? 220 : 0, easing: cubicOut }}
          out:horizontalSlide={{ x: segmentMotion ? -24 : 0, duration: segmentMotion ? 140 : 0, easing: cubicOut }}
        >
          <button
            type="button"
            class="aesir-status-bar__segment"
            data-status={item.status ?? 'unknown'}
            style:--aesir-status-color={item.color}
            aria-label={`${item.label}. ${eventSummary}`}
            aria-current={index === displayItems.length - 1 ? 'date' : undefined}
            aria-describedby={open && activeKey === itemKey(item, index) ? tooltipId : undefined}
            onmouseenter={(event) => showTooltip(item, index, event.currentTarget)}
            onfocus={(event) => showTooltip(item, index, event.currentTarget, true)}
          ></button>
        </span>
      {/each}
    </div>
  </div>

  {#if presence.present && activeItem}
    <div
      use:portal
      bind:this={tooltipPositionerRef}
      class="aesir-status-bar__tooltip-positioner"
      data-following={following || undefined}
      data-positioned={positioned || undefined}
      style={`transform: translate3d(${tooltipPosition.x}px, ${tooltipPosition.y}px, 0);`}
    >
      <div
        bind:this={tooltipRef}
        id={tooltipId}
        class="aesir-tooltip aesir-status-bar__popover aesir-overlay-motion"
        data-instant={instant || undefined}
        data-motion="tooltip"
        data-placement={tooltipPlacement}
        data-state={presence.state}
        role="tooltip"
        style={`--aesir-overlay-transform-origin: ${tooltipPosition.origin};`}
      >
        {#if tooltip}
          {@render tooltip({
            item: activeItem,
            events: activeItem.events ?? [],
            occurrences: activeItem.occurrences ?? [],
            status: activeItem.status ?? 'unknown',
            statusLabel: activeMeta.label,
            description: activeDescription,
            index: displayItems.indexOf(activeItem)
          })}
        {:else}
          <span class="aesir-status-bar__tooltip">
            {#if activeItem.start != null && activeItem.end != null}
              <span class="aesir-status-bar__tooltip-heading">
                <small>{shortDate.format(activeItem.start)}</small>
                <strong>{tooltipTimeFormatter.format(activeItem.start)}</strong>
              </span>
            {:else}
              <strong>{activeItem.label}</strong>
            {/if}
            {#if activeItem.events?.length}
              {@const eventGroups = groupEventsByDay(activeItem.events)}
              <div class="aesir-status-bar__event-groups">
                {#each eventGroups as group (group.key)}
                  <div class="aesir-status-bar__event-group">
                    {#if group.date && (!group.today || eventGroups.length > 1)}<small>{shortDate.format(group.date)}</small>{/if}
                    <ul>
                      {#each group.items as { event, data, start }, eventIndex (`${event.id ?? start}-${eventIndex}`)}
                        <li>
                          {#if start != null}<time datetime={new Date(start).toISOString()}>{tooltipTimeFormatter.format(start)}</time>{/if}
                          <span>{data.label ?? data.description ?? getStatusMeta(data.status).label}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/each}
              </div>
            {:else}
              <span>{activeDescription}</span>
            {/if}
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <footer class="aesir-status-bar__range">
    <span>{resolvedStartLabel}</span>
    <span>{endLabel}</span>
  </footer>
</section>

<style>
  :global {
    :root {
      --aesir-overlay-z-popover: 50;
      --aesir-overlay-z-tooltip: 60;
      --aesir-overlay-z-dialog: 70;
      --aesir-overlay-z-toast: 80;
    }

    .aesir-overlay-motion {
      opacity: 1;
      transform: none;
      transition:
        opacity var(--aesir-overlay-motion-duration, var(--ds-motion-duration-fast)) var(--ds-motion-easing-out),
        transform var(--aesir-overlay-motion-duration, var(--ds-motion-duration-fast)) var(--ds-motion-easing-out);
    }
    .aesir-overlay-motion[data-motion='tooltip'] {
      --aesir-overlay-start-transform: scale(0.98);
      transform-origin: var(--aesir-overlay-transform-origin, center);
    }
    .aesir-overlay-motion[data-state='closed'] {
      opacity: 0;
      transform: var(--aesir-overlay-start-transform, none);
      transition-duration: var(--aesir-overlay-exit-duration, var(--ds-motion-duration-fast));
      pointer-events: none;
    }
    .aesir-overlay-motion[data-instant] {
      transition: none;
    }
    @starting-style {
      .aesir-overlay-motion {
        opacity: 0;
        transform: var(--aesir-overlay-start-transform, none);
      }
    }

    .aesir-tooltip {
      position: fixed;
      z-index: var(--aesir-overlay-z-tooltip);
      max-width: var(--ds-sizing-3xs);
      padding: var(--ds-spacing-1-5) var(--ds-spacing-2);
      border-radius: var(--ds-radius-md);
      background: var(--ds-background-inverted);
      color: var(--ds-foreground-inverted);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-xs);
      pointer-events: none;
      --aesir-overlay-motion-duration: var(--ds-motion-duration-fast);
      --aesir-overlay-exit-duration: var(--ds-motion-duration-instant);
    }
    .aesir-tooltip[data-placement='top'] {
      --aesir-overlay-start-transform: translateY(var(--ds-spacing-0-5)) scale(0.97);
    }
    .aesir-tooltip[data-placement='bottom'] {
      --aesir-overlay-start-transform: translateY(calc(var(--ds-spacing-0-5) * -1)) scale(0.97);
    }

    .aesir-status-bar {
      display: grid;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      gap: var(--ds-spacing-2);
      color: var(--ds-foreground);
    }
    .aesir-status-bar__header,
    .aesir-status-bar__range {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-spacing-4);
    }
    .aesir-status-bar__header {
      font-size: var(--ds-font-size-sm);
    }
    .aesir-status-bar__header strong {
      font-weight: var(--ds-font-weight-semibold);
    }
    .aesir-status-bar__header span {
      color: var(--ds-foreground-muted);
      font-weight: var(--ds-font-weight-medium);
    }
    .aesir-status-bar[data-status='operational'] .aesir-status-bar__header span {
      color: var(--ds-foreground-green);
    }
    .aesir-status-bar[data-status='degraded'] .aesir-status-bar__header span {
      color: var(--ds-foreground-orange);
    }
    .aesir-status-bar[data-status='outage'] .aesir-status-bar__header span {
      color: var(--ds-foreground-red);
    }
    .aesir-status-bar__viewport {
      position: relative;
      min-width: 0;
      overflow: hidden;
      padding-block: var(--ds-spacing-1);
    }
    .aesir-status-bar__token-ruler {
      position: absolute;
      width: var(--ds-spacing-2-5);
      height: var(--ds-spacing-1);
      visibility: hidden;
      pointer-events: none;
    }
    .aesir-status-bar__segments {
      display: flex;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      justify-content: space-between;
      gap: var(--ds-spacing-1);
    }
    .aesir-status-bar__item {
      display: flex;
      flex: 0 0 var(--ds-spacing-2-5);
      min-width: 0;
      justify-content: center;
    }
    .aesir-status-bar__segment {
      position: relative;
      width: var(--ds-spacing-2-5);
      height: var(--ds-spacing-10);
      padding: 0;
      appearance: none;
      border: 0;
      border-radius: var(--ds-radius-full);
      outline: none;
      background: transparent;
      cursor: default;
      transition: opacity var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);
      --aesir-status-color: var(--ds-border);
    }
    .aesir-status-bar__segment::before {
      position: absolute;
      inset-block: 0;
      inset-inline: var(--ds-spacing-px);
      border-radius: var(--ds-radius-full);
      background: var(--aesir-status-color);
      content: '';
      transition:
        background-color var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle),
        opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }
    .aesir-status-bar__segment[data-status='operational'] {
      --aesir-status-color: var(--ds-emphasis-green);
    }
    .aesir-status-bar__segment[data-status='degraded'] {
      --aesir-status-color: var(--ds-emphasis-orange);
    }
    .aesir-status-bar__segment[data-status='outage'] {
      --aesir-status-color: var(--ds-emphasis-red);
    }
    .aesir-status-bar__segment[data-status='maintenance'] {
      --aesir-status-color: var(--ds-emphasis-blue);
    }
    .aesir-status-bar__segment:focus-visible {
      box-shadow:
        0 0 0 var(--ds-spacing-0-5) var(--ds-background),
        0 0 0 var(--ds-spacing-1) var(--ds-accent-ring);
    }
    .aesir-status-bar__range {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-status-bar__tooltip {
      display: grid;
      width: 100%;
      min-width: 0;
      gap: var(--ds-spacing-2);
    }
    .aesir-status-bar__event-groups {
      display: grid;
      margin: var(--ds-spacing-1) 0 0;
      padding: var(--ds-spacing-2) 0 0;
      border-top: var(--ds-spacing-px) solid color-mix(in srgb, var(--ds-foreground-inverted) 18%, transparent);
      gap: var(--ds-spacing-2);
    }
    .aesir-status-bar__event-group {
      display: grid;
      gap: var(--ds-spacing-1);
    }
    .aesir-status-bar__event-group + .aesir-status-bar__event-group {
      padding-top: var(--ds-spacing-2);
      border-top: var(--ds-spacing-px) solid color-mix(in srgb, var(--ds-foreground-inverted) 12%, transparent);
    }
    .aesir-status-bar__event-group > small {
      font-size: var(--ds-font-size-xxs);
      font-weight: var(--ds-font-weight-medium);
      opacity: var(--ds-opacity-70);
    }
    .aesir-status-bar__tooltip ul {
      display: grid;
      margin: 0;
      padding: 0;
      gap: var(--ds-spacing-1);
      list-style: none;
    }
    .aesir-status-bar__tooltip-heading {
      display: grid;
      gap: var(--ds-spacing-0-5);
    }
    .aesir-status-bar__tooltip-heading small {
      font-size: var(--ds-font-size-xxs);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-xs);
      opacity: var(--ds-opacity-70);
    }
    .aesir-status-bar__tooltip-heading strong,
    .aesir-status-bar__tooltip time {
      font-variant-numeric: tabular-nums;
    }
    .aesir-status-bar__tooltip li {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--ds-spacing-2);
    }
    .aesir-status-bar__tooltip time {
      min-width: 4.75rem;
      font-size: var(--ds-font-size-xs);
      white-space: nowrap;
    }
    .aesir-status-bar__tooltip strong {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-semibold);
    }
    .aesir-status-bar__tooltip span {
      color: var(--ds-foreground-inverted);
      font-weight: var(--ds-font-weight-normal);
      opacity: var(--ds-opacity-70);
    }
    .aesir-status-bar__tooltip-positioner {
      position: fixed;
      top: 0;
      left: 0;
      z-index: var(--aesir-overlay-z-tooltip);
      visibility: hidden;
      pointer-events: none;
      will-change: transform;
    }
    .aesir-status-bar__tooltip-positioner[data-positioned] {
      visibility: visible;
    }
    .aesir-status-bar__tooltip-positioner[data-following] {
      transition: transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }
    .aesir-status-bar__popover {
      position: relative;
      box-sizing: border-box;
      width: max-content;
      min-width: var(--ds-sizing-3xs);
      max-width: min(calc(100vw - var(--ds-spacing-8)), var(--ds-sizing-xs));
      overflow-wrap: anywhere;
    }
    .aesir-status-bar__popover[data-placement='top'] {
      translate: 0 -100%;
    }
    .aesir-status-bar__popover > * {
      max-width: 100%;
      min-width: 0;
    }

    @media (hover: hover) and (pointer: fine) {
      .aesir-status-bar__segment:hover {
        opacity: var(--ds-opacity-70);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-overlay-motion {
        --aesir-overlay-start-transform: none;
        transition-duration: var(--ds-motion-duration-instant);
        transform: none;
      }
      .aesir-status-bar__tooltip-positioner[data-following] {
        transition: none;
      }
    }
  }
</style>
