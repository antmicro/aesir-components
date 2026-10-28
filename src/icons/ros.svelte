<script>
  let { color, size, mirrored, ...restProps } = $props();
</script>

<svg width={size} height={size} fill={color} transform={mirrored ? 'scale(-1, 1)' : undefined} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" {...restProps}>
  <circle cx="50.5489" cy="205.45" r="22.5489" />
  <circle cx="128" cy="205.45" r="22.5489" />
  <circle cx="205.451" cy="205.45" r="22.5489" />
  <circle cx="50.5489" cy="128.001" r="22.5489" />
  <circle cx="128" cy="128.001" r="22.5489" />
  <circle cx="205.451" cy="128.001" r="22.5489" />
  <circle cx="50.5489" cy="50.5499" r="22.5489" />
  <circle cx="128" cy="50.5499" r="22.5489" />
  <circle cx="205.451" cy="50.5499" r="22.5489" />
</svg>
