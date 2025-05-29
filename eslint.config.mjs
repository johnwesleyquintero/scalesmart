// ESLint Flat Config
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import eslintPluginReact from 'eslint-plugin-react';
import eslintConfigNext from '@next/eslint-plugin-next';

export default [
  // Basic ESLint recommended rules
  eslint.configs.recommended,

  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/coverage/**',
      '**/build/**',
      '**/out/**',
      '**/.wescore/**',
      '**/.cache/**',
      '**/test/**',
      '**/__tests__/**',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      'public/pdf.worker.min.mjs',
      'src/app/hooks/use-toast.tsx',
      'src/types/index.d.ts',
      // Explicitly ignore tooling and declaration files that don't need project-level type checking for _this_ ESLint config file
      // These are now handled by tsconfig.eslint.json, but kept here for linting rules general `ignores` if they somehow get picked up elsewhere
      'next-env.d.ts',
      'vitest.config.ts',
      'tailwind.config.ts',
      'postcss.config.mjs',
      'next.config.js',
      'jest.config.js',
      'jest.setup.js',
      'eslint.config.mjs', // Self-reference, important to ignore if parsed as a JS file
      '__mocks__/**/*', // New addition to properly ignore __mocks__ as eslint warning in previous check
    ],
  },
  {
    files: ['**/*.{js,cjs,mjs,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.es2021,
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        structuredClone: 'readonly',
        React: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect', // Auto-detect React version
      },
    },
    plugins: {
      sonarjs,
      react: eslintPluginReact, // Ensure react plugin is available and correctly referenced
      '@next/next': eslintConfigNext, // Add Next.js plugin correctly as an object
    },
    rules: {
      ...eslintPluginReact.configs.recommended.rules, // Include recommended react rules
      ...eslintPluginReact.configs['jsx-runtime'].rules, // Include react jsx-runtime rules
      ...eslintConfigNext.configs.recommended.rules, // Include recommended Next.js rules
      ...eslintConfigNext.configs['core-web-vitals'].rules, // Include Next.js core-web-vitals rules
      'react/prop-types': 'off', // Disable prop-types for React components
      'sonarjs/no-duplicate-string': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/cognitive-complexity': ['error', 15],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'], // Confine TypeScript parsing with project option to src/
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.es2021,
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        structuredClone: 'readonly',
        React: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        warn: 'readonly',
        error: 'readonly',
        info: 'readonly',
      },
      parser: parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Explicitly enable JSX parsing
        },
        project: './tsconfig.eslint.json', // Point to the new tsconfig for ESLint
      },
    },
    settings: {
      react: {
        version: 'detect', // Auto-detect React version
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      sonarjs,
      react: eslintPluginReact, // Add react plugin for TS/TSX files
      '@next/next': eslintConfigNext, // Add Next.js plugin correctly as an object for TS/TSX
    },
    rules: {
      ...eslintPluginReact.configs.recommended.rules, // Include recommended react rules for TS/TSX
      ...eslintPluginReact.configs['jsx-runtime'].rules, // Include react jsx-runtime rules for TS/TSX
      ...eslintConfigNext.configs.recommended.rules, // Include recommended Next.js rules for TS/TSX
      ...eslintConfigNext.configs['core-web-vitals'].rules, // Include Next.js core-web-vitals rules for TS/TSX
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/prop-types': 'off', // Disable prop-types for React components
      'sonarjs/no-duplicate-string': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/cognitive-complexity': ['error', 15],
    },
  },
];
