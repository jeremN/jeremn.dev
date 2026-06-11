// Shared types for the hero — kept in a plain (non-`.client`) module with no
// client-only imports, so server code (GalaxyHero.tsx) can reference the type
// without pulling `galaxy.client.ts` (→ three) into the server graph.
export type GalaxyHandle = {
  dispose: () => void
  /** Toggle the opt-in ambient drone; returns true if sound is now audible. */
  toggleSound: () => boolean
}
