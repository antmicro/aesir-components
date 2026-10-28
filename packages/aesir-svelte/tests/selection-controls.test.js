import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import FormControlsFixture from './fixtures/form-controls-fixture.svelte';
import Checkbox from '../src/components/aesir-checkbox/aesir-checkbox.svelte';
import Radio from '../src/components/aesir-radio/aesir-radio.svelte';
import Switch from '../src/components/aesir-switch/aesir-switch.svelte';
import RadioReadonlyFixture from './fixtures/radio-readonly-fixture.svelte';

describe('Aesir selection controls', () => {
  test('binds checkbox state and exposes mixed and disabled semantics', async () => {
    const user = userEvent.setup();
    render(FormControlsFixture);
    const updates = screen.getByRole('checkbox', { name: 'Product updates' });
    const mixed = screen.getByRole('checkbox', { name: 'Partial selection' });
    const disabled = screen.getByRole('checkbox', { name: 'Required policy' });

    await user.click(updates);

    expect(updates.checked).toBe(true);
    expect(updates.closest('.aesir-checkbox').dataset.state).toBe('checked');
    expect(updates.getAttribute('aria-describedby')).toBe(screen.getByText('Receive release notes.').id);
    expect(screen.getByRole('status', { name: 'Updates value' }).textContent).toBe('true');
    expect(mixed.indeterminate).toBe(true);
    expect(mixed.getAttribute('aria-checked')).toBe('mixed');
    expect(mixed.closest('.aesir-checkbox').dataset.state).toBe('indeterminate');
    expect(disabled.checked).toBe(true);
    expect(disabled.hasAttribute('disabled')).toBe(true);
  });

  test('clears mixed semantics when an indeterminate checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(Checkbox, { label: 'Partial selection', indeterminate: true });
    const checkbox = screen.getByRole('checkbox', { name: 'Partial selection' });
    expect(checkbox.indeterminate).toBe(true);

    await user.click(checkbox);

    expect(checkbox.indeterminate).toBe(false);
    expect(checkbox.getAttribute('aria-checked')).toBeNull();
    expect(checkbox.closest('.aesir-checkbox').dataset.state).toBe('checked');
  });

  test('uses native radio grouping and ignores disabled choices', async () => {
    const user = userEvent.setup();
    render(FormControlsFixture);
    const free = screen.getByRole('radio', { name: 'Free' });
    const pro = screen.getByRole('radio', { name: 'Pro' });
    const enterprise = screen.getByRole('radio', { name: 'Enterprise' });

    expect(free.checked).toBe(true);
    await user.click(screen.getByText('For production applications.'));

    expect(free.checked).toBe(false);
    expect(pro.checked).toBe(true);
    expect(pro.closest('.aesir-radio').dataset.state).toBe('checked');
    expect(free.closest('.aesir-radio').dataset.state).toBe('unchecked');
    expect(pro.getAttribute('aria-describedby')).toBe(screen.getByText('For production applications.').id);
    expect(screen.getByRole('status', { name: 'Plan value' }).textContent).toBe('pro');

    await user.click(enterprise);
    expect(enterprise.checked).toBe(false);
    expect(screen.getByRole('status', { name: 'Plan value' }).textContent).toBe('pro');
  });

  test('does not change a bound radio group when a readonly option is clicked', async () => {
    const user = userEvent.setup();
    render(RadioReadonlyFixture);
    const free = screen.getByRole('radio', { name: 'Free' });
    const pro = screen.getByRole('radio', { name: 'Pro' });

    await user.click(screen.getByText('Pro'));

    expect([free.checked, pro.checked, screen.getByRole('status', { name: 'Plan value' }).textContent]).toEqual([true, false, 'free']);
    expect(new FormData(screen.getByRole('form', { name: 'Plan form' })).get('plan')).toBe('free');

    await user.click(pro);
    expect([free.checked, pro.checked, screen.getByRole('status', { name: 'Plan value' }).textContent]).toEqual([true, false, 'free']);
  });

  test('toggles switches from pointer and keyboard input without changing disabled switches', async () => {
    const user = userEvent.setup();
    render(FormControlsFixture);
    const alerts = screen.getByRole('switch', { name: 'Incident alerts' });
    const security = screen.getByRole('switch', { name: 'Security notifications' });

    await user.click(alerts);
    expect(alerts.checked).toBe(true);
    expect(alerts.closest('.aesir-switch').dataset.state).toBe('checked');
    expect(alerts.getAttribute('aria-describedby')).toBe(screen.getByText('Notify the on-call team.').id);
    expect(screen.getByRole('status', { name: 'Alerts value' }).textContent).toBe('true');

    alerts.focus();
    await user.keyboard(' ');
    expect(alerts.checked).toBe(false);
    expect(alerts.closest('.aesir-switch').dataset.state).toBe('unchecked');
    expect(screen.getByRole('status', { name: 'Alerts value' }).textContent).toBe('false');

    await user.click(security);
    expect(security.checked).toBe(true);
    expect(security.hasAttribute('disabled')).toBe(true);
  });

  test.each([
    ['checkbox', Checkbox, { label: 'Readonly checkbox', checked: true }],
    ['radio', Radio, { label: 'Readonly radio', value: 'pro', group: 'free' }],
    ['switch', Switch, { label: 'Readonly switch', checked: true }]
  ])('keeps a readonly %s focusable without allowing its value to change', async (role, Component, props) => {
    const user = userEvent.setup();
    render(Component, { ...props, readonly: true });
    const control = screen.getByRole(role, { name: props.label });
    const before = control.checked;

    await user.click(control);
    control.focus();
    await user.keyboard(' ');

    expect(control.checked).toBe(before);
    expect(control.disabled).toBe(false);
    if (role !== 'radio') expect(control.getAttribute('aria-readonly')).toBe('true');
  });

  test('forwards native form validation attributes', () => {
    render(Checkbox, { label: 'Consent', name: 'consent', value: 'yes', required: true, form: 'settings' });
    const control = screen.getByRole('checkbox', { name: 'Consent' });

    expect(control.required).toBe(true);
    expect(control.name).toBe('consent');
    expect(control.value).toBe('yes');
    expect(control.getAttribute('form')).toBe('settings');
  });
});
