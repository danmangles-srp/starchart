import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

// Load .env so Tier 2.5 data-access tests can reach DATABASE_URL_TEST.
loadEnv();

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // The logic surface (structure.md): pure domain/data/server + lib. Components
      // (.tsx screens) and app/ route files are verified by component tests, not counted.
      include: ['src/lib/**/*.ts', 'src/theme/**/*.ts', 'src/features/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/*.d.ts', 'src/lib/db.ts', 'src/features/**/components/**'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
