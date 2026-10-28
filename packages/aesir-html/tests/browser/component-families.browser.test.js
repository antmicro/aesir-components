import '../../dist/aesir-html.min.js';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());

const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('HTML component family contracts', () => {
  test('tabs synchronize selection, panels, and keyboard navigation with the host value', async () => {
    await mount('<aesir-tabs label="Workspace sections"></aesir-tabs>');
    const tabs = document.querySelector('aesir-tabs');
    tabs.items = [
      { value: 'overview', label: 'Overview', content: 'Overview panel' },
      { value: 'security', label: 'Security', content: 'Security panel', disabled: true },
      { value: 'activity', label: 'Activity', content: 'Activity panel' }
    ];
    tabs.value = 'overview';
    await settle();

    const overview = page.getByRole('tab', { name: 'Overview' });
    await overview.click();
    await userEvent.keyboard('{ArrowRight}');

    await expect.poll(() => tabs.shadowRoot.activeElement?.textContent.trim()).toBe('Activity');
    await expect.element(page.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
    await expect.element(page.getByRole('tabpanel', { name: 'Activity' })).toHaveTextContent('Activity panel');
    expect(tabs.value).toBe('activity');
  });

  test.each(['{Enter}', ' '])('tabs expose manual activation with %j, vertical navigation, and root disabled state', async (activationKey) => {
    await mount('<aesir-tabs activation-mode="manual" orientation="vertical" loop="false"></aesir-tabs>');
    const tabs = document.querySelector('aesir-tabs');
    tabs.items = [
      { value: 'one', label: 'One', content: 'One panel' },
      { value: 'two', label: 'Two', content: 'Two panel' }
    ];
    tabs.value = 'one';

    const one = page.getByRole('tab', { name: 'One' });
    const two = page.getByRole('tab', { name: 'Two' });
    await one.click();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => tabs.shadowRoot.activeElement?.textContent.trim()).toBe('Two');
    await expect.element(one).toHaveAttribute('aria-selected', 'true');
    await expect.element(two).toHaveAttribute('aria-selected', 'false');
    const firstPanel = page.getByRole('tabpanel', { name: 'One' }).element();
    await expect.element(firstPanel).toHaveTextContent('One panel');
    expect(tabs.value).toBe('one');

    await userEvent.keyboard(activationKey);
    // Wait for the native button activation, not just the browser input command.
    await expect.poll(() => tabs.value).toBe('two');
    await expect.element(two).toHaveAttribute('aria-selected', 'true');
    await expect.element(one).toHaveAttribute('aria-selected', 'false');
    await expect.element(page.getByRole('tabpanel', { name: 'Two' })).toHaveTextContent('Two panel');
    await expect.element(firstPanel).not.toBeVisible();

    tabs.disabled = true;
    await expect.element(one).toBeDisabled();
    await expect.element(two).toBeDisabled();
  });

  test('accordion keeps disclosure relationships and its public value synchronized', async () => {
    await mount('<aesir-accordion></aesir-accordion>');
    const accordion = document.querySelector('aesir-accordion');
    accordion.items = [
      { value: 'account', title: 'Account', content: 'Account settings' },
      { value: 'security', title: 'Security', content: 'Security settings' }
    ];
    accordion.value = 'account';
    await settle();

    const account = page.getByRole('button', { name: 'Account' });
    const security = page.getByRole('button', { name: 'Security' });
    await expect.element(account).toHaveAttribute('aria-expanded', 'true');
    await security.click();

    await expect.element(account).toHaveAttribute('aria-expanded', 'false');
    await expect.element(security).toHaveAttribute('aria-expanded', 'true');
    await expect.element(page.getByRole('region', { name: 'Security' })).toHaveTextContent('Security settings');
    expect(accordion.value).toBe('security');
  });

  test('quantity stepper respects bounds and emits one useful change event', async () => {
    await mount('<aesir-quantity-stepper label="Seats" value="1" min="1" max="3" step="2"></aesir-quantity-stepper>');
    const stepper = document.querySelector('aesir-quantity-stepper');
    const onChange = vi.fn();
    stepper.addEventListener('change', onChange);

    await page.getByRole('button', { name: 'Increase Seats' }).click();

    expect(stepper.value).toBe(3);
    expect(stepper.getAttribute('value')).toBe('3');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toBe(3);
    await expect.element(page.getByRole('button', { name: 'Increase Seats' })).toBeDisabled();
  });

  test('radio peers with the same name stay synchronized across Custom Element hosts', async () => {
    await mount(
      `<div role="radiogroup" aria-label="Plan">
        <aesir-radio name="plan" value="free" label="Free" group="free"></aesir-radio>
        <aesir-radio name="plan" value="pro" label="Pro" group="free" description="For production"></aesir-radio>
      </div>`
    );
    const [free, pro] = [...document.querySelectorAll('aesir-radio')];
    const onChange = vi.fn();
    pro.addEventListener('change', onChange);

    await page.getByText('For production', { exact: true }).click();

    await expect.element(page.getByRole('radio', { name: 'Free' })).not.toBeChecked();
    await expect.element(page.getByRole('radio', { name: 'Pro' })).toBeChecked();
    expect(free.group).toBe('pro');
    expect(pro.group).toBe('pro');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toEqual({ name: 'plan', value: 'pro' });
  });

  test('readonly selection controls remain focusable and do not change', async () => {
    await mount(`
      <aesir-checkbox label="Terms" checked readonly required name="terms" value="accepted"></aesir-checkbox>
      <aesir-switch label="Alerts" checked readonly name="alerts" value="enabled"></aesir-switch>
      <aesir-radio label="Pro" group="free" value="pro" readonly name="plan"></aesir-radio>
    `);

    for (const [role, name, checked] of [
      ['checkbox', 'Terms', true],
      ['switch', 'Alerts', true],
      ['radio', 'Pro', false]
    ]) {
      const control = page.getByRole(role, { name });
      await page.getByText(name, { exact: true }).click();
      if (checked) await expect.element(control).toBeChecked();
      else await expect.element(control).not.toBeChecked();
      if (role !== 'radio') await expect.element(control).toHaveAttribute('aria-readonly', 'true');
      await expect.element(control).not.toBeDisabled();
    }
    await expect.element(page.getByRole('checkbox', { name: 'Terms' })).toBeRequired();
  });
});
