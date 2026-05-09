import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, MessageSquare, BookOpen, Zap, TrendingUp, Clock,
  Plus, Sparkles, Brain, BarChart2, Target, Award, ArrowRight,
  Upload, GitCompare, StickyNote, FileQuestion, ChevronRight,
  Activity, Cpu, Hash
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDashboardAnalytics } from '../api'
import { useAuth } from '../context/AuthContext'

function formatSize(bytes) {
  if (!bytes) return '0 KB'
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(iso) {
  const date = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-5 border border-[#ffe4ee] shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={20} style={{ color }} />
        </div>
        <TrendingUp size={14} className="text-green-500" />
      </div>
      <div className="text-3xl font-extrabold text-[#2d1a22] mb-0.5">{value}</div>
      <div className="text-sm text-[#7d2347]/70">{label}</div>
      {sub && <div className="text-xs text-green-600 mt-1 font-medium">{sub}</div>}
    </motion.div>
  )
}

const QUICK_ACTIONS = [
  { icon: Upload,      label: 'Upload PDF',      desc: 'Add a new document',         to: '/chat',      color: '#a83060' },
  { icon: Brain,       label: 'Chat with AI',    desc: 'Ask questions about docs',   to: '/chat',      color: '#7d2347' },
  { icon: FileQuestion,label: 'Create Quiz',     desc: 'Generate MCQs & questions',  to: '/quiz',      color: '#c4527e' },
  { icon: StickyNote,  label: 'Generate Notes',  desc: 'Auto study notes',           to: '/chat',      color: '#a83060' },
  { icon: Sparkles,    label: 'Summarize',       desc: 'Quick AI summary',           to: '/chat',      color: '#7d2347' },
  { icon: GitCompare,  label: 'Compare Docs',    desc: 'Multi-PDF analysis',         to: '/chat',      color: '#c4527e' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardAnalytics()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const s = data?.stats
  const stats = [
    { icon: FileText,     label: 'Documents',      value: loading ? '—' : (s?.documents ?? 0),     sub: s?.documents > 0 ? 'Indexed & ready' : null,          color: '#a83060', delay: 0 },
    { icon: MessageSquare,label: 'Conversations',  value: loading ? '—' : (s?.conversations ?? 0), sub: s?.messages ? `${s.messages} total messages` : null,   color: '#c4527e', delay: 0.07 },
    { icon: BookOpen,     label: 'Notes Created',  value: loading ? '—' : (s?.notes ?? 0),         sub: s?.summaries ? `${s.summaries} summaries too` : null,  color: '#7d2347', delay: 0.14 },
    { icon: Zap,          label: 'Quizzes Taken',  value: loading ? '—' : (s?.quizzes ?? 0),        sub: data?.quiz_avg_score ? `Avg score: ${data.quiz_avg_score}%` : null, color: '#a83060', delay: 0.21 },
  ]

  const scoreColor = (score) => {
    if (!score) return 'text-[#7d2347]/40'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-500'
  }

  return (
    <div className="min-h-screen bg-[#fff8fb]">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-[#a83060] to-[#c4527e] px-6 md:px-10 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {user ? `Welcome back, ${user.username} 👋` : 'Dashboard'}
            </h1>
            <p className="text-[#f9c8d9] mt-1 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link
            to="/chat"
            className="hidden md:inline-flex items-center gap-2 bg-white text-[#a83060] font-bold px-5 py-2.5 rounded-xl hover:bg-[#ffe4ee] transition-colors shadow text-sm"
          >
            <Plus size={16} />
            New Chat
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 py-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* Token usage bar */}
        {s?.total_tokens > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-[#ffe4ee] p-4 mb-6 flex items-center gap-4"
          >
            <div className="w-9 h-9 rounded-xl bg-[#ffe4ee] flex items-center justify-center shrink-0">
              <Cpu size={16} className="text-[#a83060]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[#2d1a22]">AI Tokens Used</span>
                <span className="text-sm font-bold text-[#a83060]">{s.total_tokens.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-[#ffe4ee] rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-[#a83060] to-[#c4527e] rounded-full transition-all"
                  style={{ width: `${Math.min((s.total_tokens / 100000) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#7d2347]/50 mt-1">Groq LLM · llama-3.3-70b-versatile</p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Recent Documents */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#ffe4ee] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffe4ee]">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#a83060]" />
                <h2 className="font-bold text-[#2d1a22]">Recent Documents</h2>
              </div>
              <Link to="/chat" className="text-xs text-[#a83060] font-semibold hover:underline flex items-center gap-1">
                Upload more <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="p-6 flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-[#ffe4ee]/50 animate-pulse" />)}
              </div>
            ) : data?.recent_documents?.length ? (
              <div className="divide-y divide-[#ffe4ee]">
                {data.recent_documents.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-[#fff0f5] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#a83060]/10 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-[#a83060]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2d1a22] truncate">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[#7d2347]/50">{doc.pages} pages</span>
                        <span className="text-xs text-[#7d2347]/30">·</span>
                        <span className="text-xs text-[#7d2347]/50">{formatSize(doc.size)}</span>
                        {doc.has_ocr && (
                          <>
                            <span className="text-xs text-[#7d2347]/30">·</span>
                            <span className="text-xs bg-[#ffe4ee] text-[#a83060] px-1.5 py-0.5 rounded font-medium">OCR</span>
                          </>
                        )}
                        {doc.chunk_count > 0 && (
                          <>
                            <span className="text-xs text-[#7d2347]/30">·</span>
                            <span className="text-xs text-[#7d2347]/50">{doc.chunk_count} chunks</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#7d2347]/50">{timeAgo(doc.created_at)}</p>
                      <Link
                        to="/chat"
                        className="text-xs text-[#a83060] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end mt-0.5"
                      >
                        Open <ChevronRight size={11} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-[#ffe4ee] flex items-center justify-center mb-3">
                  <Upload size={24} className="text-[#a83060]" />
                </div>
                <p className="font-semibold text-[#2d1a22] mb-1">No documents yet</p>
                <p className="text-sm text-[#7d2347]/50 mb-4">Upload your first PDF to get started</p>
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 bg-[#a83060] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#7d2347] transition-colors"
                >
                  <Upload size={14} /> Upload PDF
                </Link>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Quiz performance */}
            <div className="bg-white rounded-2xl border border-[#ffe4ee] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award size={16} className="text-[#a83060]" />
                <h2 className="font-bold text-[#2d1a22]">Quiz Performance</h2>
              </div>
              {data?.quiz_avg_score != null ? (
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ffe4ee" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke="#a83060" strokeWidth="3"
                        strokeDasharray={`${data.quiz_avg_score} ${100 - data.quiz_avg_score}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-extrabold text-[#a83060]">{data.quiz_avg_score}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#2d1a22]">Average Score</p>
                  <p className="text-xs text-[#7d2347]/50 mt-0.5">{s?.quizzes} quiz{s?.quizzes !== 1 ? 'zes' : ''} taken</p>
                  <div className={`mt-2 text-sm font-bold ${scoreColor(data.quiz_avg_score)}`}>
                    {data.quiz_avg_score >= 80 ? '🏆 Excellent!' : data.quiz_avg_score >= 60 ? '👍 Good work' : '📚 Keep practicing'}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Target size={28} className="text-[#a83060]/30 mx-auto mb-2" />
                  <p className="text-sm text-[#7d2347]/50">No quizzes taken yet</p>
                  <Link to="/quiz" className="text-xs text-[#a83060] font-semibold mt-2 inline-block hover:underline">
                    Take a quiz →
                  </Link>
                </div>
              )}
            </div>

            {/* Recent chats */}
            <div className="bg-white rounded-2xl border border-[#ffe4ee] shadow-sm overflow-hidden flex-1">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#ffe4ee]">
                <Activity size={15} className="text-[#a83060]" />
                <h2 className="font-bold text-[#2d1a22]">Recent Chats</h2>
              </div>
              {loading ? (
                <div className="p-4 flex flex-col gap-2">
                  {[1,2,3].map(i => <div key={i} className="h-10 rounded-lg bg-[#ffe4ee]/50 animate-pulse" />)}
                </div>
              ) : data?.recent_sessions?.length ? (
                <div className="divide-y divide-[#ffe4ee]">
                  {data.recent_sessions.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-3 px-5 py-3 hover:bg-[#fff0f5] transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#ffe4ee] flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare size={12} className="text-[#a83060]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#2d1a22] truncate">{s.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock size={9} className="text-[#7d2347]/40" />
                          <span className="text-xs text-[#7d2347]/40">{timeAgo(s.created_at)}</span>
                          <span className="text-xs text-[#7d2347]/30">·</span>
                          <Hash size={9} className="text-[#7d2347]/40" />
                          <span className="text-xs text-[#7d2347]/40">{s.message_count} msgs</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <MessageSquare size={24} className="text-[#a83060]/20 mx-auto mb-2" />
                  <p className="text-xs text-[#7d2347]/40">No chats yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-[#a83060]" />
            <h2 className="font-bold text-[#2d1a22]">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Link
                  to={action.to}
                  className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-[#ffe4ee] hover:border-[#a83060]/30 hover:shadow-md transition-all group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors group-hover:scale-110 duration-200"
                    style={{ background: action.color + '15' }}
                  >
                    <action.icon size={20} style={{ color: action.color }} />
                  </div>
                  <p className="font-bold text-[#2d1a22] text-xs">{action.label}</p>
                  <p className="text-xs text-[#7d2347]/50 mt-0.5 leading-tight">{action.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
