import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Tabs from '../src/components/aesir-tabs/aesir-tabs.svelte';

describe('AesirTabs focus', () => {
  test('moves focus to the selected tab when a focused panel is hidden by a value update', async () => {
    const items = [
      { value: 'one', label: 'One', content: 'One panel' },
      { value: 'two', label: 'Two', content: 'Two panel' }
    ];
    const { rerender } = render(Tabs, { items, value: 'one' });
    const firstPanel = screen.getByRole('tabpanel', { name: 'One' });
    firstPanel.focus();
    expect(document.activeElement).toBe(firstPanel);

    await rerender({ items, value: 'two' });

    expect(firstPanel.hidden).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Two' })));
  });

  test('moves focus to the selected tab when panel content is removed', async () => {
    const { rerender } = render(Tabs, {
      items: [{ value: 'one', label: 'One', content: 'One panel' }],
      value: 'one'
    });
    const panel = screen.getByRole('tabpanel', { name: 'One' });
    panel.focus();
    expect(document.activeElement).toBe(panel);

    await rerender({ items: [{ value: 'one', label: 'One' }], value: 'one' });

    expect(screen.queryByRole('tabpanel', { name: 'One' })).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'One' })));
  });

  test('moves focus within a shadow root when the active panel is hidden', async () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    document.body.append(host);
    const items = [
      { value: 'one', label: 'One', content: 'One panel' },
      { value: 'two', label: 'Two', content: 'Two panel' }
    ];
    const rendered = render(Tabs, { target: shadow, props: { items, value: 'one' } });

    try {
      const panel = shadow.querySelector('[role="tabpanel"]');
      panel.focus();
      expect(shadow.activeElement).toBe(panel);

      await rendered.rerender({ items, value: 'two' });

      await waitFor(() => expect(shadow.activeElement).toBe(shadow.querySelector('[role="tab"][aria-selected="true"]')));
    } finally {
      rendered.unmount();
      host.remove();
    }
  });
});
