import { useCallback, useEffect, useRef, useState } from 'react'
import { HISTORY_KEY, loadHistoryResult, saveHistory } from './history'
import type { CrushHistoryItem } from './history'

export function useHistory() {
  const initialRef = useRef(loadHistoryResult())
  const initial = initialRef.current
  const canPersistRef = useRef(initial.ok)
  const didMigrateRef = useRef(false)

  const [history, setHistory] = useState<CrushHistoryItem[]>(() => initial.items)

  useEffect(() => {
    if (didMigrateRef.current) return
    didMigrateRef.current = true

    if (!initial.ok) return
    if (initial.key === HISTORY_KEY) return
    if (initial.items.length === 0) return

    try {
      const primaryRaw = localStorage.getItem(HISTORY_KEY)
      if (primaryRaw == null || primaryRaw === '') {
        saveHistory(initial.items)
      }
    } catch {
      // ignore
    }
  }, [initial.items, initial.key, initial.ok])

  useEffect(() => {
    try {
      if (!canPersistRef.current) return
      saveHistory(history)
    } catch {
      // ignore
    }
  }, [history])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== HISTORY_KEY) return
      const next = loadHistoryResult()
      if (!next.ok) return
      setHistory(next.items)
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const remove = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const clear = useCallback(() => {
    setHistory([])
  }, [])

  const prepend = useCallback((item: CrushHistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev]
      const max = 400
      return next.length > max ? next.slice(0, max) : next
    })
  }, [])

  const update = useCallback((id: string, patch: Partial<CrushHistoryItem>) => {
    setHistory((prev) => {
      let changed = false
      const next = prev.map((h) => {
        if (h.id !== id) return h
        changed = true
        return { ...h, ...patch }
      })
      return changed ? next : prev
    })
  }, [])

  return {
    history,
    setHistory,
    prepend,
    update,
    remove,
    clear,
  }
}
