<script lang="ts">
  import type { Snippet } from 'svelte';
  import { AesirButton } from '../aesir-button/index.js';
  import { AesirDialog } from '../aesir-dialog/index.js';

  type Props = {
    open?: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    errorText?: string;
    children?: Snippet;
    onconfirm?: () => void | Promise<void>;
    oncancel?: () => void;
  };
  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel = 'Continue',
    cancelLabel = 'Cancel',
    destructive = false,
    errorText = 'Action failed. Try again.',
    children,
    onconfirm,
    oncancel
  }: Props = $props();
  let pending = $state(false);
  let hasError = $state(false);
  let session = 0;
  let previousOpen = open;
  $effect(() => {
    if (open === previousOpen) return;
    previousOpen = open;
    session += 1;
    if (!open) {
      pending = false;
      hasError = false;
    }
  });
  const confirm = async (close: () => void) => {
    if (pending) return;
    const currentSession = session;
    pending = true;
    hasError = false;
    try {
      await onconfirm?.();
      if (currentSession === session && open) close();
    } catch {
      if (currentSession === session && open) hasError = true;
    } finally {
      if (currentSession === session) pending = false;
    }
  };
</script>

<AesirDialog bind:open {title} {description} role="alertdialog" closeOnEscape={false} closeOnBackdrop={false} showClose={false}>
  {@render children?.()}
  {#if hasError && errorText}<p class="aesir-alert-dialog__error" role="alert">{errorText}</p>{/if}
  {#snippet footer({ close })}
    <AesirButton
      variant="outline"
      disabled={pending}
      onclick={() => {
        hasError = false;
        oncancel?.();
        close();
      }}
    >
      {cancelLabel}
    </AesirButton>
    <AesirButton variant={destructive ? 'destructive' : 'default'} disabled={pending} onclick={() => confirm(close)}>{pending ? 'Working…' : confirmLabel}</AesirButton>
  {/snippet}
</AesirDialog>

<style>
  .aesir-alert-dialog__error {
    margin-top: var(--ds-spacing-3);
    color: var(--ds-foreground-red, var(--ds-foreground));
  }
</style>
