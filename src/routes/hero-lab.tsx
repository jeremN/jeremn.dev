import { createClientOnlyFn } from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Eyebrow } from '../components/site/Eyebrow'
import { VARIANTS, type LabHandle } from '../components/hero-lab/types'

export const Route = createFileRoute('/hero-lab')({
  head: () => ({ meta: [{ title: 'Black-hole physics lab — jeremn.dev' }] }),
  component: HeroLab,
})

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

// Keep the Three.js sim out of the server bundle (returns undefined on server).
const loadLab = createClientOnlyFn(async (canvas: HTMLCanvasElement) => {
  const { initLab } = await import('../components/hero-lab/lab.client')
  return initLab(canvas)
})

function HeroLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<LabHandle | null>(null)
  const [webgl, setWebgl] = useState<boolean | null>(null)

  useEffect(() => {
    const ok = hasWebGL()
    setWebgl(ok)
    if (!ok || !canvasRef.current) return

    let cancelled = false
    Promise.resolve(loadLab(canvasRef.current))
      .then((handle) => {
        if (cancelled) handle?.dispose()
        else if (handle) handleRef.current = handle
      })
      .catch((err) => {
        // Log the REAL error — never hide it behind a friendly message.
        console.error('[HeroLab] failed to initialise:', err)
        setWebgl(false)
      })

    return () => {
      cancelled = true
      handleRef.current?.dispose()
      handleRef.current = null
    }
  }, [])

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-2">
      <Eyebrow className="block text-accent">Hero lab · not shipped</Eyebrow>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
        Black-hole physics, six ways
      </h1>
      <p className="mt-4 max-w-[60ch] font-display text-lg text-muted">
        The same galaxy and the same cursor in every tile — only the
        warp&nbsp;law changes. Move your mouse over a panel; the hole sits at the
        matching spot in all&nbsp;six so you can compare directly. It idles in a
        slow orbit when you let go.
      </p>

      <div className="relative mt-8 h-[78vh] min-h-[600px] w-full overflow-hidden rounded-lg border border-line">
        {webgl === false ? (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_38%,#3a2a5e_0%,#160f28_46%,#0b0a12_100%)]">
            <p className="font-mono text-sm text-muted">
              WebGL unavailable — can&apos;t render the lab.
            </p>
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-2">
              {VARIANTS.map((v) => (
                <div
                  key={v.id}
                  className="relative border border-line/30 p-3"
                >
                  <div className="inline-block max-w-[30ch] rounded-md bg-ground/55 p-2.5 backdrop-blur-sm">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-mono text-xs"
                        style={{ color: v.accent }}
                      >
                        {String(v.id).padStart(2, '0')}
                      </span>
                      <span className="font-grotesk text-sm font-bold text-ink">
                        {v.name}
                      </span>
                    </div>
                    <code className="mt-1 block font-mono text-[11px] text-accent">
                      {v.law}
                    </code>
                    <p className="mt-1.5 font-mono text-[10.5px] leading-snug text-muted">
                      {v.blurb}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
