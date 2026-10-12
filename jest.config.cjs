const nextJest = require('next/jest');

module.exports = nextJest({ dir: './' })({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  clearMocks: true,
  collectCoverageFrom: ['src/lib/repository.ts', 'src/app/api/account/route.ts', 'src/components/settings/SettingsView.tsx', 'src/lib/hooks/useEntranceAnimation.ts'],
});
