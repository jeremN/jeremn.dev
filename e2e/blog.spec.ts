import { expect, test } from '@playwright/test'

test('homepage renders the SSR hero name', async ({ page }) => {
  await page.goto('/')
  // Assert the server-rendered hero text (the SEO-critical, deterministic part —
  // not the WebGL canvas).
  await expect(page.getByRole('heading', { name: /Jérémie/ })).toBeVisible()
})

test('blog lists posts and opens one with a highlighted code block', async ({
  page,
}) => {
  await page.goto('/blog')
  const firstPost = page.getByRole('link', { name: 'Hello, world' }).first()
  await expect(firstPost).toBeVisible()
  await firstPost.click()

  // The article page has both a title <h1> and the markdown's own "# Hello, world".
  await expect(
    page.getByRole('heading', { name: 'Hello, world' }).first(),
  ).toBeVisible()
  // Shiki renders fenced code as <pre class="shiki ...">.
  await expect(page.locator('pre.shiki').first()).toBeVisible()
})
