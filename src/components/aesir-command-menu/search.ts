import type { CommandGroup, CommandItem } from './types.js';

const normalize = (value: unknown = '') => String(value).trim().toLocaleLowerCase();

export const searchCommandGroups = (groups: CommandGroup[], query: string): CommandGroup[] => {
  const term = normalize(query);
  if (!term) return groups;

  const score = (item: CommandItem) => {
    const label = normalize(item.label);
    if (label === term) return 5;
    if (label.startsWith(term)) return 4;
    if (label.includes(term)) return 3;
    if (normalize(item.description).includes(term)) return 2;
    return (item.keywords ?? []).some((keyword) => normalize(keyword).includes(term)) ? 1 : 0;
  };

  // Preserve group context while ranking the most relevant group and items first.
  return groups
    .map((group, index) => {
      const ranked = (group.items ?? [])
        .map((item, itemIndex) => ({ item, itemIndex, relevance: score(item) }))
        .filter(({ relevance }) => relevance > 0)
        .sort((a, b) => b.relevance - a.relevance || a.itemIndex - b.itemIndex);
      return { group: { ...group, items: ranked.map(({ item }) => item) }, index, relevance: ranked[0]?.relevance ?? 0 };
    })
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.index - b.index)
    .map(({ group }) => group);
};
