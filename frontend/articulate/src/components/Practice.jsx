import { useEffect, useRef, useState } from 'react'
import { computeMetrics, useSpeech } from '../useSpeech'

const LIMIT = 90

export default function Practice({ question, source, onSubmit, submitting, error }) {
  const { transcript, setTranscript, listening, start, stop, error: micError, supported } = useSpeech()
  const [secondsLeft, setSecondsLeft] = useState(LIMIT)
  const [running, setRunning] = useState(false)
  const submitted = useRef(false)

  const used = LIMIT - secondsLeft
  const metrics = computeMetrics(transcript, used)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(id)
  }, [running])

  const submit = () => {
    if (submitted.current) return
    submitted.current = true
    stop()
    setRunning(false)
    onSubmit({ transcript, metrics })
  }

  // Time's up: stop listening and submit whatever was said.
  useEffect(() => {
    if (secondsLeft === 0 && running) {
      if (transcript.trim().split(/\s+/).length >= 5) submit()
      else {
        stop()
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRunning(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  // Allow resubmitting after an error from the server.
  useEffect(() => {
    if (error) submitted.current = false
  }, [error])

  const begin = () => {
    setRunning(true)
    if (supported) start()
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const urgent = secondsLeft <= 15 && running

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-indigo-300">
            Interviewer {source === 'fallback' && <span className="text-slate-500">(offline question)</span>}
          </div>
          <p className="mt-2 text-2xl font-semibold leading-snug text-white">{question}</p>
        </div>
        <div
          className={`shrink-0 rounded-xl border px-4 py-2 text-center font-mono text-3xl ${
            urgent ? 'border-red-400 text-red-400' : 'border-white/10 text-white'
          }`}
        >
          {mm}:{ss}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!running && secondsLeft === LIMIT ? (
          <button
            onClick={begin}
            className="rounded-full bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400"
          >
            {supported ? 'Start answering (mic + timer)' : 'Start timer'}
          </button>
        ) : (
          supported && (
            <button
              onClick={listening ? stop : start}
              disabled={secondsLeft === 0}
              className={`flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-white ${
                listening ? 'bg-red-500 hover:bg-red-400' : 'bg-indigo-500 hover:bg-indigo-400'
              } disabled:opacity-50`}
            >
              <span className={`h-3 w-3 rounded-full bg-white ${listening ? 'animate-pulse' : ''}`} />
              {listening ? 'Listening... tap to pause' : 'Resume mic'}
            </button>
          )
        )}
        {!supported && (
          <span className="text-sm text-amber-400">Voice needs Chrome or Edge. Type your answer instead.</span>
        )}
      </div>
      {micError && <p className="text-sm text-amber-400">{micError}</p>}

      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={8}
        placeholder={supported ? 'Your words appear here as you speak. You can edit them.' : 'Type your answer here...'}
        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-lg leading-relaxed text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-400"
      />

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          ['Words', metrics.words],
          ['Filler words', metrics.fillers],
          ['Pace (wpm)', running || used > 0 ? metrics.wpm : '-'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 py-3">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-amber-400">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting || transcript.trim().split(/\s+/).length < 5}
        className="w-full rounded-xl bg-emerald-500 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-400 disabled:opacity-40"
      >
        {submitting ? 'Your coach is reading your answer...' : 'Submit answer for feedback'}
      </button>
    </div>
  )
}
