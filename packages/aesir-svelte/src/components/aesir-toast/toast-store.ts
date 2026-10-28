import { get, writable } from 'svelte/store';

export type ToastVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive' | 'loading';
export type ToastAction = { label: string; onClick?: () => void; dismiss?: boolean };
export type ToastItem = { id: number; title: string; description?: string; variant: ToastVariant; action?: ToastAction; state: 'open' | 'closing' };
export type ToastOptions = { title: string; description?: string; variant?: ToastVariant; duration?: number; action?: ToastAction };
type ToastResult = string | { title?: string; description?: string; action?: ToastAction };
type ToastMessage<Value = unknown> = ToastResult | ((value: Value) => ToastResult);
type ToastFunction = {
  (options: ToastOptions): number;
  success: ToastShortcut;
  info: ToastShortcut;
  warning: ToastShortcut;
  error: ToastShortcut;
  loading: ToastShortcut;
  update: typeof updateToast;
  dismiss: typeof dismissToast;
  promise: <Value>(promise: Promise<Value> | (() => Promise<Value>), messages?: { loading?: ToastMessage; success?: ToastMessage<Value>; error?: ToastMessage; duration?: number }) => Promise<Value>;
};
type ToastShortcut = (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description' | 'variant'>) => number;

export const toasts = writable<ToastItem[]>([]);
let sequence = 0;
const exitDuration = 220;
const exitTimers = new Map<number, ReturnType<typeof setTimeout>>();
const dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();
const explicitDurations = new Map<number, number>();

function clearDismissTimer(id: number) {
  const timer = dismissTimers.get(id);
  if (timer) clearTimeout(timer);
  dismissTimers.delete(id);
}

function scheduleDismiss(id: number, duration: number) {
  clearDismissTimer(id);
  if (duration <= 0 || !get(toasts).some((item) => item.id === id)) return;
  dismissTimers.set(
    id,
    setTimeout(() => {
      dismissTimers.delete(id);
      dismissToast(id);
    }, duration)
  );
}

export function updateToast(id: number, patch: Partial<Omit<ToastItem, 'id'>> & { duration?: number }) {
  if (typeof window === 'undefined') return id;
  const current = get(toasts).find((item) => item.id === id);
  if (!current) return id;
  const { duration, ...next } = patch;
  if (next.state === 'open') {
    clearTimeout(exitTimers.get(id));
    exitTimers.delete(id);
  }
  toasts.update((items) => items.map((item) => (item.id === id ? { ...item, ...next } : item)));
  const updated = { ...current, ...next };
  if (duration !== undefined) {
    explicitDurations.set(id, duration);
    scheduleDismiss(id, duration);
  } else if (current.state === 'closing' && next.state === 'open') {
    scheduleDismiss(id, explicitDurations.get(id) ?? defaultDuration(updated.variant, updated.action));
  } else if (!explicitDurations.has(id) && defaultDuration(current.variant, current.action) !== defaultDuration(updated.variant, updated.action)) {
    scheduleDismiss(id, defaultDuration(updated.variant, updated.action));
  }
  return id;
}

function resolveMessage<Value>(message: ToastMessage<Value> | undefined, value: Value, fallbackTitle: string) {
  const resolved = typeof message === 'function' ? message(value) : message;
  if (typeof resolved === 'string') return { title: resolved, description: undefined, action: undefined };
  return { title: resolved?.title ?? fallbackTitle, description: resolved?.description, action: resolved?.action };
}

export function dismissToast(id: number) {
  if (typeof window === 'undefined' || exitTimers.has(id) || !get(toasts).some((item) => item.id === id)) return;
  clearDismissTimer(id);
  updateToast(id, { state: 'closing' });
  exitTimers.set(
    id,
    setTimeout(() => {
      toasts.update((items) => items.filter((item) => item.id !== id));
      exitTimers.delete(id);
      explicitDurations.delete(id);
    }, exitDuration)
  );
}

const defaultDuration = (variant: ToastVariant, action?: ToastAction) => (variant === 'destructive' || variant === 'loading' || action?.label ? 0 : 4000);

export const toast = (({ title, description, variant = 'default', duration, action }: ToastOptions) => {
  // Notifications are browser UI, never process-wide state during SSR.
  if (typeof window === 'undefined') return 0;
  const id = ++sequence;
  if (duration !== undefined) explicitDurations.set(id, duration);
  toasts.update((items) => [...items, { id, title, description, variant, action, state: 'open' }]);
  scheduleDismiss(id, duration ?? defaultDuration(variant, action));
  return id;
}) as ToastFunction;

toast.success = (title, description, options = {}) => toast({ title, description, variant: 'success', ...options });
toast.info = (title, description, options = {}) => toast({ title, description, variant: 'info', ...options });
toast.warning = (title, description, options = {}) => toast({ title, description, variant: 'warning', ...options });
toast.error = (title, description, options = {}) => toast({ title, description, variant: 'destructive', ...options });
toast.loading = (title, description, options = {}) => toast({ title, description, variant: 'loading', ...options });
toast.update = updateToast;
toast.dismiss = dismissToast;
toast.promise = (promise, messages = {}) => {
  if (typeof window === 'undefined') return Promise.resolve().then(() => (typeof promise === 'function' ? promise() : promise));
  const loading = resolveMessage(messages.loading, undefined, 'Loading…');
  const id = toast({ ...loading, variant: 'loading' });
  let task;
  try {
    task = typeof promise === 'function' ? promise() : promise;
  } catch (error) {
    task = Promise.reject(error);
  }
  return Promise.resolve(task).then(
    (result) => {
      const success = resolveMessage(messages.success, result, 'Completed');
      updateToast(id, { ...success, variant: 'success', state: 'open', duration: messages.duration });
      return result;
    },
    (error) => {
      const failure = resolveMessage(messages.error, error, 'Something went wrong');
      updateToast(id, { ...failure, variant: 'destructive', state: 'open', duration: messages.duration });
      throw error;
    }
  );
};
