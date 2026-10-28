import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import Input from '../src/components/aesir-input/aesir-input.svelte';
import DatePicker from '../src/components/aesir-date-picker/aesir-date-picker.svelte';
import FormIntegrationFixture from './fixtures/form-integration-fixture.svelte';

describe('native form and identity contracts', () => {
  test('submits current public control values through FormData', async () => {
    const user = userEvent.setup();
    render(FormIntegrationFixture);
    const form = screen.getByRole('form', { name: 'Component form' });

    await user.clear(screen.getByRole('textbox', { name: 'Project' }));
    await user.type(screen.getByRole('textbox', { name: 'Project' }), 'Example project');
    await user.click(screen.getByRole('checkbox', { name: 'Updates' }));
    await user.click(screen.getByRole('radio', { name: 'Pro' }));
    await user.click(screen.getByRole('switch', { name: 'Alerts' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Region' }), 'us');
    await user.click(screen.getByRole('button', { name: 'Increase seats' }));

    expect(Object.fromEntries(new FormData(form))).toEqual({ project: 'Example project', updates: 'yes', plan: 'pro', alerts: 'enabled', region: 'us', seats: '3' });
  });

  test('native form reset restores control defaults', async () => {
    const user = userEvent.setup();
    render(FormIntegrationFixture);
    const form = screen.getByRole('form', { name: 'Component form' });

    await user.clear(screen.getByRole('textbox', { name: 'Project' }));
    await user.type(screen.getByRole('textbox', { name: 'Project' }), 'Changed');
    await user.click(screen.getByRole('checkbox', { name: 'Updates' }));
    await user.click(screen.getByRole('radio', { name: 'Pro' }));
    await user.click(screen.getByRole('button', { name: 'Reset form' }));

    await waitFor(() => expect(Object.fromEntries(new FormData(form))).toEqual({ project: 'Aesir', plan: 'free', region: 'eu', seats: '2' }));
  });

  test('canceling a native form reset preserves edited control values', async () => {
    const user = userEvent.setup();
    render(FormIntegrationFixture);
    const form = screen.getByRole('form', { name: 'Component form' });
    const project = screen.getByRole('textbox', { name: 'Project' });
    const alerts = screen.getByRole('switch', { name: 'Alerts' });

    await user.clear(project);
    await user.type(project, 'Changed');
    await user.click(alerts);
    form.addEventListener('reset', (event) => event.preventDefault());

    await user.click(screen.getByRole('button', { name: 'Reset form' }));
    await Promise.resolve();

    expect(project.value).toBe('Changed');
    expect(alerts.checked).toBe(true);
    expect(Object.fromEntries(new FormData(form))).toMatchObject({ project: 'Changed', alerts: 'enabled' });
  });

  test('generates independent label and popup relationships for multiple instances', async () => {
    const firstInput = render(Input, { label: 'First input', description: 'First description' });
    const secondInput = render(Input, { label: 'Second input', description: 'Second description' });
    const first = screen.getByRole('textbox', { name: 'First input' });
    const second = screen.getByRole('textbox', { name: 'Second input' });

    expect(first.id).not.toBe(second.id);
    expect(first.getAttribute('aria-describedby')).not.toBe(second.getAttribute('aria-describedby'));
    firstInput.unmount();
    secondInput.unmount();

    render(DatePicker, { label: 'First date' });
    render(DatePicker, { label: 'Second date' });
    const firstDate = screen.getByRole('button', { name: 'First date' });
    const secondDate = screen.getByRole('button', { name: 'Second date' });
    expect(firstDate.getAttribute('aria-controls')).not.toBe(secondDate.getAttribute('aria-controls'));
  });
});
