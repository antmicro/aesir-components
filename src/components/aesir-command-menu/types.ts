import type { Snippet } from 'svelte';

export type CommandMenuAssignee = {
  name: string;
  src?: string;
  fallback?: string;
};

export type CommandItem = {
  id?: string;
  label: string;
  description?: string;
  keywords?: string[];
  icon?: string;
  shortcut?: string | string[];
  disabled?: boolean;
  href?: string;
  action?: (item: CommandItem) => void;
  groups?: CommandGroup[];
  placeholder?: string;
  image?: string;
  assignee?: CommandMenuAssignee;
  reference?: string;
  _index?: number;
};

export type CommandGroup = {
  label?: string;
  items?: CommandItem[];
};

export type CommandPage = {
  label: string;
  groups: CommandGroup[];
  placeholder?: string;
};

export type CommandMenuCloseOptions = {
  restoreFocus?: boolean;
  skipMotion?: boolean;
};

export type CommandMenuRenderContext = {
  query: string;
  currentPage?: CommandPage;
  close: (options?: CommandMenuCloseOptions) => void;
};

export type CommandMenuHeaderContext = Omit<CommandMenuRenderContext, 'close'>;
export type CommandMenuItemContent = Snippet<[CommandItem]>;
export type CommandMenuHeaderMeta = Snippet<[CommandMenuHeaderContext]>;
export type CommandMenuContent = Snippet<[CommandMenuRenderContext]>;
