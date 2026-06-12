import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { LabHandle } from './types'

// Six black-hole physics variants rendered side-by-side in ONE WebGL context via
// the scissor/viewport technique (a 3×2 grid). Every view shares the same cursor
// target, mapped to the same galaxy coordinate, so you compare how each warp law
// responds to the identical gesture. The sim is a stateless displacement field —
// recomputed from base positions each frame — so it can never diverge.

const COLS = 3
const ROWS = 2
const COUNT = 2000
const G = 8.0
const HORIZON = 0.6
const CAM_Z = 15
const FOV = 46

// ── shared scratch (no per-instance allocation in the hot loop) ──────────────
const S = { fx: 0, fy: 0, d: 0, nx: 0, ny: 0 }

function inflow(
  rx: number,
  ry: number,
  bx: number,
  by: number,
  pullFn: (d: number, d2: number) => number,
  swirlFn: (d: number, d2: number, pull: number) => number,
) {
  const dx = rx - bx
  const dy = ry - by
  const d2 = dx * dx + dy * dy
  const d = Math.sqrt(d2) + 1e-3
  let pull = pullFn(d, d2)
  if (pull > d) pull = d // clamp: a brick lands at most ON the hole, never past it
  const nx = dx / d
  const ny = dy / d
  const sw = swirlFn(d, d2, pull)
  S.fx = rx - nx * pull - ny * sw
  S.fy = ry - ny * pull + nx * sw
  S.d = d
  S.nx = nx
  S.ny = ny
}

// pull/swirl laws, defined once (closures, no per-call alloc)
const pInvSq = (_d: number, d2: number) => G / (d2 + 0.7)
const pInvLin = (d: number) => 4.5 / (d + 0.6)
const pWeak = (_d: number, d2: number) => 1.4 / (d2 + 1.1)
const swProp = (_d: number, _d2: number, p: number) => p * 0.95
const swSoft = (_d: number, _d2: number, p: number) => p * 0.6
const swWind = (d: number, _d2: number, p: number) =>
  Math.min(p * (0.3 + 1.5 / d), 2.0) // angular momentum: spins up near centre
const swOrbit = (d: number) => Math.min(1.9 / (d + 0.45), 2.3)

