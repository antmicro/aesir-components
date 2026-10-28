import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Avatar from '../src/components/aesir-avatar/aesir-avatar.svelte';

describe('AesirAvatar', () => {
  test('uses accessible image semantics and falls back when the image fails', async () => {
    render(Avatar, { src: '/missing.png', alt: 'Ada Lovelace', fallback: 'AL', size: 'lg' });
    const avatar = screen.getByRole('img', { name: 'Ada Lovelace' });
    const image = avatar.querySelector('img');
    expect(image.getAttribute('width')).toBe('48');
    await fireEvent.error(image);
    expect(screen.getByText('AL')).toBeTruthy();
    expect(avatar.hasAttribute('data-gradient')).toBe(false);
  });

  test('creates a stable gradient from the accessible fallback identity', () => {
    const { container } = render(Avatar, { fallback: 'JM', 'aria-label': 'Jakub Mieloch', size: 'xs', gradient: true });
    const avatar = container.querySelector('.aesir-avatar');

    expect(avatar.dataset.size).toBe('xs');
    expect(avatar.hasAttribute('data-gradient')).toBe(true);
    expect(avatar.style.getPropertyValue('--aesir-avatar-gradient-start')).toMatch(/^hsl\(/);
    expect(avatar.style.getPropertyValue('--aesir-avatar-gradient-end')).toMatch(/^hsl\(/);
    expect(screen.queryByText('JM')).toBeNull();
  });

  test('keeps initials as the default fallback', () => {
    const { container } = render(Avatar, { fallback: 'JM' });
    expect(container.querySelector('.aesir-avatar').hasAttribute('data-gradient')).toBe(false);
    expect(screen.getByText('JM')).toBeTruthy();
  });

  test('uses a fallback as its accessible identity when no label is provided', async () => {
    const { rerender } = render(Avatar, { fallback: 'JM' });
    expect(screen.getByRole('img', { name: 'JM' })).toBeTruthy();

    await rerender({ fallback: 'AL', gradient: true });
    expect(screen.getByRole('img', { name: 'AL' })).toBeTruthy();
  });

  test('supports the compact 2xs size', () => {
    const { container } = render(Avatar, { fallback: 'JM', size: '2xs' });
    expect(container.querySelector('.aesir-avatar').dataset.size).toBe('2xs');
  });

  test('retries a new source after a previous image fails', async () => {
    const { rerender } = render(Avatar, { src: '/broken.png', alt: 'Ada', fallback: 'AL' });
    await fireEvent.error(screen.getByRole('img', { name: 'Ada' }).querySelector('img'));
    expect(screen.getByText('AL')).toBeTruthy();

    await rerender({ src: '/working.png', alt: 'Ada', fallback: 'AL' });
    const image = screen.getByRole('img', { name: 'Ada' }).querySelector('img');
    expect(image.getAttribute('src')).toBe('/working.png');
    await fireEvent.load(image);
    expect(screen.queryByText('AL')).toBeNull();
  });

  test('retries a failed source when it is selected again later', async () => {
    const { rerender } = render(Avatar, { src: '/retry.png', alt: 'Ada', fallback: 'AL' });
    const avatar = screen.getByRole('img', { name: 'Ada' });
    await fireEvent.error(avatar.querySelector('img'));
    expect(avatar.querySelector('img')?.hasAttribute('data-loaded')).toBe(false);

    await rerender({ src: '/other.png', alt: 'Ada', fallback: 'AL' });
    await rerender({ src: '/retry.png', alt: 'Ada', fallback: 'AL' });

    const retriedImage = avatar.querySelector('img');
    expect(retriedImage?.getAttribute('src')).toBe('/retry.png');
    expect(screen.getByText('AL')).toBeTruthy();
    await fireEvent.load(retriedImage);
    expect(screen.queryByText('AL')).toBeNull();
  });

  test('ignores a late load event from a previous source', async () => {
    const { rerender } = render(Avatar, { src: '/first.png', alt: 'Ada', fallback: 'AL' });
    const avatar = screen.getByRole('img', { name: 'Ada' });
    const firstImage = avatar.querySelector('img');

    await rerender({ src: '/second.png', alt: 'Ada', fallback: 'AL' });
    await fireEvent.load(firstImage);

    expect(avatar.querySelector('img')?.getAttribute('src')).toBe('/second.png');
    expect(avatar.querySelector('img')?.hasAttribute('data-loaded')).toBe(false);
    expect(screen.getByText('AL')).toBeTruthy();
  });

  test('ignores a late error event from a previous source', async () => {
    const { rerender } = render(Avatar, { src: '/first.png', alt: 'Ada', fallback: 'AL' });
    const avatar = screen.getByRole('img', { name: 'Ada' });
    const firstImage = avatar.querySelector('img');

    await rerender({ src: '/second.png', alt: 'Ada', fallback: 'AL' });
    await fireEvent.error(firstImage);

    expect(avatar.querySelector('img')?.getAttribute('src')).toBe('/second.png');
    expect(screen.getByText('AL')).toBeTruthy();
  });

  test('does not treat an old load as the current request when a source repeats', async () => {
    const { rerender } = render(Avatar, { src: '/first.png', alt: 'Ada', fallback: 'AL' });
    const avatar = screen.getByRole('img', { name: 'Ada' });
    const firstRequest = avatar.querySelector('img');

    await rerender({ src: '/second.png', alt: 'Ada', fallback: 'AL' });
    await rerender({ src: '/first.png', alt: 'Ada', fallback: 'AL' });
    await fireEvent.load(firstRequest);

    expect(avatar.querySelector('img')?.hasAttribute('data-loaded')).toBe(false);
    expect(screen.getByText('AL')).toBeTruthy();
  });

  test('shows the fallback again when returning to a previously loaded source', async () => {
    const { rerender } = render(Avatar, { src: '/first.png', alt: 'Ada', fallback: 'AL' });
    const avatar = screen.getByRole('img', { name: 'Ada' });
    await fireEvent.load(avatar.querySelector('img'));
    expect(screen.queryByText('AL')).toBeNull();

    await rerender({ src: '/second.png', alt: 'Ada', fallback: 'AL' });
    await rerender({ src: '/first.png', alt: 'Ada', fallback: 'AL' });
    expect(screen.getByText('AL')).toBeTruthy();

    await fireEvent.load(avatar.querySelector('img'));
    expect(screen.queryByText('AL')).toBeNull();
  });

  test('uses an image that completed before its load handler was attached', async () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockImplementation(function () {
      return this.getAttribute('src') === '/cached.png';
    });
    const naturalWidth = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockImplementation(function () {
      return this.getAttribute('src') === '/cached.png' ? 32 : 0;
    });

    try {
      const { rerender } = render(Avatar, { src: '/pending.png', alt: 'Ada', fallback: 'AL' });
      expect(screen.getByText('AL')).toBeTruthy();

      await rerender({ src: '/cached.png', alt: 'Ada', fallback: 'AL' });

      const image = screen.getByRole('img', { name: 'Ada' }).querySelector('img');
      expect(image?.getAttribute('src')).toBe('/cached.png');
      expect(image?.hasAttribute('data-loaded')).toBe(true);
      expect(screen.queryByText('AL')).toBeNull();
    } finally {
      complete.mockRestore();
      naturalWidth.mockRestore();
    }
  });
});
