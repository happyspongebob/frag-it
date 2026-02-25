import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type Strip = {
  id: string
  x: number
  w: number
  h: number
  delay: number
  fall: number
  rotate: number
  sway: number
  opacity: number
  color: string
}

type PilePiece = {
  id: string
  x: number
  y: number
  w: number
  h: number
  rotate: number
  opacity: number
  color: string
  delay: number
}

type Particle = {
  id: string
  dx: number
  dy: number
  size: number
  delay: number
  duration: number
  opacity: number
  color: string
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

const colors = [
  'rgba(255, 255, 255, 0.80)',
  'rgba(242, 221, 204, 0.70)',
  'rgba(233, 198, 168, 0.62)',
  'rgba(244, 236, 226, 0.72)',
  'rgba(255, 255, 255, 0.55)',
]

export default function ShatterEffect(props: {
  seed: number
}) {
  const reduceMotion = useReducedMotion()

  const strips = useMemo<Strip[]>(() => {
    const list: Strip[] = []
    const count = Math.floor(rand(20, 33))

    const paperW = 360
    const paperH = 170
    const total = paperW - 26
    const step = total / count

    for (let i = 0; i < count; i += 1) {
      const w = rand(8, 18)
      const x = -total / 2 + step * i + rand(-4, 4)
      const h = rand(paperH * 0.65, paperH * 1.15)
      list.push({
        id: `s-${props.seed}-${i}`,
        x,
        w,
        h,
        delay: rand(0, 0.24),
        fall: rand(260, 540),
        rotate: rand(-12, 12),
        sway: rand(-28, 28),
        opacity: rand(0.25, 0.58),
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    return list
  }, [props.seed])

  const particles = useMemo<Particle[]>(() => {
    const list: Particle[] = []
    const count = Math.floor(rand(46, 68))

    for (let i = 0; i < count; i += 1) {
      const angle = rand(-Math.PI, Math.PI)
      const dist = rand(70, 200)
      const dx = Math.cos(angle) * dist
      const dy = Math.sin(angle) * dist * 0.72
      list.push({
        id: `pt-${props.seed}-${i}`,
        dx,
        dy,
        size: rand(6, 12),
        delay: rand(0.12, 2.9),
        duration: rand(1.2, 1.85),
        opacity: rand(0.55, 0.92),
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    return list
  }, [props.seed])

  const pile = useMemo<PilePiece[]>(() => {
    const list: PilePiece[] = []
    const count = Math.floor(rand(22, 33))

    for (let i = 0; i < count; i += 1) {
      list.push({
        id: `p-${props.seed}-${i}`,
        x: rand(-95, 95),
        y: rand(-6, 16),
        w: rand(10, 26),
        h: rand(6, 14),
        rotate: rand(-18, 18),
        opacity: rand(0.32, 0.62),
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: rand(0.85, 1.25),
      })
    }

    return list
  }, [props.seed])

  if (reduceMotion) {
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-[22px] border"
        style={{
          width: '360px',
          height: '170px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.34))',
          borderColor: 'rgba(58, 47, 42, 0.10)',
          boxShadow: '0 18px 42px rgba(58, 47, 42, 0.10)',
          backdropFilter: 'blur(10px)',
        }}
        initial={{ opacity: 0, x: '-50%', y: '-50%', scale: 1 }}
        animate={{
          opacity: [0, 0.9, 0.0],
          scale: [1, 0.985, 0.96],
          y: ['-50%', '-48%', '-46%'],
        }}
        transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
      />

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 z-20 rounded-full"
          data-particle="1"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            border: '1px solid rgba(58, 47, 42, 0.12)',
            boxShadow:
              '0 14px 30px rgba(58, 47, 42, 0.10), 0 0 0 3px rgba(255, 255, 255, 0.22), 0 0 18px rgba(255, 213, 174, 0.55)',
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.9 }}
          animate={{
            opacity: [0, p.opacity, 0],
            x: [0, p.dx],
            y: [0, p.dy],
            scale: [0.9, 1, 0.65],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}

      {strips.map((s) => (
        <motion.div
          key={s.id}
          className="absolute left-1/2 top-1/2 z-10 rounded-md border"
          style={{
            width: `${s.w}px`,
            height: `${s.h}px`,
            background: s.color,
            borderColor: 'rgba(58, 47, 42, 0.10)',
            boxShadow: '0 16px 28px rgba(58, 47, 42, 0.08)',
          }}
          initial={{ opacity: 0, x: s.x, y: -70, rotate: s.rotate, scale: 1 }}
          animate={{
            opacity: [0, s.opacity, 0],
            y: [-70, s.fall],
            x: [s.x, s.x + s.sway, s.x + s.sway * 0.4],
            rotate: [s.rotate, s.rotate + rand(-20, 20)],
            scale: [1, 1, 0.85],
          }}
          transition={{
            duration: rand(2.4, 3.2),
            delay: s.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}

      <div className="absolute inset-x-0 bottom-6">
        <div className="relative mx-auto h-20 w-[420px] max-w-[92%]">
          {pile.map((p) => (
            <motion.div
              key={p.id}
              className="absolute left-1/2 top-1/2 rounded-md border"
              style={{
                width: `${p.w}px`,
                height: `${p.h}px`,
                background: p.color,
                borderColor: 'rgba(58, 47, 42, 0.10)',
                boxShadow: '0 18px 34px rgba(58, 47, 42, 0.10)',
              }}
              initial={{ opacity: 0, x: p.x, y: p.y - 10, rotate: p.rotate, scale: 0.98 }}
              animate={{
                opacity: [0, p.opacity, Math.min(0.75, p.opacity + 0.18)],
                y: [p.y - 10, p.y + 6, p.y + 10],
                scale: [0.98, 1, 1],
              }}
              transition={{
                delay: p.delay,
                duration: rand(0.75, 1.05),
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
