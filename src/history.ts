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

export const LEGACY_HISTORY_KEYS = ['frag-it.history', 'frag-it.history.v0']

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

export type LoadHistoryResult = {
  items: CrushHistoryItem[]
  ok: boolean
  key: string
}

function parseAndValidateHistory(raw: string | null): { items: CrushHistoryItem[]; ok: boolean } {
  if (raw == null) return { items: [], ok: true }
  if (raw === '') return { items: [], ok: true }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return { items: [], ok: false }
    const items = safeParseHistory(raw)
    if (parsed.length > 0 && items.length === 0) return { items: [], ok: false }
    return { items, ok: true }
  } catch {
    return { items: [], ok: false }
  }
}

export function loadHistoryResult(): LoadHistoryResult {
  const primaryRaw = localStorage.getItem(HISTORY_KEY)
  const primary = parseAndValidateHistory(primaryRaw)
  if (primary.ok) return { items: primary.items, ok: true, key: HISTORY_KEY }

  for (const key of LEGACY_HISTORY_KEYS) {
    const raw = localStorage.getItem(key)
    const parsed = parseAndValidateHistory(raw)
    if (parsed.ok) {
      return { items: parsed.items, ok: true, key }
    }
  }

  return { items: [], ok: false, key: HISTORY_KEY }
}

export function loadHistory(): CrushHistoryItem[] {
  return loadHistoryResult().items
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
