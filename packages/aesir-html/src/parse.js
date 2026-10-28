export function parseJson(value, fallback = []) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
