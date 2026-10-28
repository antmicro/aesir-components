export function createPresence(isOpen, duration) {
  let present = $state(isOpen());
  let state = $state(isOpen() ? 'open' : 'closed');
  let timer;

  $effect(() => {
    const open = isOpen();
    clearTimeout(timer);

    if (open) {
      present = true;
      state = 'open';
      return;
    }

    state = 'closed';
    if (present) timer = setTimeout(() => (present = false), duration);

    return () => clearTimeout(timer);
  });

  return {
    get present() {
      return present;
    },
    get state() {
      return state;
    }
  };
}
