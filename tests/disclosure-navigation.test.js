import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import Accordion from '../src/components/aesir-accordion/aesir-accordion.svelte';
import Tabs from '../src/components/aesir-tabs/aesir-tabs.svelte';
import DisclosureNavigationFixture from './fixtures/disclosure-navigation-fixture.svelte';

const selectedTab = () => screen.getByRole('status', { name: 'Selected tab' });
const selectedAccordionItem = () => screen.getByRole('status', { name: 'Selected accordion item' });

describe('AesirTabs', () => {
  test('connects tabs to panels and skips disabled tabs during keyboard navigation', async () => {
    const user = userEvent.setup();
    render(DisclosureNavigationFixture);

    const overview = screen.getByRole('tab', { name: 'Overview' });
    const activity = screen.getByRole('tab', { name: 'Activity' });
    const overviewPanel = screen.getByRole('tabpanel', { name: 'Overview' });

    expect(overview.getAttribute('aria-controls')).toBe(overviewPanel.id);
    expect(overviewPanel.getAttribute('aria-labelledby')).toBe(overview.id);
    expect(overview.dataset.state).toBe('active');
    expect(activity.dataset.state).toBe('inactive');

    overview.focus();
    await user.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(activity);
    expect(activity.getAttribute('aria-selected')).toBe('true');
    expect(activity.dataset.state).toBe('active');
    expect(overview.dataset.state).toBe('inactive');
    expect(selectedTab().textContent).toBe('activity');

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(overview);
  });

  test('supports Home and End without selecting disabled tabs', async () => {
    const user = userEvent.setup();
    render(DisclosureNavigationFixture);

    const overview = screen.getByRole('tab', { name: 'Overview' });
    const activity = screen.getByRole('tab', { name: 'Activity' });

    overview.focus();
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(activity);

    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(overview);
  });

  test('falls back to the first enabled tab when the active item is removed or disabled', async () => {
    const initial = [
      { value: 'one', label: 'One', content: 'One panel' },
      { value: 'two', label: 'Two', content: 'Two panel' }
    ];
    const { rerender } = render(Tabs, { items: initial, value: 'two' });
    expect(screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected')).toBe('true');

    await rerender({
      items: [
        { ...initial[0], disabled: true },
        { value: 'three', label: 'Three', content: 'Three panel' }
      ],
      value: 'two'
    });
    expect(screen.getByRole('tab', { name: 'Three' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Three' }).hidden).toBe(false);
  });

  test('supports manual activation and optional non-looping navigation', async () => {
    const user = userEvent.setup();
    const items = [
      { value: 'one', label: 'One', content: 'One panel' },
      { value: 'two', label: 'Two', content: 'Two panel' }
    ];
    render(Tabs, { items, value: 'one', activationMode: 'manual', loop: false });
    const one = screen.getByRole('tab', { name: 'One' });
    const two = screen.getByRole('tab', { name: 'Two' });

    one.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(two);
    expect(one.getAttribute('aria-selected')).toBe('true');

    await user.keyboard('{Enter}');
    expect(two.getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(two);
  });

  test('supports Space activation in manual mode', async () => {
    const user = userEvent.setup();
    const items = [
      { value: 'one', label: 'One', content: 'One panel' },
      { value: 'two', label: 'Two', content: 'Two panel' }
    ];
    render(Tabs, { items, value: 'one', activationMode: 'manual' });
    const one = screen.getByRole('tab', { name: 'One' });
    const two = screen.getByRole('tab', { name: 'Two' });

    one.focus();
    await user.keyboard('{ArrowRight}');
    expect(one.getAttribute('aria-selected')).toBe('true');
    await user.keyboard(' ');

    expect(two.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Two' }).hidden).toBe(false);
  });

  test('does not activate disabled tabs through pointer or synthetic clicks', async () => {
    const user = userEvent.setup();
    const items = [
      { value: 'one', label: 'One', content: 'One panel' },
      { value: 'two', label: 'Two', content: 'Two panel', disabled: true }
    ];
    render(Tabs, { items, value: 'one' });
    const disabled = screen.getByRole('tab', { name: 'Two' });

    await user.click(disabled);
    disabled.click();

    expect(screen.getByRole('tab', { name: 'One' }).getAttribute('aria-selected')).toBe('true');
    expect(disabled.getAttribute('aria-selected')).toBe('false');
  });

  test('exposes no selected tab when every item is disabled', () => {
    render(Tabs, {
      items: [
        { value: 'one', label: 'One', disabled: true },
        { value: 'two', label: 'Two', disabled: true }
      ]
    });

    expect(screen.getAllByRole('tab').every((tab) => tab.getAttribute('aria-selected') === 'false')).toBe(true);
    expect(screen.getAllByRole('tab').every((tab) => tab.getAttribute('tabindex') === '-1')).toBe(true);
  });

  test('uses vertical arrow keys and can disable the entire tab set', async () => {
    const user = userEvent.setup();
    const items = [
      { value: 'one', label: 'One' },
      { value: 'two', label: 'Two' }
    ];
    const { rerender } = render(Tabs, { items, value: 'one', orientation: 'vertical' });
    const tablist = screen.getByRole('tablist');
    const one = screen.getByRole('tab', { name: 'One' });
    const two = screen.getByRole('tab', { name: 'Two' });

    expect(tablist.getAttribute('aria-orientation')).toBe('vertical');
    one.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(two);
    expect(two.getAttribute('aria-selected')).toBe('true');

    await rerender({ items, value: 'two', orientation: 'vertical', disabled: true });
    expect(one.disabled).toBe(true);
    expect(two.disabled).toBe(true);
  });

  test('repositions the indicator when orientation changes without changing selection', async () => {
    const items = [
      { value: 'one', label: 'One' },
      { value: 'two', label: 'Two' }
    ];
    const { rerender, container } = render(Tabs, { items, value: 'two', orientation: 'horizontal' });
    await tick();
    const indicator = container.querySelector('.aesir-tabs__indicator');
    expect(indicator.style.width).not.toBe('');

    await rerender({ items, value: 'two', orientation: 'vertical' });
    await tick();
    expect(indicator.style.width).toBe('');
    expect(indicator.style.top).not.toBe('');
  });
});

describe('AesirAccordion', () => {
  test('updates media when an active item keeps its value but changes its source', async () => {
    const first = { value: 'one', title: 'One', image: '/first.png', imageAlt: 'Preview' };
    const { rerender } = render(Accordion, { items: [first], value: 'one' });
    await tick();
    expect(screen.getByRole('img', { name: 'Preview' }).getAttribute('src')).toBe('/first.png');

    await rerender({ items: [{ ...first, image: '/second.png' }], value: 'one' });
    await tick();
    expect(screen.getByRole('img', { name: 'Preview' }).getAttribute('src')).toBe('/second.png');
  });

  test('allows every item to stay collapsed in single collapsible mode', async () => {
    const user = userEvent.setup();
    render(Accordion, { items: [{ value: 'one', title: 'One', content: 'Content' }], collapsible: true });
    const trigger = screen.getByRole('button', { name: 'One' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
  test('exposes disclosure relationships and updates the controlled value', async () => {
    const user = userEvent.setup();
    render(DisclosureNavigationFixture);

    const account = screen.getByRole('button', { name: 'Account' });
    const security = screen.getByRole('button', { name: 'Security' });
    const accountRegion = screen.getByRole('region', { name: 'Account' });

    expect(account.getAttribute('aria-controls')).toBe(accountRegion.id);
    expect(accountRegion.getAttribute('aria-labelledby')).toBe(account.id);
    expect(account.getAttribute('aria-expanded')).toBe('true');

    await user.click(security);

    expect(account.getAttribute('aria-expanded')).toBe('false');
    expect(security.getAttribute('aria-expanded')).toBe('true');
    expect(selectedAccordionItem().textContent).toBe('security');
  });

  test('moves focus between enabled triggers without changing the open item', async () => {
    const user = userEvent.setup();
    render(DisclosureNavigationFixture);

    const account = screen.getByRole('button', { name: 'Account' });
    const security = screen.getByRole('button', { name: 'Security' });

    account.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(security);
    expect(selectedAccordionItem().textContent).toBe('account');

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(account);
  });

  test('moves focus between triggers inside a shadow root', async () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    document.body.append(host);
    const { unmount } = render(Accordion, {
      target: shadow,
      props: {
        items: [
          { value: 'one', title: 'One', content: 'First' },
          { value: 'two', title: 'Two', content: 'Second' }
        ]
      }
    });

    try {
      const first = shadow.querySelector('button[aria-controls]');
      const second = shadow.querySelectorAll('button[aria-controls]')[1];
      first.focus();
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(shadow.activeElement).toBe(second);
    } finally {
      unmount();
      host.remove();
    }
  });

  test('falls back when the open accordion item is removed', async () => {
    const initial = [
      { value: 'one', title: 'One', content: 'One content' },
      { value: 'two', title: 'Two', content: 'Two content' }
    ];
    const { rerender } = render(Accordion, { items: initial, value: 'two' });
    expect(screen.getByRole('button', { name: 'Two' }).getAttribute('aria-expanded')).toBe('true');

    await rerender({ items: [initial[0]], value: 'two' });
    expect(screen.getByRole('button', { name: 'One' }).getAttribute('aria-expanded')).toBe('true');
  });
});

describe('AesirCollapsible', () => {
  test('keeps its trigger and content state in sync', async () => {
    const user = userEvent.setup();
    render(DisclosureNavigationFixture);

    const trigger = screen.getByRole('button', { name: 'Advanced settings' });
    const content = screen.getByText('Dangerous action').closest('.aesir-collapsible__content');

    expect(trigger.getAttribute('aria-controls')).toBe(content.id);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(content.getAttribute('aria-hidden')).toBe('true');
    expect(trigger.closest('.aesir-collapsible').dataset.state).toBe('closed');

    await user.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(content.getAttribute('aria-hidden')).toBe('false');
    expect(trigger.closest('.aesir-collapsible').dataset.state).toBe('open');
    expect(screen.getByRole('status', { name: 'Collapsible state' }).textContent).toBe('open');
  });
});
