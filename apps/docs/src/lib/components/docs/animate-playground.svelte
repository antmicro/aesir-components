<script>
  import { onDestroy } from 'svelte';
  import { AesirAnimate, AesirBadge, AesirButton, AesirCard, AesirCheckbox, AesirDropdown, AesirIcon, AesirIconSwap } from '@aesir/svelte';
  import { copyToClipboard } from './copy.js';

  const animationOptions = [
    { label: 'Fade', value: 'fade' },
    { label: 'Fade up', value: 'fade-up' },
    { label: 'Fade down', value: 'fade-down' },
    { label: 'Fade left', value: 'fade-left' },
    { label: 'Fade right', value: 'fade-right' },
    { label: 'Zoom', value: 'zoom' },
    { label: 'Blur', value: 'blur' }
  ];

  const durationOptions = [100, 140, 180, 240, 400].map((value) => ({ label: `${value} ms`, value }));
  const delayOptions = [0, 75, 100, 150, 300, 500].map((value) => ({ label: `${value} ms`, value }));
  const easingOptions = [
    { label: 'Subtle', value: 'subtle' },
    { label: 'Ease out', value: 'out' },
    { label: 'Ease in-out', value: 'in-out' },
    { label: 'Linear', value: 'linear' }
  ];
  const distanceOptions = [
    { label: 'Spacing 2', value: 'var(--ds-spacing-2)' },
    { label: 'Spacing 4', value: 'var(--ds-spacing-4)' },
    { label: 'Spacing 6', value: 'var(--ds-spacing-6)' },
    { label: 'Spacing 8', value: 'var(--ds-spacing-8)' }
  ];

  let animation = $state('fade-up');
  let duration = $state(240);
  let delay = $state(100);
  let easing = $state('out');
  let distance = $state('var(--ds-spacing-4)');
  let once = $state(true);
  let replay = $state(0);
  let copied = $state(false);
  let copyResetTimer;

  const directionalAnimations = new Set(['fade-up', 'fade-down', 'fade-left', 'fade-right']);
  const supportsDistance = $derived(directionalAnimations.has(animation));
  const selectedItem = (options, value) => options.find((option) => option.value === value) ?? options[0];
  const selectableItems = (options, value) => options.map((option) => ({ ...option, role: 'menuitemradio', checked: option.value === value }));
  const animationItems = $derived(selectableItems(animationOptions, animation));
  const durationItems = $derived(selectableItems(durationOptions, duration));
  const delayItems = $derived(selectableItems(delayOptions, delay));
  const easingItems = $derived(selectableItems(easingOptions, easing));
  const distanceItems = $derived(selectableItems(distanceOptions, distance));
  const currentAnimation = $derived(selectedItem(animationOptions, animation));
  const currentDuration = $derived(selectedItem(durationOptions, duration));
  const currentDelay = $derived(selectedItem(delayOptions, delay));
  const currentEasing = $derived(selectedItem(easingOptions, easing));
  const currentDistance = $derived(selectedItem(distanceOptions, distance));
  const replayAnimation = () => (replay += 1);
  const selectAnimation = (item) => {
    if (item.value === animation) return;
    animation = item.value;
    replayAnimation();
  };
  const selectDuration = (item) => {
    if (item.value === duration) return;
    duration = item.value;
    replayAnimation();
  };
  const selectDelay = (item) => {
    if (item.value === delay) return;
    delay = item.value;
    replayAnimation();
  };
  const selectEasing = (item) => {
    if (item.value === easing) return;
    easing = item.value;
    replayAnimation();
  };
  const selectDistance = (item) => {
    if (item.value === distance) return;
    distance = item.value;
    replayAnimation();
  };
  const generatedCode = $derived(`<AesirAnimate
	animation="${animation}"
	duration={${duration}}
	delay={${delay}}
	easing="${easing}"${
    supportsDistance
      ? `
	distance="${distance}"`
      : ''
  }
	once={${once}}
>
	<YourContent />
</AesirAnimate>`);

  const copyGeneratedCode = async () => {
    const didCopy = await copyToClipboard(generatedCode, { successLabel: 'Animation code copied' });
    if (!didCopy) return;

    copied = true;
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copied = false;
    }, 1200);
  };

  onDestroy(() => clearTimeout(copyResetTimer));
</script>

