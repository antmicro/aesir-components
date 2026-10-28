const isEventHandler = (key, value) => typeof key === 'string' && /^on[a-z]/.test(key) && typeof value === 'function';

const classNames = (value) => {
  if (!value) return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(classNames);
  if (typeof value === 'object') return Object.entries(value).flatMap(([name, enabled]) => (enabled ? [name] : []));
  return [];
};

const toKebabCase = (property) => property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const styleText = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim().replace(/;$/, '');
  if (typeof value !== 'object') return '';
  return Object.entries(value)
    .filter(([, entry]) => entry !== undefined && entry !== null && entry !== '')
    .map(([property, entry]) => `${property.startsWith('--') ? property : toKebabCase(property)}:${entry}`)
    .join(';');
};

const chain = (handlers, cancellable) =>
  function mergedHandler(...args) {
    for (const handler of handlers) {
      handler.apply(this, args);
      if (cancellable && args[0]?.defaultPrevented) break;
    }
  };

export function mergeProps(...sources) {
  const result = {};
  const functions = new Map();
  const classes = [];
  const styles = [];

  for (const source of sources) {
    if (!source) continue;
    for (const key of Reflect.ownKeys(source)) {
      const value = source[key];
      if (value === undefined) continue;
      if (key === 'class') {
        classes.push(...classNames(value));
      } else if (key === 'style') {
        const text = styleText(value);
        if (text) styles.push(text);
      } else if (typeof value === 'function') {
        functions.set(key, [...(functions.get(key) ?? []), value]);
      } else {
        result[key] = value;
      }
    }
  }

  if (classes.length) result.class = [...new Set(classes)].join(' ');
  if (styles.length) result.style = `${styles.join(';')};`;
  for (const [key, handlers] of functions) result[key] = handlers.length === 1 ? handlers[0] : chain(handlers, isEventHandler(key, handlers[0]));
  return result;
}
