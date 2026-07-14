import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'stores/**/*.test.ts', 'components/**/*.test.tsx'],
    environmentMatchGlobs: [['components/**', 'jsdom']],
  },
});
