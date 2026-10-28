export const portal = (node, target = 'body') => {
  if (typeof document === 'undefined') return {};
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  const destination = targetEl || document.body;
  destination.appendChild(node);
  return {
    destroy() {
      if (node.parentNode) node.parentNode.removeChild(node);
    }
  };
};
