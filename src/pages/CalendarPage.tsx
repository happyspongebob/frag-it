import { useMemo, useState } from 'react'
import JSZip from 'jszip'
import { useNavigate } from 'react-router-dom'
import {
  buildDailyMarkdown,
  formatDayKey,
  formatTimeKey,
  groupHistoryByDay,
} from '../history'
import type { CrushHistoryItem } from '../history'
import { useHistory } from '../useHistory'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function heatmapLevel(count: number) {
  if (!count) return 0
  if (count >= 6) return 4
  if (count >= 3) return 3
  if (count >= 2) return 2
  return 1
}

const heatmapColors = {
  0: 'rgba(255, 255, 255, 0.22)',
  1: 'rgba(242, 221, 204, 0.55)',
  2: 'rgba(233, 198, 168, 0.55)',
  3: 'rgba(233, 198, 168, 0.85)',
  4: 'rgba(217, 168, 127, 0.95)',
} as const

export default function CalendarPage() {
  const navigate = useNavigate()
  const { history, remove, clear } = useHistory()

  const [selectedDay, setSelectedDay] = useState<string>(() => formatDayKey(new Date()))
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), monthIndex: d.getMonth() }
  })

  const dayCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of history) {
      const k = formatDayKey(new Date(item.createdAt))
      map.set(k, (map.get(k) ?? 0) + 1)
    }
    return map
  }, [history])

  const selectedDayItems = useMemo(() => {
    return history
      .filter((h) => formatDayKey(new Date(h.createdAt)) === selectedDay)
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [history, selectedDay])

  const monthTitle = useMemo(() => {
    const { year, monthIndex } = calendarMonth
    return `${year}-${pad2(monthIndex + 1)}`
  }, [calendarMonth])

  const monthGrid = useMemo(() => {
    const { year, monthIndex } = calendarMonth
    const first = new Date(year, monthIndex, 1)
    const firstDow = first.getDay()
    const start = new Date(year, monthIndex, 1 - firstDow)

    const days: Date[] = []
    const d = new Date(start)
    for (let i = 0; i < 42; i += 1) {
      days.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }
    return days
  }, [calendarMonth])

  const monthWeeks = useMemo(() => {
    const rows: Date[][] = []
    for (let i = 0; i < monthGrid.length; i += 7) {
      rows.push(monthGrid.slice(i, i + 7))
    }
    return rows
  }, [monthGrid])

  function shiftMonth(delta: number) {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.monthIndex + delta, 1)
      return { year: d.getFullYear(), monthIndex: d.getMonth() }
    })
  }

  async function exportZipByDay() {
    const byDay = groupHistoryByDay(history)
    const dayKeys = Array.from(byDay.keys()).sort((a, b) => (a < b ? -1 : 1))
    const zip = new JSZip()

    for (const k of dayKeys) {
      const items = (byDay.get(k) ?? []).slice().sort((a, b) => a.createdAt - b.createdAt)
      const md = buildDailyMarkdown(k, items)
      zip.file(`${k}.md`, md)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `frag-it-md-${dayKeys[0] ?? 'empty'}_to_${dayKeys[dayKeys.length - 1] ?? 'empty'}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  }

  function onPickDay(d: Date) {
    setSelectedDay(formatDayKey(d))
    setCalendarMonth({ year: d.getFullYear(), monthIndex: d.getMonth() })
  }

  return (
    <div className="min-h-screen w-full px-5 py-14 sm:px-8 sm:py-16">
      <main className="mx-auto w-full max-w-[920px]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[clamp(22px,2.4vw,32px)] font-semibold tracking-[-0.01em] text-warm-ink">
              使用日历
            </h1>
            <p className="mt-2 text-xs leading-7 text-warm-muted">按月查看使用情况，点击日期查看当天记录。</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full border border-black/10 bg-white/30 px-4 py-2 text-[11px] font-semibold text-warm-ink/65 backdrop-blur transition hover:bg-white/45"
            >
              返回
            </button>

            <button
              type="button"
              onClick={() => exportZipByDay()}
              disabled={history.length === 0}
              className="rounded-full border border-black/10 bg-white/35 px-4 py-2 text-[11px] font-semibold text-warm-ink/70 backdrop-blur transition hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              批量导出 zip
            </button>

            <button
              type="button"
              onClick={clear}
              disabled={history.length === 0}
              className="rounded-full border border-black/10 bg-white/20 px-4 py-2 text-[11px] font-semibold text-warm-ink/60 backdrop-blur transition hover:bg-white/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              清空
            </button>
          </div>
        </header>

        <div className="mx-auto mt-7 h-px w-full max-w-[780px] bg-gradient-to-r from-transparent via-black/10 to-transparent" />

        <section className="mx-auto mt-8 w-full max-w-[780px] rounded-[26px] border border-black/10 bg-white/35 p-5 shadow-soft backdrop-blur-xl sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-full border border-black/10 bg-white/30 px-3 py-1.5 text-[11px] font-semibold text-warm-ink/60 backdrop-blur transition hover:bg-white/45"
              >
                上个月
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-full border border-black/10 bg-white/30 px-3 py-1.5 text-[11px] font-semibold text-warm-ink/60 backdrop-blur transition hover:bg-white/45"
              >
                下个月
              </button>
            </div>

            <p className="text-xs font-semibold tracking-wide text-warm-ink/60">{monthTitle}</p>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
              <p key={w} className="text-[11px] font-semibold tracking-wide text-warm-ink/45">
                {w}
              </p>
            ))}
          </div>

          <div className="mt-2 grid gap-2">
            {monthWeeks.map((week, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-7 gap-2">
                {week.map((d) => {
                  const inMonth = d.getFullYear() === calendarMonth.year && d.getMonth() === calendarMonth.monthIndex
                  const key = formatDayKey(d)
                  const count = dayCounts.get(key) ?? 0
                  const level = heatmapLevel(count)
                  const isSelected = selectedDay === key

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onPickDay(d)}
                      title={`${key}：${count} 次`}
                      className={
                        `flex h-10 flex-col items-center justify-center rounded-[14px] border text-xs transition ` +
                        (isSelected ? 'border-warm-ink/40 ring-2 ring-warm-accent/30' : 'border-black/10') +
                        (inMonth ? '' : ' opacity-45')
                      }
                      style={{ backgroundColor: heatmapColors[level as 0 | 1 | 2 | 3 | 4] }}
                    >
                      <span className="font-semibold text-warm-ink/80">{d.getDate()}</span>
                      {count > 0 && <span className="text-[10px] text-warm-ink/45">{count}</span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-6 w-full max-w-[780px] rounded-[26px] border border-black/10 bg-white/35 p-5 shadow-soft backdrop-blur-xl sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-warm-ink/60">{selectedDay}</p>
              <p className="mt-1 text-xs leading-6 text-warm-muted">{selectedDayItems.length} 条记录</p>
            </div>
          </div>

          {selectedDayItems.length === 0 ? (
            <p className="mt-3 text-sm leading-7 text-warm-ink/55">这一天还没有粉碎记录。</p>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedDayItems.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  onOpen={() => navigate(`/?historyId=${encodeURIComponent(item.id)}`)}
                  onDelete={() => remove(item.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function HistoryRow(props: { item: CrushHistoryItem; onOpen: () => void; onDelete: () => void }) {
  const { item, onOpen, onDelete } = props

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[18px] border border-black/10 bg-white/35 p-4 text-left backdrop-blur transition hover:bg-white/45"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-warm-ink/55">
            {formatTimeKey(item.createdAt)} · {item.source === 'ai' ? 'AI' : '本地'} · {item.category}
          </p>
          <p className="mt-1 text-sm leading-7 text-warm-ink/85">“{item.problemText}”</p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          className="rounded-full border border-black/10 bg-white/30 px-3 py-1 text-[11px] font-semibold text-warm-ink/60 backdrop-blur transition hover:bg-white/45"
        >
          删除
        </button>
      </div>
    </button>
  )
}
