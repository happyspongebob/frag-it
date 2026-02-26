import { useMemo } from 'react'

type Category = 'work' | 'social' | 'love' | 'study' | 'family' | 'common'

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickSomeUnique(arr: string[], count: number): string[] {
  const pool = [...arr]
  const out: string[] = []
  while (pool.length > 0 && out.length < count) {
    const i = Math.floor(Math.random() * pool.length)
    const [v] = pool.splice(i, 1)
    if (typeof v === 'string' && v.trim().length) out.push(v)
  }
  return out
}

function sanitize(text: string) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

function classify(text: string): Category {
  const t = (text || '').toLowerCase()
  const has = (list: string[]) => list.some((k) => t.includes(k))

  if (has(['工作', '加班', '老板', '同事', '项目', '绩效', 'kpi', '会议', '汇报', 'deadline', '客户'])) return 'work'
  if (has(['朋友', '社交', '群', '消息', '回复', '尴尬', '见面', '关系', '人际'])) return 'social'
  if (has(['恋爱', '喜欢', '分手', '前任', '对象', '暧昧', '结婚', '离婚', '爱', '感情'])) return 'love'
  if (has(['考试', '作业', '论文', '答辩', '绩点', '学校', '老师', '学习', '上课', '复习'])) return 'study'
  if (has(['家', '父母', '妈妈', '爸爸', '家庭', '孩子', '亲戚'])) return 'family'

  return 'common'
}

const comfortPools: Record<Category, string[]> = {
  common: [
    '你不是不做，你只是把它从“现在”移到了“之后”。',
    '想逃避，说明这件事对你来说真的不轻松。',
    '也许你不是不想做这件事，你只是不想一次做完它。',
    '现在放下，并不等于永远不面对。',
  ],
  work: [
    '你不是懒，你只是被消耗了。',
    '工作有时会把人压住。你不用为此道歉。',
    '你只是先把它从“今天”挪开一会儿。',
    '你可以先保留力气，再决定怎么做。',
  ],
  social: [
    '不想回消息也没关系，你可以先把自己放在第一位。',
    '社交的压力是真实的，不是你太敏感。',
    '你可以选择暂时不解释。',
    '你不用在每一段关系里都表现得“足够好”。',
  ],
  love: [
    '感情里的难受，不需要立刻整理成答案。',
    '你不需要马上想清楚，也不需要马上释怀。',
    '你只是先不碰它一下。',
    '你可以允许自己难过一会儿。',
  ],
  study: [
    '学业的重量有时会让人喘不过气，这很正常。',
    '你不是不努力，你只是需要一个缓冲。',
    '先放下，脑子才能慢慢回来。',
    '你可以把它拆小一点，留到更合适的时候。',
  ],
  family: [
    '家里的事有时会让人无力。你不必立刻扛起来。',
    '你可以先把自己照顾好，再决定要不要面对。',
    '暂时不处理，并不代表你不在乎。',
    '你不需要一个人把所有事都撑住。',
  ],
}

const affirmPool = [
  '你已经很努力了。',
  '你可以慢一点。',
  '你现在这样也可以。',
  '能撑到这里，已经说明你不容易。',
  '你不需要证明自己才值得被温柔对待。',
  '你的感受不需要被“合理化”才算数。',
]

export type ComfortMessageValue = {
  problemText: string
  comfort: string[]
  affirmation: string
  category: string
}

export function useComfortMessage(input: string): ComfortMessageValue {
  return useMemo(() => {
    const cleaned = sanitize(input)
    const problemText = cleaned.length ? cleaned : '一些你暂时不想面对的事情'
    const category = classify(problemText)
    const pool = [...(comfortPools[category] || []), ...comfortPools.common]

    const comfortCount = 2
    const comfort = pickSomeUnique(pool, comfortCount)

    return {
      problemText,
      category,
      comfort: comfort.length ? comfort : [pickRandom(pool)],
      affirmation: pickRandom(affirmPool),
    }
  }, [input])
}

export default function ComfortMessage(props: {
  value: ComfortMessageValue
}) {
  const { problemText, comfort, affirmation } = props.value

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs text-warm-muted">已粉碎的烦恼：</p>
        <p className="text-sm text-warm-ink/90">“{problemText}”</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-warm-muted">给你的安慰：</p>
        <div className="space-y-2">
          {comfort.map((line, idx) => (
            <p key={idx} className="text-base leading-8 text-warm-ink/95">
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-warm-muted">积极肯定：</p>
        <p className="text-sm leading-7 text-warm-ink/70">{affirmation}</p>
      </div>
    </div>
  )
}
