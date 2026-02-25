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

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

const colors = [
  'rgba(255, 255, 255, 0.78)',
  'rgba(247, 199, 167, 0.62)',
  'rgba(242, 177, 132, 0.62)',
  'rgba(244, 214, 160, 0.58)',
  'rgba(234, 179, 194, 0.50)',
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

      {strips.map((s) => (
        <motion.div
          key={s.id}
          className="absolute left-1/2 top-1/2 rounded-md border"
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
            duration: rand(1.25, 1.75),
            delay: s.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </div>
  )
}
