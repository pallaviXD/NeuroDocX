import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, FileText, ChevronRight, CheckCircle, XCircle, Clock, Trophy, RotateCcw, Loader, Brain } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { listDocuments, generateQuiz, evaluateAnswer, saveQuizScore } from '../api'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const QUIZ_TYPES = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'truefalse', label: 'True / False' },
  { value: 'fillinblank', label: 'Fill in Blank' },
  { value: 'mixed', label: 'Mixed' },
]

export default function Quiz() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [docs, setDocs] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [numQ, setNumQ] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [quizType, setQuizType] = useState('mcq')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // Quiz state
  const [quizId, setQuizId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [feedback, setFeedback] = useState({})
  const [evaluating, setEvaluating] = useState(false)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerActive, setTimerActive] = useState(false)
  const [fillInput, setFillInput] = useState('')
  const timerRef = useRef(null)
  const fillRef = useRef(null)

  // Normalize question type from AI output
  const getType = (q) => {
    const t = (q?.type || '').toLowerCase().replace(/[^a-z]/g, '')
    if (t.includes('fill') || t.includes('blank')) return 'fillinblank'
    if (t.includes('true') || t.includes('false') || t.includes('tf')) return 'truefalse'
    return 'mcq'
  }

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    listDocuments().then(setDocs).catch(() => {})
  }, [user])

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    } else if (timerActive && timeLeft === 0) {
      handleFinish()
    }
    return () => clearTimeout(timerRef.current)
  }, [timerActive, timeLeft])

  const handleGenerate = async () => {
    if (!selectedDocs.length) { setError('Select at least one document.'); return }
    setError('')
    setGenerating(true)
    try {
      const res = await generateQuiz(selectedDocs, numQ, difficulty, quizType)
      if (!res.questions?.length) throw new Error('No questions generated. Try a different document or settings.')
      setQuestions(res.questions)
      setQuizId(res.quiz_id)
      setCurrent(0)
      setAnswers({})
      setFeedback({})
      setFinished(false)
      setScore(0)
      setTimeLeft(res.questions.length * 45) // 45s per question
      setTimerActive(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswer = async (answer) => {
    if (answers[current] !== undefined) return
    const q = questions[current]
    setAnswers(prev => ({ ...prev, [current]: answer }))
    setEvaluating(true)
    try {
      const res = await evaluateAnswer(q.question, answer, q.answer, q.explanation || '')
      setFeedback(prev => ({ ...prev, [current]: res }))
    } catch {
      setFeedback(prev => ({
        ...prev,
        [current]: {
          correct: answer.toLowerCase() === q.answer.toLowerCase(),
          feedback: answer.toLowerCase() === q.answer.toLowerCase()
            ? `✅ Correct! ${q.explanation || ''}`
            : `❌ The correct answer is: ${q.answer}. ${q.explanation || ''}`,
        }
      }))
    } finally {
      setEvaluating(false)
    }
  }

  const handleNext = () => {
    setFillInput('')
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
    } else {
      handleFinish()
    }
  }

  const handleFinish = async () => {
    setTimerActive(false)
    clearTimeout(timerRef.current)
    const correct = Object.values(feedback).filter(f => f.correct).length
    const finalScore = questions.length > 0 ? correct / questions.length : 0
    setScore(finalScore)
    setFinished(true)
    if (quizId) {
      await saveQuizScore(quizId, finalScore).catch(() => {})
    }
  }

  const handleReset = () => {
    setQuestions([])
    setAnswers({})
    setFeedback({})
    setFinished(false)
    setScore(0)
    setTimerActive(false)
    setCurrent(0)
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const q = questions[current]
  const answered = answers[current] !== undefined
  const fb = feedback[current]

  // Setup screen
  if (!questions.length && !generating) {
    return (
      <div className="min-h-screen bg-[#fff8fb] p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#a83060] flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#2d1a22]">Quiz Generator</h1>
              <p className="text-[#7d2347]/60 text-sm">AI-powered questions from your documents</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#ffe4ee] p-6 flex flex-col gap-5">
            {/* Document selection */}
            <div>
              <label className="text-xs font-bold text-[#a83060]/70 uppercase tracking-widest mb-2 block">Select Documents</label>
              {docs.length === 0 ? (
                <p className="text-sm text-[#7d2347]/50">No documents uploaded yet. <a href="/chat" className="text-[#a83060] font-semibold">Upload a PDF first →</a></p>
              ) : (
                <div className="flex flex-col gap-2">
                  {docs.map(doc => (
                    <label key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#ffe4ee] hover:border-[#a83060]/30 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.id)}
                        onChange={e => setSelectedDocs(prev =>
                          e.target.checked ? [...prev, doc.id] : prev.filter(d => d !== doc.id)
                        )}
                        className="accent-[#a83060] w-4 h-4"
                      />
                      <FileText size={15} className="text-[#a83060]" />
                      <span className="text-sm text-[#2d1a22] font-medium truncate">{doc.name}</span>
                      <span className="text-xs text-[#7d2347]/40 ml-auto">{doc.pages}p</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#a83060]/70 uppercase tracking-widest mb-2 block">Questions</label>
                <select
                  value={numQ}
                  onChange={e => setNumQ(Number(e.target.value))}
                  className="w-full border border-[#f0a0c0] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2d1a22] focus:outline-none focus:border-[#a83060]"
                >
                  {[3, 5, 7, 10, 15].map(n => <option key={n} value={n}>{n} Questions</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#a83060]/70 uppercase tracking-widest mb-2 block">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full border border-[#f0a0c0] rounded-xl px-3 py-2.5 text-sm bg-white text-[#2d1a22] focus:outline-none focus:border-[#a83060] capitalize"
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#a83060]/70 uppercase tracking-widest mb-2 block">Quiz Type</label>
              <div className="grid grid-cols-2 gap-2">
                {QUIZ_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setQuizType(t.value)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      quizType === t.value
                        ? 'bg-[#a83060] text-white border-[#a83060]'
                        : 'border-[#f0a0c0] text-[#7d2347] hover:border-[#a83060]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedDocs.length}
              className="w-full bg-[#a83060] text-white font-bold py-3.5 rounded-xl hover:bg-[#7d2347] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Brain size={18} />
              Generate Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Generating
  if (generating) {
    return (
      <div className="min-h-screen bg-[#fff8fb] flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-[#a83060] animate-spin mx-auto mb-4" />
          <p className="font-bold text-[#2d1a22] text-lg">Generating your quiz...</p>
          <p className="text-[#7d2347]/60 text-sm mt-1">AI is reading your documents</p>
        </div>
      </div>
    )
  }

  // Results screen
  if (finished) {
    const correct = Object.values(feedback).filter(f => f.correct).length
    const pct = Math.round((correct / questions.length) * 100)
    return (
      <div className="min-h-screen bg-[#fff8fb] p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl border border-[#ffe4ee] shadow-xl p-8 text-center"
        >
          <Trophy size={48} className="text-[#a83060] mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-[#2d1a22] mb-1">Quiz Complete!</h2>
          <p className="text-[#7d2347]/60 mb-6">Here's how you did</p>

          <div className="w-32 h-32 rounded-full border-8 border-[#ffe4ee] flex items-center justify-center mx-auto mb-6 relative">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#a83060 ${pct * 3.6}deg, #ffe4ee 0deg)`,
              }}
            />
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center relative z-10">
              <span className="text-3xl font-extrabold text-[#a83060]">{pct}%</span>
            </div>
          </div>

          <p className="text-[#2d1a22] font-semibold mb-1">
            {correct} / {questions.length} correct
          </p>
          <p className="text-sm text-[#7d2347]/60 mb-6">
            {pct >= 80 ? '🎉 Excellent work!' : pct >= 60 ? '👍 Good job!' : '📚 Keep studying!'}
          </p>

          {/* Per-question review */}
          <div className="flex flex-col gap-2 mb-6 text-left">
            {questions.map((q, i) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
                feedback[i]?.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {feedback[i]?.correct
                  ? <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                  : <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                }
                <div>
                  <p className="font-medium text-[#2d1a22]">{q.question}</p>
                  <p className="text-[#7d2347]/60 mt-0.5">{feedback[i]?.feedback}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 border border-[#f0a0c0] text-[#a83060] font-semibold py-3 rounded-xl hover:bg-[#ffe4ee] transition-colors text-sm"
            >
              <RotateCcw size={16} />
              New Quiz
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-[#a83060] text-white font-semibold py-3 rounded-xl hover:bg-[#7d2347] transition-colors text-sm"
            >
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Active quiz
  return (
    <div className="min-h-screen bg-[#fff8fb] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-[#7d2347]/60">
            Question {current + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#a83060]">
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="w-full h-2 bg-[#ffe4ee] rounded-full mb-6">
          <div
            className="h-2 bg-[#a83060] rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl border border-[#ffe4ee] shadow-sm p-6"
          >
            {/* Difficulty badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>{difficulty}</span>
              {q?.page_ref && (
                <span className="text-xs bg-[#ffe4ee] text-[#a83060] px-2.5 py-1 rounded-full">
                  📄 Page {q.page_ref}
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-[#2d1a22] mb-5 leading-snug">{q?.question}</h2>

            {/* Options */}
            {getType(q) === 'fillinblank' ? (
              <div className="flex flex-col gap-3">
                <input
                  ref={fillRef}
                  type="text"
                  value={fillInput}
                  onChange={e => setFillInput(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={answered}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !answered && fillInput.trim()) {
                      handleAnswer(fillInput.trim())
                    }
                  }}
                  className="border-2 border-[#f0a0c0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#a83060] bg-[#fff8fb] disabled:opacity-60 disabled:bg-gray-50"
                />
                {!answered && (
                  <button
                    onClick={() => fillInput.trim() && handleAnswer(fillInput.trim())}
                    disabled={!fillInput.trim()}
                    className="bg-[#a83060] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#7d2347] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Answer
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(q?.options || []).map((opt, i) => {
                  const optLetter = opt.match(/^([A-D])\)/)?.[1] || opt
                  const isSelected = answers[current] === optLetter || answers[current] === opt
                  const isCorrect = fb && (optLetter === q.answer || opt === q.answer)
                  const isWrong = fb && isSelected && !fb.correct

                  return (
                    <button
                      key={i}
                      onClick={() => !answered && handleAnswer(optLetter)}
                      disabled={answered}
                      className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        isCorrect && answered ? 'bg-green-50 border-green-400 text-green-800' :
                        isWrong ? 'bg-red-50 border-red-400 text-red-800' :
                        isSelected ? 'bg-[#ffe4ee] border-[#a83060] text-[#a83060]' :
                        'border-[#f0a0c0] text-[#2d1a22] hover:border-[#a83060] hover:bg-[#fff0f5]'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Feedback */}
            {evaluating && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#7d2347]/60">
                <Loader size={14} className="animate-spin" />
                Evaluating...
              </div>
            )}

            {fb && !evaluating && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-xl text-sm ${
                  fb.correct ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {fb.feedback}
              </motion.div>
            )}

            {/* Next button */}
            {answered && !evaluating && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleNext}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-[#a83060] text-white font-semibold py-3 rounded-xl hover:bg-[#7d2347] transition-colors"
              >
                {current < questions.length - 1 ? (
                  <><ChevronRight size={18} /> Next Question</>
                ) : (
                  <><Trophy size={18} /> See Results</>
                )}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Skip */}
        {!answered && (
          <button
            onClick={() => {
              setFillInput('')
              setAnswers(p => ({ ...p, [current]: 'skipped' }))
              setFeedback(p => ({ ...p, [current]: { correct: false, feedback: `Skipped. Correct answer: ${q?.answer}` } }))
            }}
            className="mt-3 w-full text-xs text-[#7d2347]/40 hover:text-[#a83060] transition-colors"
          >
            Skip this question
          </button>
        )}
      </div>
    </div>
  )
}
