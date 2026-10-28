const angleDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

export function isPointerMovingTowardSubmenu(previous, current, rect, side = 'right', tolerance = Math.PI / 12) {
  if (!previous || !current || !rect) return false;

  const movingHorizontally = side === 'right' ? current.x > previous.x : current.x < previous.x;
  if (!movingHorizontally) return false;

  const edgeX = side === 'right' ? rect.left : rect.right;
  const pointerAngle = Math.atan2(current.y - previous.y, current.x - previous.x);
  const centerAngle = Math.atan2((rect.top + rect.bottom) / 2 - previous.y, edgeX - previous.x);
  const topAngle = Math.atan2(rect.top - previous.y, edgeX - previous.x);
  const bottomAngle = Math.atan2(rect.bottom - previous.y, edgeX - previous.x);
  const allowedAngle = Math.max(angleDistance(topAngle, centerAngle), angleDistance(bottomAngle, centerAngle)) + tolerance;

  return angleDistance(pointerAngle, centerAngle) <= allowedAngle;
}
