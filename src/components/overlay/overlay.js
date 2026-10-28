import { tick } from 'svelte';

const resolvePortalTarget = (node, to, originRoot) => {
  if (to?.nodeType === 1 || to?.nodeType === 11) return to;
  const defaultTarget = typeof ShadowRoot !== 'undefined' && originRoot instanceof ShadowRoot ? originRoot : node.ownerDocument.body;
  if (typeof to === 'string') return originRoot?.querySelector?.(to) ?? node.ownerDocument.querySelector(to) ?? defaultTarget;
  return defaultTarget;
};

export function portal(node, options = {}) {
  if (typeof document === 'undefined') return;
  let destroyed = false;
  let currentOptions = options ?? {};
  const origin = { parent: node.parentNode, next: node.nextSibling };
  const originRoot = node.getRootNode();

  const move = () => {
    if (destroyed) return;
    if (currentOptions.disabled) {
      const next = origin.next?.parentNode === origin.parent ? origin.next : null;
      if (origin.parent && (node.parentNode !== origin.parent || node.nextSibling !== next)) origin.parent.insertBefore(node, next);
      return;
    }
    const target = resolvePortalTarget(node, currentOptions.to, originRoot);
    if (target && node.parentNode !== target) target.appendChild(node);
  };

  queueMicrotask(move);

  return {
    update(nextOptions) {
      currentOptions = nextOptions ?? {};
      move();
    },
    destroy() {
      destroyed = true;
      node.remove();
    }
  };
}

// Modular HTML bundles must coordinate layers and scroll locks on the same page.
const overlayStateKey = Symbol.for('aesir.overlay-state.v1');
const documentOverlayState = (ownerDocument) => (ownerDocument[overlayStateKey] ??= { locks: 0, registry: undefined, exclusive: new Map(), rootOverflow: undefined });

