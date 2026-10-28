import type { Snippet } from 'svelte';

export type DropdownItemRole = 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';

export type DropdownItem = {
  type?: 'separator' | 'label';
  label?: string;
  value?: string;
  icon?: string;
  shortcut?: string | string[];
  role?: DropdownItemRole;
  checked?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  featured?: boolean;
  eyebrow?: string;
  description?: string;
  cta?: string;
  href?: string;
  target?: string;
  rel?: string;
  items?: DropdownItem[];
  action?: (item: DropdownItem) => void;
};

export type DropdownCloseOptions = { restoreFocus?: boolean; skipMotion?: boolean };
export type DropdownOpenOptions = { skipMotion?: boolean };

export type DropdownTriggerProps = {
  onpointerenter: (event: PointerEvent) => void;
  onclick: (event: MouseEvent) => void;
  onkeydown: (event: KeyboardEvent) => void;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-invalid': true | undefined;
};

export type DropdownItemContent = Snippet<[{ item: DropdownItem }]>;

export type DropdownSubmenuController = {
  openPath: string[];
  openFromPointer: (event: PointerEvent, level: number, value?: string) => void;
  openImmediately: (level: number, value?: string) => void;
  scheduleClose: (level: number) => void;
  closeFrom: (level: number) => void;
  reset: (options?: { preservePath?: boolean }) => void;
  destroy: () => void;
  trackPointer: (event: PointerEvent) => void;
};
