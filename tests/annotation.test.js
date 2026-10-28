import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Annotation from '../src/components/aesir-annotation/aesir-annotation.svelte';

describe('AesirAnnotation', () => {
  test('opens a comment thread and submits a reply with the entered text', async () => {
    const user = userEvent.setup();
    const onactivate = vi.fn();
    const onreply = vi.fn();
    render(Annotation, { author: { name: 'Ada', fallback: 'A' }, text: 'Please clarify this.', active: true, onactivate, onreply });
    await user.click(screen.getByRole('button', { name: 'Reply to comment' }));
    expect(onactivate).toHaveBeenCalledWith(true);
    const reply = screen.getByRole('textbox', { name: 'Reply to thread' });
    await user.type(reply, 'Updated.');
    await user.click(screen.getByRole('button', { name: 'Reply' }));
    expect(onreply).toHaveBeenCalledWith('Updated.');
    expect(reply.value).toBe('');
  });

  test('does not submit an empty or whitespace-only reply', async () => {
    const user = userEvent.setup();
    const onreply = vi.fn();
    render(Annotation, { author: { name: 'Ada' }, text: 'Please clarify this.', active: true, onreply });
    const reply = screen.getByRole('textbox', { name: 'Reply to thread' });

    await user.click(reply);
    const button = screen.getByRole('button', { name: 'Reply' });
    expect(button.disabled).toBe(true);

    await user.type(reply, '   ');
    expect(button.disabled).toBe(true);
    await fireEvent.submit(reply.closest('form'));
    expect(onreply).not.toHaveBeenCalled();
  });

  test('keeps an edit attached to its message when the thread is reordered', async () => {
    const user = userEvent.setup();
    const onedit = vi.fn();
    const first = { author: { name: 'Ada' }, text: 'First comment', editable: true };
    const second = { author: { name: 'Bob' }, text: 'Second comment', editable: true };
    const props = { author: first.author, messages: [first, second], active: true, onedit };
    const { rerender } = render(Annotation, props);

    await user.click(screen.getAllByRole('button', { name: 'Comment actions' })[0]);
    await user.click(screen.getByRole('menuitem', { name: 'Edit comment' }));
    let editor = screen.getByRole('textbox', { name: 'Edit comment' });
    expect(editor.closest('.aesir-annotation__message')?.textContent).toContain('Ada');

    await rerender({ ...props, messages: [second, first] });
    editor = screen.getByRole('textbox', { name: 'Edit comment' });
    expect(editor.closest('.aesir-annotation__message')?.textContent).toContain('Ada');
    await user.clear(editor);
    await user.type(editor, 'Updated first comment');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onedit).toHaveBeenCalledWith(1, 'Updated first comment');
  });
});
