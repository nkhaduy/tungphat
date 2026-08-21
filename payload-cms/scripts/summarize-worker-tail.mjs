import fs from 'node:fs'
import path from 'node:path'

const inputPath = path.resolve(process.argv[2] ?? '')
const userAgent = process.argv[3] ?? ''
const outputPath = path.resolve(process.argv[4] ?? 'output/worker-tail-summary.json')
if (!inputPath || !userAgent) throw new Error('Usage: node summarize-worker-tail.mjs <tail-file> <user-agent> [output-file]')

const events = parseJsonSequence(fs.readFileSync(inputPath, 'utf8'))
  .filter((event) => event?.event?.request?.headers?.['user-agent'] === userAgent)
  .map((event) => {
    const url = new URL(event.event.request.url)
    return {
      route: `${url.pathname}${url.search}`,
      cpuMs: Number(event.cpuTime),
      wallMs: Number(event.wallTime),
      outcome: String(event.outcome),
      status: Number(event.event.response?.status),
      version: event.scriptVersion?.id ?? null,
    }
  })

const summary = Object.fromEntries([...new Set(events.map((event) => event.route))].map((route) => {
  const rows = events.filter((event) => event.route === route)
  const cpu = rows.map((event) => event.cpuMs)
  const wall = rows.map((event) => event.wallMs)
  return [route, {
    count: rows.length,
    statuses: counts(rows.map((event) => String(event.status))),
    outcomes: counts(rows.map((event) => event.outcome)),
    cpu: distribution(cpu),
    wall: distribution(wall),
  }]
}))

const report = {
  generatedAt: new Date().toISOString(),
  userAgent,
  version: events[0]?.version ?? null,
  events: events.length,
  exceededCpu: events.filter((event) => event.outcome === 'exceededCpu').length,
  exceededMemory: events.filter((event) => event.outcome === 'exceededMemory').length,
  summary,
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))

function parseJsonSequence(source) {
  const values = []
  let start = -1
  let depth = 0
  let quoted = false
  let escaped = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') quoted = false
      continue
    }
    if (character === '"') { quoted = true; continue }
    if (character === '{') { if (depth === 0) start = index; depth += 1 }
    else if (character === '}') {
      depth -= 1
      if (depth === 0 && start >= 0) { values.push(JSON.parse(source.slice(start, index + 1))); start = -1 }
    }
  }
  return values
}

function counts(values) {
  return Object.fromEntries([...new Set(values)].map((value) => [value, values.filter((item) => item === value).length]))
}

function distribution(values) {
  return { p50: percentile(values, 0.5), p95: percentile(values, 0.95), p99: percentile(values, 0.99), max: values.length ? Math.max(...values) : null }
}

function percentile(values, quantile) {
  if (!values.length) return null
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.min(sorted.length - 1, Math.ceil(quantile * sorted.length) - 1)]
}
