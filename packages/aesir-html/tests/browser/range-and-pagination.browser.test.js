import '../../dist/aesir-html.min.js';
import { page } from 'vitest/browser';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());

describe('HTML range and pagination contracts', () => {
  test('pagination updates and reflects its page while emitting one change', async () => {
    await mount('<aesir-pagination label="Results" page="2" total-pages="5"></aesir-pagination>');
    const pagination = document.querySelector('aesir-pagination');
    const onChange = vi.fn();
    pagination.addEventListener('pagechange', onChange);

    await page.getByRole('button', { name: 'Next page' }).click();

    expect(pagination.page).toBe(3);
    expect(pagination.getAttribute('page')).toBe('3');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toEqual({ page: 3 });
    expect(onChange.mock.calls[0][0].bubbles).toBe(true);
    expect(onChange.mock.calls[0][0].composed).toBe(true);
    await expect.element(page.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
  });

  test('slider synchronizes native input with the host property and reflected value', async () => {
    await mount('<aesir-slider label="Volume" value="2" min="0" max="10" step="2" show-value></aesir-slider>');
    const slider = document.querySelector('aesir-slider');
    const input = page.getByRole('slider', { name: /Volume/ });

    const nativeInput = input.element();
    nativeInput.value = '8';
    nativeInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    expect(slider.value).toBe(8);
    await expect.poll(() => slider.getAttribute('value')).toBe('8');
    await expect.element(input).toHaveValue('8');
    await expect.element(page.getByText('8', { exact: true })).toBeInTheDocument();
  });
});
