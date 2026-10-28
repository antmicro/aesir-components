import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import FormControlsFixture from './fixtures/form-controls-fixture.svelte';
import Input from '../src/components/aesir-input/aesir-input.svelte';
import Textarea from '../src/components/aesir-textarea/aesir-textarea.svelte';
import NativeSelect from '../src/components/aesir-native-select/aesir-native-select.svelte';

describe('Aesir form fields', () => {
  test.each([Input, Textarea])('keeps label-positioned errors when the field uses an accessible name without a visible label', (component) => {
    render(component, { 'aria-label': 'Name', error: 'Name is required', errorPlacement: 'label' });
    const field = screen.getByRole('textbox', { name: 'Name' });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(field.getAttribute('aria-describedby'))?.textContent).toBe('Name is required');
  });
  test('binds text values and connects descriptions and errors', async () => {
    const user = userEvent.setup();
    render(FormControlsFixture);
    const name = screen.getByRole('textbox', { name: 'Project name' });
    const repository = screen.getByRole('textbox', { name: 'Repository' });

    await user.type(name, 'Aesir');

    expect(screen.getByRole('status', { name: 'Name value' }).textContent).toBe('Aesir');
    expect(name.hasAttribute('required')).toBe(true);
    expect(name.getAttribute('aria-describedby')).toBe(screen.getByText('Shown to workspace members.').id);
    expect(repository.getAttribute('aria-invalid')).toBe('true');
    expect(repository.getAttribute('aria-describedby').split(' ')).toEqual(expect.arrayContaining(['repository-help', screen.getByText('Use a full URL.').id]));
  });

  test('keeps number steppers within bounds and returns focus to the input', async () => {
    const user = userEvent.setup();
    render(FormControlsFixture);
    const input = screen.getByRole('spinbutton', { name: 'Replicas' });
    const decrease = screen.getByRole('button', { name: 'Decrease Replicas' });
    const increase = screen.getByRole('button', { name: 'Increase Replicas' });

    expect(decrease.hasAttribute('disabled')).toBe(true);
    await user.click(increase);

    expect(screen.getByRole('status', { name: 'Replica value' }).textContent).toBe('2');
    expect(increase.hasAttribute('disabled')).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  test('does not expose stepper actions for a readonly number input', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Input, { type: 'number', label: 'Read-only seats', value: 3, min: 1, max: 5, readonly: true });
    const input = screen.getByRole('spinbutton', { name: 'Read-only seats' });
    const decrease = screen.getByRole('button', { name: 'Decrease Read-only seats' });
    const increase = screen.getByRole('button', { name: 'Increase Read-only seats' });

    expect(input.readOnly).toBe(true);
    expect(decrease.disabled).toBe(true);
    expect(increase.disabled).toBe(true);
    await user.click(increase);
    expect(input.value).toBe('3');

    await rerender({ type: 'number', label: 'Read-only seats', value: 3, min: 1, max: 5, readonly: false });
    expect(input.readOnly).toBe(false);
    expect(increase.disabled).toBe(false);
    await user.click(increase);
    expect(input.value).toBe('4');
  });

  test('binds textarea content, reports its count, and auto-resizes', async () => {
    const user = userEvent.setup();
    render(FormControlsFixture);
    const textarea = screen.getByRole('textbox', { name: 'Notes' });

    await user.type(textarea, 'Release');

    expect(screen.getByRole('status', { name: 'Notes value' }).textContent).toBe('Release');
    expect(screen.getByText('7/ 12')).toBeTruthy();
    expect(textarea.style.height).toBe('40px');
    expect(textarea.getAttribute('aria-describedby')).toBe(screen.getByText('Short release notes.').id);
  });

  test('shows a zero-character limit in the textarea counter', () => {
    render(Textarea, { label: 'Locked note', value: '', maxlength: 0, showCount: true });
    expect(screen.getByRole('textbox', { name: 'Locked note' }).maxLength).toBe(0);
    expect(screen.getByText('0/ 0')).toBeTruthy();
  });

  test('binds native select values while preserving native option state', async () => {
    const user = userEvent.setup();
    render(FormControlsFixture);
    const select = screen.getByRole('combobox', { name: 'Deployment region' });

    expect(select.value).toBe('');
    expect(select.hasAttribute('required')).toBe(true);
    expect(select.getAttribute('aria-describedby')).toBe(screen.getByText('Choose the closest region.').id);
    expect(screen.getByRole('option', { name: 'Legacy' }).disabled).toBe(true);

    await user.selectOptions(select, 'eu');
    expect(screen.getByRole('status', { name: 'Region value' }).textContent).toBe('eu');
  });

  test('keeps a native selection when option order changes', async () => {
    const first = { value: 'a', label: 'Alpha' };
    const second = { value: 'b', label: 'Beta' };
    const { rerender } = render(NativeSelect, { label: 'Choice', value: 'b', options: [first, second] });
    const select = screen.getByRole('combobox', { name: 'Choice' });

    expect(select.value).toBe('b');
    await rerender({ label: 'Choice', value: 'b', options: [second, first] });

    expect(select.value).toBe('b');
    expect(select.selectedOptions[0].textContent).toBe('Beta');
  });
});
