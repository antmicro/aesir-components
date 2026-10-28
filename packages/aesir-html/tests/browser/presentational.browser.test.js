import '../../dist/aesir-html.min.js';
import { page } from 'vitest/browser';
import { afterEach, describe, expect, test } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());
const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('HTML presentational component contracts', () => {
  test('alert exposes the appropriate live-region role and optional action slot', async () => {
    await mount(
      `<aesir-alert alert-title="Saved" description="Your changes are live" has-action>
        <button slot="action" type="button">Undo</button>
      </aesir-alert>`
    );
    const alert = document.querySelector('aesir-alert');
    await expect.element(page.getByRole('status')).toHaveTextContent('Saved');
    await expect.element(page.getByRole('button', { name: 'Undo' })).toBeInTheDocument();

    alert.variant = 'destructive';
    alert.title = 'Save failed';
    await settle();

    await expect.element(page.getByRole('alert')).toHaveTextContent('Save failed');
  });

  test('progress clamps values and removes determinate semantics while loading', async () => {
    await mount('<aesir-progress label="Upload" value="120" max="80" show-value></aesir-progress>');
    const progress = document.querySelector('aesir-progress');
    const bar = page.getByRole('progressbar', { name: 'Upload' });

    await expect.element(bar).toHaveAttribute('aria-valuenow', '80');
    await expect.element(bar).toHaveAttribute('aria-valuemax', '80');
    progress.indeterminate = true;
    progress.label = 'Loading';
    await settle();

    const loading = page.getByRole('progressbar', { name: 'Loading' });
    await expect.element(loading).not.toHaveAttribute('aria-valuenow');
    await expect.element(loading).not.toHaveAttribute('aria-valuetext');
  });

  test('breadcrumb marks only the final item as the current page', async () => {
    await mount('<aesir-breadcrumb label="Project path"></aesir-breadcrumb>');
    const breadcrumb = document.querySelector('aesir-breadcrumb');
    breadcrumb.items = [{ label: 'Projects', href: '/projects' }, { label: 'Aesir', href: '/projects/aesir' }, { label: 'Settings' }];
    await settle();

    await expect.element(page.getByRole('navigation', { name: 'Project path' })).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    await expect.element(page.getByText('Settings', { exact: true })).toHaveAttribute('aria-current', 'page');
  });
});
