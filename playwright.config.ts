import { defineConfig } from '@playwright/test'

// Dedicated port (not the conventional 3000, which may be occupied on a dev
// machine) + --strictPort so the server fails loudly rather than silently
// landing on another port and letting tests hit the wrong thing.
//
// NOTE: the blog tests read the database. Start `turso dev --db-file local.db`
// first (the dev server reads TURSO_DATABASE_URL from .env → http://127.0.0.1:8080),
// otherwise workerd can't reach a `file:` libSQL db. See README.
const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: `http://localhost:${PORT}` },
})
