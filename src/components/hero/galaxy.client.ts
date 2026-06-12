import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { GalaxyHandle } from './types'

// Ported 1:1 from design/inspiration/21-hero-final.html (visually approved).
// Imperative Three.js wrapped in a client-only island: the renderer mounts into
// the passed <canvas>, all listeners are removable, and dispose() tears it down.
export function initGalaxy(canvas: HTMLCanvasElement): GalaxyHandle {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const W = () => window.innerWidth
  const H = () => window.innerHeight

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
  renderer.setSize(W(), H())
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x060510)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  const camera = new THREE.PerspectiveCamera(46, W() / H(), 0.1, 100)
  camera.position.set(0, 0, 20)

  scene.add(new THREE.HemisphereLight(0xbcc6ff, 0x2a1838, 0.55))
  scene.add(new THREE.AmbientLight(0xffffff, 0.15))
  const key = new THREE.DirectionalLight(0xffffff, 1.35)
  key.position.set(-4, 5, 9)
  scene.add(key)
  scene.add(new THREE.PointLight(0xffd98a, 1.8, 12, 2))

  // background starfield
  {
    const N = 700
    const p = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      p[i * 3] = (Math.random() - 0.5) * 46
      p[i * 3 + 1] = (Math.random() - 0.5) * 30
      p[i * 3 + 2] = -6 - Math.random() * 24
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    scene.add(
      new THREE.Points(
        g,
        new THREE.PointsMaterial({
          color: 0xb8c0ee,
          size: 0.05,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        }),
      ),
    )
  }

  // LEGO brick geometry (plate + stud)
  const plate = new THREE.CylinderGeometry(0.5, 0.5, 0.34, 20)
  plate.rotateX(Math.PI / 2)
  const stud = new THREE.CylinderGeometry(0.33, 0.33, 0.2, 18)
  stud.rotateX(Math.PI / 2)
  stud.translate(0, 0, 0.24)
  const piece = mergeGeometries([plate, stud])
  piece.scale(0.18, 0.18, 0.18)
  const pieceMat = new THREE.MeshStandardMaterial({
    roughness: 0.5,
    metalness: 0.0,
    envMapIntensity: 0.6,
  })

  const COUNT = coarse ? 4000 : 8000
  const galaxy = new THREE.InstancedMesh(piece, pieceMat, COUNT)
  const P = {
    radius: 7,
    branches: 2,
    spin: 1.35,
    randomness: 0.45,
    power: 3.0,
    ellipse: 1.25,
    bulge: 0.18,
  }
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
  const cIrid = new THREE.Color('#bfeefe')
  const cAlien = new THREE.Color('#9cff3d')
  const tmp = new THREE.Color()
  const alienIdx = (Math.random() * COUNT) | 0
  function pickColor(t: number, i: number): THREE.Color {
    if (i === alienIdx) return cAlien
    const r = Math.random()
    if (r < 0.06) return cWhite
    if (r < 0.09) return cIrid
    for (let k = 1; k < stops.length; k++) {
      if (t <= stops[k][0]) {
        const a = stops[k - 1]
        const b = stops[k]
        return tmp.copy(a[1]).lerp(b[1], (t - a[0]) / (b[0] - a[0]))
      }
    }
    return tmp.copy(stops[6][1])
  }

  const dummy = new THREE.Object3D()
  const baseX = new Float32Array(COUNT)
  const baseY = new Float32Array(COUNT)
  const baseZ = new Float32Array(COUNT)
  const baseS = new Float32Array(COUNT)
  const rotZ = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) {
    const r = Math.random() * P.radius
    const bulgeR = P.radius * P.bulge
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
    baseX[i] = (Math.cos(angle) * r + jx) * P.ellipse
    baseY[i] = Math.sin(angle) * r + jy
    baseZ[i] = Math.random() * 0.5
    baseS[i] = 0.7 + Math.random() * 0.5
    rotZ[i] = Math.floor(Math.random() * 4) * (Math.PI / 2)
    galaxy.setColorAt(i, pickColor(r / P.radius, i))
  }
  if (galaxy.instanceColor) galaxy.instanceColor.needsUpdate = true
  scene.add(galaxy)

  // nebula clusters + "you are here" sun marker
  const spinGroup = new THREE.Group()
  scene.add(spinGroup)
  const NEBULAE = [
    { color: '#8fc0ff', angle: 1.1, radius: 4.7 },
    { color: '#ff7a4d', angle: 4.2, radius: 5.1 },
    { color: '#86ffc8', angle: 5.7, radius: 3.3 },
  ]
  for (const n of NEBULAE) {
    const col = new THREE.Color(n.color)
    const m = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      envMapIntensity: 1,
    })
    const pos = new THREE.Vector3(
      Math.cos(n.angle) * n.radius * P.ellipse,
      Math.sin(n.angle) * n.radius,
      0.7,
    )
    for (let k = 0; k < 9; k++) {
      const b = new THREE.Mesh(piece, m)
      b.position
        .copy(pos)
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 1.1,
            (Math.random() - 0.5) * 1.1,
            (Math.random() - 0.5) * 0.3,
          ),
        )
      b.scale.setScalar(0.9 + Math.random() * 0.8)
      b.rotation.z = Math.random() * Math.PI
      spinGroup.add(b)
    }
  }
  {
    const sp = new THREE.Vector3(
      Math.cos(2.6) * 4.4 * P.ellipse,
      Math.sin(2.6) * 4.4,
      1.0,
    )
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff4d0 }),
    )
    sun.position.copy(sp)
    spinGroup.add(sun)
    const rg = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.03, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0xfff0b0 }),
    )
    rg.position.copy(sp)
    spinGroup.add(rg)
  }
  // scattered outer star plates
  {
    const SN = coarse ? 120 : 240
    const sm = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      emissive: 0x223044,
      emissiveIntensity: 0.2,
    })
    const stars = new THREE.InstancedMesh(piece, sm, SN)
    const d = new THREE.Object3D()
    for (let i = 0; i < SN; i++) {
      const a = Math.random() * Math.PI * 2
      const rr = 8 + Math.random() * 8
      d.position.set(
        Math.cos(a) * rr * 1.2,
        Math.sin(a) * rr,
        -1 - Math.random() * 3,
      )
      d.rotation.z = Math.random() * Math.PI
      d.scale.setScalar(0.5 + Math.random() * 0.5)
      d.updateMatrix()
      stars.setMatrixAt(i, d.matrix)
    }
    scene.add(stars)
  }

  // glowing core
  scene.add(
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 2),
      new THREE.MeshBasicMaterial({ color: 0xfff3cf }),
    ),
  )
  function radialTex(arr: Array<[number, string]>): THREE.CanvasTexture {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 128
    const x = cv.getContext('2d')!
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
    for (const s of arr) g.addColorStop(s[0], s[1])
    x.fillStyle = g
    x.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(cv)
  }
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radialTex([
        [0, 'rgba(255,243,205,0.95)'],
        [0.35, 'rgba(255,200,120,0.4)'],
        [1, 'rgba(255,190,110,0)'],
      ]),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  halo.scale.setScalar(4.6)
  scene.add(halo)

  // cursor-following black hole
  const blackHole = new THREE.Group()
  blackHole.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
    ),
  )
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.05, 14, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd27a }),
  )
  blackHole.add(ring)
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.025, 12, 40),
    new THREE.MeshBasicMaterial({ color: 0xff7a3d }),
  )
  blackHole.add(ring2)
  const bhGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radialTex([
        [0, 'rgba(150,195,255,0.55)'],
        [0.4, 'rgba(120,150,255,0.18)'],
        [1, 'rgba(120,150,255,0)'],
      ]),
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  bhGlow.scale.setScalar(2.2)
  blackHole.add(bhGlow)
  blackHole.position.set(0, 0, 0.8)
  scene.add(blackHole)

  const bh = { x: 0, y: 0, tx: 0, ty: 0 }
  function planeHalf() {
    const h = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
    return { h, w: h * (W() / H()) }
  }
  const onPointerMove = (e: PointerEvent) => {
    const ph = planeHalf()
    bh.tx = ((e.clientX / W()) * 2 - 1) * ph.w
    bh.ty = (-(e.clientY / H()) * 2 + 1) * ph.h
  }
  window.addEventListener('pointermove', onPointerMove)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  // bloom: strength 0.1, radius 0.3, threshold 0.95 (threshold is the key knob)
  // higher threshold = fewer pixels glow; lower strength = dimmer glow.
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(W(), H()),
    0.1,
    0.3,
    0.95,
  )
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  const onResize = () => {
    camera.aspect = W() / H()
    camera.updateProjectionMatrix()
    renderer.setSize(W(), H())
    composer.setSize(W(), H())
  }
  window.addEventListener('resize', onResize)

  // ---- opt-in ambient sound (off by default) ----
  let actx: AudioContext | null = null
  let ambient: GainNode | null = null
  let muted = false
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  function startAudio() {
    if (actx || !AudioCtor) return
    actx = new AudioCtor()
    ambient = actx.createGain()
    ambient.gain.value = 0
    ambient.connect(actx.destination)
    const lp = actx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 440
    lp.connect(ambient)
    for (const f of [55, 55.3, 82.5]) {
      const o = actx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      const g = actx.createGain()
      g.gain.value = 0.5
      o.connect(g)
      g.connect(lp)
      o.start()
    }
    ambient.gain.linearRampToValueAtTime(0.09, actx.currentTime + 2.5)
  }
  function toggleSound(): boolean {
    if (!actx) {
      startAudio()
      return true
    }
    muted = !muted
    ambient?.gain.linearRampToValueAtTime(
      muted ? 0 : 0.09,
      actx.currentTime + 0.3,
    )
    return !muted
  }

  function easeOutBack(x: number) {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
  }
  const G = 4.5
  const HORIZON = 0.6
  // Warp = the two laws chosen in /hero-lab:
  //  · inverse-LINEAR pull `G/(d+ε)` — lensing deflection falls off as 1/d (not
  //    1/d²), so the swirl reaches gracefully across the arm instead of a tight
  //    local pucker.
  //  · tidal spaghettification — within `reach` of the hole, bricks stretch
  //    along the radial pull and thin crosswise (the tidal elongation of matter
  //    falling in), then fade out so nothing pops through the horizon sphere.
  function simulate(rot: number, intro: number) {
    const cR = Math.cos(rot)
    const sR = Math.sin(rot)
    const reach = HORIZON * 2.2
    for (let i = 0; i < COUNT; i++) {
      const bx = baseX[i]
      const by = baseY[i]
      const rx = bx * cR - by * sR
      const ry = bx * sR + by * cR
      const dx = rx - bh.x
      const dy = ry - bh.y
      const d = Math.sqrt(dx * dx + dy * dy) + 1e-3
      let pull = G / (d + 0.6)
      if (pull > d) pull = d // clamp: a brick lands at most ON the hole
      const nx = dx / d
      const ny = dy / d
      const sw = pull * 0.6
      const fx = rx - nx * pull - ny * sw
      const fy = ry - ny * pull + nx * sw
      const s = baseS[i] * intro
      let rz = rotZ[i] + rot
      let sx = s
      let sy = s
      if (d < reach) {
        const t = 1 - d / reach // 0 → 1 toward the centre
        const stretch = 1 + t * t * 3.2
        rz = Math.atan2(ny, nx) // align the brick's long axis to the radial pull
        sx = s * stretch
        sy = s / Math.sqrt(stretch)
        if (d < 0.3) {
          const f = Math.max(0, d / 0.3)
          sx *= f
          sy *= f
        }
      }
      dummy.position.set(fx, fy, baseZ[i])
      dummy.rotation.set(0, 0, rz)
      dummy.scale.set(sx, sy, s)
      dummy.updateMatrix()
      galaxy.setMatrixAt(i, dummy.matrix)
    }
    galaxy.instanceMatrix.needsUpdate = true
  }

  // Manual delta timer (avoids the deprecated THREE.Clock). lastTime === 0 means
  // "uninitialised / just resumed", so the next frame's delta is 0 — discarding
  // any idle gap so the intro animation never jumps after a pause.
  let lastTime = 0
  function getDelta(): number {
    const now = performance.now() / 1000
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
  let elapsed = 0
  let rot = 0
  function loop() {
    if (!running) return
    const dt = Math.min(getDelta(), 0.05)
    elapsed += dt
    rot += dt * 0.055
    const ip = Math.min(elapsed / 1.9, 1)
    const e = 1 - Math.pow(1 - ip, 3)
    camera.position.z = 20 - 7.5 * e
    camera.lookAt(0, 0, 0)
    bh.x += (bh.tx - bh.x) * 0.12
    bh.y += (bh.ty - bh.y) * 0.12
    blackHole.position.x = bh.x
    blackHole.position.y = bh.y
    ring.rotation.z += dt * 0.8
    ring2.rotation.z -= dt * 1.2
    spinGroup.rotation.z = rot
    simulate(rot, easeOutBack(Math.min(elapsed / 1.6, 1)))
    composer.render()
    raf = requestAnimationFrame(loop)
  }

  function setRunning(v: boolean) {
    if (v === running) return
    running = v
    if (v) {
      lastTime = 0 // discard the idle gap so the intro doesn't jump
      raf = requestAnimationFrame(loop)
    } else if (raf) {
      cancelAnimationFrame(raf)
      raf = null
    }
  }

  // Pause when the hero is scrolled past (covered by the opaque content) or the
  // tab is hidden — saves GPU while reading the editorial content below.
  const scrolledPast = () => window.scrollY > window.innerHeight * 1.15
  const shouldRun = () => !document.hidden && !scrolledPast()
  const onVisibility = () => setRunning(shouldRun())
  const onScroll = () => setRunning(shouldRun())
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('scroll', onScroll, { passive: true })

  if (reduced) {
    // static frame: no RAF loop, no cursor warp
    camera.position.z = 12.5
    camera.lookAt(0, 0, 0)
    bh.x = 999
    bh.y = 999
    blackHole.visible = false
    spinGroup.rotation.z = 0.4
    simulate(0.4, 1)
    composer.render()
  } else {
    setRunning(shouldRun())
  }

  function dispose() {
    setRunning(false)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('visibilitychange', onVisibility)
    void actx?.close()
    composer.dispose()
    pmrem.dispose()
    renderer.dispose()
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else if (mat) mat.dispose()
    })
  }

  return { dispose, toggleSound }
}
