<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { restoreOnFormReset } from '../form-reset.svelte.js';
  type FileUploadProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onselect'> & {
    files?: File[];
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    disabled?: boolean;
    label?: string;
    description?: string;
    browseLabel?: string;
    showList?: boolean;
    onselect?: (files: File[]) => void;
    onreject?: (files: File[]) => void;
    class?: string;
  };
  let {
    files = $bindable([]),
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    disabled = false,
    label = 'Upload files',
    description = 'Drag and drop or choose from your device',
    browseLabel = 'Choose files',
    showList = true,
    onselect,
    onreject,
    class: className,
    ...restProps
  }: FileUploadProps = $props();
  let input: HTMLInputElement;
  let dragging = $state(false);
  let dragDepth = 0;
  const initialFiles = [...files];
  restoreOnFormReset(
    () => input,
    () => {
      files = [...initialFiles];
      dragDepth = 0;
      dragging = false;
      input.value = '';
    }
  );
  $effect(() => {
    if (disabled) {
      dragDepth = 0;
      dragging = false;
    }
  });
  const uid = $props.id();
  const formatSize = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`);
  let acceptRules = $derived(
    (accept ?? '')
      .split(',')
      .map((rule) => rule.trim().toLowerCase())
      .filter(Boolean)
  );
  const accepted = (file: File) =>
    !acceptRules.length ||
    acceptRules.some((value) => {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();
      return value.startsWith('.') ? name.endsWith(value) : value.endsWith('/*') ? type.startsWith(value.slice(0, -1)) : type === value;
    });
  const isDisabled = () => disabled || input?.matches(':disabled');
  const isFileDrag = (event: DragEvent) => !event.dataTransfer?.types || Array.from(event.dataTransfer.types).includes('Files');
  const add = (incoming: FileList | File[]) => {
    if (isDisabled()) {
      if (input) input.value = '';
      return;
    }
    const next = [...incoming];
    const rejected: File[] = [];
    const valid: File[] = [];
    const capacity = Math.floor(multiple ? Math.max((maxFiles ?? Infinity) - files.length, 0) : Math.max(Math.min(maxFiles ?? 1, 1), 0)) || 0;
    for (const file of next) {
      if (!accepted(file) || (maxSize !== undefined && file.size > maxSize) || valid.length >= capacity) rejected.push(file);
      else valid.push(file);
    }
    if (valid.length) {
      files = multiple ? [...files, ...valid] : valid;
      onselect?.(valid);
    }
    if (rejected.length) onreject?.(rejected);
    if (input) input.value = '';
  };
  const remove = (index: number) => (files = files.filter((_, fileIndex) => fileIndex !== index));
</script>

<div class={`file-upload ${className ?? ''}`.trim()} {...restProps}>
  <input
    bind:this={input}
    id={uid}
    class="file-upload__input"
    type="file"
    tabindex="-1"
    aria-labelledby={`${uid}-label`}
    aria-describedby={`${uid}-description`}
    {accept}
    {multiple}
    {disabled}
    onchange={(event) => add(event.currentTarget.files ?? [])}
  />
  <div
    class="file-upload__dropzone"
    role="group"
    class:dragging={dragging && !isDisabled()}
    class:disabled
    aria-labelledby={`${uid}-label`}
    aria-describedby={`${uid}-description`}
    ondragenter={(event) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      if (!isDisabled() && ++dragDepth) dragging = true;
    }}
    ondragover={(event) => {
      if (isFileDrag(event)) event.preventDefault();
    }}
    ondragleave={(event) => {
      event.preventDefault();
      if (--dragDepth <= 0) {
        dragDepth = 0;
        dragging = false;
      }
    }}
    ondrop={(event) => {
      event.preventDefault();
      dragDepth = 0;
      dragging = false;
      if (!isDisabled()) add(event.dataTransfer?.files ?? []);
    }}
  >
    <span class="file-upload__icon"><AesirIcon name="upload" size={18} /></span>
    <span class="file-upload__copy">
      <strong id={`${uid}-label`}>{label}</strong>
      <span id={`${uid}-description`}>{description}</span>
    </span>
    <button class="file-upload__button" type="button" {disabled} onclick={() => input?.click()}>{browseLabel}</button>
  </div>
  {#if showList && files.length}
    <ul aria-live="polite">
      {#each files as file, index (index)}
        <li>
          <AesirIcon name="file" size={17} />
          <span>
            <strong>{file.name}</strong>
            <small>{formatSize(file.size)}</small>
          </span>
          <button type="button" {disabled} aria-label={`Remove ${file.name}`} onclick={() => remove(index)}><AesirIcon name="x" size={16} /></button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .file-upload {
    display: grid;
    width: 100%;
    min-width: 0;
    gap: var(--ds-spacing-3);
    container-type: inline-size;
  }
  .file-upload__input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .file-upload__dropzone {
    display: grid;
    grid-template-columns: var(--ds-spacing-9) minmax(0, 1fr) auto;
    min-height: var(--aesir-file-upload-dropzone-min-height, 6rem);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--aesir-file-upload-dropzone-padding, var(--ds-spacing-4));
    border: 1px dashed var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    transition:
      border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
      background var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
      transform 140ms var(--ds-motion-easing-out);
  }
  .file-upload__dropzone:hover,
  .file-upload__dropzone.dragging,
  .file-upload__dropzone:has(.file-upload__button:focus-visible) {
    border-color: var(--ds-border-hover);
    background: var(--ds-background);
    outline: none;
  }
  .file-upload__dropzone.dragging {
    transform: scale(0.995);
  }
  .file-upload__dropzone.disabled,
  .file-upload__input:disabled + .file-upload__dropzone {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .file-upload__icon {
    display: grid;
    width: var(--ds-spacing-9);
    height: var(--ds-spacing-9);
    flex: none;
    border-radius: var(--ds-radius-lg);
    background: var(--ds-surface);
    color: var(--ds-foreground-muted);
    place-items: center;
  }
  .file-upload__copy {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-0-5);
    overflow-wrap: anywhere;
  }
  .file-upload__copy strong {
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    line-height: 1.25;
  }
  .file-upload__copy span,
  small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: 1.35;
  }
  .file-upload__button {
    flex: none;
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition: transform 140ms var(--ds-motion-easing-out);
  }
  .file-upload__button:active {
    transform: scale(0.97);
  }
  .file-upload__button:focus-visible {
    outline: 2px solid var(--ds-accent-ring);
    outline-offset: 2px;
  }
  .file-upload__button:disabled {
    cursor: not-allowed;
  }
  ul {
    display: grid;
    max-height: var(--aesir-file-upload-list-max-height, none);
    overflow-y: auto;
    gap: var(--ds-spacing-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: var(--aesir-file-upload-item-gap, var(--ds-spacing-3));
    padding: var(--aesir-file-upload-item-padding, var(--ds-spacing-3));
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
  }
  li > span {
    display: grid;
    min-width: 0;
    flex: 1;
  }
  li strong {
    overflow: hidden;
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  li small {
    display: var(--aesir-file-upload-size-display, block);
  }
  li button {
    display: grid;
    width: var(--ds-spacing-8);
    height: var(--ds-spacing-8);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: var(--ds-foreground-muted);
    place-items: center;
  }
  li button:hover {
    background: var(--ds-surface);
    color: var(--ds-foreground);
  }
  li button:active {
    transform: scale(0.96);
  }
  @container (max-width: 24rem) {
    .file-upload__dropzone {
      align-items: flex-start;
      grid-template-columns: var(--ds-spacing-9) minmax(0, 1fr);
    }
    .file-upload__button {
      grid-column: 1 / -1;
      justify-self: stretch;
    }
  }
</style>
