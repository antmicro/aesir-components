import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Fixture from './fixtures/presentational-components-fixture.svelte';

describe('AesirBadge', () => {
  test('renders content and public visual options', () => {
    render(Fixture);
    const badge = screen.getByText('Ready');
    expect(badge.dataset.variant).toBe('success');
    expect(badge.dataset.size).toBe('sm');
    expect(badge.dataset.font).toBe('mono');
  });
});

describe('AesirButtonGroup', () => {
  test('groups controls with the requested orientation and size', () => {
    render(Fixture);
    const group = screen.getByRole('group', { name: 'Actions' });
    expect(group.dataset.orientation).toBe('vertical');
    expect(group.dataset.size).toBe('lg');
    expect(group.querySelectorAll('button')).toHaveLength(2);
  });
});

describe('AesirCard', () => {
  test('renders optional regions only when supplied', () => {
    render(Fixture);
    expect(screen.getByRole('heading', { name: 'Project', level: 2 })).toBeTruthy();
    expect(screen.getByText('Card content')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Card action' })).toBeTruthy();
  });
});

describe('AesirComponentPreview', () => {
  test('forwards embedded and content presentation options', () => {
    render(Fixture);
    const content = screen.getByText('Preview content').parentElement;
    expect(content.classList.contains('consumer-content')).toBe(true);
    expect(content.parentElement.hasAttribute('data-embedded')).toBe(true);
  });
});

describe('AesirField', () => {
  test('connects its label and support text to the slotted control', () => {
    render(Fixture);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.required).toBe(true);
    expect(document.getElementById(input.getAttribute('aria-describedby')).textContent).toBe('Work address');
  });
});

describe('AesirKbd', () => {
  test('renders modifiers and custom key content', () => {
    render(Fixture);
    const key = screen.getByText('K').closest('kbd');
    expect(key.dataset.size).toBe('small');
    expect(key.textContent).toContain('Shift');
  });
});

describe('AesirPill', () => {
  test('renders as a navigable link with its requested size', () => {
    render(Fixture);
    const pill = screen.getByRole('link', { name: 'Active' });
    expect(pill.getAttribute('href')).toBe('/filters');
    expect(pill.dataset.size).toBe('sm');
  });
});

describe('AesirScrollArea', () => {
  test('keeps content in a viewport with the requested overflow axis', () => {
    render(Fixture);
    const area = screen.getByLabelText('Scrollable examples');
    expect(area.dataset.orientation).toBe('horizontal');
    expect(area.querySelector('[data-slot="scroll-area-viewport"]')).toBeTruthy();
  });
});
