module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', 'resize-observer-polyfill'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'babel-jest',
      {
        presets: ['@babel/preset-react', '@babel/preset-typescript'],
        plugins: [
          '@babel/plugin-transform-modules-commonjs',
          '@babel/plugin-syntax-dynamic-import',
        ],
      },
    ],
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        plugins: [
          '@babel/plugin-transform-modules-commonjs',
          '@babel/plugin-syntax-dynamic-import',
        ],
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },
  transformIgnorePatterns: ['/node_modules/(?!react-markdown)/'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
