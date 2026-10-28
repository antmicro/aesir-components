import { createHighlighter } from 'shiki';

const themes = ['github-light', 'github-dark-high-contrast'];
const languages = ['svelte', 'javascript', 'typescript', 'html', 'css', 'bash', 'markdown', 'yaml', 'json', 'text'];

const normalizeLanguage = (language = 'text') => {
  const normalized = String(language).toLowerCase();
  if (normalized === 'svx') return 'svelte';
  if (normalized === 'md') return 'markdown';
  if (normalized === 'yml') return 'yaml';
  if (normalized === 'ts') return 'typescript';
  if (normalized === 'js') return 'javascript';
  if (normalized === 'sh' || normalized === 'shell' || normalized === 'zsh') return 'bash';
  return normalized || 'text';
};

const escapeHtml = (value = '') => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export const createDocsHighlighter = async () => {
  const highlighter = await createHighlighter({ themes, langs: languages });

  const highlightedLines = (code, language = 'text', theme = 'github-light') => {
    let tokens;
    try {
      tokens = highlighter.codeToTokens(code, { lang: normalizeLanguage(language), theme });
    } catch {
      tokens = highlighter.codeToTokens(code, { lang: 'text', theme });
    }

    return {
      fg: tokens.fg,
      lines: tokens.tokens.map((line) => {
        const lineTokens = line
          .map((token) => {
            let style = `color: ${token.color};`;
            if (token.fontStyle & 1) style += 'font-style: italic;';
            if (token.fontStyle & 2) style += 'font-weight: 600;';
            if (token.fontStyle & 4) style += 'text-decoration: underline;';
            return `<span style="${style}">${escapeHtml(token.content)}</span>`;
          })
          .join('');
        return lineTokens || '&nbsp;';
      })
    };
  };

  const highlight = (code, language = 'text', theme = 'github-light') => {
    const result = highlightedLines(code, language, theme);
    return `<pre class="shiki" style="color: ${result.fg}; background: transparent;"><code>${result.lines.map((line) => `<span class="line">${line}</span>`).join('\n')}</code></pre>`;
  };

  highlight.lines = (code, language = 'text', theme = 'github-light') => highlightedLines(code, language, theme).lines;
  return highlight;
};
