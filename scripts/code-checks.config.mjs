/**
 * Configuration for the code-checker script.
 * Define the commands to run and their descriptive names.
 */
export const CHECKS = [
  { command: 'npm run format', name: 'Format Check' },
  { command: 'npm run lint:npx', name: 'Lint Check' },
  { command: 'npm run typecheck', name: 'Type Check' },
  //{ command: 'npm run test', name: 'Unit Tests' },
];
