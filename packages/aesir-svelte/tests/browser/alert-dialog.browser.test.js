import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import AesirAlertDialog from '../../src/components/aesir-alert-dialog/aesir-alert-dialog.svelte';
import AlertDialogFixture from '../fixtures/alert-dialog-fixture.svelte';

describe('alert dialog', () => {
  test('uses alertdialog semantics and focuses the safe action first', async () => {
    await render(AlertDialogFixture);
    const trigger = page.getByRole('button', { name: 'Delete project' });
    await trigger.click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete project?' });
    await expect.element(dialog).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await expect.element(dialog).toHaveAttribute('aria-describedby');
  });

  test('does not dismiss on Escape or backdrop press; cancel restores focus', async () => {
    await render(AlertDialogFixture);
    const trigger = page.getByRole('button', { name: 'Delete project' });
    await trigger.click();
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('alertdialog')).toBeInTheDocument();
    await page.getByRole('presentation').click({ position: { x: 1, y: 1 } });
    await expect.element(page.getByRole('alertdialog')).toBeInTheDocument();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
    await expect.element(page.getByRole('status', { name: 'Cancellations' })).toHaveTextContent('1');
  });

  test('confirms only on the explicit action', async () => {
    await render(AlertDialogFixture);
    await page.getByRole('button', { name: 'Delete project' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect.element(page.getByRole('status', { name: 'Confirmations', exact: true })).toHaveTextContent('1');
    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('prevents duplicate async confirmation and closes after resolution', async () => {
    await render(AlertDialogFixture);
    await page.getByRole('button', { name: 'Publish project' }).click();
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect.element(page.getByRole('button', { name: 'Working…' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await expect.element(page.getByRole('status', { name: 'Async confirmations' })).toHaveTextContent('1');
    await page.getByRole('button', { name: 'Resolve publish' }).click();
    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
    await expect.element(page.getByRole('status', { name: 'Async confirmations' })).toHaveTextContent('1');
  });

  test('keeps a rejected action open, shows its error, and allows retry', async () => {
    await render(AlertDialogFixture);
    await page.getByRole('button', { name: 'Publish project' }).click();
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByRole('button', { name: 'Reject publish' }).click();
    await expect.element(page.getByRole('alertdialog')).toBeInTheDocument();
    await expect.element(page.getByRole('alert')).toHaveTextContent('Publishing failed.');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect.element(page.getByRole('status', { name: 'Async confirmations' })).toHaveTextContent('2');
    await page.getByRole('button', { name: 'Resolve publish' }).click();
    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('clears a failed action when canceled and reopened', async () => {
    await render(AlertDialogFixture);
    await page.getByRole('button', { name: 'Publish project' }).click();
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByRole('button', { name: 'Reject publish' }).click();
    await expect.element(page.getByRole('alert')).toHaveTextContent('Publishing failed.');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Publish project' }).click();
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  });

  test('updates the visible failure message when errorText changes', async () => {
    let rejectConfirmation;
    const props = {
      open: true,
      title: 'Archive project?',
      description: 'The operation can take a moment.',
      errorText: 'The first failure message.',
      onconfirm: () => new Promise((_, reject) => (rejectConfirmation = reject))
    };
    const rendered = await render(AesirAlertDialog, props);
    await page.getByRole('button', { name: 'Continue' }).click();
    rejectConfirmation(new Error('Request failed'));
    await expect.element(page.getByRole('alert')).toHaveTextContent('The first failure message.');

    await rendered.rerender({ ...props, errorText: 'The updated failure message.' });
    await expect.element(page.getByRole('alert')).toHaveTextContent('The updated failure message.');
  });

  test('does not close a reopened dialog when an earlier confirmation resolves', async () => {
    const resolutions = [];
    const props = {
      open: true,
      title: 'Archive project?',
      description: 'The operation can take a moment.',
      onconfirm: () => new Promise((resolve) => resolutions.push(resolve))
    };
    const rendered = await render(AesirAlertDialog, props);
    await page.getByRole('button', { name: 'Continue' }).click();

    await rendered.rerender({ ...props, open: false });
    await rendered.rerender(props);
    await expect.element(page.getByRole('alertdialog', { name: 'Archive project?' })).toHaveAttribute('data-state', 'open');
    await expect.element(page.getByRole('button', { name: 'Continue' })).toBeEnabled();

    await page.getByRole('button', { name: 'Continue' }).click();
    expect(resolutions).toHaveLength(2);
    resolutions[0]();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect.element(page.getByRole('button', { name: 'Working…' })).toBeDisabled();
    await expect.element(page.getByRole('alertdialog', { name: 'Archive project?' })).toHaveAttribute('data-state', 'open');

    resolutions[1]();
    await expect.element(page.getByRole('alertdialog', { name: 'Archive project?' })).not.toBeInTheDocument();
  });

  test('does not show an error from an earlier session after reopening', async () => {
    let rejectConfirmation;
    const props = {
      open: true,
      title: 'Archive project?',
      description: 'The operation can take a moment.',
      onconfirm: () => new Promise((_, reject) => (rejectConfirmation = reject))
    };
    const rendered = await render(AesirAlertDialog, props);
    await page.getByRole('button', { name: 'Continue' }).click();

    await rendered.rerender({ ...props, open: false });
    await rendered.rerender(props);
    rejectConfirmation(new Error('Earlier operation failed'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    await expect.element(page.getByRole('alertdialog', { name: 'Archive project?' })).toHaveAttribute('data-state', 'open');
    await expect.element(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
    expect(page.getByRole('alert').query()).toBeNull();
  });
});
