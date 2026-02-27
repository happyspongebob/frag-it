import type { IncomingMessage, ServerResponse } from 'node:http'

 const rateLimitStore = new Map<string, { resetAt: number; count: number }>()

type ComfortCategory =
  | 'relationship'
  | 'work_study'
  | 'family'
  | 'health'
  | 'money'
  | 'self_worth'
  | 'future'
  | 'stress'
  | 'other'

type ComfortPayload = {
  version: 'comfort.v1'
  language: string
  category: ComfortCategory | string
  comfort: string[]
  affirmation: string
  tags: string[]
  sql_hint: {
    topic: string
    emotion: string
    severity: string
    entities: string[]
  }
  ext: {
    clientId: string
    requestId: string
    debug: {
      model: string
      finish_reason: string
    }
  }
}

type RequestBody = {
  problem?: unknown
  locale?: unknown
  clientId?: unknown
  requestId?: unknown
}

 function getClientIp(req: IncomingMessage): string {
   const xf = String(req.headers['x-forwarded-for'] ?? '')
   if (xf.trim().length) return xf.split(',')[0].trim()
   return String((req.socket as any)?.remoteAddress ?? '')
 }

 function rateLimit(ip: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
   const now = Date.now()
   const windowMs = 60_000
   const max = 30

   const existing = rateLimitStore.get(ip)
   if (!existing || existing.resetAt <= now) {
     rateLimitStore.set(ip, { resetAt: now + windowMs, count: 1 })
     return { ok: true } as const
   }

   if (existing.count >= max) {
     const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
     return { ok: false, retryAfterSeconds } as const
   }

   existing.count += 1
   rateLimitStore.set(ip, existing)
   return { ok: true } as const
 }

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += String(chunk)
    })
    req.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function sanitize(text: string): string {
  return (text || '').replace(/\s+/g, ' ').trim()
}

function extractFirstJsonObject(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return ''
  return text.slice(start, end + 1)
}

function isComfortPayload(value: unknown): value is ComfortPayload {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (v.version !== 'comfort.v1') return false
  if (typeof v.language !== 'string') return false
  if (typeof v.category !== 'string') return false
  if (!Array.isArray(v.comfort) || v.comfort.length < 2 || v.comfort.length > 4) return false
  if (typeof v.affirmation !== 'string') return false
  if (!Array.isArray(v.tags)) return false
  if (!v.sql_hint || typeof v.sql_hint !== 'object') return false
  if (!v.ext || typeof v.ext !== 'object') return false
  return true
}

function systemPromptZh(): string {
  return [
    '你是一名温柔、可靠的安慰文案助手，为一个“粉碎烦恼”的网页应用生成短文案。',
    '',
    '你的任务：',
    '- 读取用户的一句话烦恼内容',
    '- 输出：',
    '  1) comfort：2-4 句安慰（数组，每个元素是一句完整句子）',
    '  2) affirmation：1 句简短积极肯定',
    '  3) category：1 个分类标签',
    '',
    '语气要求：',
    '- 温柔、接地气、不评判，尽量具体贴合用户烦恼',
    '- 不要说教，不要空泛鸡汤',
    '- 不要向用户提问',
    '- 不要使用表情符号',
    '- 不要使用列表、编号或项目符号',
    '- 不要提到“我是 AI/模型/系统提示/政策”等内容',
    '',
    '输出必须严格遵守（非常重要）：',
    '- 只能输出且必须输出：一个合法的 JSON 对象',
    '- JSON 之外不得出现任何字符（不能有解释、不能有 Markdown、不能有代码块）',
    '- 所有 key 和字符串 value 必须使用英文双引号',
    '- 不能有多余逗号',
    '- 句子字符串内部不要包含换行符',
    '',
    '输出 JSON 结构（必须完全一致）：',
    '{',
    '  "version": "comfort.v1",',
    '  "language": "<BCP47 语言标签，例如 zh-CN>",',
    '  "category": "<字符串>",',
    '  "comfort": ["<句子1>", "<句子2>", "<句子3?>", "<句子4?>"],',
    '  "affirmation": "<字符串>",',
    '  "tags": ["<字符串>", "<字符串>", "<字符串?>", "<字符串?>", "<字符串?>", "<字符串?>"],',
    '  "sql_hint": {',
    '    "topic": "<字符串或空字符串>",',
    '    "emotion": "<字符串或空字符串>",',
    '    "severity": "<字符串或空字符串>",',
    '    "entities": ["<字符串>", "<字符串?>", "<字符串?>", "<字符串?>"]',
    '  },',
    '  "ext": {',
    '    "clientId": "<字符串或空字符串>",',
    '    "requestId": "<字符串或空字符串>",',
    '    "debug": {',
    '      "model": "<字符串或空字符串>",',
    '      "finish_reason": "<字符串或空字符串>"',
    '    }',
    '  }',
    '}',
    '',
    '字段规则：',
    '- comfort：数组长度必须为 2-4；每个元素只能是一句完整句子（不要合并成一长段）',
    '- affirmation：简短有力，中文建议 8-20 个字',
    '- category：必须从用户消息给定的分类集合中选择且只能选 1 个',
    '- tags：2-6 个简短标签（词/短语），不要写成句子',
    '- sql_hint：为未来数据库/SQL 预留。不要瞎编，不确定就用空字符串/更短数组',
    '- ext：为未来扩展预留。clientId/requestId 原样回显（没有就空字符串）',
    '- ext.debug.model 与 ext.debug.finish_reason 必须输出空字符串（服务端会填充）',
  ].join('\n')
}

