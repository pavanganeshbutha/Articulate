import { useState } from 'react'
import Setup from './components/Setup'
import Practice from './components/Practice'
import Scorecard from './components/Scorecard'

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}

export default function App() {
  const [screen, setScreen] = useState('setup')
  const [settings, setSettings] = useState(null)
  const [q, setQ] = useState({ question: '', source: 'ai' })
  const [asked, setAsked] = useState([])
  const [attempt, setAttempt] = useState(0)
  const [answer, setAnswer] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadQuestion = async (cfg, forced) => {
    setBusy(true)
    setError('')
    try {
      const data = forced
        ? { question: forced, source: 'ai' }
        : await post('/api/question', { ...cfg, previous: asked })
      setQ(data)
      setAsked((a) => [...a, data.question])
      setAttempt((n) => n + 1)
      setScreen('practice')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const start = (cfg) => {
    setSettings(cfg)
    loadQuestion(cfg)
  }

  const submit = async ({ transcript, metrics }) => {
    setBusy(true)
    setError('')
    try {
      const result = await post('/api/feedback', {
        question: q.question,
        transcript,
        category: settings.category,
        metrics,
      })
      setAnswer({ result, transcript, metrics })
      setScreen('scorecard')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <button onClick={() => setScreen('setup')} className="text-xl font-bold text-white">
          Articulate<span className="text-indigo-400">.</span>
        </button>
        {screen !== 'setup' && (
          <button onClick={() => setScreen('setup')} className="text-sm text-slate-400 hover:text-white">
            Change settings
          </button>
        )}
      </header>

      {screen === 'setup' && <Setup onStart={start} loading={busy} error={error} />}
      {screen === 'practice' && (
        <Practice
          key={attempt}
          question={q.question}
          source={q.source}
          onSubmit={submit}
          submitting={busy}
          error={error}
        />
      )}
      {screen === 'scorecard' && answer && (
        <Scorecard
          {...answer}
          onRetry={() => {
            setAttempt((n) => n + 1)
            setError('')
            setScreen('practice')
          }}
          onNext={(forced) => loadQuestion(settings, forced)}
        />
      )}
    </div>
  )
}
