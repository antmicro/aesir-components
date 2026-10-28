const entries = {
  people: [
    ['😀', 'Grinning face', 'happy smile'],
    ['😃', 'Smiley', 'happy smile'],
    ['😄', 'Smile', 'happy laugh'],
    ['😁', 'Grin', 'happy teeth'],
    ['😅', 'Sweat smile', 'relief nervous'],
    ['😂', 'Joy', 'tears laugh'],
    ['🤣', 'Rolling on the floor laughing', 'rofl lol'],
    ['😊', 'Blush', 'happy smile'],
    ['🙂', 'Slightly smiling face', 'happy'],
    ['🙃', 'Upside down face', 'sarcasm'],
    ['😉', 'Wink', 'playful'],
    ['😍', 'Heart eyes', 'love'],
    ['🥰', 'Smiling face with hearts', 'love'],
    ['😎', 'Sunglasses', 'cool'],
    ['🤔', 'Thinking face', 'hmm question'],
    ['🫡', 'Saluting face', 'yes respect'],
    ['🤗', 'Hugging face', 'hug thanks'],
    ['😐', 'Neutral face', 'meh'],
    ['🫠', 'Melting face', 'hot overwhelmed'],
    ['😮', 'Open mouth', 'surprised wow'],
    ['🥳', 'Partying face', 'celebrate birthday'],
    ['🥺', 'Pleading face', 'please'],
    ['😴', 'Sleeping', 'tired sleep'],
    ['🤯', 'Exploding head', 'mind blown'],
    ['👋', 'Wave', 'hello goodbye'],
    ['👍', 'Thumbs up', 'thumbsup yes approve +1'],
    ['👎', 'Thumbs down', 'thumbsdown no -1'],
    ['👏', 'Clap', 'applause well done'],
    ['🙌', 'Raised hands', 'celebrate hooray'],
    ['🙏', 'Folded hands', 'thanks please pray'],
    ['🤞', 'Crossed fingers', 'luck'],
    ['💪', 'Flexed biceps', 'strong strength'],
    ['👀', 'Eyes', 'looking review watching'],
    ['🤝', 'Handshake', 'agreement deal'],
    ['✌️', 'Victory hand', 'peace'],
    ['👌', 'OK hand', 'okay']
  ],
  nature: [
    ['🐶', 'Dog', 'puppy animal'],
    ['🐱', 'Cat', 'kitten animal'],
    ['🦊', 'Fox', 'animal'],
    ['🐻', 'Bear', 'animal'],
    ['🐼', 'Panda', 'animal'],
    ['🐸', 'Frog', 'animal'],
    ['🐝', 'Bee', 'honey insect'],
    ['🦋', 'Butterfly', 'insect'],
    ['🌱', 'Seedling', 'plant grow'],
    ['🌿', 'Herb', 'leaf plant'],
    ['🌳', 'Tree', 'forest nature'],
    ['🌻', 'Sunflower', 'flower'],
    ['🌈', 'Rainbow', 'weather'],
    ['☀️', 'Sun', 'weather sunny'],
    ['🌙', 'Moon', 'night'],
    ['🔥', 'Fire', 'hot lit']
  ],
  food: [
    ['☕', 'Coffee', 'tea drink morning'],
    ['🍵', 'Tea', 'drink'],
    ['🍕', 'Pizza', 'food lunch'],
    ['🍔', 'Burger', 'food lunch'],
    ['🍟', 'Fries', 'food'],
    ['🌮', 'Taco', 'food lunch'],
    ['🍣', 'Sushi', 'food'],
    ['🍜', 'Noodles', 'ramen food'],
    ['🍎', 'Apple', 'fruit'],
    ['🥑', 'Avocado', 'fruit'],
    ['🍓', 'Strawberry', 'fruit'],
    ['🍪', 'Cookie', 'dessert'],
    ['🍰', 'Cake', 'birthday dessert'],
    ['🍩', 'Doughnut', 'donut dessert'],
    ['🥤', 'Drink', 'soda'],
    ['🍿', 'Popcorn', 'snack movie']
  ],
  travel: [
    ['🚀', 'Rocket', 'ship launch release'],
    ['✈️', 'Airplane', 'travel flight'],
    ['🚗', 'Car', 'drive travel'],
    ['🚲', 'Bicycle', 'bike travel'],
    ['🚂', 'Train', 'travel'],
    ['🚢', 'Ship', 'boat travel'],
    ['🏠', 'House', 'home remote'],
    ['🏢', 'Office', 'building work'],
    ['🏖️', 'Beach', 'vacation holiday'],
    ['🏔️', 'Mountain', 'hiking'],
    ['🏕️', 'Camping', 'tent vacation'],
    ['🌍', 'Globe', 'earth world']
  ],
  activities: [
    ['🎉', 'Party popper', 'tada celebrate congrats'],
    ['🎊', 'Confetti ball', 'celebrate'],
    ['🎯', 'Bullseye', 'target goal'],
    ['🏆', 'Trophy', 'win award'],
    ['🥇', 'Gold medal', 'win first'],
    ['⚽', 'Soccer ball', 'football sport'],
    ['🏀', 'Basketball', 'sport'],
    ['🏈', 'American football', 'sport'],
    ['🎮', 'Video game', 'gaming controller'],
    ['🎨', 'Artist palette', 'design art'],
    ['🎵', 'Musical note', 'music'],
    ['🎸', 'Guitar', 'music']
  ],
  objects: [
    ['💡', 'Light bulb', 'idea tip'],
    ['💻', 'Laptop', 'computer code'],
    ['⌨️', 'Keyboard', 'computer typing'],
    ['📱', 'Phone', 'mobile'],
    ['🔧', 'Wrench', 'fix tool'],
    ['🔨', 'Hammer', 'build tool'],
    ['🛠️', 'Tools', 'build repair'],
    ['🐛', 'Bug', 'error insect'],
    ['📌', 'Pushpin', 'pin important'],
    ['📝', 'Memo', 'note document'],
    ['📚', 'Books', 'docs learn'],
    ['📅', 'Calendar', 'date schedule'],
    ['⏰', 'Alarm clock', 'time reminder'],
    ['📣', 'Megaphone', 'announcement'],
    ['🔒', 'Lock', 'security private'],
    ['🎁', 'Gift', 'present birthday']
  ],
  symbols: [
    ['❤️', 'Red heart', 'love'],
    ['💙', 'Blue heart', 'love'],
    ['💚', 'Green heart', 'love'],
    ['💜', 'Purple heart', 'love'],
    ['✨', 'Sparkles', 'magic new'],
    ['💯', 'Hundred points', '100 perfect'],
    ['✅', 'Check mark', 'done success yes'],
    ['❌', 'Cross mark', 'no error'],
    ['⚠️', 'Warning', 'attention alert'],
    ['🆘', 'SOS', 'help urgent'],
    ['➕', 'Plus', 'add'],
    ['➖', 'Minus', 'remove'],
    ['🔴', 'Red circle', 'red status'],
    ['🔵', 'Blue circle', 'blue status'],
    ['🟢', 'Green circle', 'green status'],
    ['⚪', 'White circle', 'white status'],
    ['1️⃣', 'One', 'number 1'],
    ['2️⃣', 'Two', 'number 2'],
    ['3️⃣', 'Three', 'number 3'],
    ['🆗', 'OK', 'okay approved'],
    ['🆒', 'Cool', 'nice'],
    ['♻️', 'Recycle', 'reuse'],
    ['🔁', 'Repeat', 'again retry'],
    ['💬', 'Speech balloon', 'chat message']
  ],
  flags: [
    ['🏁', 'Chequered flag', 'finish race'],
    ['🚩', 'Triangular flag', 'red flag warning'],
    ['🏳️', 'White flag', 'surrender'],
    ['🏴‍☠️', 'Pirate flag', 'pirate skull'],
    ['🇵🇱', 'Poland', 'polish flag'],
    ['🇺🇸', 'United States', 'usa flag'],
    ['🇬🇧', 'United Kingdom', 'uk british flag'],
    ['🇪🇺', 'European Union', 'eu europe flag']
  ]
};

