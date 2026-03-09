import { useCallback, useEffect, useState } from 'react'
import { loadHistory, saveHistory } from './history'
import type { CrushHistoryItem } from './history'

export function useHistory() {
  const [history, setHistory] = useState<CrushHistoryItem[]>(() => loadHistory())

  useEffect(() => {
    try {
      saveHistory(history)
    } catch {
      // ignore
    }
  }, [history])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'frag-it.history.v1') return
      setHistory(loadHistory())
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

  return {
    history,
    setHistory,
    prepend,
    remove,
    clear,
  }
}