// Closing on pointerdown must not let the remainder of that gesture click through.
const swallowPointerClick = (ownerDocument, pointerTarget) => {
  const state = documentOverlayState(ownerDocument);
  state.releasePointerClick?.();
  const cleanup = () => {
    ownerDocument.removeEventListener('click', swallow, true);
    ownerDocument.removeEventListener('contextmenu', swallow, true);
    ownerDocument.removeEventListener('pointerdown', cleanup, true);
    clearTimeout(timer);
    if (state.releasePointerClick === cleanup) state.releasePointerClick = undefined;
  };
  const swallow = (event) => {
    const sameGesture = event.composedPath().includes(pointerTarget) || event.target === ownerDocument.body || event.target === ownerDocument.documentElement;
    if (!sameGesture) {
      cleanup();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    cleanup();
  };
  const timer = setTimeout(cleanup, 1000);
  state.releasePointerClick = cleanup;
  ownerDocument.addEventListener('click', swallow, true);
  ownerDocument.addEventListener('contextmenu', swallow, true);
  ownerDocument.addEventListener('pointerdown', cleanup, true);
};

export function registerExclusiveOverlay(ownerDocument, group, close) {
  const state = documentOverlayState(ownerDocument);
  state.exclusive ??= new Map();
  state.exclusive.get(group)?.();
  state.exclusive.set(group, close);

  return () => {
    if (state.exclusive.get(group) === close) state.exclusive.delete(group);
  };
}

const registerOverlayLayer = (ownerDocument, layer) => {
  const state = documentOverlayState(ownerDocument);
  let registry = state.registry;
  let released = false;

  if (!registry) {
    const layers = [];
    const blockingLayer = () => {
      const index = layers.findLastIndex((entry) => entry.modal);
      const active = layers[index];
      return active?.blockOutside ? { active, branches: layers.slice(index).flatMap((entry) => entry.branches?.() ?? []) } : undefined;
    };
    const outsideBlockingLayer = (event) => {
      const blocking = blockingLayer();
      return blocking && !blocking.branches.some((branch) => branch && event.composedPath().includes(branch)) ? blocking.active : undefined;
    };
    const onOutsidePointer = (event) => {
      const active = outsideBlockingLayer(event);
      if (!active) return;
      swallowPointerClick(ownerDocument, event.composedPath()[0]);
      active.onPointerDown?.(event);
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onOutsideClick = (event) => {
      const active = outsideBlockingLayer(event);
      if (!active) return;
      active.onPointerDown?.(event);
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onOutsideHover = (event) => {
      if (!outsideBlockingLayer(event)) return;
      if (event.type === 'contextmenu') event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onFocusIn = (event) => {
      const active = blockingLayer()?.active;
      if (!active) return;
      if (!outsideBlockingLayer(event)) {
        active.lastFocus = event.composedPath()[0];
        return;
      }
      const content = active.branches().find(Boolean);
      const target = active.lastFocus?.isConnected ? active.lastFocus : (getFocusableElements(content ?? ownerDocument.body)[0] ?? content);
      target?.focus({ preventScroll: true });
    };
    const onPointerDown = (event) => {
      if (event.defaultPrevented) return;
      layers.at(-1)?.onPointerDown?.(event);
    };
    const onKeydown = (event) => {
      if (event.defaultPrevented || event.key !== 'Escape') return;
      const activeLayer = layers.at(-1);
      if (!activeLayer?.onEscape) return;
      event.preventDefault();
      activeLayer.onEscape(event);
    };

    ownerDocument.addEventListener('pointerdown', onPointerDown);
    ownerDocument.addEventListener('keydown', onKeydown);
    ownerDocument.addEventListener('pointerdown', onOutsidePointer, true);
    ownerDocument.addEventListener('click', onOutsideClick, true);
    ownerDocument.addEventListener('contextmenu', onOutsideHover, true);
    ownerDocument.addEventListener('pointerover', onOutsideHover, true);
    ownerDocument.addEventListener('pointerenter', onOutsideHover, true);
    ownerDocument.addEventListener('focusin', onFocusIn);
    registry = { layers, onPointerDown, onKeydown, onOutsidePointer, onOutsideClick, onOutsideHover, onFocusIn };
    state.registry = registry;
  }

  registry.layers.push(layer);

  return () => {
    if (released) return;
    released = true;
    const index = registry.layers.indexOf(layer);
    if (index >= 0) registry.layers.splice(index, 1);
    if (registry.layers.length) return;
    ownerDocument.removeEventListener('pointerdown', registry.onPointerDown);
    ownerDocument.removeEventListener('keydown', registry.onKeydown);
    ownerDocument.removeEventListener('pointerdown', registry.onOutsidePointer, true);
    ownerDocument.removeEventListener('click', registry.onOutsideClick, true);
    ownerDocument.removeEventListener('contextmenu', registry.onOutsideHover, true);
    ownerDocument.removeEventListener('pointerover', registry.onOutsideHover, true);
    ownerDocument.removeEventListener('pointerenter', registry.onOutsideHover, true);
    ownerDocument.removeEventListener('focusin', registry.onFocusIn);
    state.registry = undefined;
  };
};

export function registerDismissableOverlay(ownerDocument, { branches, onDismiss, dismissOnPointerDown = true, exclusive = false, modal = false }) {
  const releaseExclusive = exclusive ? registerExclusiveOverlay(ownerDocument, 'floating-overlay', () => onDismiss('exclusive')) : () => {};
  let backdrop;
  if (modal) {
    const content = branches().find(Boolean);
    if (content) {
      backdrop = ownerDocument.createElement('div');
      backdrop.dataset.aesirMenuBackdrop = '';
      backdrop.setAttribute('aria-hidden', 'true');
      const zIndex = ownerDocument.defaultView.getComputedStyle(content).zIndex || 'var(--aesir-overlay-z-popover, 50)';
      backdrop.style.cssText = `position:fixed;inset:0;background:transparent;z-index:calc(${zIndex === 'auto' ? 'var(--aesir-overlay-z-popover, 50)' : zIndex} - 1);`;
      const root = content.getRootNode();
      (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot ? root : ownerDocument.body).append(backdrop);
    }
    ownerDocument.dispatchEvent(new ownerDocument.defaultView.Event('aesir:tooltip-dismiss'));
  }
  const releaseLayer = registerOverlayLayer(ownerDocument, {
    modal,
    blockOutside: modal,
    branches,
    onPointerDown: dismissOnPointerDown
      ? (event) => {
          if ('button' in event && event.button !== 0) return;
          if (branches().some((branch) => branch && event.composedPath().includes(branch))) return;
          onDismiss('pointerdown', event);
        }
      : undefined,
    onEscape: (event) => onDismiss('escape', event)
  });
  const unlock = modal ? lockDocumentOverlay(ownerDocument) : () => {};
  return () => {
    releaseExclusive();
    releaseLayer();
    backdrop?.remove();
    unlock();
  };
}

export function lockDocumentOverlay(ownerDocument = document) {
  const root = ownerDocument.documentElement;
  const state = documentOverlayState(ownerDocument);
  let released = false;

  if (state.locks === 0) {
    state.rootOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
  }
  state.locks += 1;
  root.dataset.overlayOpen = 'true';

  return () => {
    if (released) return;
    released = true;

    state.locks -= 1;
    if (state.locks) return;
    root.style.overflow = state.rootOverflow ?? '';
    state.rootOverflow = undefined;
    delete root.dataset.overlayOpen;
  };
}

export function registerModalOverlay(ownerDocument = document, options = {}) {
  const { onEscape, branches, onPointerDownOutside, returnFocus, restoreFocus = true } = typeof options === 'function' ? { onEscape: options } : options;
  const previouslyFocused = ownerDocument.activeElement;
  const unregisterLayer = registerOverlayLayer(ownerDocument, {
    modal: true,
    branches,
    onEscape,
    onPointerDown: onPointerDownOutside
      ? (event) => {
          if (branches?.().some((branch) => branch && event.composedPath().includes(branch))) return;
          onPointerDownOutside(event);
        }
      : undefined
  });
  const unlockOverlay = lockDocumentOverlay(ownerDocument);
  const EventConstructor = ownerDocument.defaultView?.Event ?? Event;
  ownerDocument.dispatchEvent(new EventConstructor('aesir:tooltip-dismiss'));

  return () => {
    unregisterLayer();
    unlockOverlay();
    if (!restoreFocus) return;
    const target = returnFocus?.() ?? previouslyFocused;
    queueMicrotask(() => target?.isConnected && target.focus?.());
  };
}

const composedParent = (node) => {
  if (node?.assignedSlot) return node.assignedSlot;
  if (node?.parentElement) return node.parentElement;
  const root = node?.getRootNode?.();
  return typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot ? root.host : null;
};

/** Only controls in the active modal may open a tooltip over it. */
export function canShowTooltip(node) {
  if (!node) return false;
  const modal = documentOverlayState(node.ownerDocument).registry?.layers.findLast((layer) => layer.modal);
  if (!modal) return true;
  const branches = modal.branches?.() ?? [];
  for (let ancestor = node; ancestor; ancestor = composedParent(ancestor)) {
    if (branches.includes(ancestor)) return true;
  }
  return false;
}

/** A portaled floating panel must sit above the modal containing its anchor. */
export function getFloatingOverlayZIndex(anchor) {
  if (!anchor) return undefined;
  const modals = documentOverlayState(anchor.ownerDocument).registry?.layers.filter((layer) => layer.modal) ?? [];
  let insideModal = false;
  let modalZ = 0;
  const ownerWindow = anchor.ownerDocument.defaultView;
  for (let ancestor = anchor; ancestor; ancestor = composedParent(ancestor)) {
    if (modals.some((layer) => layer.branches?.().includes(ancestor))) insideModal = true;
    if (insideModal) modalZ = Math.max(modalZ, Number(ownerWindow.getComputedStyle(ancestor).zIndex) || 0);
  }
  if (!insideModal) return undefined;
  const tokens = ownerWindow.getComputedStyle(anchor);
  const popoverZ = Number(tokens.getPropertyValue('--aesir-overlay-z-popover')) || 50;
  const dialogZ = Number(tokens.getPropertyValue('--aesir-overlay-z-dialog')) || 70;
  return Math.max(popoverZ, (modalZ || dialogZ) + 1);
}

const createsFixedContainingBlock = (element) => {
  const style = getComputedStyle(element);
  const containment = (style.contain || '').split(/\s+/);
  const willChange = (style.willChange || '').split(',').map((value) => value.trim());
  const isActiveEffect = (value) => Boolean(value) && value !== 'none';

  return (
    isActiveEffect(style.transform) ||
    isActiveEffect(style.perspective) ||
    isActiveEffect(style.filter) ||
    isActiveEffect(style.backdropFilter) ||
    (Boolean(style.containerType) && style.containerType !== 'normal') ||
    style.contentVisibility === 'auto' ||
    containment.some((value) => ['layout', 'paint', 'strict', 'content'].includes(value)) ||
    willChange.some((value) => ['transform', 'perspective', 'filter', 'backdrop-filter'].includes(value))
  );
};

export function getFixedPositionOffset(node) {
  for (let ancestor = composedParent(node); ancestor; ancestor = composedParent(ancestor)) {
    if (!createsFixedContainingBlock(ancestor)) continue;
    const rect = ancestor.getBoundingClientRect();
    return {
      left: rect.left + ancestor.clientLeft,
      top: rect.top + ancestor.clientTop
    };
  }

  return { left: 0, top: 0 };
}

export function getAnchoredPosition(anchorNode, overlayNode, { placement = 'bottom', align = 'start', offset = 8, gutter = 8, matchWidth = false, width, maxHeight = Infinity } = {}) {
  const anchor = anchorNode.getBoundingClientRect();
  const containingBlock = getFixedPositionOffset(overlayNode);
  const ownerWindow = overlayNode.ownerDocument.defaultView ?? window;
  const viewportWidth = Math.max(ownerWindow.innerWidth - gutter * 2, 0);
  const viewportHeight = Math.max(ownerWindow.innerHeight - gutter * 2, 0);
  // Integer DOM measurements can round a fractional text width down in Firefox.
  // Use the untransformed CSS border box, rounded up, so the final glyph still fits.
  const overlayStyle = ownerWindow.getComputedStyle(overlayNode);
  const horizontalExtras =
    overlayStyle.boxSizing === 'border-box'
      ? 0
      : ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((total, property) => total + (parseFloat(overlayStyle[property]) || 0), 0);
  const naturalWidth = Math.ceil(Math.max((parseFloat(overlayStyle.width) || 0) + horizontalExtras, overlayNode.offsetWidth, overlayNode.scrollWidth));
  const requestedWidth = Math.min(width ?? (matchWidth ? anchor.width : naturalWidth), viewportWidth);
  const requestedHeight = Math.min(Math.max(overlayNode.scrollHeight, overlayNode.offsetHeight), maxHeight, viewportHeight);
  const spaceAbove = Math.max(anchor.top - offset - gutter, 0);
  const spaceBelow = Math.max(ownerWindow.innerHeight - anchor.bottom - offset - gutter, 0);
  const spaceLeft = Math.max(anchor.left - offset - gutter, 0);
  const spaceRight = Math.max(ownerWindow.innerWidth - anchor.right - offset - gutter, 0);
  const vertical = placement === 'top' || placement === 'bottom';
  const preferredSpace = placement === 'top' ? spaceAbove : placement === 'bottom' ? spaceBelow : placement === 'left' ? spaceLeft : spaceRight;
  const oppositeSpace = placement === 'top' ? spaceBelow : placement === 'bottom' ? spaceAbove : placement === 'left' ? spaceRight : spaceLeft;
  const requestedSize = vertical ? requestedHeight : requestedWidth;
  const oppositePlacement = placement === 'top' ? 'bottom' : placement === 'bottom' ? 'top' : placement === 'left' ? 'right' : 'left';
  const resolvedPlacement = requestedSize > preferredSpace && oppositeSpace > preferredSpace ? oppositePlacement : placement;
  const availableWidth = resolvedPlacement === 'left' ? spaceLeft : resolvedPlacement === 'right' ? spaceRight : viewportWidth;
  const availableHeight = resolvedPlacement === 'top' ? spaceAbove : resolvedPlacement === 'bottom' ? spaceBelow : viewportHeight;
  const overlayWidth = Math.min(requestedWidth, availableWidth);
  const overlayHeight = Math.min(requestedHeight, availableHeight);
  const desiredLeft =
    resolvedPlacement === 'left'
      ? anchor.left - overlayWidth - offset
      : resolvedPlacement === 'right'
        ? anchor.right + offset
        : align === 'end'
          ? anchor.right - overlayWidth
          : align === 'center'
            ? anchor.left + (anchor.width - overlayWidth) / 2
            : anchor.left;
  const desiredTop =
    resolvedPlacement === 'top'
      ? anchor.top - overlayHeight - offset
      : resolvedPlacement === 'bottom'
        ? anchor.bottom + offset
        : align === 'end'
          ? anchor.bottom - overlayHeight
          : align === 'center'
            ? anchor.top + (anchor.height - overlayHeight) / 2
            : anchor.top;
  const viewportLeft = Math.min(Math.max(desiredLeft, gutter), Math.max(ownerWindow.innerWidth - overlayWidth - gutter, gutter));
  const viewportTop = Math.min(Math.max(desiredTop, gutter), Math.max(ownerWindow.innerHeight - overlayHeight - gutter, gutter));
  const originX = resolvedPlacement === 'left' ? overlayWidth : resolvedPlacement === 'right' ? 0 : Math.min(Math.max(anchor.left + anchor.width / 2 - viewportLeft, 0), overlayWidth);
  const originY = resolvedPlacement === 'top' ? overlayHeight : resolvedPlacement === 'bottom' ? 0 : Math.min(Math.max(anchor.top + anchor.height / 2 - viewportTop, 0), overlayHeight);

  return {
    placement: resolvedPlacement,
    top: viewportTop - containingBlock.top,
    left: viewportLeft - containingBlock.left,
    originX,
    originY,
    style: `top:${viewportTop - containingBlock.top}px;left:${viewportLeft - containingBlock.left}px;width:${overlayWidth}px;max-width:${viewportWidth}px;max-height:${Math.min(maxHeight, availableHeight)}px;--aesir-overlay-transform-origin:${originX}px ${originY}px;`
  };
}

export function autoUpdateOverlayPosition(anchorNode, overlayNode, onUpdate) {
  const ownerWindow = overlayNode.ownerDocument.defaultView ?? window;
  let frame;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(onUpdate);
  };
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);

  observer?.observe(anchorNode);
  observer?.observe(overlayNode);
  ownerWindow.addEventListener('resize', update);
  ownerWindow.addEventListener('scroll', update, true);
  update();

  return () => {
    cancelAnimationFrame(frame);
    observer?.disconnect();
    ownerWindow.removeEventListener('resize', update);
    ownerWindow.removeEventListener('scroll', update, true);
  };
}

export function autoUpdateAnchoredPosition(anchorNode, overlayNode, options, onUpdate) {
  return autoUpdateOverlayPosition(anchorNode, overlayNode, () => onUpdate(getAnchoredPosition(anchorNode, overlayNode, options)));
}

export function getFocusableElements(node) {
  const selector = 'a[href], button, input, select, textarea, [tabindex]';
  const elements = [];
  const visit = (parent) => {
    const assigned = parent.localName === 'slot' ? parent.assignedElements({ flatten: true }) : [];
    const children = assigned.length ? assigned : (parent.shadowRoot ?? parent).children;
    for (const element of children ?? []) {
      if (element.matches(selector)) elements.push(element);
      visit(element);
    }
  };
  visit(node);
  return elements.filter((element) => {
    if (element.tabIndex < 0 || element.matches(':disabled') || element.closest('[hidden], [inert]')) return false;
    const style = node.ownerDocument.defaultView.getComputedStyle(element);
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    for (let ancestor = element; ancestor; ancestor = composedParent(ancestor)) {
      if (ancestor.hidden || ancestor.inert || node.ownerDocument.defaultView.getComputedStyle(ancestor).display === 'none') return false;
    }
    return true;
  });
}

export function trapFocus(node) {
  const focusable = () => getFocusableElements(node);
  const activeElement = () => {
    let active = node.ownerDocument.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
  };
  let destroyed = false;

  // Portals move after mounting; focusing before that move loses focus.
  tick().then(() => {
    if (!destroyed) (focusable()[0] ?? node).focus();
  });

  const onKeydown = (event) => {
    if (event.defaultPrevented || event.key !== 'Tab') return;
    const elements = focusable();
    if (!elements.length) {
      event.preventDefault();
      node.focus();
      return;
    }

    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && (activeElement() === first || !elements.includes(activeElement()))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (activeElement() === last || !elements.includes(activeElement()))) {
      event.preventDefault();
      first.focus();
    }
  };

  node.addEventListener('keydown', onKeydown);
  return {
    destroy() {
      destroyed = true;
      node.removeEventListener('keydown', onKeydown);
    }
  };
}
