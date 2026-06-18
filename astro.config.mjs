import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

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
    pre: [...(defaultSchema.attributes?.pre ?? []), 'className', 'style', 'tabIndex'],
    code: [...(defaultSchema.attributes?.code ?? []), 'className', 'style'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className', 'style'],
  },
}

// https://astro.build/config
export default defineConfig({
  site: 'https://jeremn.dev',
  base: '/',
  output: 'static',
  integrations: [mdx()],
  markdown: {
    // GFM is on by default. Match the old Shiki theme.
    shikiConfig: { theme: 'github-dark' },
    rehypePlugins: [[rehypeSanitize, sanitizeSchema]],
  },
  vite: { plugins: [tailwindcss()] },
})
