import '../../dist/aesir-html.min.js';
import { page } from 'vitest/browser';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());

describe('HTML date and upload contracts', () => {
  test('date picker enforces limits and reflects a selected date', async () => {
    await mount('<aesir-date-picker label="Release date" value="2026-09-15" min="2026-09-10" max="2026-09-20"></aesir-date-picker>');
    const picker = document.querySelector('aesir-date-picker');
    const onSelect = vi.fn();
    picker.addEventListener('select', onSelect);

    const trigger = page.getByRole('button', { name: /Release date/ });
    await trigger.click();
    await expect.element(page.getByRole('button', { name: 'Wednesday, September 9, 2026' })).toBeDisabled();
    await page.getByRole('button', { name: 'Wednesday, September 16, 2026' }).click();

    expect(picker.value).toBe('2026-09-16');
    expect(picker.open).toBe(false);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0][0].detail).toBe('2026-09-16');
  });

  test('file upload accepts valid files, rejects invalid files, and preserves its selection', async () => {
    await mount('<aesir-file-upload label="Documents" accept=".txt"></aesir-file-upload>');
    const upload = document.querySelector('aesir-file-upload');
    const input = upload.shadowRoot.querySelector('input[type="file"]');
    const onSelect = vi.fn();
    const onReject = vi.fn();
    upload.addEventListener('select', onSelect);
    upload.addEventListener('reject', onReject);

    const valid = new File(['notes'], 'notes.txt', { type: 'text/plain' });
    const validTransfer = new DataTransfer();
    validTransfer.items.add(valid);
    Object.defineProperty(input, 'files', { configurable: true, value: validTransfer.files });
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await expect.element(page.getByText('notes.txt', { exact: true })).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledOnce();

    const invalid = new File(['image'], 'image.png', { type: 'image/png' });
    const invalidTransfer = new DataTransfer();
    invalidTransfer.items.add(invalid);
    Object.defineProperty(input, 'files', { configurable: true, value: invalidTransfer.files });
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    expect(onReject).toHaveBeenCalledOnce();
    await expect.element(page.getByText('notes.txt', { exact: true })).toBeInTheDocument();
  });
});
