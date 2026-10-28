import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import AesirFileUpload from '../src/components/aesir-file-upload/aesir-file-upload.svelte';

test('gives the native file input the visible upload label', () => {
  const { container } = render(AesirFileUpload, { label: 'Design files' });
  const input = container.querySelector('input[type="file"]');
  const visibleLabel = screen.getByText('Design files');

  expect(input.getAttribute('aria-labelledby')).toBe(visibleLabel.id);
  expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('Drag and drop or choose from your device').id);
});

test('replaces a single file and preserves it when the next choice is rejected', async () => {
  const user = userEvent.setup({ applyAccept: false });
  const onselect = vi.fn();
  const onreject = vi.fn();
  const { container } = render(AesirFileUpload, { accept: '.txt', onselect, onreject });
  const input = container.querySelector('input');
  const first = new File(['first'], 'first.txt');
  const second = new File(['second'], 'second.txt');
  const rejected = new File(['bad'], 'bad.png');
  await user.upload(input, first);
  await user.upload(input, second);
  expect(screen.queryByText('first.txt')).toBeNull();
  expect(screen.getByText('second.txt')).toBeTruthy();
  expect(onselect).toHaveBeenLastCalledWith([second]);
  await user.upload(input, rejected);
  expect(screen.getByText('second.txt')).toBeTruthy();
  expect(onreject).toHaveBeenCalledWith([rejected]);
});

test('supports repeated file names, applies capacity, and disables removal', async () => {
  const file = new File(['same'], 'same.txt');
  const onreject = vi.fn();
  const { container, rerender } = render(AesirFileUpload, { multiple: true, maxFiles: 2, onreject });
  const input = container.querySelector('input');
  await fireEvent.change(input, { target: { files: [file, file, file] } });
  expect(screen.getAllByText('same.txt')).toHaveLength(2);
  expect(onreject).toHaveBeenCalledWith([file]);
  await rerender({ files: [file, file], multiple: true, maxFiles: 2, disabled: true, onreject });
  expect(screen.getAllByRole('button', { name: 'Remove same.txt' }).every((button) => button.disabled)).toBe(true);
});

test('ignores drag and drop while disabled', async () => {
  const onselect = vi.fn();
  const onreject = vi.fn();
  const { container } = render(AesirFileUpload, { disabled: true, onselect, onreject });
  const dropzone = screen.getByRole('group', { name: /Upload files/ });
  const file = new File(['content'], 'blocked.txt', { type: 'text/plain' });

  await fireEvent.dragEnter(dropzone, { dataTransfer: { files: [file] } });
  expect(dropzone.classList.contains('dragging')).toBe(false);
  await fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

  expect(onselect).not.toHaveBeenCalled();
  expect(onreject).not.toHaveBeenCalled();
  expect(container.querySelector('input').disabled).toBe(true);
  expect(screen.queryByText('blocked.txt')).toBeNull();
});

test('validates extension rules case-insensitively and enforces max size', async () => {
  const user = userEvent.setup({ applyAccept: false });
  const onselect = vi.fn();
  const onreject = vi.fn();
  const { container } = render(AesirFileUpload, { accept: '.txt', maxSize: 5, multiple: true, onselect, onreject });
  const input = container.querySelector('input');
  const accepted = new File(['12345'], 'NOTES.TXT', { type: 'text/plain' });
  const oversized = new File(['123456'], 'large.txt', { type: 'text/plain' });

  await user.upload(input, [accepted, oversized]);

  expect(onselect).toHaveBeenCalledWith([accepted]);
  expect(onreject).toHaveBeenCalledWith([oversized]);
  expect(screen.getByText('NOTES.TXT')).toBeTruthy();
  expect(screen.queryByText('large.txt')).toBeNull();
});

test('supports wildcard MIME rules and resets drag state after nested leaves', async () => {
  const onselect = vi.fn();
  const { container } = render(AesirFileUpload, { accept: 'image/*', multiple: true, onselect });
  const dropzone = screen.getByRole('group', { name: /Upload files/ });
  const image = new File(['image'], 'photo.webp', { type: 'image/webp' });

  await fireEvent.dragEnter(dropzone);
  await fireEvent.dragEnter(dropzone);
  expect(dropzone.classList.contains('dragging')).toBe(true);
  await fireEvent.dragLeave(dropzone);
  expect(dropzone.classList.contains('dragging')).toBe(true);
  await fireEvent.dragLeave(dropzone);
  expect(dropzone.classList.contains('dragging')).toBe(false);
  await fireEvent.drop(dropzone, { dataTransfer: { files: [image] } });

  expect(onselect).toHaveBeenCalledWith([image]);
  expect(container.querySelector('input').value).toBe('');
});

test('reports rejected files in their incoming order when type and count limits both apply', async () => {
  const onselect = vi.fn();
  const onreject = vi.fn();
  render(AesirFileUpload, { accept: '.txt', multiple: true, maxFiles: 1, onselect, onreject });
  const dropzone = screen.getByRole('group', { name: /Upload files/ });
  const accepted = new File(['a'], 'accepted.txt');
  const overLimit = new File(['b'], 'over-limit.txt');
  const wrongType = new File(['c'], 'wrong-type.png');

  await fireEvent.drop(dropzone, { dataTransfer: { files: [accepted, overLimit, wrongType] } });

  expect(onselect).toHaveBeenCalledWith([accepted]);
  expect(onreject.mock.calls[0][0].map((file) => file.name)).toEqual(['over-limit.txt', 'wrong-type.png']);
});

