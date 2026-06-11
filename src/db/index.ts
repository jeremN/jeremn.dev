import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function readEnv(name: string): string {
  // process.env works in Node (dev tooling) and, with nodejs_compat, in the
  // Workers runtime when vars/secrets are provided. For local dev the libSQL
  // URL must be HTTP-reachable from workerd (see README: `turso dev`), since
  // workerd has no filesystem for a `file:` SQLite database.
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export function getDb() {
  if (_db) return _db
  const client = createClient({
    url: readEnv('TURSO_DATABASE_URL'),
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  _db = drizzle(client, { schema })
  return _db
}

export type Db = ReturnType<typeof getDb>
