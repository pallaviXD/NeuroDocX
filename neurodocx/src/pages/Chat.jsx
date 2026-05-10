import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Send, FileText, X, Brain, Copy, ThumbsUp, Loader,
  Sparkles, FileQuestion, StickyNote, GitCompare,
  History, Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  uploadPDF, listDocuments, deleteDocument,
  sendMessage as apiSendMessage, summarize, generateNotes, compareDocuments,
  listSessions, getSessionMessages, deleteSession
} from '../api'
import VoiceAssistant from '../components/VoiceAssistant'

const QUICK_PROMPTS = [
  'Summarize this document',
  'What are the key findings?',
  'Explain the methodology',
  'List the main conclusions',
  'What are the key concepts?',
  "Explain like I'm 10",
]

const EXPLAIN_MODES = ['standard', 'beginner', 'technical', 'business', 'eli5']

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

const WELCOME = { role: 'assistant', content: "Hi! Upload a PDF and I'll help you understand, summarize, and extract insights from it.", sources: [] }

export default function Chat() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Panels
  const [sidePanel, setSidePanel] = useState('docs') // 'docs' | 'history'

  // Docs
  const [docs, setDocs] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Chat
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [explainMode, setExplainMode] = useState('standard')
  const [lastAnswer, setLastAnswer] = useState('')
  const [error, setError] = useState('')

  // History
  const [sessions, setSessions] = useState([])
  const [loadingSession, setLoadingSession] = useState(false)

  const fileRef = useRef()
  const bottomRef = useRef()

  useEffect(() => {
    if (!user) { navigate('/auth', { state: { from: '/chat' } }); return }
    listDocuments().then(setDocs).catch(() => {})
    listSessions().then(setSessions).catch(() => {})
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleFiles = async (incoming) => {
    const pdfs = Array.from(incoming).filter(f => f.type === 'application/pdf')
    if (!pdfs.length) return
    setUploading(true); setError('')
    for (const file of pdfs) {
      try {
        const doc = await uploadPDF(file)
        setDocs(prev => [doc, ...prev])
        setSelectedDocs(prev => [...prev, doc.id])
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${file.name} uploaded and indexed (${doc.pages} pages). Ready to answer your questions!`,
          sources: [],
        }])
      } catch (err) { setError(`Upload failed: ${err.message}`) }
    }
    setUploading(false)
  }

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const q = (text || input).trim()
    if (!q) return
    if (!selectedDocs.length) { setError('Select at least one document first.'); return }
    setInput(''); setError('')
    setMessages(prev => [...prev, { role: 'user', content: q, sources: [] }])
    setLoading(true)
    try {
      const result = await apiSendMessage(selectedDocs, q, sessionId, explainMode)
      setSessionId(result.session_id)
      setLastAnswer(result.answer)
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer, sources: result.sources || [] }])
      listSessions().then(setSessions).catch(() => {})
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, sources: [] }])
    } finally { setLoading(false) }
  }

  // ── History ─────────────────────────────────────────────────────────────────
  const loadSession = async (session) => {
    setLoadingSession(true); setError('')
    try {
      const msgs = await getSessionMessages(session.id)
      setMessages(msgs.length ? msgs.map(m => ({ role: m.role, content: m.content, sources: m.sources || [] })) : [WELCOME])
      setSessionId(session.id)
      if (session.doc_ids?.length) {
        const validIds = session.doc_ids.filter(Boolean)
        setSelectedDocs(validIds)
      }
    } catch (err) { setError(err.message) }
    finally { setLoadingSession(false) }
  }

  const startNewChat = () => {
    setMessages([WELCOME])
    setSessionId(null)
    setInput('')
    setError('')
  }

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation()
    try {
      await deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (sessionId === id) startNewChat()
    } catch (err) { setError(err.message) }
  }

  // ── AI Tools ────────────────────────────────────────────────────────────────
  const runTool = async (label, fn) => {
    if (!selectedDocs.length) { setError('Select a document first.'); return }
    setLoading(true)
    try {
      const res = await fn()
      setMessages(prev => [...prev,
        { role: 'user', content: label, sources: [] },
        { role: 'assistant', content: res, sources: [] },
      ])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const toggleDoc = (id) => setSelectedDocs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  const removeDoc = async (id) => {
    try { await deleteDocument(id); setDocs(prev => prev.filter(d => d.id !== id)); setSelectedDocs(prev => prev.filter(d => d !== id)) }
    catch (err) { setError(err.message) }
  }
  const copyText = (text) => navigator.clipboard.writeText(text)
  const formatSize = (b) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`

  return (
    <div className="flex h-[calc(100vh-57px)] bg-[#fff8fb]">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-[#ffe4ee] overflow-hidden">

        {/* Tab switcher */}
        <div className="flex border-b border-[#ffe4ee] shrink-0">
          <button
            onClick={() => setSidePanel('docs')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${sidePanel === 'docs' ? 'bg-[#ffe4ee] text-[#a83060] border-b-2 border-[#a83060]' : 'text-[#7d2347]/50 hover:bg-[#fff0f5]'}`}
          >
            <FileText size={13} /> Documents
          </button>
          <button
            onClick={() => setSidePanel('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${sidePanel === 'history' ? 'bg-[#ffe4ee] text-[#a83060] border-b-2 border-[#a83060]' : 'text-[#7d2347]/50 hover:bg-[#fff0f5]'}`}
          >
            <History size={13} /> History
          </button>
        </div>

        {/* ── Documents panel ── */}
        {sidePanel === 'docs' && (
          <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
            {/* Upload zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              onClick={() => fileRef.current.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${dragOver ? 'border-[#a83060] bg-[#ffe4ee]' : 'border-[#f0a0c0] hover:border-[#a83060] hover:bg-[#fff0f5]'}`}
            >
              {uploading ? <Loader size={22} className="text-[#a83060] mx-auto mb-1 animate-spin" /> : <Upload size={22} className="text-[#a83060] mx-auto mb-1" />}
              <p className="text-sm font-semibold text-[#a83060]">{uploading ? 'Processing...' : 'Drop PDFs here'}</p>
              <p className="text-xs text-[#7d2347]/50 mt-0.5">or click to browse</p>
              <input ref={fileRef} type="file" accept=".pdf" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>

            {/* Doc list */}
            {docs.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[#7d2347]/50 font-medium">Click to select for chat</p>
                {docs.map(doc => (
                  <div key={doc.id} onClick={() => toggleDoc(doc.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer group transition-all ${selectedDocs.includes(doc.id) ? 'border-[#a83060] bg-[#fff0f5]' : 'border-[#ffe4ee] hover:border-[#f0a0c0]'}`}
                  >
                    <FileText size={14} className={selectedDocs.includes(doc.id) ? 'text-[#a83060] shrink-0' : 'text-[#7d2347]/40 shrink-0'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2d1a22] truncate">{doc.name}</p>
                      <p className="text-xs text-[#7d2347]/40">{doc.pages}p · {formatSize(doc.size)}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeDoc(doc.id) }} className="opacity-0 group-hover:opacity-100 text-[#a83060] transition-opacity shrink-0">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick prompts */}
            <div>
              <p className="text-xs font-bold text-[#a83060]/60 uppercase tracking-widest mb-2">Quick Prompts</p>
              <div className="flex flex-col gap-1">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p)} className="text-left text-xs text-[#7d2347] px-3 py-2 rounded-lg hover:bg-[#ffe4ee] transition-colors">{p}</button>
                ))}
              </div>
            </div>

            {/* AI Tools */}
            <div>
              <p className="text-xs font-bold text-[#a83060]/60 uppercase tracking-widest mb-2">AI Tools</p>
              <div className="flex flex-col gap-1">
                {[
                  { icon: Sparkles, label: 'Summarize Document', fn: async () => { const r = await summarize(selectedDocs, 'detailed'); return r.summary } },
                  { icon: StickyNote, label: 'Generate Notes', fn: async () => { const r = await generateNotes(selectedDocs); return r.notes } },
                  { icon: GitCompare, label: 'Compare Docs', fn: async () => { const r = await compareDocuments(selectedDocs); return r.comparison } },
                ].map((t, i) => (
                  <button key={i} onClick={() => runTool(t.label, t.fn)} className="flex items-center gap-2 text-xs text-[#7d2347] px-3 py-2 rounded-lg hover:bg-[#ffe4ee] transition-colors">
                    <t.icon size={12} className="text-[#a83060]" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Explain mode */}
            <div className="mt-auto">
              <p className="text-xs font-bold text-[#a83060]/60 uppercase tracking-widest mb-1.5">Explain Mode</p>
              <select value={explainMode} onChange={e => setExplainMode(e.target.value)}
                className="w-full text-xs border border-[#f0a0c0] rounded-xl px-3 py-2 bg-white text-[#2d1a22] focus:outline-none focus:border-[#a83060]">
                {EXPLAIN_MODES.map(m => <option key={m} value={m}>{m === 'eli5' ? "Explain Like I'm 10" : m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── History panel ── */}
        {sidePanel === 'history' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#ffe4ee] shrink-0">
              <span className="text-xs font-bold text-[#a83060]/70 uppercase tracking-widest">Previous Chats</span>
              <button onClick={startNewChat}
                className="flex items-center gap-1 text-xs bg-[#a83060] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#7d2347] transition-colors font-semibold">
                <Plus size={11} /> New Chat
              </button>
            </div>

            {loadingSession ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader size={20} className="animate-spin text-[#a83060]" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <MessageSquare size={28} className="text-[#a83060]/20 mb-2" />
                <p className="text-sm font-semibold text-[#2d1a22]">No chat history yet</p>
                <p className="text-xs text-[#7d2347]/40 mt-1">Start a conversation to see it here</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {sessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => loadSession(s)}
                    className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer hover:bg-[#fff0f5] transition-colors border-b border-[#ffe4ee]/60 group ${sessionId === s.id ? 'bg-[#ffe4ee]' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${sessionId === s.id ? 'bg-[#a83060]' : 'bg-[#ffe4ee]'}`}>
                      <MessageSquare size={12} className={sessionId === s.id ? 'text-white' : 'text-[#a83060]'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2d1a22] truncate leading-snug">{s.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#7d2347]/40">{timeAgo(s.created_at)}</span>
                        <span className="text-xs text-[#7d2347]/30">·</span>
                        <span className="text-xs text-[#7d2347]/40">{s.message_count} msgs</span>
                      </div>
                    </div>
                    <button
                      onClick={e => handleDeleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-400 transition-all shrink-0 mt-0.5"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="bg-white border-b border-[#ffe4ee] px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#a83060] flex items-center justify-center shrink-0">
            <Brain size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#2d1a22] text-sm">NeuroDocX AI</p>
            <p className="text-xs text-[#7d2347]/50 truncate">
              {selectedDocs.length ? `${selectedDocs.length} doc${selectedDocs.length > 1 ? 's' : ''} selected` : 'No documents selected'}
            </p>
          </div>
          <button onClick={startNewChat} title="New Chat"
            className="p-2 rounded-lg hover:bg-[#ffe4ee] text-[#a83060] transition-colors shrink-0">
            <Plus size={16} />
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-[#7d2347]/50">AI Ready</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-600 text-xs px-4 py-2 flex items-center justify-between shrink-0">
            {error}
            <button onClick={() => setError('')}><X size={13} /></button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${msg.role === 'user' ? 'bg-[#a83060] text-white' : 'bg-[#ffe4ee] text-[#a83060]'}`}>
                  {msg.role === 'user' ? (user?.username?.[0]?.toUpperCase() || 'U') : <Brain size={15} />}
                </div>
                <div className="max-w-[78%] group">
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#a83060] text-white rounded-tr-sm' : 'bg-white border border-[#ffe4ee] text-[#2d1a22] rounded-tl-sm shadow-sm'}`}>
                    {msg.content}
                  </div>
                  {msg.sources?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {msg.sources.map((s, si) => (
                        <span key={si} className="text-xs bg-[#ffe4ee] text-[#a83060] px-2 py-0.5 rounded-full font-medium">
                          Page {s.page}{s.doc_name ? ` · ${s.doc_name.split('.')[0]}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.role === 'assistant' && (
                    <div className="flex gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyText(msg.content)} className="p-1 rounded hover:bg-[#ffe4ee] text-[#a83060]/50 hover:text-[#a83060]"><Copy size={11} /></button>
                      <button className="p-1 rounded hover:bg-[#ffe4ee] text-[#a83060]/50 hover:text-[#a83060]"><ThumbsUp size={11} /></button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffe4ee] flex items-center justify-center">
                <Brain size={15} className="text-[#a83060]" />
              </div>
              <div className="bg-white border border-[#ffe4ee] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                      className="w-2 h-2 rounded-full bg-[#a83060]" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-[#ffe4ee] px-4 py-3 shrink-0">
          <div className="flex items-end gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="p-2.5 rounded-xl border border-[#f0a0c0] text-[#a83060] hover:bg-[#ffe4ee] transition-colors shrink-0">
              {uploading ? <Loader size={17} className="animate-spin" /> : <Upload size={17} />}
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask anything about your documents..."
              rows={1}
              className="flex-1 resize-none border border-[#f0a0c0] rounded-2xl px-4 py-2.5 text-sm text-[#2d1a22] placeholder-[#7d2347]/40 focus:outline-none focus:border-[#a83060] bg-[#fff8fb] max-h-28"
              style={{ minHeight: '44px' }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-[#a83060] text-white hover:bg-[#7d2347] transition-colors disabled:opacity-40 shrink-0 shadow">
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>

      <VoiceAssistant onQuery={sendMessage} lastAnswer={lastAnswer} disabled={!selectedDocs.length} />
    </div>
  )
}
