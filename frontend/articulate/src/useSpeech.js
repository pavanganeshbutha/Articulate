import { useCallback, useEffect, useRef, useState } from 'react'

const SpeechRecognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

// Wraps the browser Web Speech API (Chrome/Edge). `supported` is false elsewhere,
// so callers can fall back to the typed answer box.
export function useSpeech() {
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recRef = useRef(null)
  const baseRef = useRef('')
  const wantRef = useRef(false)

  const start = useCallback(() => {
    if (!SpeechRecognition || wantRef.current) return
    setError('')
    baseRef.current = transcript ? transcript.trimEnd() + ' ' : ''
    wantRef.current = true

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
      setTranscript(baseRef.current + text)
    }
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      wantRef.current = false
      setListening(false)
      setError(
        e.error === 'not-allowed'
          ? 'Microphone blocked. Allow mic access, or type your answer below.'
          : `Voice input stopped (${e.error}). You can type your answer instead.`,
      )
    }
    // Chrome ends sessions after silence; restart while the user still wants to talk.
    rec.onend = () => {
      if (wantRef.current) {
        baseRef.current = ''
        try {
          rec.start()
        } catch {
          /* already started */
        }
      } else {
        setListening(false)
      }
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      wantRef.current = false
    }
  }, [transcript])

  const stop = useCallback(() => {
    wantRef.current = false
    recRef.current?.stop()
    setListening(false)
  }, [])

  const reset = useCallback(() => {
    wantRef.current = false
    recRef.current?.abort()
    setListening(false)
    setTranscript('')
    setError('')
  }, [])

  useEffect(() => () => {
    wantRef.current = false
    recRef.current?.abort()
  }, [])

  return { transcript, setTranscript, listening, start, stop, reset, error, supported: Boolean(SpeechRecognition) }
}

const FILLERS = /\b(um+|uh+|er|ah|like|you know|basically|actually|literally|sort of|kind of|i mean)\b/gi

export function computeMetrics(text, secondsUsed) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const fillers = (text.match(FILLERS) || []).length
  const minutes = Math.max(secondsUsed, 1) / 60
  return { words, fillers, wpm: Math.round(words / minutes), seconds: secondsUsed }
}
