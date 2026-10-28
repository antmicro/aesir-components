import { render } from 'vitest-browser-svelte';
import { expect, test, vi } from 'vitest';
import FileUpload from '../../src/components/aesir-file-upload/aesir-file-upload.svelte';

test('clears a pending file choice that arrives after the upload is disabled', async () => {
  const onselect = vi.fn();
  const rendered = await render(FileUpload, { onselect });
  const file = new File(['content'], 'notes.txt', { type: 'text/plain' });

  await rendered.rerender({ disabled: true, onselect });
  let input = document.querySelector('.file-upload__input');
  expect(input.disabled).toBe(true);
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  expect(input.value).not.toBe('');

  input.dispatchEvent(new Event('change', { bubbles: true }));

  expect(onselect).not.toHaveBeenCalled();
  expect(input.value).toBe('');

  await rendered.rerender({ disabled: false, onselect });
  input = document.querySelector('.file-upload__input');
  expect(input.disabled).toBe(false);
  const retry = new DataTransfer();
  retry.items.add(file);
  input.files = retry.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  expect(onselect).toHaveBeenCalledWith([file]);
  expect(input.value).toBe('');
});

test('reports mixed drop rejections in the order provided by the browser', async () => {
  const onreject = vi.fn();
  await render(FileUpload, { accept: '.txt', multiple: true, maxFiles: 1, onreject });
  const dropzone = document.querySelector('.file-upload__dropzone');
  const transfer = new DataTransfer();
  transfer.items.add(new File(['a'], 'accepted.txt'));
  transfer.items.add(new File(['b'], 'over-limit.txt'));
  transfer.items.add(new File(['c'], 'wrong-type.png'));

  dropzone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));

  expect(onreject.mock.calls[0][0].map((file) => file.name)).toEqual(['over-limit.txt', 'wrong-type.png']);
});

test('highlights the dropzone for files but not for dragged text', async () => {
  await render(FileUpload);
  const dropzone = document.querySelector('.file-upload__dropzone');
  const textTransfer = new DataTransfer();
  textTransfer.setData('text/plain', 'a selection');

  dropzone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: textTransfer }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(dropzone.classList.contains('dragging')).toBe(false);
  const textOver = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: textTransfer });
  dropzone.dispatchEvent(textOver);
  expect(textOver.defaultPrevented).toBe(false);

  const fileTransfer = new DataTransfer();
  fileTransfer.items.add(new File(['content'], 'notes.txt'));
  dropzone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: fileTransfer }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(dropzone.classList.contains('dragging')).toBe(true);
  const fileOver = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: fileTransfer });
  dropzone.dispatchEvent(fileOver);
  expect(fileOver.defaultPrevented).toBe(true);
});

test('keeps the browse button inside a narrow upload with long copy', async () => {
  await render(FileUpload, {
    label: 'UnbreakableLongFileUploadLabelForMobileLayouts',
    description: 'UnbreakableLongDescriptionForAcceptedFileTypes'
  });
  const root = document.querySelector('.file-upload');
  root.style.width = '220px';
  const button = root.querySelector('.file-upload__button');

  expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right + 0.5);
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
});

test('fills a centered flex preview without collapsing its copy or button', async () => {
  const preview = document.createElement('div');
  preview.style.cssText = 'display:flex;justify-content:center;width:640px';
  document.body.append(preview);

  try {
    await render(FileUpload, { target: preview, props: { description: 'PNG, JPG, or PDF up to 5 MB' } });
    const root = preview.querySelector('.file-upload');
    const button = root.querySelector('.file-upload__button');

    expect(root.getBoundingClientRect().width).toBeGreaterThanOrEqual(600);
    expect(button.getBoundingClientRect().height).toBeLessThan(60);

    preview.style.width = '320px';
    expect(root.getBoundingClientRect().width).toBeGreaterThanOrEqual(300);
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  } finally {
    preview.remove();
  }
});

test('shows the disabled appearance inside a dynamically disabled fieldset', async () => {
  await render(FileUpload);
  const root = document.querySelector('.file-upload');
  const fieldset = document.createElement('fieldset');
  document.body.append(fieldset);
  fieldset.append(root);
  const input = root.querySelector('.file-upload__input');
  const dropzone = root.querySelector('.file-upload__dropzone');

  try {
    expect(input.matches(':disabled')).toBe(false);
    expect(getComputedStyle(dropzone).opacity).toBe('1');

    fieldset.disabled = true;
    expect(input.matches(':disabled')).toBe(true);
    expect(getComputedStyle(dropzone).opacity).toBe('0.5');

    fieldset.disabled = false;
    expect(input.matches(':disabled')).toBe(false);
    expect(getComputedStyle(dropzone).opacity).toBe('1');
  } finally {
    fieldset.remove();
  }
});