function userPromptZh(input: {
  problem: string
  locale: string
  clientId: string
  requestId: string
}): string {
  const { problem, locale, clientId, requestId } = input

  return [
    '输入信息：',
    `- problem（烦恼原文）："${problem}"`,
    `- locale（期望语言，可空）："${locale}"（为空则根据 problem 自动判断）`,
    `- clientId："${clientId}"`,
    `- requestId："${requestId}"`,
    '',
    '分类集合（必须且只能选 1 个）：',
    '- relationship（关系/亲密/社交）',
    '- work_study（工作/学习/考试）',
    '- family（家庭）',
    '- health（健康/睡眠/身体）',
    '- money（经济）',
    '- self_worth（自我价值/内疚/羞耻）',
    '- future（未来/不确定/选择）',
    '- stress（压力/焦虑/情绪泛化）',
    '- other（其他）',
    '',
    '要求：',
    '- 只输出 1 个 JSON 对象，必须完全符合 system 中给定的结构',
    '- language：填写你实际使用的语言标签（例如 "zh-CN"）',
    '- comfort：必须为 2-4 句，数组逐句输出；每句不要换行',
    '- 内容尽量贴合 problem，避免套话',
    '- 不要提问',
    '- ext.clientId / ext.requestId：原样回显输入（缺失则空字符串）',
    '- ext.debug.model / ext.debug.finish_reason：输出空字符串',
    '',
    '现在开始输出 JSON：',
  ].join('\n')
}

export default async function handler(req: IncomingMessage & { method?: string; body?: any }, res: ServerResponse & { status?: (code: number) => any; json?: (body: any) => any }) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }

   const ip = getClientIp(req)
   const rl = rateLimit(ip)
   if (!rl.ok) {
     res.statusCode = 429
     res.setHeader('Content-Type', 'application/json; charset=utf-8')
     res.setHeader('Retry-After', String(rl.retryAfterSeconds))
     res.end(
       JSON.stringify({
         error: 'Rate limit exceeded',
         retryAfterSeconds: rl.retryAfterSeconds,
       }),
     )
     return
   }

  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Missing DASHSCOPE_API_KEY' }))
    return
  }

  let bodyUnknown: unknown
  try {
    bodyUnknown = req.body ?? (await readJsonBody(req))
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Invalid JSON body' }))
    return
  }

  const body = (bodyUnknown || {}) as RequestBody
  const problem = sanitize(getString(body.problem))
  const locale = sanitize(getString(body.locale))
  const clientId = sanitize(getString(body.clientId))
  const requestId = sanitize(getString(body.requestId))

  if (!problem) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Missing problem' }))
    return
  }

   if (problem.length > 240) {
     res.statusCode = 400
     res.setHeader('Content-Type', 'application/json; charset=utf-8')
     res.end(JSON.stringify({ error: 'Problem too long' }))
     return
   }

  const controller = new AbortController()
  const timeoutMs = 12_000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
     const start = Date.now()
    const upstreamRes = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        temperature: 0.6,
        max_tokens: 400,
        stream: false,
        messages: [
          { role: 'system', content: systemPromptZh() },
          { role: 'user', content: userPromptZh({ problem, locale, clientId, requestId }) },
        ],
      }),
      signal: controller.signal,
    })

    const upstreamText = await upstreamRes.text()
     const elapsedMs = Date.now() - start

    if (!upstreamRes.ok) {
       console.warn('[api/comfort] upstream_error', {
         ip,
         requestId,
         status: upstreamRes.status,
         elapsedMs,
       })
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          error: 'Upstream error',
          status: upstreamRes.status,
          body: upstreamText,
          requestId,
        }),
      )
      return
    }

    const upstreamJson = JSON.parse(upstreamText) as any
    const content = String(upstreamJson?.choices?.[0]?.message?.content ?? '')
    const finishReason = String(upstreamJson?.choices?.[0]?.finish_reason ?? '')
    const model = String(upstreamJson?.model ?? 'qwen-plus')

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      const extracted = extractFirstJsonObject(content)
      if (!extracted) {
        throw new Error('Model returned non-JSON content')
      }
      parsed = JSON.parse(extracted)
    }

    if (!isComfortPayload(parsed)) {
       console.warn('[api/comfort] invalid_schema', {
         ip,
         requestId,
         model,
         finishReason,
         elapsedMs,
       })
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          error: 'Invalid model output schema',
          raw: content,
          requestId,
        }),
      )
      return
    }

    const payload: ComfortPayload = {
      ...parsed,
      ext: {
        ...parsed.ext,
        clientId: parsed.ext?.clientId ? String(parsed.ext.clientId) : clientId,
        requestId: parsed.ext?.requestId ? String(parsed.ext.requestId) : requestId,
        debug: {
          model,
          finish_reason: finishReason,
        },
      },
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))

     console.info('[api/comfort] ok', {
       ip,
       requestId,
       model,
       finishReason,
       elapsedMs,
     })
  } catch (err: any) {
    const aborted = err?.name === 'AbortError'

     console.warn('[api/comfort] failed', {
       ip,
       requestId,
       aborted,
     })

    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(
      JSON.stringify({
        error: aborted ? 'Upstream timeout' : 'Upstream request failed',
        requestId,
      }),
    )
  } finally {
    clearTimeout(timeout)
  }
}
