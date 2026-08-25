import type { APIRoute } from 'astro'
import { feedFor } from '../lib/feed'

export const GET: APIRoute = ({ site }) => feedFor('en', site)
