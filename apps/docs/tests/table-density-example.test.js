import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';

let component;
let target;
const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');

beforeEach(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(() => callback(performance.now()), 0));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  target = document.createElement('div');
  document.body.append(target);
  const { default: TableDensityExample } = await import('../src/lib/components/docs/examples/table-density-example.svelte');
  component = mount(TableDensityExample, { target });
  await tick();
});

afterEach(async () => {
  if (component) await unmount(component);
  target?.remove();
  if (originalScrollIntoView) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  vi.unstubAllGlobals();
});

test('density preview offers five distinct sizes and updates the table live', async () => {
  const table = target.querySelector('.aesir-table-wrap');
  const picker = target.querySelector('[role="combobox"]');
  expect(table.dataset.density).toBe('lg');

  picker.click();
  await tick();
  expect(document.querySelectorAll('[role="option"]')).toHaveLength(5);

  for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
    if (!document.querySelector('[role="listbox"]')) {
      picker.click();
      await tick();
    }
    const option = [...document.querySelectorAll('[role="option"]')].find((node) => node.textContent.trim().startsWith(size.toUpperCase()));
    expect(option).toBeTruthy();
    option.click();
    await tick();
    expect(table.dataset.density).toBe(size);
  }
});
