import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { portal } from '../src/components/overlay/overlay.js';
import PortalFixture from './fixtures/portal-fixture.svelte';

describe('AesirPortal', () => {
  test('moves content to the configured target and reacts to target changes', async () => {
    const user = userEvent.setup();
    render(PortalFixture);

    const content = screen.getByText('Portalled content');
    await waitFor(() => expect(content.parentElement?.parentElement).toBe(screen.getByTestId('first-target')));

    await user.click(screen.getByRole('button', { name: 'Change target' }));
    expect(content.parentElement?.parentElement).toBe(screen.getByTestId('second-target'));
  });

  test('restores content to its original location when disabled', async () => {
    const user = userEvent.setup();
    render(PortalFixture);

    const content = screen.getByText('Portalled content');
    await waitFor(() => expect(content.parentElement?.parentElement).toBe(screen.getByTestId('first-target')));

    await user.click(screen.getByRole('button', { name: 'Toggle portal' }));
    expect(content.parentElement?.parentElement).toBe(screen.getByTestId('origin'));
  });

  test('resolves selector targets and the default target in the origin shadow root after target changes', async () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const origin = document.createElement('div');
    const content = document.createElement('span');
    const firstTarget = document.createElement('div');
    const secondTarget = document.createElement('div');
    const externalTarget = document.createElement('div');
    firstTarget.id = 'first-shadow-target';
    secondTarget.id = 'second-shadow-target';
    externalTarget.id = 'external-target';
    origin.append(content);
    shadow.append(origin, firstTarget, secondTarget);
    document.body.append(host, externalTarget);

    const action = portal(content, { to: '#first-shadow-target' });
    try {
      await waitFor(() => expect(content.parentElement).toBe(firstTarget));
      action.update({ to: '#second-shadow-target' });
      expect(content.parentElement).toBe(secondTarget);
      action.update({ to: '#external-target' });
      expect(content.parentElement).toBe(externalTarget);
      action.update({ to: '#missing-shadow-target' });
      expect(content.parentNode).toBe(shadow);
      action.update({});
      expect(content.parentNode).toBe(shadow);
    } finally {
      action.destroy();
      host.remove();
      externalTarget.remove();
    }
  });

  test('restores the original sibling position when disabled after targeting the origin parent', async () => {
    const origin = document.createElement('div');
    const before = document.createElement('span');
    const content = document.createElement('span');
    const after = document.createElement('span');
    const externalTarget = document.createElement('div');
    origin.append(before, content, after);
    document.body.append(origin, externalTarget);

    const action = portal(content, { to: externalTarget });
    try {
      await waitFor(() => expect(content.parentNode).toBe(externalTarget));
      action.update({ to: origin });
      expect(origin.children[2]).toBe(content);
      action.update({ disabled: true });
      expect(origin.children[0]).toBe(before);
      expect(origin.children[1]).toBe(content);
      expect(origin.children[2]).toBe(after);
    } finally {
      action.destroy();
      origin.remove();
      externalTarget.remove();
    }
  });

  test('falls back to the default portal target when a new selector is missing', async () => {
    const origin = document.createElement('div');
    const content = document.createElement('span');
    const firstTarget = document.createElement('div');
    firstTarget.id = 'temporary-portal-target';
    origin.append(content);
    document.body.append(origin, firstTarget);

    const action = portal(content, { to: '#temporary-portal-target' });
    try {
      await waitFor(() => expect(content.parentNode).toBe(firstTarget));

      action.update({ to: '#missing-portal-target' });

      expect(content.parentNode).toBe(document.body);
      firstTarget.remove();
      expect(content.isConnected).toBe(true);
    } finally {
      action.destroy();
      origin.remove();
      firstTarget.remove();
    }
  });
});
