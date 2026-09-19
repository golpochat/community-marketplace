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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/common/guards/**/*.ts',
        'src/common/csrf/**/*.ts',
        'src/events/event-bus.service.ts',
        'src/modules/metrics/metrics-scrape.guard.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        statements: 50,
      },
    },
  },
});
