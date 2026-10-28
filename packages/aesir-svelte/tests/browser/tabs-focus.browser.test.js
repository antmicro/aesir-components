import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import Tabs from '../../src/components/aesir-tabs/aesir-tabs.svelte';

describe('AesirTabs focus', () => {
  test('moves focus out of a panel hidden by a controlled value update', async () => {
    const items = [
      { value: 'one', label: 'One', content: 'One panel' },
      { value: 'two', label: 'Two', content: 'Two panel' }
    ];
    const rendered = await render(Tabs, { items, value: 'one' });
    const firstPanel = page.getByRole('tabpanel', { name: 'One' });
    firstPanel.element().focus();
    await expect.element(firstPanel).toHaveFocus();

    await rendered.rerender({ items, value: 'two' });

    await expect.element(page.getByRole('tab', { name: 'Two' })).toHaveFocus();
  });

  test('moves focus to the tab when its panel is removed', async () => {
    const rendered = await render(Tabs, {
      items: [{ value: 'one', label: 'One', content: 'One panel' }],
      value: 'one'
    });
    const panel = page.getByRole('tabpanel', { name: 'One' });
    panel.element().focus();
    await expect.element(panel).toHaveFocus();

    await rendered.rerender({ items: [{ value: 'one', label: 'One' }], value: 'one' });

    await expect.element(page.getByRole('tab', { name: 'One' })).toHaveFocus();
  });
});
