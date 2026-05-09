import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Target, TrendingUp, Download, FileText,
  Loader, Brain, Calendar, AlertCircle, CheckCircle,
  BarChart2, Award, ArrowUp, ArrowDown, Minus, Zap, Plus, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { listDocuments, generateExamReport, generateStudyPlan, getProgress } from '../api'
import { jsPDF } from 'jspdf'

function timeAgo(iso) {
  const date = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ScoreBar({ score, label, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#7d2347]/60 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-[#ffe4ee] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold text-[#2d1a22] w-10 text-right">{score}%</span>
    </div>
  )
}

export default function ExamPrep() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [docs, setDocs] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [subject, setSubject] = useState('')
  const [examType, setExamType] = useState('general')
  const [examDate, setExamDate] = useState('')
  const [weakTopics, setWeakTopics] = useState([])
  const [weakInput, setWeakInput] = useState('')
  const [tab, setTab] = useState('report') // report | plan | progress
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [plan, setPlan] = useState(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    listDocuments().then(setDocs).catch(() => {})
    getProgress().then(setProgress).catch(() => {})
  }, [user])

  const handleReport = async () => {
    if (!selectedDocs.length) { setError('Select at least one document.'); return }
    setLoading(true); setError('')
    try {
      const res = await generateExamReport(selectedDocs, subject, examType)
      setReport(res)
      setTab('report')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handlePlan = async () => {
    if (!selectedDocs.length) { setError('Select at least one document.'); return }
    setLoading(true); setError('')
    try {
      const res = await generateStudyPlan(selectedDocs, examDate, weakTopics)
      setPlan(res)
      setTab('plan')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const downloadPDF = (content, filename, title) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxW = pageW - margin * 2

    // Header background
    doc.setFillColor(168, 48, 96)
    doc.rect(0, 0, pageW, 35, 'F')

    // Logo text
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('NeuroDocX', margin, 16)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('AI PDF Intelligence Platform', margin, 23)
    doc.setFontSize(9)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 30)

    // Title
    doc.setTextColor(168, 48, 96)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, 48)

    // Divider
    doc.setDrawColor(168, 48, 96)
    doc.setLineWidth(0.5)
    doc.line(margin, 52, pageW - margin, 52)

    // Content
    doc.setTextColor(45, 26, 34)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const lines = doc.splitTextToSize(content, maxW)
    let y = 60
    const lineH = 5.5

    lines.forEach(line => {
      if (y > pageH - 25) {
        doc.addPage()
        // Mini header on new pages
        doc.setFillColor(168, 48, 96)
        doc.rect(0, 0, pageW, 12, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text('NeuroDocX — AI PDF Intelligence', margin, 8)
        doc.setTextColor(45, 26, 34)
        doc.setFontSize(10)
        y = 20
      }

      // Style section headings (all caps lines)
      if (line === line.toUpperCase() && line.trim().length > 3 && !line.match(/^\d/)) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(168, 48, 96)
        doc.text(line, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(45, 26, 34)
      } else {
        doc.text(line, margin, y)
      }
      y += lineH
    })

    // Footer on last page
    doc.setFillColor(255, 228, 238)
    doc.rect(0, pageH - 12, pageW, 12, 'F')
    doc.setTextColor(168, 48, 96)
    doc.setFontSize(8)
    doc.text('Generated by NeuroDocX — AI-Powered PDF Intelligence', margin, pageH - 5)
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageW - margin - 10, pageH - 5)

    doc.save(filename)
  }

  const addWeakTopic = () => {
    if (weakInput.trim() && !weakTopics.includes(weakInput.trim())) {
      setWeakTopics(prev => [...prev, weakInput.trim()])
      setWeakInput('')
    }
  }

  const trendIcon = progress?.summary?.trend === 'improving'
    ? <ArrowUp size={14} className="text-green-500" />
    : progress?.summary?.trend === 'declining'
    ? <ArrowDown size={14} className="text-red-500" />
    : <Minus size={14} className="text-yellow-500" />

  const scoreColor = (s) => s >= 80 ? '#16a34a' : s >= 60 ? '#2563eb' : s >= 40 ? '#d97706' : '#dc2626'

  return (
    <div className="min-h-screen bg-[#fff8fb]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#a83060] to-[#c4527e] px-6 md:px-10 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Target size={22} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Exam Preparation</h1>
          </div>
          <p className="text-[#f9c8d9] text-sm ml-13">AI-powered study reports, progress tracking, and personalized study plans</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Setup panel */}
          <div className="flex flex-col gap-4">
            {/* Document selection */}
            <div className="bg-white rounded-2xl border border-[#ffe4ee] p-5">
              <h2 className="text-xs font-bold text-[#a83060]/70 uppercase tracking-widest mb-3">Select Documents</h2>
              {docs.length === 0 ? (
                <p className="text-sm text-[#7d2347]/50">No documents yet. <a href="/chat" className="text-[#a83060] font-semibold">Upload a PDF →</a></p>
              ) : (
                <div className="flex flex-col gap-2">
                  {docs.map(doc => (
                    <label key={doc.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-[#ffe4ee] hover:border-[#a83060]/30 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.id)}
                        onChange={e => setSelectedDocs(prev =>
                          e.target.checked ? [...prev, doc.id] : prev.filter(d => d !== doc.id)
                        )}
                        className="accent-[#a83060] w-4 h-4 shrink-0"
                      />
                      <FileText size={13} className="text-[#a83060] shrink-0" />
                      <span className="text-xs text-[#2d1a22] font-medium truncate">{doc.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl border border-[#ffe4ee] p-5 flex flex-col gap-3">
              <h2 className="text-xs font-bold text-[#a83060]/70 uppercase tracking-widest">Settings</h2>

              <div>
                <label className="text-xs font-semibold text-[#7d2347] mb-1 block">Subject / Topic</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Computer Networks, History..."
                  className="w-full border border-[#f0a0c0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#a83060] bg-[#fff8fb]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#7d2347] mb-1 block">Exam Type</label>
                <select
                  value={examType}
                  onChange={e => setExamType(e.target.value)}
                  className="w-full border border-[#f0a0c0] rounded-xl px-3 py-2 text-sm bg-white text-[#2d1a22] focus:outline-none focus:border-[#a83060]"
                >
                  <option value="general">General Exam</option>
                  <option value="mcq">MCQ / Objective</option>
                  <option value="descriptive">Descriptive / Essay</option>
                  <option value="mixed">Mixed Format</option>
                  <option value="viva">Viva / Oral Exam</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#7d2347] mb-1 block">Exam Date (optional)</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full border border-[#f0a0c0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#a83060] bg-[#fff8fb]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#7d2347] mb-1 block">Weak Topics</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={weakInput}
                    onChange={e => setWeakInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addWeakTopic()}
                    placeholder="Add a weak topic..."
                    className="flex-1 border border-[#f0a0c0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#a83060] bg-[#fff8fb]"
                  />
                  <button onClick={addWeakTopic} className="p-2 bg-[#a83060] text-white rounded-xl hover:bg-[#7d2347]">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {weakTopics.map((t, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-[#ffe4ee] text-[#a83060] px-2 py-1 rounded-full">
                      {t}
                      <button onClick={() => setWeakTopics(prev => prev.filter((_, j) => j !== i))}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-xl">{error}</div>
            )}
            <button
              onClick={handleReport}
              disabled={loading || !selectedDocs.length}
              className="w-full flex items-center justify-center gap-2 bg-[#a83060] text-white font-bold py-3 rounded-xl hover:bg-[#7d2347] transition-colors disabled:opacity-40 text-sm"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Brain size={16} />}
              Generate Exam Report
            </button>
            <button
              onClick={handlePlan}
              disabled={loading || !selectedDocs.length}
              className="w-full flex items-center justify-center gap-2 border-2 border-[#a83060] text-[#a83060] font-bold py-3 rounded-xl hover:bg-[#ffe4ee] transition-colors disabled:opacity-40 text-sm"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Calendar size={16} />}
              Generate Study Plan
            </button>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Progress summary cards */}
            {progress?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Quizzes Taken', value: progress.summary.total_attempts, icon: Zap, color: '#a83060' },
                  { label: 'Average Score', value: `${progress.summary.avg_score}%`, icon: BarChart2, color: '#c4527e' },
                  { label: 'Best Score', value: `${progress.summary.best_score}%`, icon: Award, color: '#7d2347' },
                  { label: 'Latest Score', value: `${progress.summary.latest_score}%`, icon: Target, color: '#a83060' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-white rounded-2xl border border-[#ffe4ee] p-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: s.color + '18' }}>
                      <s.icon size={16} style={{ color: s.color }} />
                    </div>
                    <div className="text-xl font-extrabold text-[#2d1a22]">{s.value}</div>
                    <div className="text-xs text-[#7d2347]/60">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-[#ffe4ee] overflow-hidden">
              <div className="flex border-b border-[#ffe4ee]">
                {[
                  { id: 'report', label: 'Exam Report', icon: FileText },
                  { id: 'plan', label: 'Study Plan', icon: Calendar },
                  { id: 'progress', label: 'Progress', icon: TrendingUp },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
                      tab === t.id
                        ? 'bg-[#ffe4ee] text-[#a83060] border-b-2 border-[#a83060]'
                        : 'text-[#7d2347]/60 hover:bg-[#fff0f5]'
                    }`}
                  >
                    <t.icon size={15} />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Exam Report Tab */}
                {tab === 'report' && (
                  loading ? (
                    <div className="flex flex-col items-center py-12">
                      <Loader size={36} className="text-[#a83060] animate-spin mb-4" />
                      <p className="font-semibold text-[#2d1a22]">Generating your exam report...</p>
                      <p className="text-sm text-[#7d2347]/50 mt-1">Analyzing document content and performance data</p>
                    </div>
                  ) : report ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-[#2d1a22]">Exam Preparation Report</h3>
                          {report.avg_score && (
                            <p className="text-xs text-[#7d2347]/60 mt-0.5">Based on {report.total_quizzes} quiz attempts · Avg: {report.avg_score}%</p>
                          )}
                        </div>
                        <button
                          onClick={() => downloadPDF(report.report, 'NeuroDocX_Exam_Report.pdf', 'Exam Preparation Report')}
                          className="flex items-center gap-2 bg-[#a83060] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#7d2347] transition-colors"
                        >
                          <Download size={14} />
                          Download PDF
                        </button>
                      </div>
                      <div className="bg-[#fff8fb] rounded-xl p-5 text-sm text-[#2d1a22] leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto border border-[#ffe4ee]">
                        {report.report}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#ffe4ee] flex items-center justify-center mb-4">
                        <FileText size={28} className="text-[#a83060]" />
                      </div>
                      <p className="font-semibold text-[#2d1a22] mb-1">No report generated yet</p>
                      <p className="text-sm text-[#7d2347]/50">Select documents and click "Generate Exam Report"</p>
                    </div>
                  )
                )}

                {/* Study Plan Tab */}
                {tab === 'plan' && (
                  loading ? (
                    <div className="flex flex-col items-center py-12">
                      <Loader size={36} className="text-[#a83060] animate-spin mb-4" />
                      <p className="font-semibold text-[#2d1a22]">Creating your study plan...</p>
                    </div>
                  ) : plan ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-[#2d1a22]">Personalized Study Plan</h3>
                        <button
                          onClick={() => downloadPDF(plan.plan, 'NeuroDocX_Study_Plan.pdf', 'Personalized Study Plan')}
                          className="flex items-center gap-2 bg-[#a83060] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#7d2347] transition-colors"
                        >
                          <Download size={14} />
                          Download PDF
                        </button>
                      </div>
                      <div className="bg-[#fff8fb] rounded-xl p-5 text-sm text-[#2d1a22] leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto border border-[#ffe4ee]">
                        {plan.plan}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#ffe4ee] flex items-center justify-center mb-4">
                        <Calendar size={28} className="text-[#a83060]" />
                      </div>
                      <p className="font-semibold text-[#2d1a22] mb-1">No study plan yet</p>
                      <p className="text-sm text-[#7d2347]/50">Select documents and click "Generate Study Plan"</p>
                    </div>
                  )
                )}

                {/* Progress Tab */}
                {tab === 'progress' && (
                  progress?.progress?.length ? (
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#2d1a22]">Your Progress</h3>
                        <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ffe4ee] text-[#a83060]">
                          {trendIcon}
                          {progress.summary.trend}
                        </div>
                      </div>

                      {/* Score bars */}
                      <div className="flex flex-col gap-3">
                        {progress.progress.slice(-8).map((p, i) => (
                          <ScoreBar
                            key={i}
                            label={`Attempt ${p.attempt}`}
                            score={p.score}
                            color={scoreColor(p.score)}
                          />
                        ))}
                      </div>

                      {/* Performance breakdown */}
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#ffe4ee]">
                        {[
                          { label: 'Needs Work', range: '0-40%', color: '#dc2626', count: progress.progress.filter(p => p.score < 40).length },
                          { label: 'Improving', range: '40-70%', color: '#d97706', count: progress.progress.filter(p => p.score >= 40 && p.score < 70).length },
                          { label: 'Strong', range: '70-100%', color: '#16a34a', count: progress.progress.filter(p => p.score >= 70).length },
                        ].map((b, i) => (
                          <div key={i} className="text-center p-3 rounded-xl" style={{ background: b.color + '10' }}>
                            <div className="text-xl font-extrabold" style={{ color: b.color }}>{b.count}</div>
                            <div className="text-xs font-semibold text-[#2d1a22]">{b.label}</div>
                            <div className="text-xs text-[#7d2347]/50">{b.range}</div>
                          </div>
                        ))}
                      </div>

                      {/* Advice */}
                      <div className="bg-[#ffe4ee] rounded-xl p-4">
                        <p className="text-xs font-bold text-[#a83060] mb-1">Personalized Advice</p>
                        <p className="text-sm text-[#2d1a22]">
                          {progress.summary.avg_score >= 80
                            ? "Excellent performance! You're well-prepared. Focus on maintaining consistency and reviewing edge cases."
                            : progress.summary.avg_score >= 60
                            ? "Good progress! Identify the topics where you scored below 60% and revisit those sections. Take more practice quizzes."
                            : progress.summary.avg_score >= 40
                            ? "You're building understanding. Spend more time on fundamentals and use the Generate Notes feature for key concepts."
                            : "Start with the basics. Use the Summarize feature to get an overview, then take easy-difficulty quizzes to build confidence."}
                        </p>
                      </div>

                      <button
                        onClick={() => downloadPDF(
                          `NEURODOCX PROGRESS REPORT\n\nStudent: ${user?.username}\nGenerated: ${new Date().toLocaleDateString()}\n\nSUMMARY\nTotal Attempts: ${progress.summary.total_attempts}\nAverage Score: ${progress.summary.avg_score}%\nBest Score: ${progress.summary.best_score}%\nLatest Score: ${progress.summary.latest_score}%\nTrend: ${progress.summary.trend}\n\nDETAILED ATTEMPTS\n${progress.progress.map(p => `Attempt ${p.attempt}: ${p.score}% (${p.difficulty} difficulty, ${p.total_questions} questions) - ${timeAgo(p.created_at)}`).join('\n')}`,
                          'NeuroDocX_Progress_Report.pdf',
                          'Student Progress Report'
                        )}
                        className="flex items-center justify-center gap-2 border-2 border-[#a83060] text-[#a83060] font-semibold py-2.5 rounded-xl hover:bg-[#ffe4ee] transition-colors text-sm"
                      >
                        <Download size={15} />
                        Download Progress Report
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#ffe4ee] flex items-center justify-center mb-4">
                        <TrendingUp size={28} className="text-[#a83060]" />
                      </div>
                      <p className="font-semibold text-[#2d1a22] mb-1">No progress data yet</p>
                      <p className="text-sm text-[#7d2347]/50 mb-4">Take some quizzes to track your progress</p>
                      <a href="/quiz" className="text-sm text-[#a83060] font-semibold hover:underline">Go to Quiz →</a>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
