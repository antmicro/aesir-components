import { registerIcons } from './icons/registry.js';

export function registerAesirComponent(tag, { display = 'block', position, zIndex } = {}) {
  const componentStyleId = `${tag}-host-styles`;
  if (!document.getElementById(componentStyleId)) {
    const style = document.createElement('style');
    style.id = componentStyleId;
    style.textContent = `${tag} {
      box-sizing: border-box;
      display: ${display};
      font-family: var(--ds-font-family-sans);
      letter-spacing: var(--ds-font-letter-spacing-normal);
      ${position ? `position: ${position};` : ''}
      ${zIndex ? `z-index: var(${zIndex});` : ''}
    }${tag === 'aesir-scroll-area' ? `\n${tag} { overflow: hidden; }` : ''}`;
    document.head.append(style);
  }

  document.documentElement.classList.add('aesir-html-ready');
}

globalThis.Aesir = Object.assign(globalThis.Aesir ?? {}, {
  registerIcons,
  version: __AESIR_VERSION__
});
