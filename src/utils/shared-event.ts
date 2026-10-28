type SharedEventHandler<T extends Event = Event> = (event: T) => void;

type SharedEventRegistry = {
  handlers: Set<SharedEventHandler>;
  listener: EventListener;
};

const registries = new WeakMap<EventTarget, Map<string, SharedEventRegistry>>();

export const listenShared = <T extends Event>(target: EventTarget, type: string, handler: SharedEventHandler<T>, capture = false) => {
  const key = `${type}:${capture}`;
  let targetRegistries = registries.get(target);
  if (!targetRegistries) {
    targetRegistries = new Map();
    registries.set(target, targetRegistries);
  }

  let registry = targetRegistries.get(key);
  if (!registry) {
    const handlers = new Set<SharedEventHandler>();
    const listener: EventListener = (event) => {
      for (const subscriber of [...handlers]) subscriber(event);
    };
    registry = { handlers, listener };
    targetRegistries.set(key, registry);
    target.addEventListener(type, listener, capture);
  }

  registry.handlers.add(handler as SharedEventHandler);
  let active = true;

  return () => {
    if (!active) return;
    active = false;
    registry?.handlers.delete(handler as SharedEventHandler);
    if (registry?.handlers.size) return;
    target.removeEventListener(type, registry?.listener as EventListener, capture);
    if (targetRegistries?.get(key) === registry) targetRegistries.delete(key);
    if (!targetRegistries?.size) registries.delete(target);
  };
};
