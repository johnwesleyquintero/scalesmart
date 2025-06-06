// ESLint Flat Config
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintConfigNext from '@next/eslint-plugin-next';

// Common ignores for all configurations
const commonIgnores = [
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
  'next-env.d.ts',
  'vitest.config.ts',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'next.config.js',
  'jest.config.js',
  'jest.setup.js',
  'eslint.config.mjs',
  '__mocks__/**/*',
];

// Common globals for all configurations
const commonGlobals = {
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
};

// Common React settings for all configurations
const reactSettings = {
  react: {
    version: 'detect', // Auto-detect React version
  },
};

// Common plugins for all configurations
const commonPlugins = {
  sonarjs,
  react: eslintPluginReact,
  'react-hooks': eslintPluginReactHooks,
  '@next/next': eslintConfigNext,
};

// Common rules for all configurations
const commonRules = {
  ...eslintPluginReact.configs.recommended.rules,
  ...eslintPluginReact.configs['jsx-runtime'].rules,
  ...eslintPluginReactHooks.configs.recommended.rules,
  ...eslintConfigNext.configs.recommended.rules,
  ...eslintConfigNext.configs['core-web-vitals'].rules,
  'react/prop-types': 'off',
  'sonarjs/no-duplicate-string': 'error',
  'sonarjs/no-identical-functions': 'error',
  'sonarjs/cognitive-complexity': ['error', 15],
};

// Base configuration for JavaScript files
const jsConfig = {
  files: ['**/*.{js,cjs,mjs,jsx}'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: commonGlobals,
  },
  settings: reactSettings,
  plugins: commonPlugins,
  rules: commonRules,
};

// Base configuration for TypeScript files
const tsConfig = {
  files: ['src/**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      ...commonGlobals,
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
  settings: reactSettings,
  plugins: {
    ...commonPlugins,
    '@typescript-eslint': tseslint,
  },
  rules: {
    ...commonRules,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};

export default [
  eslint.configs.recommended,
  { ignores: commonIgnores },
  jsConfig,
  tsConfig,
];
