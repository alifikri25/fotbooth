import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'] },
  build: {
    target: ['es2022', 'safari16'],
    rolldownOptions: {
      onwarn(warning, warn) {
        // This is a browser-only application; Lucide's React server boundary directive is irrelevant here.
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          warning.message.includes('use client') &&
          warning.id?.includes('lucide-react')
        )
          return;
        warn(warning);
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 200,
      ignored: ['**/playwright-report/**', '**/test-results/**', '**/docs/qa/**'],
    },
  },
});
