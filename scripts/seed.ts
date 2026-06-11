import 'dotenv/config'
import { getDb } from '../src/db'
import { post } from '../src/db/schema'
import { postInsertSchema } from '../src/db/validators'

const samples = [
  {
    slug: 'hello-world',
    title: 'Hello, world',
    summary: 'The first post on jeremn.dev.',
    status: 'published' as const,
    tags: ['meta'],
    publishedAt: new Date('2026-06-01'),
    bodyMarkdown:
      '# Hello, world\n\nThis blog runs on **TanStack Start** with markdown stored in Turso.\n\n```ts\nconst greeting = "hi";\nconsole.log(greeting);\n```\n',
  },
  {
    slug: 'why-tanstack-start',
    title: 'Why I chose TanStack Start',
    summary: 'Notes on the stack behind this site.',
    status: 'published' as const,
    tags: ['tanstack', 'architecture'],
    publishedAt: new Date('2026-06-05'),
    bodyMarkdown:
      '## Why TanStack Start\n\nType-safe routing, server functions, and a clean SSR story.\n',
  },
]

async function main() {
  const db = getDb()
  for (const s of samples) {
    const values = postInsertSchema.parse(s)
    await db.insert(post).values(values).onConflictDoNothing({ target: post.slug })
    console.log('seeded:', s.slug)
  }
}

main().then(() => process.exit(0))
