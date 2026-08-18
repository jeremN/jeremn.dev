import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { BASE } from '../site.config.mjs'

const stageOf = (page: Page) => page.locator('[data-canvas-stage]')

/** Draws one stroke inside the stage, in stage-relative pixels. */
async function draw(page: Page, points: [number, number][]) {
  await stageOf(page).scrollIntoViewIfNeeded()
  const box = await stageOf(page).boundingBox()
  if (!box) throw new Error('stage has no box')
  await page.mouse.move(box.x + points[0][0], box.y + points[0][1])
  await page.mouse.down()
  for (const [x, y] of points.slice(1)) {
    await page.mouse.move(box.x + x, box.y + y, { steps: 6 })
  }
  await page.mouse.up()
}

test.describe('living canvas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(stageOf(page)).toHaveAttribute('data-draw-available', 'true')
  })

  test('starts off, with the canvas transparent to the pointer', async ({ page }) => {
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'off')
    await expect(page.locator('[data-draw-canvas]')).toHaveCSS('pointer-events', 'none')
    await expect(page.locator('[data-draw-toggle]')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('[data-draw-clear]')).toBeHidden()
  })

  test('the control toggles draw mode', async ({ page }) => {
    await page.locator('[data-draw-toggle]').click()
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'on')
    await expect(page.locator('[data-draw-canvas]')).toHaveCSS('pointer-events', 'auto')
    await expect(page.locator('[data-draw-toggle]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-draw-clear]')).toBeVisible()

    await page.locator('[data-draw-toggle]').click()
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'off')
  })

  test('Esc exits', async ({ page }) => {
    await page.locator('[data-draw-toggle]').click()
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'on')
    await page.keyboard.press('Escape')
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'off')
  })

  test('holding D draws and releasing it exits', async ({ page }) => {
    await page.keyboard.down('d')
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'on')
    await page.keyboard.up('d')
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'off')
  })

  test('releasing D does not cancel a latched session', async ({ page }) => {
    await page.locator('[data-draw-toggle]').click()
    await page.keyboard.down('d')
    await page.keyboard.up('d')
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'on')
  })

  // Section 7.4 names this exact failure: typing "d" in a future search box
  // must not open draw mode.
  test('D is ignored while a form field has focus', async ({ page }) => {
    await page.evaluate(() => {
      const input = document.createElement('input')
      input.id = 'probe'
      document.body.append(input)
      input.focus()
    })
    await page.keyboard.press('d')
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'off')
    await expect(page.locator('#probe')).toHaveValue('d')
  })

  test('D with a modifier held is ignored', async ({ page }) => {
    await page.keyboard.press('Control+d')
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'off')
    await page.keyboard.press('Shift+d')
    await expect(stageOf(page)).toHaveAttribute('data-draw-mode', 'off')
  })

  test('records a stroke and undoes the last one', async ({ page }) => {
    await page.locator('[data-draw-toggle]').click()
    await draw(page, [[200, 120], [320, 150], [460, 130]])
    await expect(stageOf(page)).toHaveAttribute('data-strokes', '1')
    await draw(page, [[200, 200], [340, 230]])
    await expect(stageOf(page)).toHaveAttribute('data-strokes', '2')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(stageOf(page)).toHaveAttribute('data-strokes', '1')
  })

  test('Clear removes every stroke', async ({ page }) => {
    await page.locator('[data-draw-toggle]').click()
    await draw(page, [[200, 120], [320, 150]])
    await expect(stageOf(page)).toHaveAttribute('data-strokes', '1')
    await page.locator('[data-draw-clear]').click()
    await expect(stageOf(page)).toHaveAttribute('data-strokes', '0')
  })

  test('strokes survive a reload and stay inside the session', async ({ page }) => {
    await page.locator('[data-draw-toggle]').click()
    await draw(page, [[220, 140], [360, 170]])
    await expect(stageOf(page)).toHaveAttribute('data-strokes', '1')

    await page.reload()
    await expect(stageOf(page)).toHaveAttribute('data-strokes', '1')

    // sessionStorage, not localStorage: a new context is a new visit.
    const fresh = await page.context().browser()!.newContext()
    const other = await fresh.newPage()
    await other.goto(`${page.url()}`)
    await expect(other.locator('[data-canvas-stage]')).toHaveAttribute('data-strokes', '0')
    await fresh.close()
  })

  test('the pen actually marks the canvas', async ({ page }) => {
    await page.locator('[data-draw-toggle]').click()
    await stageOf(page).scrollIntoViewIfNeeded()
    const before = await page
      .locator('[data-draw-canvas]')
      .evaluate((c) => (c as HTMLCanvasElement).toDataURL().length)
    await draw(page, [[200, 120], [400, 200], [600, 140]])
    const after = await page
      .locator('[data-draw-canvas]')
      .evaluate((c) => (c as HTMLCanvasElement).toDataURL().length)
    expect(after).toBeGreaterThan(before)
  })

  test('the hero is complete before the script runs', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`${BASE}/`)
    // The landscape is server-rendered, so it must be there regardless.
    await expect(page.locator('[data-landscape]')).toBeAttached()
    // The control ships hidden. Only the client module reveals it, so it is
    // never dead furniture on a page that cannot use it.
    await expect(page.locator('[data-draw-controls]')).toBeHidden()
    await context.close()
  })
})

