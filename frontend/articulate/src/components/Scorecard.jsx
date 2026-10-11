const LABELS = {
  structure: 'Structure',
  clarity: 'Clarity',
  conciseness: 'Conciseness',
  confidence: 'Confidence',
}

const barColor = (n) => (n >= 8 ? 'bg-emerald-400' : n >= 5 ? 'bg-amber-400' : 'bg-red-400')

export default function Scorecard({ result, transcript, metrics, onRetry, onNext }) {
  const scores = result.scores || {}
  const values = Object.keys(LABELS).map((k) => Number(scores[k]) || 0)
  const overall = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 border-indigo-400">
          <span className="text-3xl font-bold text-white">{overall}</span>
          <span className="text-xs text-slate-400">/ 10</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Your articulation scorecard</h2>
          {result.strength && <p className="mt-1 text-emerald-300">Strength: {result.strength}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(LABELS).map(([key, label]) => {
          const n = Number(scores[key]) || 0
          return (
            <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-300">{label}</span>
                <span className="font-semibold text-white">{n}/10</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className={`h-2 rounded-full ${barColor(n)}`} style={{ width: `${n * 10}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-sm text-slate-400">
        {metrics.words} words, {metrics.fillers} filler words, {metrics.wpm} wpm
        {metrics.wpm > 170 ? ' (a bit fast)' : metrics.wpm > 0 && metrics.wpm < 100 ? ' (a bit slow)' : ''}
      </p>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-white">What to fix first</h3>
        <ol className="space-y-3">
          {(result.issues || []).slice(0, 3).map((issue, i) => (
            <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-amber-300">
                {i + 1}. {issue.title}
              </div>
              <div className="mt-1 text-slate-300">{issue.detail}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Your answer</h3>
          <p className="whitespace-pre-wrap text-slate-300">{transcript}</p>
        </div>
        <div className="rounded-xl border border-indigo-400/50 bg-indigo-500/10 p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-300">A clearer version</h3>
          <p className="whitespace-pre-wrap text-slate-100">{result.rewrite}</p>
        </div>
      </section>

      {result.followUp && (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
            The interviewer might ask next
          </h3>
          <p className="text-lg text-white">{result.followUp}</p>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onRetry}
          className="flex-1 rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
        >
          Try this question again
        </button>
        <button
          onClick={() => onNext(result.followUp)}
          className="flex-1 rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
        >
          Practise the follow-up
        </button>
        <button
          onClick={() => onNext()}
          className="flex-1 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400"
        >
          Next question
        </button>
      </div>
    </div>
  )
}
