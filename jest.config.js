// Unit tests for pure-TS business logic (lib/) — no React Native dependency,
// so plain ts-jest is enough (no jest-expo / simulator needed).
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