test.describe('living canvas guards', () => {
  // Section 7.4 gates on the pointer type rather than the width. `hasTouch`
  // makes Chromium report `pointer: coarse` while keeping the desktop
  // viewport, so this isolates the pointer gate from the breakpoint.
  test('the control stays hidden on a coarse pointer', async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true })
    const page = await context.newPage()
    await page.goto(`${BASE}/`)
    await expect(page.locator('[data-canvas-stage]')).toHaveAttribute('data-draw-available', 'false')
    await expect(page.locator('[data-draw-controls]')).toBeHidden()
    await context.close()
  })

  test('reduced motion keeps drawing but stops the reactions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${BASE}/`)
    await page.locator('[data-draw-toggle]').click()
    await stageOf(page).scrollIntoViewIfNeeded()

    const sun = page.locator('[data-landscape-variant="desktop"] #sun')
    const box = await sun.boundingBox()
    if (!box) throw new Error('sun has no box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    // Read it now, not through a retrying matcher. The class self-removes after
    // 260ms, so `not.toHaveClass` would go green on the timeout even if the
    // preference were ignored.
    const reacted = await sun.evaluate((el) => el.classList.contains('is-reacting'))
    await page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height / 2, { steps: 4 })
    await page.mouse.up()

    expect(reacted).toBe(false)
    // Drawing is user-initiated, so it survives the preference.
    await expect(page.locator('[data-canvas-stage]')).toHaveAttribute('data-strokes', '1')
  })

  test('a stroke across the sun makes it react', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.locator('[data-draw-toggle]').click()
    await stageOf(page).scrollIntoViewIfNeeded()
    const sun = page.locator('[data-landscape-variant="desktop"] #sun')
    const box = await sun.boundingBox()
    if (!box) throw new Error('sun has no box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    const reacted = await sun.evaluate((el) => el.classList.contains('is-reacting'))
    await page.mouse.up()
    expect(reacted).toBe(true)
  })

  // The tree cluster sits on a group carrying a transform attribute. `scale`
  // and `rotate` displaced it by 34px and lifted the trees off the ridge, so
  // the reaction uses `translate`. Assert the seat, not the property.
  test('the plant reaction does not move the trees off the ridge', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const plant = page.locator('[data-landscape-variant="desktop"] #plant')
    const before = await plant.boundingBox()
    await plant.evaluate((el) => {
      ;(el as HTMLElement).style.transition = 'none'
      el.classList.add('is-reacting')
    })
    const after = await plant.boundingBox()
    if (!before || !after) throw new Error('plant has no box')
    expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(4)
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1)
  })
})
