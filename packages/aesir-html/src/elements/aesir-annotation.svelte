<svelte:options
  customElement={{
    tag: 'aesir-annotation',
    props: {
      active: { type: 'Boolean', reflect: true },
      editable: { type: 'Boolean' }
    }
  }}
/>

<script>
  import { AesirAnnotation } from '@aesir/svelte/components/aesir-annotation';
  import { parseJson } from '../parse.js';

  let { id, kind = 'comment', authorName = '', avatarSrc = '', avatarFallback = '', time = '', text = '', diff = [], active = $bindable(false), editable = false } = $props();
  const host = $host();
  const author = $derived({ name: authorName, src: avatarSrc, fallback: avatarFallback });
  const parsedDiff = $derived(parseJson(diff));
  const emit = (type, detail) => host.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  const activate = (nextActive) => {
    active = nextActive;
    emit('activate', { active: nextActive });
  };
  const edit = (value) => {
    text = value;
    emit('edit', { value });
  };
</script>

<AesirAnnotation
  {id}
  {kind}
  {author}
  {time}
  {text}
  diff={parsedDiff}
  {active}
  {editable}
  onactivate={activate}
  onresolve={() => emit('resolve')}
  onremove={() => emit('remove')}
  onedit={edit}
  onaccept={() => emit('accept')}
  onreject={() => emit('reject')}
  onreply={(value) => emit('reply', { value })}
/>
