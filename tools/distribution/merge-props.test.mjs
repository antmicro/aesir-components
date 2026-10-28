import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeProps } from '@aesir/svelte/utilities/merge-props';

test('mergeProps combines classes and styles without losing later values', () => {
  assert.deepEqual(mergeProps({ class: 'root', style: { color: 'red', '--size': 2 } }, { class: ['active', { disabled: false }], style: 'color:blue' }), {
    class: 'root active',
    style: 'color:red;--size:2;color:blue;'
  });
});

test('mergeProps chains event handlers and respects preventDefault', () => {
  const calls = [];
  const event = new Event('click', { cancelable: true });
  const props = mergeProps(
    { onclick: () => calls.push('consumer') },
    {
      onclick: (nextEvent) => {
        calls.push('internal');
        nextEvent.preventDefault();
      }
    },
    { onclick: () => calls.push('after') }
  );

  props.onclick(event);
  assert.deepEqual(calls, ['consumer', 'internal']);
});

test('mergeProps lets later scalar props win', () => {
  assert.deepEqual(mergeProps({ tabindex: 0, disabled: false }, { tabindex: -1, disabled: true }), { tabindex: -1, disabled: true });
});

test('mergeProps preserves symbol keyed Svelte attachments', () => {
  const attachment = Symbol('attachment');
  const attach = () => {};
  const result = mergeProps({ [attachment]: attach }, { id: 'trigger' });

  assert.equal(result[attachment], attach);
});
