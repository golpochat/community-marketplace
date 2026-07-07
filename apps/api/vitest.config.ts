import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