export function initLab(canvas: HTMLCanvasElement): LabHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  const cw = () => canvas.clientWidth || 1
  const ch = () => canvas.clientHeight || 1
  renderer.setSize(cw(), ch(), false)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  // ── shared brick geometry + material (matches the tuned hero) ──────────────
  const plate = new THREE.CylinderGeometry(0.5, 0.5, 0.34, 16)
  plate.rotateX(Math.PI / 2)
  const stud = new THREE.CylinderGeometry(0.33, 0.33, 0.2, 14)
  stud.rotateX(Math.PI / 2)
  stud.translate(0, 0, 0.24)
  const piece = mergeGeometries([plate, stud])!
  piece.scale(0.18, 0.18, 0.18)
  const pieceMat = new THREE.MeshStandardMaterial({
    roughness: 0.5,
    metalness: 0.0,
    envMapIntensity: 0.6,
  })

  // ── colour ramp (core → rim), shared ──────────────────────────────────────
  const stops: Array<[number, THREE.Color]> = [
    [0, new THREE.Color('#fff4cf')],
    [0.1, new THREE.Color('#ffd34d')],
    [0.22, new THREE.Color('#ff9a3d')],
    [0.38, new THREE.Color('#ff6b86')],
    [0.56, new THREE.Color('#d24fc4')],
    [0.76, new THREE.Color('#7a4fd0')],
    [1, new THREE.Color('#3f6ad0')],
  ]
  const cWhite = new THREE.Color('#ffffff')
  const tmp = new THREE.Color()
  function rampColor(t: number): THREE.Color {
    if (Math.random() < 0.06) return cWhite
    for (let k = 1; k < stops.length; k++) {
      if (t <= stops[k][0]) {
        const a = stops[k - 1]
        const b = stops[k]
        return tmp.copy(a[1]).lerp(b[1], (t - a[0]) / (b[0] - a[0]))
      }
    }
    return tmp.copy(stops[6][1])
  }

  const P = { radius: 7, branches: 2, spin: 1.35, randomness: 0.45, power: 3.0 }
  const cRed = new THREE.Color('#6a0d0d')
  const cBlack = new THREE.Color('#050307')

  type View = {
    id: number
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    galaxy: THREE.InstancedMesh
    bhGroup: THREE.Group
    ring: THREE.Mesh
    ring2: THREE.Mesh
    baseX: Float32Array
    baseY: Float32Array
    baseZ: Float32Array
    baseS: Float32Array
    rotZ: Float32Array
    baseColors: Float32Array // for variant 6 redshift
  }

  const dummy = new THREE.Object3D()
  const wcol = new THREE.Color()

  function buildView(id: number): View {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x060510)
    scene.environment = envTex

    scene.add(new THREE.HemisphereLight(0xbcc6ff, 0x2a1838, 0.5))
    scene.add(new THREE.AmbientLight(0xffffff, 0.15))
    const key = new THREE.DirectionalLight(0xffffff, 1.2)
    key.position.set(-4, 5, 9)
    scene.add(key)
    scene.add(new THREE.PointLight(0xffd98a, 1.4, 12, 2))

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
    camera.position.set(0, 0, CAM_Z)
    camera.lookAt(0, 0, 0)

    // light starfield for depth
    {
      const N = 180
      const p = new Float32Array(N * 3)
      for (let i = 0; i < N; i++) {
        p[i * 3] = (Math.random() - 0.5) * 30
        p[i * 3 + 1] = (Math.random() - 0.5) * 20
        p[i * 3 + 2] = -6 - Math.random() * 18
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(p, 3))
      scene.add(
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            color: 0xb8c0ee,
            size: 0.06,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
          }),
        ),
      )
    }

    const galaxy = new THREE.InstancedMesh(piece, pieceMat, COUNT)
    const baseX = new Float32Array(COUNT)
    const baseY = new Float32Array(COUNT)
    const baseZ = new Float32Array(COUNT)
    const baseS = new Float32Array(COUNT)
    const rotZ = new Float32Array(COUNT)
    const baseColors = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const r = Math.random() * P.radius
      const bulgeR = P.radius * 0.18
      const angle =
        r < bulgeR
          ? Math.random() * Math.PI * 2
          : ((i % P.branches) / P.branches) * Math.PI * 2 + r * P.spin
      const jx =
        Math.pow(Math.random(), P.power) *
        (Math.random() < 0.5 ? 1 : -1) *
        P.randomness *
        r
      const jy =
        Math.pow(Math.random(), P.power) *
        (Math.random() < 0.5 ? 1 : -1) *
        P.randomness *
        r
      baseX[i] = (Math.cos(angle) * r + jx) * 1.25
      baseY[i] = Math.sin(angle) * r + jy
      baseZ[i] = Math.random() * 0.5
      baseS[i] = 0.7 + Math.random() * 0.5
      rotZ[i] = Math.floor(Math.random() * 4) * (Math.PI / 2)
      const c = rampColor(r / P.radius)
      galaxy.setColorAt(i, c)
      baseColors[i * 3] = c.r
      baseColors[i * 3 + 1] = c.g
      baseColors[i * 3 + 2] = c.b
    }
    if (galaxy.instanceColor) galaxy.instanceColor.needsUpdate = true
    scene.add(galaxy)

    // glowing core
    scene.add(
      new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.45, 2),
        new THREE.MeshBasicMaterial({ color: 0xfff3cf }),
      ),
    )

    // black hole: sphere + two accretion rings + soft glow (calmed values)
    const bhGroup = new THREE.Group()
    bhGroup.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 20, 14),
        new THREE.MeshBasicMaterial({ color: 0x000000 }),
      ),
    )
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.05, 12, 40),
      new THREE.MeshBasicMaterial({ color: 0xffd27a }),
    )
    bhGroup.add(ring)
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.025, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0xff7a3d }),
    )
    bhGroup.add(ring2)
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: radialTex(),
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    glow.scale.setScalar(2.2)
    bhGroup.add(glow)
    bhGroup.position.set(0, 0, 0.8)
    scene.add(bhGroup)

    return {
      id,
      scene,
      camera,
      galaxy,
      bhGroup,
      ring,
      ring2,
      baseX,
      baseY,
      baseZ,
      baseS,
      rotZ,
      baseColors,
    }
  }

  function radialTex(): THREE.CanvasTexture {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 128
    const x = cv.getContext('2d')!
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(150,195,255,0.55)')
    g.addColorStop(0.4, 'rgba(120,150,255,0.18)')
    g.addColorStop(1, 'rgba(120,150,255,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(cv)
    return t
  }

  const views: View[] = []
  for (let i = 0; i < COLS * ROWS; i++) views.push(buildView(i + 1))

  // ── per-variant simulate. Writes instance matrices (and colours for v6). ────
  function simulate(view: View, rot: number) {
    const cR = Math.cos(rot)
    const sR = Math.sin(rot)
    const { baseX, baseY, baseZ, baseS, rotZ, galaxy } = view
    let recolour = false
    for (let i = 0; i < COUNT; i++) {
      const bx = baseX[i]
      const by = baseY[i]
      const rx = bx * cR - by * sR
      const ry = bx * sR + by * cR
      let s = baseS[i]
      let rz = rotZ[i] + rot
      let sx = s
      let sy = s

      switch (view.id) {
        case 1:
          inflow(rx, ry, bh.x, bh.y, pInvSq, swProp)
          if (S.d < HORIZON) s *= Math.max(0, S.d / HORIZON)
          sx = sy = s
          break
        case 2:
          inflow(rx, ry, bh.x, bh.y, pInvLin, swSoft)
          if (S.d < HORIZON) s *= Math.max(0, S.d / HORIZON)
          sx = sy = s
          break
        case 3:
          inflow(rx, ry, bh.x, bh.y, pInvLin, swWind)
          if (S.d < HORIZON) s *= Math.max(0, S.d / HORIZON)
          sx = sy = s
          break
        case 4:
          inflow(rx, ry, bh.x, bh.y, pWeak, swOrbit)
          if (S.d < HORIZON * 0.7) s *= Math.max(0, S.d / (HORIZON * 0.7))
          sx = sy = s
          break
        case 5: {
          inflow(rx, ry, bh.x, bh.y, pInvLin, swSoft)
          const reach = HORIZON * 2.2
          if (S.d < reach) {
            const t = 1 - S.d / reach // 0..1 toward centre
            const stretch = 1 + t * t * 3.2
            rz = Math.atan2(S.ny, S.nx) // align brick length to the radial pull
            sx = s * stretch
            sy = s / Math.sqrt(stretch)
            if (S.d < 0.3) {
              sx *= Math.max(0, S.d / 0.3)
              sy *= Math.max(0, S.d / 0.3)
            }
          } else {
            sx = sy = s
          }
          break
        }
        case 6: {
          inflow(rx, ry, bh.x, bh.y, pInvLin, swSoft)
          if (S.d < HORIZON) s *= Math.max(0, S.d / HORIZON)
          sx = sy = s
          // gravitational redshift: fade colour → red → black near horizon
          const tint = S.d < HORIZON * 1.4 ? 1 - S.d / (HORIZON * 1.4) : 0
          wcol.setRGB(
            view.baseColors[i * 3],
            view.baseColors[i * 3 + 1],
            view.baseColors[i * 3 + 2],
          )
          if (tint > 0) {
            wcol.lerp(cRed, Math.min(tint * 1.3, 1))
            wcol.lerp(cBlack, tint * tint)
            recolour = true
          }
          galaxy.setColorAt(i, wcol)
          break
        }
      }

      dummy.position.set(S.fx, S.fy, baseZ[i])
      dummy.rotation.set(0, 0, rz)
      dummy.scale.set(sx, sy, s)
      dummy.updateMatrix()
      galaxy.setMatrixAt(i, dummy.matrix)
    }
    galaxy.instanceMatrix.needsUpdate = true
    // v6 rewrites colours every frame so cleared tints reset to base.
    if (view.id === 6 && galaxy.instanceColor)
      galaxy.instanceColor.needsUpdate = recolour || true
  }

  // ── cursor → shared galaxy coordinate (same spot in every tile) ────────────
  const bh = { x: 2.2, y: 1.1, tx: 2.2, ty: 1.1 }
  function planeHalf() {
    const aspect = cw() / COLS / (ch() / ROWS)
    const h = Math.tan((FOV / 2) * (Math.PI / 180)) * CAM_Z
    return { h, w: h * aspect }
  }
  let lastMove = -9999
  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    const tw = rect.width / COLS
    const th = rect.height / ROWS
    const lx = (((e.clientX - rect.left) % tw) / tw) * 2 - 1
    const ly = -((((e.clientY - rect.top) % th) / th) * 2 - 1)
    const ph = planeHalf()
    bh.tx = lx * ph.w
    bh.ty = ly * ph.h
    lastMove = nowS()
  }
  canvas.addEventListener('pointermove', onPointerMove)

  function nowS() {
    return performance.now() / 1000
  }

  // ── loop ───────────────────────────────────────────────────────────────────
  let lastTime = 0
  function getDelta() {
    const now = nowS()
    if (lastTime === 0) {
      lastTime = now
      return 0
    }
    const dt = now - lastTime
    lastTime = now
    return dt
  }

  let running = false
  let raf: number | null = null
  let rot = 0
  let idleT = 0

  function loop() {
    if (!running) return
    const dt = Math.min(getDelta(), 0.05)
    rot += dt * 0.04

    // idle: drive the hole in a slow orbit so the page demos itself
    if (nowS() - lastMove > 1.6) {
      idleT += dt
      const ph = planeHalf()
      bh.tx = Math.cos(idleT * 0.6) * ph.w * 0.5
      bh.ty = Math.sin(idleT * 0.9) * ph.h * 0.5
    }
    bh.x += (bh.tx - bh.x) * 0.1
    bh.y += (bh.ty - bh.y) * 0.1

    const w = cw()
    const h = ch()
    const vw = w / COLS
    const vh = h / ROWS
    // Viewport/scissor take CSS-pixel coords; three multiplies by the pixel
    // ratio internally, so we must NOT pre-multiply here.
    renderer.setScissorTest(true)
    for (let i = 0; i < views.length; i++) {
      const view = views[i]
      const col = i % COLS
      const row = (i / COLS) | 0
      // gl y is bottom-up
      const vx = col * vw
      const vy = h - (row + 1) * vh
      view.bhGroup.position.x = bh.x
      view.bhGroup.position.y = bh.y
      view.ring.rotation.z += dt * 0.8
      view.ring2.rotation.z -= dt * 1.2
      simulate(view, rot)
      if (view.camera.aspect !== vw / vh) {
        view.camera.aspect = vw / vh
        view.camera.updateProjectionMatrix()
      }
      renderer.setViewport(vx, vy, vw, vh)
      renderer.setScissor(vx, vy, vw, vh)
      renderer.render(view.scene, view.camera)
    }
    renderer.setScissorTest(false)
    raf = requestAnimationFrame(loop)
  }

  function setRunning(v: boolean) {
    if (v === running) return
    running = v
    if (v) {
      lastTime = 0
      raf = requestAnimationFrame(loop)
    } else if (raf !== null) {
      cancelAnimationFrame(raf)
      raf = null
    }
  }

  function onResize() {
    renderer.setSize(cw(), ch(), false)
  }
  window.addEventListener('resize', onResize)
  const onVisibility = () => setRunning(!document.hidden)
  document.addEventListener('visibilitychange', onVisibility)

  setRunning(true)

  function dispose() {
    setRunning(false)
    canvas.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    for (const v of views) {
      v.scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material as THREE.Material | THREE.Material[]
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else if (mat) mat.dispose()
      })
    }
    pieceMat.dispose()
    piece.dispose()
    envTex.dispose()
    pmrem.dispose()
    renderer.dispose()
  }

  return { dispose }
}
