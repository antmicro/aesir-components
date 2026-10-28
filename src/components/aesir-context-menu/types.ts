import type { DropdownSubmenuController } from '../aesir-dropdown/types.js';

export type ContextMenuPosition = { x: number; y: number };
export type ContextMenuOpenOptions = { restoreFocus?: boolean; returnFocus?: HTMLElement | null };

export type ContextMenuContext = {
  getOpen: () => boolean;
  getModal: () => boolean;
  setOpen: (value: boolean, options?: ContextMenuOpenOptions) => void;
  getPosition: () => ContextMenuPosition;
  setPosition: (x: number, y: number) => void;
  setContent: (element: HTMLElement | undefined) => void;
  submenu: DropdownSubmenuController;
};
