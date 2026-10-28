<script>
  import { AesirTooltip } from '../../src/components/aesir-tooltip/index.js';

  let { disabled = false, content = 'Copy URL', anchorStyle } = $props();
</script>

<AesirTooltip {content} delay={0} {disabled} style={anchorStyle}>
  {#snippet trigger(props)}<button type="button" {...props}>Copy</button>{/snippet}
</AesirTooltip>

<button type="button">Outside</button>
