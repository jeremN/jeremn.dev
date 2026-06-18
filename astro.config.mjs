import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import rehypeSanitize from 'rehype-sanitize'

// https://astro.build/config
export default defineConfig({
  site: 'https://jeremn.dev',
  base: '/',
  output: 'static',
  integrations: [mdx()],
  markdown: {
    // GFM is on by default. Match the old Shiki theme.
    shikiConfig: { theme: 'github-dark' },
    // Defense-in-depth for agent-authored markdown. Astro applies rehype
    // plugins after parsing, before stringify — i.e. sanitize the tree.
    rehypePlugins: [rehypeSanitize],
  },
  vite: { plugins: [tailwindcss()] },
})
