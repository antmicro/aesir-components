<script lang="ts">
  import { AesirIcon } from '@aesir/svelte';
  import Android from '@aesir/svelte/icons/android';
  import Python from '@aesir/svelte/icons/python';
  import Ros from '@aesir/svelte/icons/ros';
  import TensorFlow from '@aesir/svelte/icons/tensor-flow';
  import Zephyr from '@aesir/svelte/icons/zephyr';

  const icons = [
    { label: 'Python', icon: Python },
    { label: 'ROS', icon: Ros },
    { label: 'Zephyr', icon: Zephyr },
    { label: 'Android', icon: Android },
    { label: 'TensorFlow', icon: TensorFlow }
  ];
</script>

<div class="custom-icons">
  {#each icons as item (item.label)}
    <span class="custom-icons__item">
      <AesirIcon icon={item.icon} size={28} />
      <small>{item.label}</small>
    </span>
  {/each}
</div>

<style>
  .custom-icons {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(auto-fit, minmax(var(--ds-spacing-20), 1fr));
    gap: var(--ds-spacing-4);
  }

  .custom-icons__item {
    display: grid;
    place-items: center;
    gap: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
  }

  .custom-icons__item small {
    font-size: var(--ds-font-size-xs);
  }
</style>
