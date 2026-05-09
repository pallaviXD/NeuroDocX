import { useState, useRef, useCallback, useEffect } from 'react'

const SUPPORTED = typeof window !== 'undefined' && (
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
)
const TTS_SUPPORTED = typeof window !== 'undefined' && 'speechSynthesis' in window

export function useVoice({ onTranscript, onError } = {}) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [voices, setVoices] = useState([])

  const recognitionRef = useRef(null)
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)

  // Keep callback refs fresh without causing re-renders
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  // Load available TTS voices
  useEffect(() => {
    if (!TTS_SUPPORTED) return
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices()
      setVoices(v)
      // Prefer a natural English voice
      const preferred = v.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural'))
      ) || v.find(v => v.lang.startsWith('en')) || v[0]
      setSelectedVoice(preferred || null)
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  // Start listening
  const startListening = useCallback(() => {
    if (!SUPPORTED) {
      onError?.('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }
    if (listening) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => setListening(true)

    rec.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      const current = final || interim
      setTranscript(current)
      if (final) {
        const trimmed = final.trim()
        onTranscriptRef.current?.(trimmed)
      }
    }

    rec.onerror = (e) => {
      setListening(false)
      if (e.error !== 'no-speech') {
        onErrorRef.current?.(`Voice error: ${e.error}`)
      }
    }

    rec.onend = () => {
      setListening(false)
      setTranscript('')
    }

    recognitionRef.current = rec
    rec.start()
  }, [listening, onTranscript, onError])

  // Stop listening
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (listening) stopListening()
    else startListening()
  }, [listening, startListening, stopListening])

  // Speak text aloud
  const speak = useCallback((text, onDone) => {
    if (!TTS_SUPPORTED || !text) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Strip markdown for cleaner speech
    const clean = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[•\-]\s/g, '. ')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\(Page \d+\)/g, '')
      .replace(/📄|💡|✅|❌|🔑|📊|🎯|⚡|🧠|📋|🤝|⚖️|🌟/g, '')
      .trim()

    // Split into chunks to avoid browser TTS cutoff on long text
    const chunks = splitIntoChunks(clean, 200)
    let idx = 0

    const speakChunk = () => {
      if (idx >= chunks.length) {
        setSpeaking(false)
        onDone?.()
        return
      }
      const utt = new SpeechSynthesisUtterance(chunks[idx])
      utt.voice = selectedVoice
      utt.rate = 0.95
      utt.pitch = 1.0
      utt.volume = 1.0
      utt.onstart = () => setSpeaking(true)
      utt.onend = () => { idx++; speakChunk() }
      utt.onerror = () => { setSpeaking(false); onDone?.() }
      utteranceRef.current = utt
      window.speechSynthesis.speak(utt)
    }

    speakChunk()
  }, [selectedVoice])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis.cancel()
    }
  }, [])

  return {
    listening,
    speaking,
    transcript,
    voiceEnabled,
    setVoiceEnabled,
    voices,
    selectedVoice,
    setSelectedVoice,
    supported: SUPPORTED,
    ttsSupported: TTS_SUPPORTED,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
  }
}

function splitIntoChunks(text, maxWords) {
  const words = text.split(' ')
  const chunks = []
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '))
  }
  return chunks
}
