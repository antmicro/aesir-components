<script>
  import { AesirBadge, AesirButton, AesirCommandMenu, AesirIcon, AesirDropdown, AesirTextarea, AesirTooltip, mergeProps } from '@aesir/svelte';

  let { value = $bindable(''), onsubmit, projectPicker, autofocus = false, typeToFocus = false } = $props();
  let files = $state([]);
  let fileInput;
  let composer;
  let contextOpen = $state(false);
  let draggingFiles = $state(false);
  let dragDepth = 0;
  const placeholderImage =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#e5e7eb"/><rect x="14" y="14" width="20" height="20" rx="3" fill="#6b7280"/><path d="M19 8v6m10-6v6M19 34v6m10-6v6M8 19h6m-6 10h6m20-10h6m-6 10h6" stroke="#6b7280" stroke-width="3"/></svg>'
    );
  const featuredComponent = {
    id: 'Core:STM32F103C8T6',
    label: 'STM32F103C8T6',
    image: 'https://openhardware.antmicro.com/imported/components/lqfp-48-7x7mm-p0-5mm-stmicroelectronics-stm32f103c8t6/previews/topT.webp'
  };
  let contexts = $state([featuredComponent]);
  const categories = [
    '1-Wire',
    'ADC',
    'Audio',
    'Base Memory',
    'Bluetooth',
    'Cache Controller',
    'CAN',
    'Clock Control',
    'Clock Monitor',
    'Comparator',
    'Core',
    'Counter',
    'Cryptography Coprocessor',
    'Cyclic Redundancy Check',
    'DAC',
    'DAI',
    'Debug Controller',
    'Debug Interface',
    'Display',
    'Distributed Switch Architecture',
    'DMA',
    'DSP',
    'eSPI',
    'Ethernet Interface',
    'Ethernet PHY Interface',
    'Flash Controller',
    'FPGA',
    'Fuel Gauge',
    'GPIO',
    'GSM Modem controller',
    'Haptics',
    'Hardware Information',
    'Hardware Spinlocks',
    'I²C',
    'I²S',
    'I³C',
    'IEEE 802.15.4',
    'Industrial I/O',
    'Input',
    'Inter-Processor Mailbox',
    'Interrupt Controller',
    'IPC',
    'LED',
    'LED Strip',
    'LoRa',
    'MBOX',
    'Memory',
    'Memory Controllers',
    'Memory Management/Protection Unit',
    'Message Handling Unit',
    'MFD',
    'MIPI-DSI',
    'Miscellaneous',
    'MMC Memory Controller',
    'MTD',
    'Multi-bit SPI',
    'Multiplexer',
    'Operational amplifier',
    'PCI Express',
    'PECI',
    'Pin Control',
    'Power',
    'PS/2',
    'Pulse I/O',
    'PWM',
    'Reset Controller',
    'RNG',
    'RTC',
    'RTL Core',
    'RTL Interface',
    'SD Host Controller',
    'Sensor',
    'Serial Host Interface',
    'Serial Interface',
    'SMBus',
    'SPI',
    'SRAM',
    'SYSCON Interface',
    'Tachometer',
    'Timer',
    'USB',
    'Video',
    'VirtIO',
    'Voltage Regulator',
    'Wakeup Controller',
    'Watchdog',
    'Wireless',
    'xSPI'
  ];
  const demoComponents = { ADC: ['ADS1115', 'MCP3008'], Core: ['STM32F407', 'RP2040'], Sensor: ['BME280', 'TMP117'], 'Voltage Regulator': ['LM7805', 'TPS7A02'], FPGA: ['iCE40UP5K'], RTC: ['DS3231'] };
  const contextGroups = [
    { label: 'Suggested component', items: [featuredComponent] },
    {
      label: 'Hardware categories',
      items: categories.map((category) => ({
        id: category,
        label: category,
        groups: [
          {
            label: 'Demo components',
            items: [
              ...(category === 'Core' ? [featuredComponent] : []),
              ...(demoComponents[category] ?? [`${category} example A`, `${category} example B`]).map((label) => ({ id: `${category}:${label}`, label, image: placeholderImage }))
            ]
          }
        ]
      }))
    }
  ];

  const attachmentOptions = [
    { value: 'context', label: 'Add context', icon: 'layers' },
    { value: 'upload', label: 'Upload files', icon: 'upload' }
  ];

  const models = [
    { label: 'Qwen3.6', value: 'qwen-3-6' },
    { label: 'Qwen3.5', value: 'qwen-3-5' },
    { label: 'Qwen3-Coder', value: 'qwen-3-coder' }
  ];

  let model = $state('qwen-3-6');
  const modelItems = $derived(models.map((item) => ({ ...item, role: 'menuitemradio', checked: item.value === model })));
  const modelLabel = $derived(models.find((item) => item.value === model)?.label);

  const submit = (event) => {
    event.preventDefault();
    if (value.trim())
      onsubmit?.(value.trim(), [...contexts.map(({ id, label, image }) => ({ id, label, image })), ...files.map((file, index) => ({ id: `file-${index}-${file.name}`, label: file.name }))]);
  };

  const submitFromKeyboard = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    if (value.trim()) event.currentTarget.form?.requestSubmit();
  };

  const addFiles = (incomingFiles) => {
    files = [...files, ...Array.from(incomingFiles ?? [])];
  };

  const focusWhenTyping = (event) => {
    if (
      !typeToFocus ||
      contextOpen ||
      document.documentElement.dataset.overlayOpen === 'true' ||
      event.defaultPrevented ||
      event.isComposing ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.key.length !== 1
    )
      return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable)) return;

    const textarea = composer?.querySelector('textarea');
    if (!textarea) return;
    event.preventDefault();
    value += event.key;
    textarea.focus();
    queueMicrotask(() => textarea.setSelectionRange(value.length, value.length));
  };
