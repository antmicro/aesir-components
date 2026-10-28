<script>
  import { AesirStatusBar } from '../../src/components/aesir-status-bar/index.js';

  const items = [
    { id: 'first', label: 'Jun 14, 2026', status: 'operational' },
    { id: 'second', label: 'Jun 15, 2026', status: 'maintenance' }
  ];
</script>

<AesirStatusBar label="API" {items} />
