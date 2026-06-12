// Shared, dependency-free metadata for the black-hole physics lab.
// Kept in a plain (non-`.client`) module — no Three.js — so the route component
// can SSR the labels/descriptions without pulling `lab.client.ts` (→ three) into
// the server bundle. The sim keys its warp functions off these same `id`s.
export type LabHandle = { dispose: () => void }

export type Variant = {
  id: number
  /** Short display name. */
  name: string
  /** The force/displacement law, as a one-line formula. */
  law: string
  /** One-sentence physics rationale + what it looks like. */
  blurb: string
  /** Tile accent (matches a galaxy hue) for the label. */
  accent: string
}

export const VARIANTS: Variant[] = [
  {
    id: 1,
    name: 'Inverse-square (current)',
    law: 'pull = G / (d² + ε)',
    blurb:
      'Softened Newtonian gravity. The ε prevents the singularity at d→0. Tight, very local pucker — only bricks right at the cursor move.',
    accent: '#ffd34d',
  },
  {
    id: 2,
    name: 'Inverse-linear (lensing)',
    law: 'pull = G / (d + ε)',
    blurb:
      'Gravitational-lensing deflection falls off as 1/d, not 1/d². More faithful, and the warp reaches gracefully across the whole arm.',
    accent: '#ff9a3d',
  },
  {
    id: 3,
    name: 'Angular-momentum spiral',
    law: 'swirl ∝ pull · (a + k/d)',
    blurb:
      'Infalling matter conserves angular momentum (v_θ ∝ 1/r), so the swirl intensifies near the centre — bricks whip into a true accretion spiral.',
    accent: '#ff6b86',
  },
  {
    id: 4,
    name: 'Orbit (stable disk)',
    law: 'tangential ≫ radial',
    blurb:
      'Bias tangential over radial so bricks circle the hole instead of diving in. A swirling disk forms around the cursor and holds — calm, hypnotic.',
    accent: '#d24fc4',
  },
  {
    id: 5,
    name: 'Tidal spaghettification',
    law: 'stretch ∝ 1/d along r̂',
    blurb:
      'Near the horizon, stretch each brick radially and thin it crosswise — the tidal elongation of matter falling in. Same pull, dramatic shape.',
    accent: '#7a4fd0',
  },
  {
    id: 6,
    name: 'Gravitational redshift',
    law: 'colour → red → black, d < r_h',
    blurb:
      'As bricks cross the horizon they redshift then darken — light climbing out of the well loses energy. Layered on the inflow as a per-brick colour fade.',
    accent: '#3f6ad0',
  },
]
