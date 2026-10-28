<script>
  import { AesirBadge, AesirButton, AesirButtonGroup, AesirCard, AesirComponentPreview, AesirField, AesirKbd, AesirPill, AesirScrollArea } from '../../src/index.js';
</script>

<AesirBadge variant="success" size="sm" font="mono">Ready</AesirBadge>

<AesirButtonGroup orientation="vertical" size="lg" aria-label="Actions">
  <AesirButton>Save</AesirButton>
  <AesirButton>Cancel</AesirButton>
</AesirButtonGroup>

<AesirCard title="Project" titleElement="h2" description="Project settings">
  <p>Card content</p>
  {#snippet footer()}<button>Card action</button>{/snippet}
</AesirCard>

<AesirComponentPreview embedded contentClass="consumer-content" contentStyle="min-height: 10px">
  <span>Preview content</span>
</AesirComponentPreview>

<AesirField label="Email" description="Work address" required>
  {#snippet children(context)}
    <input id={context.controlId} aria-describedby={context.describedBy} required={context.required} />
  {/snippet}
</AesirField>

<AesirKbd ctrl shift small>K</AesirKbd>
<AesirPill href="/filters" size="sm">Active</AesirPill>

<AesirScrollArea orientation="horizontal" aria-label="Scrollable examples">
  <div style="width: 1000px">Wide content</div>
</AesirScrollArea>
