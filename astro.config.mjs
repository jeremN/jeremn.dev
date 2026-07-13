import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { SITE, BASE } from './site.config.mjs'

// Sanitize agent/author-authored markdown (defense-in-depth) WITHOUT destroying
// Astro's Shiki highlighting. Astro runs its built-in Shiki before user rehype
// plugins, so the default sanitize schema would strip Shiki's inline token
// colors + `astro-code` class, flattening code blocks to plain text. Re-permit
// exactly those presentational attributes on code elements; everything else
// (scripts, event handlers, disallowed tags) is still stripped.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    pre: [...(defaultSchema.attributes?.pre ?? []), 'className', 'style', 'tabIndex', 'dataLanguage'],
    code: [...(defaultSchema.attributes?.code ?? []), 'className', 'style'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className', 'style'],
  },
}

// https://astro.build/config
export default defineConfig({
  site: SITE,
  base: BASE || '/',
  output: 'static',
  integrations: [mdx()],
  markdown: {
    // GFM is on by default. Match the old Shiki theme.
    shikiConfig: {
      theme: 'github-dark',
      // The fence language is only known inside Shiki — the highlighted <pre>
      // carries no class. Stamp it onto the <pre> as data-language (permitted
      // through sanitize via the `dataLanguage` allow-list above) so the client
      // can render a language label on each code block.
      transformers: [
        {
          pre(node) {
            const lang = this.options?.lang
            if (lang && lang !== 'plaintext' && lang !== 'text') {
              node.properties.dataLanguage = lang
            }
          },
        },
      ],
    },
    rehypePlugins: [[rehypeSanitize, sanitizeSchema]],
  },
  vite: { plugins: [tailwindcss()] },
})