{#snippet dropdownField(label, currentItem, items, onselect, disabled = false)}
  <div class="animate-playground__field">
    <span>{label}</span>
    <AesirDropdown class="animate-playground__dropdown-anchor" {items} {onselect} label={`${label} options`} matchTriggerWidth>
      {#snippet trigger(triggerProps)}
        <AesirButton {...triggerProps} variant="outline" width="full" class="animate-playground__dropdown-trigger" aria-label={`${label}: ${currentItem.label}`} {disabled}>
          <span>{currentItem.label}</span>
          <AesirIcon name="chevron-down" />
        </AesirButton>
      {/snippet}

      {#snippet itemContent({ item })}
        <span>{item.label}</span>
        {#if item.checked}<AesirIcon name="check" class="animate-playground__dropdown-check" />{/if}
      {/snippet}
    </AesirDropdown>
  </div>
{/snippet}

<div class="animate-playground">
  <div class="animate-playground__controls">
    {@render dropdownField('Animation', currentAnimation, animationItems, selectAnimation)}
    {@render dropdownField('Duration', currentDuration, durationItems, selectDuration)}
    {@render dropdownField('Delay', currentDelay, delayItems, selectDelay)}
    {@render dropdownField('Easing', currentEasing, easingItems, selectEasing)}
    {@render dropdownField('Distance', currentDistance, distanceItems, selectDistance, !supportsDistance)}

    <div class="animate-playground__check">
      <AesirCheckbox bind:checked={once} label="Animate once" onchange={replayAnimation} />
    </div>
  </div>

  <div class="animate-playground__preview">
    <div class="animate-playground__preview-header">
      <span>Preview</span>
      <AesirButton variant="outline" size="sm" onclick={replayAnimation}>Replay</AesirButton>
    </div>

    <div class="animate-playground__stage">
      {#key replay}
        <AesirAnimate {animation} {duration} {delay} {easing} {distance} {once}>
          <AesirCard title="Animated status" description="This preview uses the configuration selected above.">
            {#snippet headerAction()}<AesirBadge variant="success"><AesirIcon name="sparkles" />Ready</AesirBadge>{/snippet}
          </AesirCard>
        </AesirAnimate>
      {/key}
    </div>
  </div>

  <div class="animate-playground__code">
    <AesirButton variant="ghost" size="icon-sm" aria-label={copied ? 'Animation code copied' : 'Copy generated animation'} onclick={copyGeneratedCode}>
      <AesirIconSwap name="copy" activeName="check" active={copied} />
    </AesirButton>
    <pre aria-label="Generated animation code"><code><span class="code-line"><span class="syntax-punctuation">&lt;</span><span class="syntax-component">AesirAnimate</span></span>
<span class="code-line">	<span class="syntax-attribute">animation</span><span class="syntax-punctuation">=</span><span class="syntax-string">"{animation}"</span></span>
<span class="code-line">	<span class="syntax-attribute">duration</span><span class="syntax-punctuation">=&#123;</span><span class="syntax-number">{duration}</span><span
            class="syntax-punctuation">&#125;</span></span>
<span class="code-line">	<span class="syntax-attribute">delay</span><span class="syntax-punctuation">=&#123;</span><span class="syntax-number">{delay}</span><span
            class="syntax-punctuation">&#125;</span></span>
<span class="code-line">	<span class="syntax-attribute">easing</span><span class="syntax-punctuation">=</span><span class="syntax-string">"{easing}"</span></span>
{#if supportsDistance}<span class="code-line">	<span class="syntax-attribute">distance</span><span class="syntax-punctuation">=</span><span class="syntax-string">"{distance}"</span></span>{/if}
<span class="code-line">	<span class="syntax-attribute">once</span><span class="syntax-punctuation">=&#123;</span><span class="syntax-boolean">{once}</span><span
            class="syntax-punctuation">&#125;</span></span>
<span class="code-line"><span class="syntax-punctuation">&gt;</span></span>
<span class="code-line">	<span class="syntax-punctuation">&lt;</span><span class="syntax-component">YourContent</span> <span class="syntax-punctuation">/&gt;</span></span>
<span class="code-line"><span class="syntax-punctuation">&lt;/</span><span class="syntax-component">AesirAnimate</span><span class="syntax-punctuation">&gt;</span></span></code></pre>
  </div>
</div>

<style>
  .animate-playground {
    display: grid;
    gap: var(--ds-spacing-4);
  }

  .animate-playground__controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--ds-sizing-3xs)), 1fr));
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-4);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-xl);
    background: var(--ds-background-secondary);
  }

  .animate-playground__field {
    display: grid;
    gap: var(--ds-spacing-1-5);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }

  :global(.animate-playground__dropdown-anchor) {
    width: 100%;
  }

  :global(.animate-playground__dropdown-trigger) {
    justify-content: space-between;
    font-weight: var(--ds-font-weight-normal);
  }

  :global(.animate-playground__dropdown-check) {
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-4);
    color: var(--ds-foreground-muted);
  }

  .animate-playground__check {
    display: flex;
    align-items: center;
    align-self: end;
    min-height: var(--ds-spacing-10);
  }

  .animate-playground__preview {
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-xl);
  }

  .animate-playground__preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }

  .animate-playground__stage {
    display: grid;
    min-height: var(--ds-spacing-48);
    place-items: center;
    padding: var(--ds-spacing-6);
    background: var(--ds-background);
  }

  .animate-playground__stage > :global(.aesir-animate) {
    width: min(100%, var(--ds-sizing-md));
  }

  .animate-playground__code {
    position: relative;
    overflow: auto;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-xl);
    background: var(--ds-background-secondary);
  }

  .animate-playground__code > :global(.aesir-button) {
    position: absolute;
    top: var(--ds-spacing-3);
    right: var(--ds-spacing-3);
    z-index: 1;
  }

  .animate-playground__code pre {
    margin: 0;
    padding: var(--ds-spacing-5);
  }

  .animate-playground__code code {
    display: block;
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
    white-space: normal;
  }

  .code-line {
    display: block;
    white-space: pre;
  }

  .syntax-punctuation {
    color: var(--ds-foreground-muted);
  }

  .syntax-component,
  .syntax-number,
  .syntax-boolean {
    color: var(--ds-foreground-muted-blue);
  }

  .syntax-attribute {
    color: var(--ds-foreground-muted-purple);
  }

  .syntax-string {
    color: var(--ds-foreground-muted-green);
  }
</style>
