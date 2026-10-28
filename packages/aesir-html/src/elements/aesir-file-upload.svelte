<svelte:options
  customElement={{
    tag: 'aesir-file-upload',
    props: {
      multiple: { type: 'Boolean' },
      maxSize: { type: 'Number', attribute: 'max-size' },
      maxFiles: { type: 'Number', attribute: 'max-files' },
      disabled: { type: 'Boolean', reflect: true },
      showList: { type: 'Boolean', attribute: 'show-list' }
    }
  }}
/>

<script>
  import { AesirFileUpload } from '@aesir/svelte/components/aesir-file-upload';
  import { blockDisabledClick } from '../disabled-click.js';
  let {
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    disabled = false,
    label = 'Upload files',
    description = 'Drag and drop or choose from your device',
    browseLabel = 'Choose files',
    showList = true
  } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
  let files = $state([]);
  const dispatch = (name, detail) => host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
</script>

<AesirFileUpload
  bind:files
  {accept}
  {multiple}
  {maxSize}
  {maxFiles}
  {disabled}
  {label}
  {description}
  {browseLabel}
  {showList}
  onselect={(selected) => dispatch('select', selected)}
  onreject={(rejected) => dispatch('reject', rejected)}
/>
