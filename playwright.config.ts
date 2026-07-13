import { defineConfig } from '@playwright/test'
import { BASE } from './site.config.mjs'

const origin = 'http://localhost:4321'

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run build && npm run preview',
    // Health-check the served root, which sits under BASE.
    url: `${origin}${BASE}/`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  // Left as the bare origin on purpose: a leading-slash goto() resolves against
  // the origin and would discard a path here. Specs prefix paths with BASE.
  use: { baseURL: origin },
})
