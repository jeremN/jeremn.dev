// Living Canvas — the visitor draws on the hero landscape.
//
// Canvas 2D rather than WebGL. The whole feature is smaller than the galaxy it
// replaced, and it degrades to nothing when the guards say no.
//
// Points are stored NORMALISED to the stage box (0..1). A resize then only
// needs a redraw, and a stroke drawn at 1440px still lands correctly after the
// window narrows or the visitor returns to a restored session.

type Point = { x: number; y: number; w: number }
type Stroke = Point[]

const STORAGE_KEY = 'living-canvas'
/** Caps exist so sessionStorage cannot be filled. Section 7.4 of the design
 *  document treats an uncaught QuotaExceededError as a real failure: it would
 *  take the hero down. */
const MAX_STROKES = 60
const MAX_POINTS = 500
const MIN_WIDTH = 1.1
const MAX_WIDTH = 3.4
/** Pointer speed, in px/ms, at which the pen reaches its thinnest. */
const FAST = 2.2
/** Velocity is smoothed over three samples. Raw pointer deltas jitter enough
 *  to make an even drag look ribbed. */
const SMOOTHING = 3
const PARALLAX_PX = 6

export type LivingCanvas = { destroy: () => void }

export function initLivingCanvas(stage: HTMLElement): LivingCanvas | null {
  const canvas = stage.querySelector<HTMLCanvasElement>('[data-draw-canvas]')
  const controls = stage.querySelector<HTMLElement>('[data-draw-controls]')
  const toggle = stage.querySelector<HTMLButtonElement>('[data-draw-toggle]')
  const clear = stage.querySelector<HTMLButtonElement>('[data-draw-clear]')
  const landscape = stage.querySelector<HTMLElement>('[data-landscape]')
  if (!canvas || !controls || !toggle || !clear) return null

  // Section 7.4: gate on the pointer type, not on the viewport width. A touch
  // laptop is a fine-pointer device and should get the feature; a wide phone
  // is not and should not.
  const fine = window.matchMedia('(pointer: fine)')
  if (!fine.matches) {
    stage.dataset.drawAvailable = 'false'
    return null
  }
  stage.dataset.drawAvailable = 'true'

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    stage.dataset.drawAvailable = 'false'
    return null
  }

  // The guards above proved these are present. Binding them here keeps the
  // closures below free of non-null assertions.
  const cv: HTMLCanvasElement = canvas
  const cx: CanvasRenderingContext2D = ctx
  const btnDraw: HTMLButtonElement = toggle
  const btnClear: HTMLButtonElement = clear

  // The control is markup that ships hidden, so the hero is complete without
  // JavaScript. Script reveals it. It is never dead furniture.
  controls.hidden = false

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)')

  let strokes: Stroke[] = load()
  let current: Stroke | null = null
  let drawing = false
  let mode = false
  /** The button latches draw mode. Holding D is momentary and must not clear
   *  the latch on key release. */
  let latched = false
  let speeds: number[] = []
  let last: { x: number; y: number; t: number } | null = null

  function publish() {
    stage.dataset.strokes = String(strokes.length)
  }

  function load(): Stroke[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.slice(-MAX_STROKES) as Stroke[]
    } catch {
      // A corrupt entry or a blocked store must not stop the hero rendering.
      return []
    }
  }

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(strokes.slice(-MAX_STROKES)))
    } catch {
      // Quota, private mode, or a disabled store. Drawing keeps working for
      // this page view; only persistence is lost.
    }
  }

  function size() {
    const rect = stage.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = Math.max(1, Math.round(rect.width * dpr))
    cv.height = Math.max(1, Math.round(rect.height * dpr))
    cx.setTransform(dpr, 0, 0, dpr, 0, 0)
    redraw()
  }

  function redraw() {
    const rect = stage.getBoundingClientRect()
    cx.clearRect(0, 0, rect.width, rect.height)
    // Read the colour off the canvas rather than hardcoding Electric. The
    // element carries `text-accent`, so a theme flip only needs this redraw.
    cx.strokeStyle = getComputedStyle(cv).color
    cx.lineCap = 'round'
    cx.lineJoin = 'round'
    for (const stroke of strokes) drawStroke(stroke, rect)
    if (current) drawStroke(current, rect)
  }

  function drawStroke(stroke: Stroke, rect: DOMRect) {
    if (stroke.length === 1) {
      const p = stroke[0]
      cx.beginPath()
      cx.arc(p.x * rect.width, p.y * rect.height, p.w / 2, 0, Math.PI * 2)
      cx.fillStyle = cx.strokeStyle as string
      cx.fill()
      return
    }
    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i - 1]
      const b = stroke[i]
      cx.beginPath()
      cx.lineWidth = b.w
      cx.moveTo(a.x * rect.width, a.y * rect.height)
      cx.lineTo(b.x * rect.width, b.y * rect.height)
      cx.stroke()
    }
  }

  /** Width falls as the pointer speeds up, the way a real pen thins on a fast
   *  stroke. Speed is the mean of the last three samples. */
  function widthFor(speed: number): number {
    speeds.push(speed)
    if (speeds.length > SMOOTHING) speeds.shift()
    const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length
    const t = Math.min(mean / FAST, 1)
    return MAX_WIDTH - (MAX_WIDTH - MIN_WIDTH) * t
  }

  // ── hotspots ───────────────────────────────────────────────────────────
  // The regions are read from the rendered SVG rather than hardcoded, so they
  // follow the landscape's responsive scaling and cannot drift out of step
  // with the artwork.
  function hotspots(): HTMLElement[] {
    const visible = stage.querySelector<HTMLElement>(
      '[data-landscape-variant="desktop"], [data-landscape-variant="mobile"]',
    )
    const root = visible?.checkVisibility?.() ? visible : stage
    return Array.from(root.querySelectorAll<HTMLElement>('#water, #sun, #plant'))
  }

  const reacting = new Map<Element, number>()

  function react(clientX: number, clientY: number) {
    if (calm.matches) return
    for (const spot of hotspots()) {
      const r = spot.getBoundingClientRect()
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) continue
      spot.classList.add('is-reacting')
      window.clearTimeout(reacting.get(spot))
      reacting.set(
        spot,
        window.setTimeout(() => spot.classList.remove('is-reacting'), 260),
      )
    }
  }

  // ── mode ───────────────────────────────────────────────────────────────
  function setMode(on: boolean) {
    mode = on
    stage.dataset.drawMode = on ? 'on' : 'off'
    cv.style.pointerEvents = on ? 'auto' : 'none'
    cv.style.cursor = on ? 'crosshair' : ''
    btnDraw.setAttribute('aria-pressed', String(on))
    btnClear.hidden = !on
    if (!on) {
      drawing = false
      current = null
      redraw()
    }
  }

  // ── pointer ────────────────────────────────────────────────────────────
  function onPointerDown(e: PointerEvent) {
    if (!mode) return
    cv.setPointerCapture(e.pointerId)
    drawing = true
    speeds = []
    const rect = stage.getBoundingClientRect()
    last = { x: e.clientX, y: e.clientY, t: e.timeStamp }
    current = [
      { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, w: MAX_WIDTH },
    ]
    react(e.clientX, e.clientY)
    redraw()
  }

  function onPointerMove(e: PointerEvent) {
    if (!mode || !drawing || !current || !last) return
    const rect = stage.getBoundingClientRect()
    const dt = Math.max(e.timeStamp - last.t, 1)
    const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y)
    const w = widthFor(dist / dt)
    if (current.length < MAX_POINTS) {
      current.push({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        w,
      })
    }
    last = { x: e.clientX, y: e.clientY, t: e.timeStamp }
    react(e.clientX, e.clientY)
    redraw()
  }

  function onPointerUp() {
    if (!drawing) return
    drawing = false
    if (current && current.length > 0) {
      strokes.push(current)
      if (strokes.length > MAX_STROKES) strokes = strokes.slice(-MAX_STROKES)
      save()
      publish()
    }
    current = null
    last = null
    redraw()
  }

  // ── keyboard ───────────────────────────────────────────────────────────
  function editable(el: Element | null): boolean {
    if (!(el instanceof HTMLElement)) return false
    if (el.isContentEditable) return true
    return /^(input|textarea|select)$/i.test(el.tagName)
  }

  function onKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      if (!mode || strokes.length === 0) return
      e.preventDefault()
      strokes.pop()
      save()
      publish()
      redraw()
      return
    }
    if (e.key === 'Escape' && mode) {
      latched = false
      setMode(false)
      return
    }
    // Section 7.4: a bare D only. A modifier means the visitor is reaching for
    // a browser shortcut, and a focused field means they are typing the letter.
    if (e.key.toLowerCase() !== 'd') return
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
    if (editable(document.activeElement)) return
    if (e.repeat || mode) return
    setMode(true)
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key.toLowerCase() !== 'd') return
    if (latched) return
    setMode(false)
  }

  // ── parallax ───────────────────────────────────────────────────────────
  // Restrained on purpose: six pixels at the corners. It is off while drawing,
  // because the artwork must not slide under the pen.
  // rAF-throttled. A raw pointermove handler that writes an inline style fires
  // far more often than the compositor can use, and each write is a style
  // invalidation.
  let parallaxQueued = false
  let parallaxAt = { x: 0, y: 0 }

  function applyParallax() {
    parallaxQueued = false
    if (!landscape || mode || calm.matches) return
    const rect = stage.getBoundingClientRect()
    const dx = ((parallaxAt.x - rect.left) / rect.width - 0.5) * 2
    const dy = ((parallaxAt.y - rect.top) / rect.height - 0.5) * 2
    landscape.style.translate = `${(-dx * PARALLAX_PX).toFixed(2)}px ${(-dy * PARALLAX_PX).toFixed(2)}px`
  }

  function onStageMove(e: PointerEvent) {
    if (!landscape || mode || calm.matches) return
    parallaxAt = { x: e.clientX, y: e.clientY }
    if (parallaxQueued) return
    parallaxQueued = true
    requestAnimationFrame(applyParallax)
  }

  function onStageLeave() {
    if (landscape) landscape.style.translate = ''
  }

  // ── wiring ─────────────────────────────────────────────────────────────
  const onToggle = () => {
    latched = !mode
    setMode(!mode)
  }
  const onClear = () => {
    strokes = []
    current = null
    save()
    publish()
    redraw()
  }
  const onResize = () => size()
  const themeWatcher = new MutationObserver(redraw)
  const dark = window.matchMedia('(prefers-color-scheme: dark)')

  toggle.addEventListener('click', onToggle)
  clear.addEventListener('click', onClear)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  stage.addEventListener('pointermove', onStageMove)
  stage.addEventListener('pointerleave', onStageLeave)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('resize', onResize)
  dark.addEventListener('change', redraw)
  themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  setMode(false)
  publish()
  size()

  return {
    destroy() {
      toggle.removeEventListener('click', onToggle)
      clear.removeEventListener('click', onClear)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      stage.removeEventListener('pointermove', onStageMove)
      stage.removeEventListener('pointerleave', onStageLeave)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
      dark.removeEventListener('change', redraw)
      themeWatcher.disconnect()
    },
  }
}
