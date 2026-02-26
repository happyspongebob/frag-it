import { useEffect, useMemo, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number
  color: string
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

const colors = [
  'rgba(255, 255, 255, 0.82)',
  'rgba(242, 221, 204, 0.78)',
  'rgba(233, 198, 168, 0.72)',
  'rgba(255, 255, 255, 0.60)',
]

export default function CanvasShatter(props: {
  text: string
  seed: number
  active: boolean
  durationMs?: number
}) {
  const reduceMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const durationMs = props.durationMs ?? 2200

  const maxParticles = useMemo(() => {
    const len = (props.text || '').length
    return Math.min(1200, Math.max(320, 320 + len * 40))
  }, [props.text])

  useEffect(() => {
    if (reduceMotion) return
    if (!props.active) return

    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    const rect = parent.getBoundingClientRect()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = Math.max(1, Math.floor(rect.width))
    const h = Math.max(1, Math.floor(rect.height))

    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ctx2: CanvasRenderingContext2D = ctx

    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0)

    const off = document.createElement('canvas')
    off.width = Math.floor(w * dpr)
    off.height = Math.floor(h * dpr)
    const offCtx = off.getContext('2d')
    if (!offCtx) return

    const offCtx2: CanvasRenderingContext2D = offCtx

    offCtx2.setTransform(dpr, 0, 0, dpr, 0, 0)
    offCtx2.clearRect(0, 0, w, h)

    const text = props.text || ''
    const fontSize = Math.max(18, Math.min(34, Math.floor(w / 18)))
    offCtx2.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, \"PingFang SC\", \"Microsoft YaHei\", sans-serif`
    offCtx2.textAlign = 'center'
    offCtx2.textBaseline = 'middle'
    offCtx2.fillStyle = 'rgba(0,0,0,1)'

    const lines = wrapText(offCtx2, text, Math.min(w * 0.78, 560))
    const lineH = Math.floor(fontSize * 1.35)
    const totalH = Math.max(1, lines.length) * lineH
    const startY = h / 2 - totalH / 2 + lineH / 2

    lines.forEach((line, i) => {
      offCtx2.fillText(line, w / 2, startY + i * lineH)
    })

    const img = offCtx2.getImageData(0, 0, Math.floor(w * dpr), Math.floor(h * dpr))
    const data = img.data

    const particles: Particle[] = []
    const step = Math.max(4, Math.floor(6 * dpr))

    for (let y = 0; y < img.height; y += step) {
      for (let x = 0; x < img.width; x += step) {
        const idx = (y * img.width + x) * 4 + 3
        if (data[idx] > 40) {
          const px = x / dpr
          const py = y / dpr

          const angle = rand(-Math.PI, Math.PI)
          const speed = rand(26, 120)
          const vx = Math.cos(angle) * speed
          const vy = Math.sin(angle) * speed * 0.78 + rand(-42, 10)

          particles.push({
            x: px,
            y: py,
            vx,
            vy,
            r: rand(1.5, 3.2),
            a: rand(0.55, 0.95),
            color: colors[Math.floor(Math.random() * colors.length)],
          })
        }
      }
    }

    if (particles.length > maxParticles) {
      shuffleInPlace(particles)
      particles.length = maxParticles
    }

    const start = performance.now()
    const gravity = rand(-12, 22)

    function frame(now: number) {
      const t = now - start
      const p = Math.min(1, t / durationMs)

      ctx2.clearRect(0, 0, w, h)

      const drag = 0.982
      const drift = 0.36

      for (let i = 0; i < particles.length; i += 1) {
        const pt = particles[i]

        pt.vx *= drag
        pt.vy = pt.vy * drag + gravity * 0.016

        pt.x += (pt.vx * 0.016) + rand(-drift, drift)
        pt.y += (pt.vy * 0.016) + rand(-drift, drift)

        const fade = 1 - p
        const alpha = Math.max(0, pt.a * fade)
        if (alpha <= 0.001) continue

        ctx2.globalAlpha = alpha
        ctx2.fillStyle = pt.color
        ctx2.beginPath()
        ctx2.arc(pt.x, pt.y, pt.r * (0.9 + 0.35 * fade), 0, Math.PI * 2)
        ctx2.fill()
      }

      ctx2.globalAlpha = 1

      if (p < 1) {
        rafRef.current = window.requestAnimationFrame(frame)
      }
    }

    rafRef.current = window.requestAnimationFrame(frame)

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [durationMs, maxParticles, props.active, props.seed, props.text, reduceMotion])

  if (reduceMotion || !props.active) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim()
  if (!cleaned.length) return ['']

  const words = cleaned.split(' ')
  const lines: string[] = []
  let line = ''

  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i]
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test
    } else {
      lines.push(line)
      line = words[i]
    }
  }

  if (line) lines.push(line)
  return lines.slice(0, 3)
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
}
