import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import langBash from '@shikijs/langs/bash'
import langCss from '@shikijs/langs/css'
import langGo from '@shikijs/langs/go'
import langHtml from '@shikijs/langs/html'
import langJavascript from '@shikijs/langs/javascript'
import langJson from '@shikijs/langs/json'
import langMarkdown from '@shikijs/langs/markdown'
import langPython from '@shikijs/langs/python'
import langRust from '@shikijs/langs/rust'
import langSql from '@shikijs/langs/sql'
import langTsx from '@shikijs/langs/tsx'
import langTypescript from '@shikijs/langs/typescript'
import githubDark from '@shikijs/themes/github-dark'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { unified } from 'unified'

// The Cloudflare Workers runtime (workerd) forbids runtime WASM instantiation
// ("Wasm code generation disallowed by embedder"), which kills Shiki's default
// oniguruma-WASM engine AND its dynamic grammar loading. So build a fine-grained
// highlighter with the pure-JS regex engine and a fixed set of bundled langs +
// theme — no WASM, no dynamic import. Runs identically in Node and workerd.
async function buildProcessor() {
  const highlighter = await createHighlighterCore({
    themes: [githubDark],
    langs: [
      langTypescript,
      langTsx,
      langJavascript,
      langJson,
      langBash,
      langHtml,
      langCss,
      langMarkdown,
      langPython,
      langRust,
      langGo,
      langSql,
    ],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  })

  // Order matters: sanitize the user-derived tree BEFORE Shiki decorates it.
  // remarkRehype drops raw HTML, rehypeSanitize strips unsafe URLs/attrs, then
  // Shiki adds trusted highlight markup the sanitizer never sees.
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeShikiFromHighlighter, highlighter, { theme: 'github-dark' })
    .use(rehypeStringify)
}

// Build the highlighter once per runtime instance, then reuse it.
let processorPromise: ReturnType<typeof buildProcessor> | null = null

export async function renderMarkdown(markdown: string): Promise<string> {
  processorPromise ??= buildProcessor()
  const processor = await processorPromise
  const file = await processor.process(markdown)
  return String(file)
}
