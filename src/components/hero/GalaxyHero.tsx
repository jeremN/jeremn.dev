import { useEffect, useRef, useState } from 'react'
import { Eyebrow } from '../site/Eyebrow'
import type { GalaxyHandle } from './galaxy.client'

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

export function GalaxyHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<GalaxyHandle | null>(null)
  // null = undetermined (server / first paint); the canvas SSRs either way.
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [soundOn, setSoundOn] = useState(false)

  useEffect(() => {
    const ok = hasWebGL()
    setWebgl(ok)
    if (!ok) return

    let cancelled = false
    // Dynamic import → Three.js + the scene land in their own chunk, fetched
    // only here (client-only), never on /blog or /cv.
    import('./galaxy.client')
      .then(({ initGalaxy }) => {
        if (cancelled || !canvasRef.current) return
        handleRef.current = initGalaxy(canvasRef.current)
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
