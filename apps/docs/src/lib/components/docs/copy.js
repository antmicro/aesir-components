import { toast } from '@aesir/svelte/components/aesir-toast';

export async function copyToClipboard(value, options = {}) {
  const { successLabel = 'Copied', showValue = true, errorLabel = 'Copy failed', emptyDescription = 'No value available for this item.' } = options;

  if (!value) {
    toast.error(errorLabel, emptyDescription);
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    toast.success(successLabel, showValue ? value : undefined);
    return true;
  } catch {
    toast.error(errorLabel, 'Clipboard is not available in this context.');
    return false;
  }
}
