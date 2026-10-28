import type { Snippet } from 'svelte';

export type AccordionValue = string | string[];
export type AccordionType = 'single' | 'multiple';
export type AccordionIndicator = 'chevron' | 'plus-minus';

export type AccordionItem = {
  value: string;
  title: string;
  content?: string | number;
  disabled?: boolean;
  icon?: string;
  iconLabel?: string;
  image?: string;
  imageAlt?: string;
  video?: string;
  poster?: string;
  mediaAlt?: string;
};

export type AccordionItemContent<Item extends AccordionItem = AccordionItem> = Snippet<[{ item: Item; open: boolean }]>;
export type AccordionMedia<Item extends AccordionItem = AccordionItem> = Snippet<[{ item: Item }]>;
