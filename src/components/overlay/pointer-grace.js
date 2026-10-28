const pointInPolygon = ({ x, y }, polygon) => {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects = currentPoint.y > y !== previousPoint.y > y && x < ((previousPoint.x - currentPoint.x) * (y - currentPoint.y)) / (previousPoint.y - currentPoint.y) + currentPoint.x;
    if (intersects) inside = !inside;
  }
  return inside;
};

export function isPointerInHoverGraceArea(point, triggerRect, contentRect, placement, tolerance = 8) {
  const horizontalStart = Math.min(triggerRect.left, contentRect.left) - tolerance;
  const horizontalEnd = Math.max(triggerRect.right, contentRect.right) + tolerance;
  const polygon =
    placement === 'top'
      ? [
          { x: contentRect.left - tolerance, y: contentRect.bottom - tolerance },
          { x: contentRect.right + tolerance, y: contentRect.bottom - tolerance },
          { x: triggerRect.right + tolerance, y: triggerRect.top + tolerance },
          { x: triggerRect.left - tolerance, y: triggerRect.top + tolerance }
        ]
      : [
          { x: triggerRect.left - tolerance, y: triggerRect.bottom - tolerance },
          { x: triggerRect.right + tolerance, y: triggerRect.bottom - tolerance },
          { x: contentRect.right + tolerance, y: contentRect.top + tolerance },
          { x: contentRect.left - tolerance, y: contentRect.top + tolerance }
        ];

  if (point.x < horizontalStart || point.x > horizontalEnd) return false;
  return pointInPolygon(point, polygon);
}
