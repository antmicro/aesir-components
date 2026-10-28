import '../../dist/aesir-html.min.js';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());
const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('HTML combobox contracts', () => {
  test('autocomplete skips disabled options and publishes the selected item', async () => {
    await mount('<aesir-autocomplete-box label="City"></aesir-autocomplete-box>');
    const autocomplete = document.querySelector('aesir-autocomplete-box');
    autocomplete.options = [
      { label: 'Warsaw', value: 'warsaw' },
      { label: 'Berlin', value: 'berlin', disabled: true },
      { label: 'Prague', value: 'prague' }
    ];
    const onSelect = vi.fn();
    autocomplete.addEventListener('select', onSelect);
    await settle();

    const input = page.getByRole('combobox', { name: 'City' });
    await input.click();
    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(autocomplete.value).toBe('prague');
    expect(autocomplete.query).toBe('Prague');
    expect(autocomplete.open).toBe(false);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0][0].detail).toEqual({ label: 'Prague', value: 'prague' });
  });

  test('tag input adds custom values and removes them through accessible controls', async () => {
    await mount('<aesir-tag-input label="Topics" allow-custom></aesir-tag-input>');
    const tags = document.querySelector('aesir-tag-input');
    tags.value = ['accessibility'];
    tags.options = [{ label: 'Accessibility', value: 'accessibility' }];
    const onChange = vi.fn();
    tags.addEventListener('change', onChange);
    await settle();

    const input = page.getByRole('combobox', { name: 'Topics' });
    await input.fill('Frontend');
    await userEvent.keyboard('{Enter}');

    expect(tags.value).toEqual(['accessibility', 'Frontend']);
    expect(onChange.mock.calls.at(-1)[0].detail).toEqual({ value: ['accessibility', 'Frontend'] });
    await page.getByRole('button', { name: 'Remove Frontend' }).click();
    expect(tags.value).toEqual(['accessibility']);
  });
});