</script>

<svelte:window onkeydown={focusWhenTyping} />

<form
  bind:this={composer}
  class="llm-composer"
  data-dragging={draggingFiles || undefined}
  onsubmit={submit}
  ondragenter={(event) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    dragDepth += 1;
    draggingFiles = true;
  }}
  ondragover={(event) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }}
  ondragleave={(event) => {
    if (!draggingFiles) return;
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) draggingFiles = false;
  }}
  ondrop={(event) => {
    if (!event.dataTransfer?.files.length) return;
    event.preventDefault();
    dragDepth = 0;
    draggingFiles = false;
    addFiles(event.dataTransfer.files);
  }}
>
  <div class="context-tags">
    {#each contexts as context (context.id)}
      <AesirBadge variant="outline">
        <img class="context-thumbnail" src={context.image ?? placeholderImage} alt="" onerror={(event) => (event.currentTarget.src = placeholderImage)} />
        {context.label}
        <AesirButton
          class="context-remove"
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${context.label}`}
          onclick={() => (contexts = contexts.filter((item) => item.id !== context.id))}
        >
          <AesirIcon name="x" size={12} />
        </AesirButton>
      </AesirBadge>
    {/each}
    {#each files as file, index (file)}
      <AesirBadge variant="outline">
        <span class="file-thumbnail"><AesirIcon name="file" size={15} /></span>
        {file.name}
        <AesirButton
          class="context-remove"
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${file.name}`}
          onclick={() => (files = files.filter((_, fileIndex) => fileIndex !== index))}
        >
          <AesirIcon name="x" size={12} />
        </AesirButton>
      </AesirBadge>
    {/each}
  </div>
  <input
    bind:this={fileInput}
    type="file"
    multiple
    hidden
    onchange={(event) => {
      addFiles(event.currentTarget.files);
      event.currentTarget.value = '';
    }}
  />
  <AesirTextarea bind:value aria-label="Message" placeholder="Ask anything…" rows={2} resize="auto" {autofocus} onkeydown={submitFromKeyboard} />
  <div class="llm-composer__toolbar">
    <div class="llm-composer__tools">
      <AesirDropdown
        items={attachmentOptions}
        align="start"
        placement="top"
        label="Attachments"
        onselect={(item) => {
          if (item.value === 'upload') fileInput?.click();
          else contextOpen = true;
        }}
      >
        {#snippet trigger(props)}
          <AesirTooltip content="Add attachments">
            {#snippet trigger(tooltipProps)}
              {@const triggerProps = mergeProps(props, tooltipProps)}
              <AesirButton {...triggerProps} type="button" variant="ghost" size="icon-sm" aria-label="Add attachments">
                <AesirIcon name="plus" size={16} />
              </AesirButton>
            {/snippet}
          </AesirTooltip>
        {/snippet}
        {#snippet itemContent({ item })}
          <AesirIcon name={item.icon} size={14} />
          <span>{item.label}</span>
        {/snippet}
      </AesirDropdown>
      <AesirDropdown items={modelItems} placement="top" align="start" label="Choose model" onselect={(selectedModel) => (model = selectedModel.value)}>
        {#snippet trigger(props)}
          <AesirButton {...props} type="button" variant="ghost" size="sm" aria-label={`Choose model: ${modelLabel}`}>{modelLabel} <AesirIcon name="chevron-down" size={14} /></AesirButton>
        {/snippet}
      </AesirDropdown>
    </div>
    <div class="llm-composer__submit">
      {@render projectPicker?.()}
      <AesirButton type="submit" variant="accent" size="icon-sm" aria-label="Send message" disabled={!value.trim()}>
        <AesirIcon name="arrow-right" size={16} />
      </AesirButton>
    </div>
  </div>
</form>
<AesirCommandMenu
  bind:open={contextOpen}
  groups={contextGroups}
  shortcut={false}
  label="Add context"
  placeholder="Search hardware categories…"
  onselect={(item) => {
    if (!contexts.some((context) => context.id === item.id)) contexts = [...contexts, item];
  }}
>
  {#snippet itemContent(item)}
    {#if item.groups}
      <AesirIcon name="layers" size={16} />
      <span class="context-option-label">{item.label}</span>
      <AesirIcon name="chevron-right" size={14} />
    {:else}
      <img class="context-thumbnail" src={item.image ?? placeholderImage} alt="" onerror={(event) => (event.currentTarget.src = placeholderImage)} />
      <span class="context-option-label">{item.label}</span>
      {#if contexts.some((context) => context.id === item.id)}<AesirIcon name="check" size={14} />{/if}
    {/if}
  {/snippet}
</AesirCommandMenu>

<style>
  .context-tags {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    min-width: 0;
    max-width: 100%;
    scrollbar-width: thin;
    gap: var(--ds-spacing-2);
  }
  .context-tags :global(.aesir-badge) {
    flex-shrink: 0;
    border-radius: var(--ds-radius-lg);
  }
  .context-tags :global(.context-remove) {
    width: var(--ds-spacing-6);
    height: var(--ds-spacing-6);
    border-radius: var(--ds-radius-md);
  }
  .context-option-label {
    font-size: var(--ds-font-size-sm);
    line-height: 1.4;
  }
  .context-tags:not(:empty) {
    padding: var(--ds-spacing-2);
  }
  .context-thumbnail {
    width: var(--ds-spacing-6);
    height: var(--ds-spacing-6);
    object-fit: contain;
    border-radius: var(--ds-radius-sm);
    flex-shrink: 0;
  }
  .file-thumbnail {
    display: grid;
    width: var(--ds-spacing-6);
    height: var(--ds-spacing-6);
    flex: none;
    place-items: center;
  }
  .llm-composer {
    position: relative;
    width: 100%;
    padding: var(--ds-spacing-2);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    transition:
      border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  .llm-composer[data-dragging] {
    border-color: var(--ds-accent);
    box-shadow: inset 0 0 0 var(--ds-spacing-px) var(--ds-accent-ring);
  }

  .llm-composer[data-dragging]::after {
    position: absolute;
    z-index: 2;
    display: grid;
    border-radius: calc(var(--ds-radius-lg) - var(--ds-spacing-px));
    background: color-mix(in oklch, var(--ds-accent-surface) 92%, transparent);
    color: var(--ds-accent-text);
    content: 'Drop files to attach';
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
    inset: 0;
    place-items: center;
    pointer-events: none;
  }

  .llm-composer :global(textarea) {
    min-height: var(--ds-spacing-12);
    max-height: var(--ds-spacing-40);
    overflow-y: auto;
    padding: var(--ds-spacing-2);
    border: 0;
    background: transparent;
    box-shadow: none;
    scrollbar-color: var(--ds-border-hover) transparent;
    scrollbar-width: thin;
  }

  .llm-composer :global(textarea::-webkit-scrollbar) {
    width: var(--ds-spacing-2);
  }

  .llm-composer :global(textarea::-webkit-scrollbar-track) {
    background: transparent;
  }

  .llm-composer :global(textarea::-webkit-scrollbar-thumb) {
    border: var(--ds-spacing-0-5) solid transparent;
    border-radius: var(--ds-radius-full);
    background: var(--ds-border-hover);
    background-clip: padding-box;
  }

  .llm-composer__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-1) var(--ds-spacing-1) 0 var(--ds-spacing-2);
  }

  .llm-composer__tools,
  .llm-composer__submit {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-1);
  }

  @media (prefers-reduced-motion: reduce) {
    .llm-composer {
      transition-duration: var(--ds-motion-duration-instant);
    }
  }
</style>
