import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AesirSelectionToolbar from '../../src/components/aesir-selection-toolbar/aesir-selection-toolbar.svelte';
import SelectionToolbarActionsFixture from '../fixtures/selection-toolbar-actions-fixture.svelte';
import './setup.js';

test('moves a visible selection toolbar between the portal and inline layout', async () => {
  const rendered = await render(AesirSelectionToolbar, { count: 2, position: 'fixed' });
  const toolbar = page.getByRole('toolbar', { name: 'Selection actions' });

  await expect.element(toolbar).toBeInTheDocument();
  expect(toolbar.element().parentElement).toBe(document.body);

  await rendered.rerender({ count: 2, position: 'inline' });
  expect(toolbar.element().parentElement).not.toBe(document.body);

  await rendered.rerender({ count: 2, position: 'fixed' });
  expect(toolbar.element().parentElement).toBe(document.body);
});

test('keeps an inline selection toolbar inside its narrow container', async () => {
  const rendered = await render(AesirSelectionToolbar, { count: 42, label: 'selected records', position: 'inline', onclear: () => {} });
  rendered.container.style.width = '170px';
  const toolbar = page.getByRole('toolbar', { name: 'Selection actions' });
  await expect.element(toolbar).toBeInTheDocument();

  expect(toolbar.element().getBoundingClientRect().right).toBeLessThanOrEqual(rendered.container.getBoundingClientRect().right);
  expect(toolbar.element().scrollWidth).toBeLessThanOrEqual(toolbar.element().clientWidth);
  expect(page.getByRole('button', { name: 'Clear selection' }).element().getBoundingClientRect().right).toBeLessThanOrEqual(toolbar.element().getBoundingClientRect().right);
});

test('makes an exiting toolbar unavailable while its closing animation runs', async () => {
  const rendered = await render(AesirSelectionToolbar, { count: 2, onclear: () => {} });
  const toolbar = page.getByRole('toolbar', { name: 'Selection actions' });

  await expect.element(toolbar).toHaveAttribute('data-state', 'open');
  const toolbarElement = toolbar.element();
  await rendered.rerender({ count: 0, onclear: () => {} });

  expect(toolbarElement.isConnected).toBe(true);
  expect(toolbarElement.dataset.state).toBe('closed');
  expect(toolbarElement.inert).toBe(true);
  expect(toolbarElement.getAttribute('aria-hidden')).toBe('true');

  await rendered.rerender({ count: 3, onclear: () => {} });
  expect(toolbarElement.isConnected).toBe(true);
  expect(toolbarElement.dataset.state).toBe('open');
  expect(toolbarElement.inert).toBe(false);
  expect(toolbarElement.hasAttribute('aria-hidden')).toBe(false);
});

test('keeps the clear control reachable with several actions on a narrow viewport', async () => {
  await page.viewport(320, 700);
  await render(SelectionToolbarActionsFixture);

  const toolbar = page.getByRole('toolbar', { name: 'Selection actions' }).element();
  const clear = page.getByRole('button', { name: 'Clear selection' }).element();
  const actions = toolbar.querySelector('.aesir-selection-toolbar__actions');
  const toolbarRect = toolbar.getBoundingClientRect();
  const clearRect = clear.getBoundingClientRect();

  expect(toolbarRect.left).toBeGreaterThanOrEqual(0);
  expect(toolbarRect.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
  expect(clearRect.left).toBeGreaterThanOrEqual(toolbarRect.left);
  expect(clearRect.right).toBeLessThanOrEqual(toolbarRect.right);
  expect(actions.querySelectorAll('button')).toHaveLength(8);
  expect(actions.scrollWidth).toBeGreaterThan(actions.clientWidth);

  await page.getByRole('button', { name: 'Archive' }).click();
  await expect.element(page.getByRole('status', { name: 'Last action' })).toHaveTextContent('Archive');
  await page.getByRole('button', { name: 'More' }).click();
  await expect.element(page.getByRole('status', { name: 'Last action' })).toHaveTextContent('More');
});
