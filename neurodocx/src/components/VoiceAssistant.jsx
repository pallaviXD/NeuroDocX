import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, X, Settings, Brain, Radio, Waves } from 'lucide-react'
import { useVoice } from '../hooks/useVoice'

export default function VoiceAssistant({ onQuery, lastAnswer, disabled }) {
  const [open, setOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | listening | thinking | speaking
  const [lastTranscript, setLastTranscript] = useState('')
  const lastAnswerRef = useRef('')
  const phaseRef = useRef('idle')

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase }, [phase])

  const {
    listening, speaking, transcript,
    voiceEnabled, setVoiceEnabled,
    voices, selectedVoice, setSelectedVoice,
    supported, ttsSupported,
    toggleListening, stopListening,
    speak, stopSpeaking,
  } = useVoice({
    onTranscript: useCallback((text) => {
      setLastTranscript(text)
      setPhase('thinking')
      onQuery?.(text)
    }, [onQuery]),
    onError: useCallback((msg) => {
      setPhase('idle')
    }, []),
  })

  // When a new answer arrives and we're in thinking phase → speak it
  useEffect(() => {
    if (!lastAnswer || lastAnswer === lastAnswerRef.current) return
    lastAnswerRef.current = lastAnswer

    if (phaseRef.current === 'thinking') {
      if (voiceEnabled && ttsSupported) {
        setPhase('speaking')
        speak(lastAnswer, () => setPhase('idle'))
      } else {
        setPhase('idle')
      }
    }
  }, [lastAnswer, voiceEnabled, ttsSupported, speak])

  // Sync listening state
  useEffect(() => {
    if (listening) setPhase('listening')
    else if (phaseRef.current === 'listening') setPhase('idle')
  }, [listening])

  useEffect(() => {
    if (!speaking && phaseRef.current === 'speaking') setPhase('idle')
  }, [speaking])

  const handleMicClick = () => {
    if (disabled) return
    if (phase === 'speaking') { stopSpeaking(); setPhase('idle'); return }
    if (phase === 'listening') { stopListening(); setPhase('idle'); return }
    if (phase === 'thinking') return
    toggleListening()
  }

  const handleStop = () => {
    stopListening()
    stopSpeaking()
    setPhase('idle')
  }

  const phaseConfig = {
    idle:      { label: 'Ready to listen',  color: 'text-[#7d2347]/50', orbColor: 'bg-[#ffe4ee]',  iconColor: 'text-[#a83060]' },
    listening: { label: 'Listening...',      color: 'text-[#a83060] font-bold', orbColor: 'bg-[#a83060]', iconColor: 'text-white' },
    thinking:  { label: 'Thinking...',       color: 'text-blue-500 font-bold',  orbColor: 'bg-blue-500',  iconColor: 'text-white' },
    speaking:  { label: 'Speaking...',       color: 'text-green-600 font-bold', orbColor: 'bg-green-500', iconColor: 'text-white' },
  }
  const cfg = phaseConfig[phase]

  if (!supported && !ttsSupported) return null

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          phase === 'listening' ? 'bg-[#a83060] ring-4 ring-[#a83060]/30' :
          phase === 'speaking'  ? 'bg-green-500 ring-4 ring-green-400/30' :
          phase === 'thinking'  ? 'bg-blue-500 ring-4 ring-blue-400/30' :
          'bg-[#a83060]'
        }`}
      >
        {open ? <X size={20} className="text-white" /> : (
          <div className="relative">
            <Mic size={20} className="text-white" />
            {phase !== 'idle' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white animate-ping" />
            )}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-40 right-4 md:bottom-24 md:right-6 z-50 w-[320px] bg-white rounded-3xl shadow-2xl border border-[#ffe4ee] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#a83060] to-[#c4527e] px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Brain size={15} className="text-white" />
                </div>
                <span className="font-bold text-white text-sm">Voice Assistant</span>
                {phase !== 'idle' && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <button
                onClick={() => setShowSettings(s => !s)}
                className={`p-1.5 rounded-lg transition-colors text-white ${showSettings ? 'bg-white/30' : 'hover:bg-white/20'}`}
              >
                <Settings size={14} />
              </button>
            </div>

            {/* Settings */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-[#fff8fb] border-b border-[#ffe4ee]"
                >
                  <div className="px-5 py-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#2d1a22]">Auto-read AI responses</p>
                        <p className="text-xs text-[#7d2347]/50 mt-0.5">Hear answers spoken aloud</p>
                      </div>
                      <button
                        onClick={() => setVoiceEnabled(v => !v)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${voiceEnabled ? 'bg-[#a83060]' : 'bg-[#f0a0c0]'}`}
                      >
                        <motion.span
                          animate={{ x: voiceEnabled ? 20 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow block"
                        />
                      </button>
                    </div>
                    {ttsSupported && voices.filter(v => v.lang.startsWith('en')).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#2d1a22] mb-1.5">Voice</p>
                        <select
                          value={selectedVoice?.name || ''}
                          onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value))}
                          className="w-full text-xs border border-[#f0a0c0] rounded-lg px-2.5 py-2 bg-white text-[#2d1a22] focus:outline-none focus:border-[#a83060]"
                        >
                          {voices.filter(v => v.lang.startsWith('en')).map(v => (
                            <option key={v.name} value={v.name}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main */}
            <div className="px-5 py-6 flex flex-col items-center gap-5">

              {/* Orb */}
              <div className="relative flex items-center justify-center w-28 h-28">
                {/* Pulse rings */}
                {phase === 'listening' && [1, 1.5, 2].map((scale, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, scale], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.3, ease: 'easeOut' }}
                    className="absolute w-20 h-20 rounded-full bg-[#a83060]/25"
                  />
                ))}
                {phase === 'speaking' && (
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 0.7 }}
                    className="absolute w-20 h-20 rounded-full bg-green-400/20"
                  />
                )}
                {phase === 'thinking' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="absolute w-24 h-24 rounded-full border-2 border-dashed border-blue-300"
                  />
                )}

                <button
                  onClick={handleMicClick}
                  disabled={disabled || phase === 'thinking'}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${cfg.orbColor} ${
                    disabled || phase === 'thinking' ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  {phase === 'speaking' ? (
                    <Volume2 size={30} className={cfg.iconColor} />
                  ) : phase === 'listening' ? (
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>
                      <MicOff size={30} className={cfg.iconColor} />
                    </motion.div>
                  ) : phase === 'thinking' ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                      <Brain size={30} className={cfg.iconColor} />
                    </motion.div>
                  ) : (
                    <Mic size={30} className={cfg.iconColor} />
                  )}
                </button>
              </div>

              {/* Status */}
              <div className="text-center min-h-[40px]">
                <p className={`text-sm ${cfg.color}`}>{cfg.label}</p>
                {phase === 'listening' && transcript && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[#7d2347]/60 mt-1 italic max-w-[240px] truncate"
                  >
                    "{transcript}"
                  </motion.p>
                )}
                {phase === 'thinking' && lastTranscript && (
                  <p className="text-xs text-[#7d2347]/50 mt-1 italic max-w-[240px] truncate">
                    "{lastTranscript}"
                  </p>
                )}
              </div>

              {/* Sound wave when speaking */}
              {phase === 'speaking' && (
                <div className="flex items-end gap-1 h-8">
                  {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 1, 0.7, 0.4, 0.8, 0.6, 1].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [h, h * 0.2, h] }}
                      transition={{ repeat: Infinity, duration: 0.4 + i * 0.06, ease: 'easeInOut' }}
                      className="w-1.5 rounded-full bg-green-500"
                      style={{ height: `${h * 28}px`, transformOrigin: 'bottom' }}
                    />
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="w-full flex flex-col gap-2">
                {phase === 'idle' && (
                  <button
                    onClick={handleMicClick}
                    disabled={disabled}
                    className="w-full flex items-center justify-center gap-2 bg-[#a83060] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#7d2347] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Mic size={16} />
                    {disabled ? 'Select a document first' : 'Ask a question'}
                  </button>
                )}
                {(phase === 'listening' || phase === 'speaking') && (
                  <button
                    onClick={handleStop}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white text-sm font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors"
                  >
                    <VolumeX size={16} />
                    Stop
                  </button>
                )}
                {phase === 'thinking' && (
                  <div className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 text-sm font-semibold py-3 rounded-xl">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Brain size={16} />
                    </motion.div>
                    AI is thinking...
                  </div>
                )}

                {/* Auto-read status */}
                {ttsSupported && (
                  <div className="flex items-center justify-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${voiceEnabled ? 'bg-green-500' : 'bg-[#f0a0c0]'}`} />
                    <span className="text-xs text-[#7d2347]/50">
                      Auto-read {voiceEnabled ? 'on' : 'off'} · tap ⚙️ to change
                    </span>
                  </div>
                )}
              </div>

              {/* Hint */}
              {phase === 'idle' && !disabled && (
                <p className="text-xs text-[#7d2347]/35 text-center leading-relaxed">
                  Tap the mic and speak your question naturally.
                  The AI will answer and optionally read it back.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
