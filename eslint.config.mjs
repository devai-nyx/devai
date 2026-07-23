import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { rootGateIgnorePatterns } from './scripts/managed-worktree-paths.mjs';

const managedRootIgnores = rootGateIgnorePatterns(process.cwd());

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/generated/**',
      'docs/**',
      '.devai/**',
      '.claude/**',
      'examples/**',
      ...managedRootIgnores,
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
