import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5'

const app = express()
app.use(express.json({ limit: '1mb' }))

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

// Used when the API is unavailable so the demo never dead-ends.
const FALLBACK_QUESTIONS = {
  behavioral: [
    'Tell me about a time you disagreed with a teammate on a technical decision. How did you resolve it?',
    'Describe a production incident you owned. What happened and what did you change afterwards?',
    'Tell me about a project where you had to influence people without having authority over them.',
    'Walk me through a time you had to deliver under a tight deadline and trade-offs were unavoidable.',
  ],
  technical: [
    'Explain how you would design a URL shortener, starting with the requirements you would clarify.',
    'Explain the trade-offs between SQL and NoSQL databases for a growing product.',
    'Walk me through what happens from the moment a user types a URL into a browser to the page rendering.',
    'Explain how you would debug a service whose latency suddenly doubled.',
  ],
}

function extractJson(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in model response')
  return JSON.parse(text.slice(start, end + 1))
}

async function askClaude({ system, user, maxTokens = 1500 }) {
  if (!client) throw new Error('ANTHROPIC_API_KEY is not set')
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  })
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
}

app.get('/api/health', (_req, res) => res.json({ ok: true, ai: Boolean(client) }))

app.post('/api/question', async (req, res) => {
  const { level = 'Senior', category = 'behavioral', background = '', previous = [] } = req.body || {}
  const kind = category === 'technical' ? 'technical' : 'behavioral'
  try {
    const text = await askClaude({
      maxTokens: 300,
      system:
        'You are a senior engineering interviewer. Reply with ONLY a JSON object: {"question": "..."}. ' +
        'The question must be answerable out loud in about 90 seconds, be specific, and suit an experienced software engineer.',
      user:
        `Level: ${level}\nType: ${kind === 'technical' ? 'technical explanation (explain a concept, design or debugging approach)' : 'behavioral (past experience story)'}\n` +
        (background ? `Candidate background / job description:\n${background.slice(0, 2000)}\n` : '') +
        (previous.length ? `Do not repeat these questions:\n- ${previous.join('\n- ')}\n` : ''),
    })
    const { question } = extractJson(text)
    if (!question) throw new Error('Empty question')
    res.json({ question, source: 'ai' })
  } catch (err) {
    console.error('question error:', err.message)
    const bank = FALLBACK_QUESTIONS[kind].filter((q) => !previous.includes(q))
    const pool = bank.length ? bank : FALLBACK_QUESTIONS[kind]
    res.json({ question: pool[Math.floor(Math.random() * pool.length)], source: 'fallback' })
  }
})

const FEEDBACK_SYSTEM = `You are a direct, constructive and encouraging interview coach: a senior interviewer coaching a peer.
You judge ONLY how clearly the candidate ARTICULATED their answer (structure, clarity, conciseness, confidence), NOT whether the technical content is correct.
The transcript comes from speech recognition, so ignore punctuation/capitalisation glitches.
Always start the issues list's tone from a genuine strength (put it in "strength"), then give the top 3 concrete issues quoting or paraphrasing the candidate's actual words.
For "rewrite", rewrite the candidate's OWN content into a clearer answer they could say in about 90 seconds: use STAR (Situation, Task, Action, Result) for behavioral questions, and context -> approach -> trade-offs -> conclusion for technical ones. Do not invent facts the candidate did not mention; use bracketed placeholders like [metric] if impact is missing.
Reply with ONLY this JSON, no markdown:
{
 "scores": {"structure": 1-10, "clarity": 1-10, "conciseness": 1-10, "confidence": 1-10},
 "strength": "one sentence",
 "issues": [{"title": "short label", "detail": "1-2 sentences with a concrete fix"}],
 "rewrite": "the clearer answer",
 "followUp": "one pressure follow-up question an interviewer would ask next"
}`

app.post('/api/feedback', async (req, res) => {
  const { question, transcript, category = 'behavioral', metrics = {} } = req.body || {}
  if (!question || !transcript || transcript.trim().split(/\s+/).length < 5) {
    return res.status(400).json({ error: 'Please give a longer answer (at least a sentence or two).' })
  }
  try {
    const text = await askClaude({
      maxTokens: 1800,
      system: FEEDBACK_SYSTEM,
      user:
        `Question type: ${category}\nQuestion: ${question}\n\nCandidate transcript:\n"""${transcript.slice(0, 6000)}"""\n\n` +
        `Measured speaking metrics: ${JSON.stringify(metrics)} (fillers = filler words counted, wpm = words per minute, seconds = time used of 90)`,
    })
    res.json(extractJson(text))
  } catch (err) {
    console.error('feedback error:', err.message)
    res.status(502).json({ error: 'Could not generate feedback right now. Please try again.' })
  }
})

// In production serve the built React app from the same service.
const dist = path.resolve(__dirname, '../frontend/articulate/dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => console.log(`Articulate API on http://localhost:${PORT} (AI ${client ? 'on' : 'OFF - set ANTHROPIC_API_KEY'})`))
