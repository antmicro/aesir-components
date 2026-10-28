import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import TagInput from '../../src/components/aesir-tag-input/aesir-tag-input.svelte';

test('a long selected tag stays within a narrow tag input', async () => {
  const label = 'A long selected topic label that should wrap inside its tag instead of widening the field';
  await render(TagInput, {
    label: 'Topics',
    options: [{ label, value: 'long-topic' }],
    value: ['long-topic'],
    style: 'width: 220px; --ds-spacing-7: 28px; --ds-spacing-4: 16px'
  });

  const root = document.querySelector('.aesir-tag-input');
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

  const badge = root.querySelector('.aesir-tag-input__badge');
  const labelRect = badge.querySelector('span').getBoundingClientRect();
  const badgeRect = badge.getBoundingClientRect();
  expect(labelRect.top).toBeGreaterThanOrEqual(badgeRect.top - 1);
  expect(labelRect.bottom).toBeLessThanOrEqual(badgeRect.bottom + 1);
});
