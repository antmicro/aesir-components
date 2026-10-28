<script>
  import { AesirAnnotation, toast } from '@aesir/svelte';

  const authors = {
    john: { name: 'John Doe', src: 'https://avatars.jakerunzer.com/John%20Doe', fallback: 'JD' },
    jane: { name: 'Jane Smith', src: 'https://avatars.jakerunzer.com/Jane%20Smith', fallback: 'JS' }
  };

  let active = $state('comment');
  let comment = $state('Could we keep the river reference here? It gives the passage a stronger sense of place.');
  const activate = (id, nextActive) => (active = nextActive ? id : null);
  const complete = (message) => {
    active = null;
    toast.success(message);
  };
</script>

<div class="annotation-examples">
  <AesirAnnotation
    id="comment-river-reference"
    kind="comment"
    author={authors.john}
    time="12 min ago"
    text={comment}
    editable
    active={active === 'comment'}
    onactivate={(nextActive) => activate('comment', nextActive)}
    onedit={(value) => (comment = value)}
    onresolve={() => complete('Comment resolved')}
    onremove={() => complete('Comment removed')}
    onreply={() => complete('Reply added')}
  />

  <AesirAnnotation
    id="suggestion-semoliki-spelling"
    kind="suggestion"
    author={authors.jane}
    time="5 min ago"
    diff={[
      { type: 'del', text: 'devious Semikoli' },
      { type: 'ins', text: 'devious semicolons' }
    ]}
    active={active === 'replacement'}
    onactivate={(nextActive) => activate('replacement', nextActive)}
    onaccept={() => complete('Suggestion accepted')}
    onreject={() => complete('Suggestion rejected')}
    onreply={() => complete('Reply added')}
  />

  <AesirAnnotation
    id="suggestion-patience-addition"
    kind="suggestion"
    author={authors.john}
    time="1 min ago"
    diff={[{ type: 'ins', text: 'with unusual patience,' }]}
    active={active === 'addition'}
    onactivate={(nextActive) => activate('addition', nextActive)}
    onaccept={() => complete('Suggestion accepted')}
    onreject={() => complete('Suggestion rejected')}
    onreply={() => complete('Reply added')}
  />
</div>

<style>
  .annotation-examples {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
    align-items: start;
    gap: var(--ds-spacing-4);
  }
</style>
