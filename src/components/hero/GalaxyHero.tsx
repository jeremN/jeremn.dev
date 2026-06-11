import { createClientOnlyFn } from '@tanstack/react-start'
import { useEffect, useRef, useState } from 'react'
import { Eyebrow } from '../site/Eyebrow'
import type { GalaxyHandle } from './types'

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

// createClientOnlyFn keeps this body (and its dynamic import of Three.js) OUT of
// the server bundle — it returns undefined on the server. So Three.js lands in
// its own client chunk, fetched only here, never on /blog or /cv.
const loadGalaxy = createClientOnlyFn(async (canvas: HTMLCanvasElement) => {
  const { initGalaxy } = await import('./galaxy.client')
  return initGalaxy(canvas)
})

export function GalaxyHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<GalaxyHandle | null>(null)
  // null = undetermined (server / first paint); the canvas SSRs either way.
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [soundOn, setSoundOn] = useState(false)

  useEffect(() => {
    const ok = hasWebGL()
    setWebgl(ok)
    if (!ok || !canvasRef.current) return

    let cancelled = false
    Promise.resolve(loadGalaxy(canvasRef.current))
      .then((handle) => {
        if (cancelled) handle?.dispose()
        else if (handle) handleRef.current = handle
      })
      .catch((err) => {
        // Log the REAL error (do not hide it behind a friendly message).
        console.error('[GalaxyHero] failed to initialise:', err)
        setWebgl(false)
      })

    return () => {
      cancelled = true
      handleRef.current?.dispose()
      handleRef.current = null
    }
  }, [])

  // CSS-gradient fallback when WebGL is unavailable or init failed.
  if (webgl === false) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_38%,#3a2a5e_0%,#160f28_46%,#0b0a12_100%)]"
      />
    )
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 z-0 h-full w-full"
      />
      <button
        type="button"
        onClick={() => setSoundOn(handleRef.current?.toggleSound() ?? false)}
        className="group fixed bottom-5 right-5 z-10 rounded-full border border-line bg-surface/50 px-3 py-1.5 backdrop-blur transition-colors hover:border-accent/60"
        aria-pressed={soundOn}
      >
        <Eyebrow className="transition-colors group-hover:text-accent">
          {soundOn ? '♪ sound on' : '♪ sound'}
        </Eyebrow>
      </button>
    </>
  )
}
