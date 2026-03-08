export type HistorySource = 'ai' | 'local'

export type ComfortMessageValueLike = {
  problemText: string
  comfort: string[]
  affirmation: string
  category: string
}

export type CrushHistoryItem = ComfortMessageValueLike & {
  id: string
  createdAt: number
  source: HistorySource
}

export const HISTORY_KEY = 'frag-it.history.v1'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function formatDayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function formatTimeKey(ts: number) {
  const d = new Date(ts)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function safeParseHistory(raw: string | null): CrushHistoryItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((v) => v && typeof v === 'object')
      .map((v) => v as CrushHistoryItem)
      .filter(
        (v) =>
          typeof v.id === 'string' &&
          typeof v.createdAt === 'number' &&
          (v.source === 'ai' || v.source === 'local') &&
          typeof v.problemText === 'string' &&
          Array.isArray(v.comfort) &&
          typeof v.affirmation === 'string' &&
          typeof v.category === 'string',
      )
  } catch {
    return []
  }
}

export function loadHistory(): CrushHistoryItem[] {
  return safeParseHistory(localStorage.getItem(HISTORY_KEY))
}

export function saveHistory(items: CrushHistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

export function buildDailyMarkdown(dayKey: string, items: CrushHistoryItem[]) {
  const lines: string[] = []
  lines.push('---')
  lines.push(`date: ${dayKey}`)
  lines.push('tags: [frag-it]')
  lines.push('---')
  lines.push('')

  for (const item of items) {
    lines.push(`## ${formatTimeKey(item.createdAt)}`)
    lines.push('')
    lines.push(`- 烦恼：${item.problemText}`)
    lines.push(`- 分类：${item.category}`)
    lines.push(`- 来源：${item.source}`)
    lines.push('')
    lines.push('### 安慰')
    lines.push('')
    for (const c of item.comfort) {
      lines.push(`- ${c}`)
    }
    lines.push('')
    lines.push(`### 积极肯定\n\n${item.affirmation}`)
    lines.push('')
  }

  return lines.join('\n')
}

export function groupHistoryByDay(history: CrushHistoryItem[]) {
  const byDay = new Map<string, CrushHistoryItem[]>()
  for (const item of history) {
    const k = formatDayKey(new Date(item.createdAt))
    const arr = byDay.get(k) ?? []
    arr.push(item)
    byDay.set(k, arr)
  }
  return byDay
}

export function createHistoryId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
