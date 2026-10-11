import { useState } from 'react'

const Choice = ({ active, onClick, title, hint }) => (
  <button
    onClick={onClick}
    className={`flex-1 rounded-xl border p-4 text-left transition ${
      active ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 hover:border-white/30'
    }`}
  >
    <div className="font-semibold text-white">{title}</div>
    <div className="mt-1 text-sm text-slate-400">{hint}</div>
  </button>
)

export default function Setup({ onStart, loading, error }) {
  const [level, setLevel] = useState('Senior')
  const [category, setCategory] = useState('behavioral')
  const [background, setBackground] = useState('')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Say it <span className="text-indigo-400">clearly</span>.
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          You know your stuff. Practise answering out loud, under a 90-second clock, and get coaching on how you
          explain it.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">Level</h2>
        <div className="flex gap-3">
          {['Senior', 'Staff'].map((l) => (
            <Choice key={l} active={level === l} onClick={() => setLevel(l)} title={`${l} engineer`} hint="" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">Question type</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Choice
            active={category === 'behavioral'}
            onClick={() => setCategory('behavioral')}
            title="Behavioral"
            hint="Tell me about a time when..."
          />
          <Choice
            active={category === 'technical'}
            onClick={() => setCategory('technical')}
            title="Technical explanation"
            hint="Explain how you would design / debug..."
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
          Your background or job description <span className="normal-case text-slate-500">(optional)</span>
        </h2>
        <textarea
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          rows={3}
          placeholder="e.g. 6 years backend, Java and Kafka, interviewing for a Staff role at a fintech"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-400"
        />
      </section>

      {error && <p className="text-sm text-amber-400">{error}</p>}

      <button
        disabled={loading}
        onClick={() => onStart({ level, category, background })}
        className="w-full rounded-xl bg-indigo-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
      >
        {loading ? 'Finding your question...' : 'Start practising'}
      </button>
    </div>
  )
}