test('removes only the selected duplicate file entry', async () => {
  const user = userEvent.setup();
  const first = new File(['first'], 'same.txt');
  const second = new File(['second'], 'same.txt');
  render(AesirFileUpload, { files: [first, second], multiple: true });

  await user.click(screen.getAllByRole('button', { name: 'Remove same.txt' })[0]);

  expect(screen.getAllByText('same.txt')).toHaveLength(1);
  expect(screen.getByText('6 B')).toBeTruthy();
});

test('treats a zero-byte maximum as a real limit', async () => {
  const onselect = vi.fn();
  const onreject = vi.fn();
  const { container } = render(AesirFileUpload, { maxSize: 0, onselect, onreject });
  const file = new File(['content'], 'too-large.txt');

  await fireEvent.change(container.querySelector('input'), { target: { files: [file] } });

  expect(onselect).not.toHaveBeenCalled();
  expect(onreject).toHaveBeenCalledWith([file]);
  expect(screen.queryByText('too-large.txt')).toBeNull();
});

test('rejects all dropped files when the single-file capacity is negative', async () => {
  const onselect = vi.fn();
  const onreject = vi.fn();
  render(AesirFileUpload, { maxFiles: -1, onselect, onreject });
  const dropzone = screen.getByRole('group', { name: /Upload files/ });
  const files = [new File(['a'], 'first.txt'), new File(['b'], 'second.txt'), new File(['c'], 'third.txt')];

  await fireEvent.drop(dropzone, { dataTransfer: { files } });

  expect(onselect).not.toHaveBeenCalled();
  expect(onreject).toHaveBeenCalledWith(files);
  expect(screen.queryByText('first.txt')).toBeNull();
  expect(screen.queryByText('second.txt')).toBeNull();
});

test('ignores empty accept entries when a dropped file has no MIME type', async () => {
  const onselect = vi.fn();
  const onreject = vi.fn();
  render(AesirFileUpload, { accept: '.txt,', onselect, onreject });
  const dropzone = screen.getByRole('group', { name: /Upload files/ });
  const file = new File(['content'], 'private.unknown');
  expect(file.type).toBe('');

  await fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

  expect(onselect).not.toHaveBeenCalled();
  expect(onreject).toHaveBeenCalledWith([file]);
  expect(screen.queryByText('private.unknown')).toBeNull();
});

test('clears drag highlighting when disabled while a file is over the dropzone', async () => {
  const { rerender } = render(AesirFileUpload);
  const dropzone = screen.getByRole('group', { name: /Upload files/ });

  await fireEvent.dragEnter(dropzone);
  expect(dropzone.classList.contains('dragging')).toBe(true);

  await rerender({ disabled: true });
  expect(dropzone.classList.contains('dragging')).toBe(false);

  await rerender({ disabled: false });
  expect(dropzone.classList.contains('dragging')).toBe(false);
});

test('restores the initial selection on form reset without calling selection callbacks', async () => {
  const form = document.createElement('form');
  document.body.append(form);
  const initial = new File(['initial'], 'initial.txt');
  const selected = new File(['selected'], 'selected.txt');
  const onselect = vi.fn();
  const onreject = vi.fn();
  const { container, unmount } = render(AesirFileUpload, { target: form, props: { files: [initial], multiple: true, onselect, onreject } });
  try {
    const input = container.querySelector('input[type="file"]');

    await fireEvent.change(input, { target: { files: [selected] } });
    expect(screen.getByText('selected.txt')).toBeTruthy();

    form.reset();

    await waitFor(() => expect(screen.queryByText('selected.txt')).toBeNull());
    expect(screen.getByText('initial.txt')).toBeTruthy();
    expect(onselect).toHaveBeenCalledTimes(1);
    expect(onreject).not.toHaveBeenCalled();
  } finally {
    unmount();
    form.remove();
  }
});

test('ignores dropped files inside a disabled fieldset', async () => {
  const fieldset = document.createElement('fieldset');
  fieldset.disabled = true;
  document.body.append(fieldset);
  const onselect = vi.fn();
  const onreject = vi.fn();
  const file = new File(['content'], 'blocked.txt');
  const { container, unmount } = render(AesirFileUpload, { target: fieldset, props: { onselect, onreject } });
  try {
    expect(container.querySelector('input[type="file"]').matches(':disabled')).toBe(true);
    const dropzone = container.querySelector('.file-upload__dropzone');

    await fireEvent.dragEnter(dropzone);
    expect(dropzone.classList.contains('dragging')).toBe(false);
    await fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(onselect).not.toHaveBeenCalled();
    expect(onreject).not.toHaveBeenCalled();
    expect(screen.queryByText('blocked.txt')).toBeNull();
  } finally {
    unmount();
    fieldset.remove();
  }
});
