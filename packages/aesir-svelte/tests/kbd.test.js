import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Fixture from './fixtures/kbd-fixture.svelte';

afterEach(() => vi.restoreAllMocks());

describe('AesirKbd', () => {
  test('gives Apple modifier glyphs readable names without exposing the glyphs twice', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    render(Fixture);

    const kbd = screen.getByText('K').closest('kbd');
    for (const [glyph, label] of [
      ['⌥', 'Option'],
      ['⇧', 'Shift'],
      ['⌘', 'Command']
    ]) {
      expect([...kbd.querySelectorAll('[aria-hidden="true"]')].some((element) => element.textContent === glyph)).toBe(true);
      expect([...kbd.querySelectorAll('.aesir-kbd__sr-only')].some((element) => element.textContent === label)).toBe(true);
    }

    const spoken = kbd.cloneNode(true);
    spoken.querySelectorAll('[aria-hidden="true"]').forEach((element) => element.remove());
    expect(spoken.textContent.replace(/\s+/g, ' ').trim()).toBe('Ctrl + Option + Shift + Command + K');
  });

  test('keeps readable modifier text visible on non-Apple platforms', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Linux x86_64');
    render(Fixture);

    const kbd = screen.getByText('K').closest('kbd');
    expect([...kbd.children].filter((element) => !element.classList.contains('aesir-kbd__sr-only')).map((element) => element.textContent)).toEqual(['Ctrl', 'Alt', 'Shift', 'Ctrl', 'K']);
    expect(kbd.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });
});
