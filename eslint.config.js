import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteConfig from './apps/docs/svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

/** @type {import('eslint').Linter.Config[]} */ export default [
  includeIgnoreFile(gitignorePath),
  { ignores: ['packages/aesir-html/dist/**'] },
  js.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  {
    files: ['packages/aesir-html/src/index.js', 'packages/aesir-html/src/register.js'],
    languageOptions: { globals: { __AESIR_VERSION__: 'readonly' } }
  },

  {
    files: ['**/*.ts'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: { parser: tsParser },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.js'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: { parserOptions: { parser: tsParser, svelteConfig } },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  },
  {
    files: ['packages/aesir-svelte/src/components/aesir-button/*.svelte', 'packages/aesir-svelte/src/components/aesir-breadcrumb/*.svelte'],
    rules: { 'svelte/no-navigation-without-resolve': 'off' }
  }
];