export const emojiCategories = [
  { id: 'people', label: 'Smileys & people' },
  { id: 'nature', label: 'Animals & nature' },
  { id: 'food', label: 'Food & drink' },
  { id: 'travel', label: 'Travel & places' },
  { id: 'activities', label: 'Activities' },
  { id: 'objects', label: 'Objects' },
  { id: 'symbols', label: 'Symbols' },
  { id: 'flags', label: 'Flags' }
];

export const emojiCatalog = Object.entries(entries).flatMap(([category, values]) =>
  values.map(([emoji, name, keywords]) => ({ emoji, name, keywords, category, id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_') }))
);

export const frequentEmoji = ['👍', '🤔', '😅', '🤣', '🫠', '👋', '😮', '😂', '🎉', '🙏', '❤️', '👀', '✅', '🤞', '☕', '😎'];
const workEmoji = ['✅', '👀', '🙌', '🙏', '➕', '👏', '💡', '🎯', '👋', '👍', '🎉', '1️⃣', '2️⃣', '3️⃣', '📣', '⚪', '🔵', '🔴', '🆒', '🆗', '🆘', '🚀', '🔥', '💯'];

export function getEmojiGroups(query = '', category = 'all', recent = frequentEmoji) {
  const normalized = query.trim().toLowerCase().replace(/^:|:$/g, '').replace(/_/g, ' ');
  if (normalized) return [{ id: 'results', label: 'Search results', items: emojiCatalog.filter((item) => `${item.name} ${item.keywords} ${item.emoji}`.toLowerCase().includes(normalized)) }];
  const lookup = (values) => values.map((emoji) => emojiCatalog.find((item) => item.emoji === emoji)).filter(Boolean);
  if (category !== 'all') return emojiCategories.filter((entry) => entry.id === category).map((entry) => ({ ...entry, items: emojiCatalog.filter((item) => item.category === entry.id) }));
  return [
    { id: 'frequent', label: 'Frequently used', items: lookup(recent) },
    { id: 'work', label: 'Getting work done', items: lookup(workEmoji) },
    ...emojiCategories.map((entry) => ({ ...entry, items: emojiCatalog.filter((item) => item.category === entry.id) }))
  ];
}

export function emojiNavigationIndex(index, key, length, columns = 8, control = false) {
  if (!length) return -1;
  if (key === 'ArrowRight') return Math.min(length - 1, index + 1);
  if (key === 'ArrowLeft') return Math.max(0, index - 1);
  if (key === 'ArrowDown') return Math.min(length - 1, index + columns);
  if (key === 'ArrowUp') return Math.max(0, index - columns);
  if (key === 'Home') return control ? 0 : Math.floor(index / columns) * columns;
  if (key === 'End') return control ? length - 1 : Math.min(length - 1, Math.floor(index / columns) * columns + columns - 1);
  return undefined;
}

export function emojiNavigationTarget(group, index, key, lengths, columns = 8, control = false) {
  const length = lengths[group];
  if (!length) return undefined;
  const next = emojiNavigationIndex(index, key, length, columns, control);
  if (next === undefined) return undefined;
  if (control && key === 'Home') return { group: 0, index: 0 };
  if (control && key === 'End') return { group: lengths.length - 1, index: lengths.at(-1) - 1 };
  if (group + 1 < lengths.length) {
    if (key === 'ArrowRight' && index === length - 1) return { group: group + 1, index: 0 };
    if (key === 'ArrowDown' && index >= Math.floor((length - 1) / columns) * columns) return { group: group + 1, index: Math.min(index % columns, lengths[group + 1] - 1) };
  }
  if (group > 0) {
    const previous = lengths[group - 1];
    if (key === 'ArrowLeft' && index === 0) return { group: group - 1, index: previous - 1 };
    if (key === 'ArrowUp' && index < columns) return { group: group - 1, index: Math.min(Math.floor((previous - 1) / columns) * columns + index, previous - 1) };
  }
  return { group, index: next };
}
