import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders basic markdown to HTML', async () => {
    const html = await renderMarkdown('# Hello\n\nWorld')
    expect(html).toContain('<h1')
    expect(html).toContain('World')
  })

  it('strips raw <script> tags from markdown', async () => {
    const html = await renderMarkdown('<script>alert(1)</script>\n\n# Safe')
    expect(html).not.toContain('<script')
  })

  it('strips javascript: URLs from links', async () => {
    const html = await renderMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })

  it('syntax-highlights fenced code blocks', async () => {
    const html = await renderMarkdown('```js\nconst x = 1;\n```')
    // Shiki emits `<pre class="shiki <theme>">` — match the class prefix.
    expect(html).toContain('class="shiki')
  })
})
