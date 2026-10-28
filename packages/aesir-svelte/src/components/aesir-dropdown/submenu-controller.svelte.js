import { isPointerMovingTowardSubmenu } from './pointer-grace.js';

export class SubmenuController {
  openPath = $state([]);
  // Internal bookkeeping; only openPath participates in rendering.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  timers = new Map();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  invalidPointerMoves = new Map();
  pointerHistory = [];
  lastPointerSample = 0;

  constructor(getMenu) {
    this.getMenu = getMenu;
  }

  clearTimer = (level) => {
    clearTimeout(this.timers.get(level));
    this.timers.delete(level);
  };

  closeFrom = (level) => {
    for (const [timerLevel, timer] of this.timers) {
      if (timerLevel >= level) {
        clearTimeout(timer);
        this.timers.delete(timerLevel);
      }
    }
    this.openPath = this.openPath.slice(0, level);
    for (const pointerLevel of this.invalidPointerMoves.keys()) {
      if (pointerLevel >= level) this.invalidPointerMoves.delete(pointerLevel);
    }
  };

  isMovingToward = (event, level) => {
    const submenu = this.getMenu()?.querySelector(`[data-submenu-level="${level}"]`);
    const previous = this.pointerHistory.at(-1);
    if (!submenu || !previous) return false;
    return isPointerMovingTowardSubmenu(previous, { x: event.clientX, y: event.clientY }, submenu.getBoundingClientRect(), submenu.dataset.side);
  };

  trackPointer = (event) => {
    if (event.pointerType !== 'mouse' || event.timeStamp - this.lastPointerSample < 16) return;
    this.lastPointerSample = event.timeStamp;
    for (let level = 0; level < this.openPath.length; level += 1) {
      const valid = this.isMovingToward(event, level);
      this.invalidPointerMoves.set(level, valid ? 0 : (this.invalidPointerMoves.get(level) ?? 0) + 1);
    }
    this.pointerHistory = [...this.pointerHistory.slice(-2), { x: event.clientX, y: event.clientY }];
  };

  openFromPointer = (event, level, value) => {
    this.clearTimer(level);
    if (this.openPath[level] === value) return;
    if (this.openPath[level] === undefined) {
      this.openImmediately(level, value);
      return;
    }

    const hasPointerGrace = this.isMovingToward(event, level) || (this.invalidPointerMoves.get(level) ?? 2) < 2;
    const delay = hasPointerGrace ? 420 : 140;
    this.timers.set(
      level,
      setTimeout(() => {
        this.openImmediately(level, value);
      }, delay)
    );
  };

  openImmediately = (level, value) => {
    this.closeFrom(level);
    this.invalidPointerMoves.set(level, 0);
    this.openPath = [...this.openPath.slice(0, level), value];
  };

  scheduleClose = (level) => {
    this.clearTimer(level);
    this.timers.set(
      level,
      setTimeout(() => this.closeFrom(level), 400)
    );
  };

  reset = ({ preservePath = false } = {}) => {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.invalidPointerMoves.clear();
    this.pointerHistory = [];
    if (!preservePath) this.openPath = [];
  };

  destroy = () => this.reset();
}
