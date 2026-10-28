<script>
  let { color, size, mirrored, ...restProps } = $props();
</script>

<svg width={size} height={size} fill={color} transform={mirrored ? 'scale(-1, 1)' : undefined} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" {...restProps}>
  <path d="M220 75.1613L131.437 24.7783V231.821L166.862 211.353V153.097L193.628 168.449L193.234 128.693L166.862 113.342V90.1187L220 121.214V75.1613Z" />
  <path d="M35 75.1613L123.564 24.7783V231.821L88.1383 211.353V90.1187L35 121.214V75.1613Z" />
</svg>
