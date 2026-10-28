<script>
  import TagInput from '../../src/components/aesir-tag-input/aesir-tag-input.svelte';

  let topics = $state(['a']);
</script>

<form aria-label="Topics form">
  <TagInput
    label="Topics"
    name="topics"
    options={[
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b' }
    ]}
    bind:value={topics}
  />
  <button type="reset">Reset topics</button>
  <output aria-label="Selected topics">{topics.join(',')}</output>
</form>
