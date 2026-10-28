import { autoUpdateOverlayPosition } from '../overlay/overlay.js';

const VIEWPORT_GUTTER = 8;

export function positionSubmenu(node) {
  const update = () => {
    node.dataset.side = 'right';
    node.style.setProperty('--aesir-submenu-shift-y', '0px');

    let rect = node.getBoundingClientRect();
    const anchorRect = node.parentElement.getBoundingClientRect();
    const roomRight = window.innerWidth - anchorRect.right - VIEWPORT_GUTTER;
    const roomLeft = anchorRect.left - VIEWPORT_GUTTER;

    if (rect.width > roomRight && roomLeft > roomRight) {
      node.dataset.side = 'left';
      rect = node.getBoundingClientRect();
    }

    const shiftY = rect.top < VIEWPORT_GUTTER ? VIEWPORT_GUTTER - rect.top : rect.bottom > window.innerHeight - VIEWPORT_GUTTER ? window.innerHeight - VIEWPORT_GUTTER - rect.bottom : 0;
    node.style.setProperty('--aesir-submenu-shift-y', `${shiftY}px`);
  };
  const stop = autoUpdateOverlayPosition(node.parentElement, node, update);

  return {
    destroy: stop
  };
}
