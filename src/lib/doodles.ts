// Which hand-drawn mark sits at the end of a Writing row.
//
// The comps pair each row with a mark that matches its subject: a padlock on a
// security note, a node cluster on an agents note, braces on a Svelte one. The
// pairing is editorial, so it lives here as data rather than in the template.

export const ROW_MARKS = ['code', 'braces', 'nodes', 'dotgrid', 'padlock'] as const
export type RowMark = (typeof ROW_MARKS)[number]

// Lowercased tag → mark. A post carries several tags; the first one that
// appears here wins, so order the post's frontmatter most-specific first.
const BY_TAG: Record<string, RowMark> = {
  security: 'padlock',
  dependencies: 'padlock',
  renovate: 'padlock',
  agents: 'nodes',
  ci: 'nodes',
  migration: 'nodes',
  svelte: 'braces',
  refactoring: 'braces',
  testing: 'dotgrid',
  tooling: 'code',
  engineering: 'code',
}

/**
 * Pick a row's mark from its tags.
 *
 * An unmapped tag still gets a mark, chosen by hashing the tag rather than
 * defaulting to one shape. Two reasons: a new tag never renders a blank space,
 * and the same tag always resolves to the same mark, so the index does not
 * reshuffle when an unrelated post is published.
 */
export function markForTags(tags: string[]): RowMark {
  for (const tag of tags) {
    const mark = BY_TAG[tag.toLowerCase()]
    if (mark) return mark
  }

  const key = (tags[0] ?? '').toLowerCase()
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return ROW_MARKS[hash % ROW_MARKS.length]
}
