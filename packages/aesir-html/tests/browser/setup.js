import '../../dist/aesir-core.css';

export function applyTheme(mode) {
  const root = document.documentElement;
  root.dataset.aesirTheme = 'mist';
  root.dataset.aesirAccent = 'blue';
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;

  document.body.style.margin = '0';
  document.body.style.padding = '32px';
  document.body.style.background = 'var(--ds-background)';
  document.body.style.color = 'var(--ds-foreground)';
  document.body.style.fontFamily = 'var(--ds-font-family-sans)';
}

applyTheme('light');
