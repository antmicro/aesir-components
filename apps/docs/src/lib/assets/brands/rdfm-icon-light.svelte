<script>
  let { title = '', class: className = '', ...restProps } = $props();
</script>

<svg
  viewBox="0 0 550 550"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class={className}
  width="100%"
  height="100%"
  role={title ? 'img' : 'presentation'}
  aria-label={title || undefined}
  aria-hidden={title ? undefined : true}
  {...restProps}
>
  <path d="M465.801 84H83.8008V466H465.801V84Z" fill="#332D37" />
  <path d="M358.141 193.746H191.457V356.253" stroke="white" stroke-width="43.5829" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M358.143 356.252L284.02 282.112" stroke="white" stroke-width="43.5829" stroke-linecap="round" stroke-linejoin="round" />
  <path opacity="0.3" d="M284.02 282.112H358.143V193.746" stroke="white" stroke-width="43.5829" stroke-linecap="round" stroke-linejoin="round" />
</svg>
