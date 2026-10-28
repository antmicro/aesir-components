import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Progress from '../../src/components/aesir-progress/aesir-progress.svelte';

test('keeps the track inside a narrow container when the label grows', async () => {
  const props = { value: 40, label: 'Upload', showValue: true, style: 'width: 96px' };
  const rendered = await render(Progress, props);
  const track = page.getByRole('progressbar').element();
  const root = track.closest('.aesir-progress');

  await rendered.rerender({ ...props, label: 'UploadingAnUnbreakableArchiveFilename' });

  expect(track.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right + 0.5);
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
});
