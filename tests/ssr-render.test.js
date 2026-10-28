import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Accordion from '../src/components/aesir-accordion/aesir-accordion.svelte';
import Avatar from '../src/components/aesir-avatar/aesir-avatar.svelte';
import Badge from '../src/components/aesir-badge/aesir-badge.svelte';
import Breadcrumb from '../src/components/aesir-breadcrumb/aesir-breadcrumb.svelte';
import Checkbox from '../src/components/aesir-checkbox/aesir-checkbox.svelte';
import Input from '../src/components/aesir-input/aesir-input.svelte';
import NativeSelect from '../src/components/aesir-native-select/aesir-native-select.svelte';
import Select from '../src/components/aesir-select/aesir-select.svelte';
import Progress from '../src/components/aesir-progress/aesir-progress.svelte';
import Radio from '../src/components/aesir-radio/aesir-radio.svelte';
import ResizablePanels from '../src/components/aesir-resizable-panels/aesir-resizable-panels.svelte';
import Switch from '../src/components/aesir-switch/aesir-switch.svelte';
import Tabs from '../src/components/aesir-tabs/aesir-tabs.svelte';
import Textarea from '../src/components/aesir-textarea/aesir-textarea.svelte';
import HydrationFixture from './fixtures/hydration-fixture.svelte';
import { hydrationMarkup } from './fixtures/hydration-markup.js';

const serverCases = [
  ['accordion', Accordion, { items: [{ value: 'one', title: 'One', content: 'Content' }] }],
  ['avatar', Avatar, { fallback: 'Aesir' }],
  ['badge', Badge, {}],
  ['breadcrumb', Breadcrumb, { items: [{ label: 'Home', href: '/' }, { label: 'Current' }] }],
  ['checkbox', Checkbox, { label: 'Updates' }],
  ['input', Input, { label: 'Project' }],
  ['native select', NativeSelect, { label: 'Region', options: [{ label: 'Europe', value: 'eu' }] }],
  ['select', Select, { label: 'Region', options: [{ label: 'Europe', value: 'eu' }] }],
  ['progress', Progress, { value: 40, label: 'Completion' }],
  ['radio', Radio, { label: 'Free', value: 'free', group: 'free' }],
  ['resizable panels', ResizablePanels, {}],
  ['switch', Switch, { label: 'Alerts' }],
  ['tabs', Tabs, { items: [{ value: 'one', label: 'One', content: 'Panel' }] }],
  ['textarea', Textarea, { label: 'Notes' }]
];

describe('server rendering', () => {
  test.each(serverCases)('%s renders without browser globals', (_name, Component, props) => {
    const result = render(Component, { props });

    expect(result.body).toBeTypeOf('string');
    expect(result.body.length).toBeGreaterThan(0);
  });

  test('produces deterministic hydration markup', () => {
    const first = render(HydrationFixture).body;
    const second = render(HydrationFixture).body;

    expect(first).toBe(second);
    expect(first).toBe(hydrationMarkup);
    expect(first).toContain('Hydrated action');
  });

  test('keeps an avatar fallback visible until its image loads on the client', () => {
    const body = render(Avatar, { props: { src: '/portrait.png', alt: 'Ada', fallback: 'AL' } }).body;

    expect(body).toContain('src="/portrait.png"');
    expect(body).toContain('AL');
    expect(body).not.toContain('data-loaded');
  });
});
