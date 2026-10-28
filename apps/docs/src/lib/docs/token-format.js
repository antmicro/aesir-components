export const getTokenValue = (definition) => definition?.$value ?? definition?.value ?? definition;

export const parsePxValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return Number.NaN;
  return Number.parseFloat(value.replace('px', ''));
};

export const toRem = (value) => {
  const px = parsePxValue(value);
  if (!Number.isFinite(px)) return '';
  if (px === 1) return '1px';
  return `${(px / 16).toFixed(4).replace(/\.?0+$/, '')}rem`;
};
