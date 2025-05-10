import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

import next from '@next/eslint-plugin-next';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...next.configs.recommended,
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: '@typescript-eslint/parser',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
      },
    },
    plugins: {
      next: next,
      '@typescript-eslint': typescript,
      sonarjs: sonarjs,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-explicit-any': 'warn',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': ['error', 15],
      'react/react-in-jsx-scope': 'off',
    },
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/__tests__/**',
      '**/__mocks__/**', // Added this line
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      'eslint.config.js',
      'postcss.config.js',
      'tailwind.config.js',
      'tsconfig.json',
      'next-env.d.ts',
      'next.config.js',
      'next.config.mjs',
      'jest.config.js',
      'jest.config.mjs',
      'jest.setup.js',
      'jest.setup.mjs',
      'jest.env.js',
      'jest.env.mjs',
      'jest.preset.js',
      '.wescore/**',
    ],
  },
];
