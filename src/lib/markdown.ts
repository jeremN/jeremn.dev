import rehypeShiki from '@shikijs/rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

// Order matters: sanitize the user-derived tree BEFORE Shiki decorates it.
// remarkRehype drops raw HTML (allowDangerousHtml defaults to false), and
// rehypeSanitize strips unsafe URLs/attrs. Shiki then adds trusted highlight
// markup that the sanitizer never sees — so code-block styling survives.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeShiki, { theme: 'github-dark' })
  .use(rehypeStringify)

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown)
  return String(file)
}
