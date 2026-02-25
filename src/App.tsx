import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import ComfortMessage, { useComfortMessage } from './components/ComfortMessage'
import ShatterEffect from './components/ShatterEffect'

type ViewState = 'input' | 'crushing' | 'result'

function sanitize(text: string) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

export default function App() {
  const reduceMotion = useReducedMotion()

  const [state, setState] = useState<ViewState>('input')
  const [input, setInput] = useState('')
  const [problem, setProblem] = useState('')
  const [seed, setSeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)

  const tearAudioRef = useRef<HTMLAudioElement | null>(null)

  const comfort = useComfortMessage(problem)

  const followUps = useMemo(() => {
    return ['5 分钟后再回来看看', '把它变成一个更小的东西', '今天不碰，也是一种选择']
  }, [])

  const durations = useMemo(() => {
    return {
      page: reduceMotion ? 0.25 : 0.65,
      crushing: reduceMotion ? 1200 : 4200,
    }
  }, [reduceMotion])

  useEffect(() => {
    if (tearAudioRef.current) return
    tearAudioRef.current = new Audio('/sfx/tear.mp3')
    tearAudioRef.current.preload = 'auto'
  }, [])

  useEffect(() => {
    if (state !== 'crushing') return

    const t = window.setTimeout(() => {
      setState('result')
    }, durations.crushing)

    return () => window.clearTimeout(t)
  }, [durations.crushing, state])

  function startCrush() {
    const cleaned = sanitize(input)
    const value = cleaned.length ? cleaned : '一些你暂时不想面对的事情'

    if (soundOn && tearAudioRef.current) {
      try {
        tearAudioRef.current.pause()
        tearAudioRef.current.currentTime = 0
        tearAudioRef.current.volume = 0.25
        void tearAudioRef.current.play().catch(() => {})
      } catch {
        // ignore
      }
    }

    setProblem(value)
    setSeed((s) => s + 1)
    setState('crushing')
  }

  function resetAll() {
    setInput('')
    setProblem('')
    setSeed((s) => s + 1)
    setState('input')
  }

  return (
    <div className="min-h-screen w-full px-5 py-14 sm:px-8 sm:py-16">
      <main className="mx-auto w-full max-w-[920px]">
        <header className="text-center">
          <h1 className="text-[clamp(28px,3.2vw,44px)] font-semibold tracking-[-0.02em] text-warm-ink">
            你不需要立刻面对一切。
          </h1>
          <p className="mt-3 text-sm leading-7 text-warm-muted">
            这里不是让你变好，是让你先轻一点。
          </p>
        </header>

        <div className="mx-auto mt-7 h-px w-full max-w-[780px] bg-gradient-to-r from-transparent via-black/10 to-transparent" />

        <section className="relative mx-auto mt-8 w-full max-w-[780px]">
          <AnimatePresence mode="wait">
            {state === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: durations.page, ease: 'easeOut' }}
                className="rounded-[26px] border border-black/10 bg-white/40 shadow-soft backdrop-blur-xl"
              >
                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs tracking-wide text-warm-muted">
                      把它写下来就好，不需要解释。
                    </p>

                    <button
                      type="button"
                      onClick={() => setSoundOn((v) => !v)}
                      className="rounded-full border border-black/10 bg-white/40 px-3 py-1 text-[11px] font-semibold text-warm-ink/70 backdrop-blur transition hover:bg-white/55"
                      aria-label={soundOn ? '关闭音效' : '开启音效'}
                    >
                      {soundOn ? '音效：开' : '音效：关'}
                    </button>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-black/10 bg-black/5 p-4 sm:p-5">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault()
                          startCrush()
                        }
                      }}
                      placeholder="现在压在你身上的事情是……"
                      maxLength={140}
                      rows={3}
                      className="w-full resize-none bg-transparent text-[15px] leading-7 text-warm-ink/90 outline-none placeholder:text-warm-ink/35"
                      aria-label="输入你不想面对的事情"
                      autoFocus
                    />
                    <p className="mt-3 text-xs leading-6 text-warm-ink/45">
                      例如：我不想上班、不想社交、不想面对那个困难…
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={startCrush}
                    className="mt-5 w-full rounded-full bg-gradient-to-r from-warm-accent2 to-warm-accent px-5 py-3.5 text-sm font-semibold text-warm-ink/90 shadow-[0_14px_30px_rgba(233,198,168,0.18)] transition active:scale-[0.99]"
                  >
                    把它放下来
                  </button>

                  <p className="mt-4 text-center text-xs leading-6 text-warm-ink/45">
                    你可以只写几个字。也可以很长。
                  </p>
                </div>
              </motion.div>
            )}

            {state === 'crushing' && (
              <motion.div
                key="crushing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: durations.page, ease: 'easeOut' }}
                className="relative overflow-hidden rounded-[26px] border border-black/10 bg-white/28 shadow-soft backdrop-blur-xl"
                aria-live="polite"
              >
                <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-center px-6 py-14 text-center">
                  <p className="text-[clamp(22px,2.7vw,32px)] font-semibold tracking-[-0.01em] text-warm-ink">
                    正在粉碎中...
                  </p>
                  <p className="mt-3 text-xs leading-7 text-warm-ink/55">
                    {seed % 2 === 0 ? '你可以先不用管它。' : '它正在被轻轻拆开。'}
                  </p>
                </div>

                <ShatterEffect seed={seed} />
              </motion.div>
            )}

            {state === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: durations.page, ease: 'easeOut' }}
                className="rounded-[26px] border border-black/10 bg-white/40 shadow-soft backdrop-blur-xl"
              >
                <div className="p-6 sm:p-8">
                  <div className="mx-auto flex max-w-[560px] flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/20 text-2xl">
                      ✨
                    </div>
                    <h2 className="mt-4 text-[clamp(22px,2.4vw,30px)] font-semibold text-warm-ink">
                      粉碎成功！
                    </h2>
                    <p className="mt-2 text-xs leading-7 text-warm-ink/55">
                      你的烦恼已经被安全地粉碎了。
                    </p>
                  </div>

                  <div className="relative mx-auto mt-6 max-w-[720px] rounded-[22px] border border-black/10 bg-black/5 p-5 sm:p-7">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduceMotion ? 0.25 : 0.85, ease: 'easeOut' }}
                    >
                      <ComfortMessage value={comfort} />
                    </motion.div>

                    <div className="mt-6 rounded-full bg-gradient-to-r from-warm-accent2/40 to-warm-accent/25 px-4 py-3 text-center text-sm font-semibold text-warm-ink/80">
                      {comfort.affirmation}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetAll}
                    className="mx-auto mt-8 flex w-full max-w-[360px] items-center justify-center rounded-full bg-gradient-to-r from-warm-accent2 to-warm-accent px-5 py-3.5 text-sm font-semibold text-warm-ink/90 shadow-[0_14px_30px_rgba(233,198,168,0.18)] transition active:scale-[0.99]"
                  >
                    粉碎新的烦恼
                  </button>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0.25 : 0.7,
                      delay: reduceMotion ? 0 : 0.05,
                      ease: 'easeOut',
                    }}
                    className="mx-auto mt-5 w-full max-w-[520px]"
                  >
                    <div className="grid gap-2 sm:grid-cols-3">
                      {followUps.map((label) => (
                        <button
                          key={label}
                          type="button"
                          className="rounded-full border border-black/10 bg-white/35 px-4 py-2.5 text-xs font-semibold text-warm-ink/70 backdrop-blur transition hover:bg-white/50 active:scale-[0.99]"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  <p className="mt-5 text-center text-xs leading-7 text-warm-ink/40">
                    记住：每一次的逃避，都是为了更好的前进。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  )
}
