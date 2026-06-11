import { defineConfig } from 'vitest/config'

// Standalone config (not the app's vite.config.ts) so unit tests run in plain
// Node, without the Cloudflare/TanStack Start plugins.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
