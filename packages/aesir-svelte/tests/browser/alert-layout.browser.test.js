import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import Alert from '../../src/components/aesir-alert/aesir-alert.svelte';
import { applyTheme } from './setup.js';

test('contains an unbroken alert message in a narrow container', async () => {
  applyTheme('light');
  const rendered = await render(Alert, { title: 'Upload failed', description: 'UnbrokenErrorIdentifier'.repeat(10), icon: 'triangle-alert' });
  const alert = document.querySelector('.aesir-alert');
  alert.style.width = '240px';

  expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth);
  expect(alert.querySelector('.aesir-alert__description').scrollWidth).toBeLessThanOrEqual(alert.querySelector('.aesir-alert__description').clientWidth);

  await rendered.rerender({ title: 'UnbrokenErrorIdentifier'.repeat(10), description: 'Try again later', icon: 'triangle-alert' });
  expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth);
  expect(alert.querySelector('.aesir-alert__title').scrollWidth).toBeLessThanOrEqual(alert.querySelector('.aesir-alert__title').clientWidth);
});
