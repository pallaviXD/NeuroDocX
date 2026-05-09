import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Brain, MessageSquare, FileSearch, BookOpen, Zap, Mic,
  Shield, Sparkles, GitCompare, Quote, Layers, Target,
  TrendingUp, History, Lock, FileText, Cpu
} from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'AI PDF Chat',
    desc: 'Natural conversations with your documents. Ask anything — get expert-level answers with page citations.',
    badge: 'Core',
  },
  {
    icon: Brain,
    title: 'RAG Pipeline',
    desc: 'Retrieval-Augmented Generation grounds every answer in your actual document. Zero hallucinations.',
    badge: 'AI',
  },
  {
    icon: FileSearch,
    title: 'Semantic Search',
    desc: 'MMR-powered vector search understands context and meaning, not just keywords. Diverse, relevant results every time.',
    badge: 'AI',
  },
  {
    icon: GitCompare,
    title: 'Multi-PDF Comparison',
    desc: 'Upload multiple documents and compare, cross-reference, and query across all of them simultaneously.',
    badge: 'Core',
  },
  {
    icon: Quote,
    title: 'Source Citations',
    desc: 'Every AI response includes exact page references and source excerpts. Full transparency and traceability.',
    badge: 'Core',
  },
  {
    icon: Layers,
    title: 'Smart Summaries',
    desc: 'Five summary styles: Short, Detailed, Bullet Points, Beginner-friendly, and Technical. One click.',
    badge: 'Core',
  },
  {
    icon: Shield,
    title: 'OCR Support',
    desc: 'Works with scanned and image-based PDFs. Tesseract OCR extracts text from any document automatically.',
    badge: 'AI',
  },
  {
    icon: BookOpen,
    title: 'Study Notes Generator',
    desc: 'Auto-generate structured study notes with key concepts, definitions, practice questions, and quick reference summaries.',
    badge: 'Student',
  },
  {
    icon: Zap,
    title: 'Quiz Generator',
    desc: 'Create MCQs, True/False, Fill-in-the-blank, and descriptive questions with AI-powered answer evaluation.',
    badge: 'Student',
  },
  {
    icon: Target,
    title: 'Exam Prep Reports',
    desc: 'AI-generated exam reports with topic priority, predicted questions, revision checklists — downloadable as PDF.',
    badge: 'Student',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    desc: 'Track quiz scores over time, see performance trends, get personalized advice on where to improve.',
    badge: 'Student',
  },
  {
    icon: Sparkles,
    title: 'Explain Modes',
    desc: 'Standard, Beginner, Technical, Business, or Explain Like I\'m 10. The AI adapts its language to you.',
    badge: 'Core',
  },
  {
    icon: Mic,
    title: 'Voice Assistant',
    desc: 'Speak your question, hear the answer. Full speech-to-text and text-to-speech with voice selection.',
    badge: 'Core',
  },
  {
    icon: History,
    title: 'Chat History',
    desc: 'All conversations are saved. Resume any previous chat without re-uploading your documents.',
    badge: 'Core',
  },
  {
    icon: Lock,
    title: 'Secure Authentication',
    desc: 'JWT-based auth with bcrypt password hashing, real-time strength validation, and secure password generator.',
    badge: 'Security',
  },
]

const badgeColors = {
  Core:     'bg-[#ffe4ee] text-[#a83060]',
  AI:       'bg-[#a83060]/10 text-[#7d2347]',
  Student:  'bg-blue-50 text-blue-700',
  Security: 'bg-green-50 text-green-700',
}

const techStack = [
  { category: 'Frontend', items: ['React.js 19', 'Tailwind CSS v4', 'Framer Motion', 'React Router v7'] },
  { category: 'Backend', items: ['FastAPI', 'Python 3.12', 'SQLAlchemy', 'SQLite'] },
  { category: 'AI & LLM', items: ['Groq API', 'llama-3.3-70b', 'Sentence Transformers'] },
  { category: 'Vector Search', items: ['FAISS', 'all-MiniLM-L6-v2', 'MMR Retrieval'] },
  { category: 'Document Processing', items: ['PyMuPDF', 'Tesseract OCR', 'Intelligent Chunking'] },
  { category: 'Security', items: ['JWT Tokens', 'bcrypt', 'Password Strength API'] },
]

const stats = [
  { value: '15+', label: 'AI Features' },
  { value: '5', label: 'Explain Modes' },
  { value: '4', label: 'Quiz Types' },
  { value: '100%', label: 'Free to Use' },
]

export default function Features() {
  return (
    <div className="min-h-screen bg-[#fff8fb]">

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#ffe4ee] via-white to-[#f9c8d9] py-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#a83060]/10 text-[#a83060] text-sm font-semibold px-4 py-2 rounded-full mb-5 border border-[#a83060]/20">
            <Sparkles size={14} />
            Complete Feature Set
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2d1a22] mb-4">
            Everything NeuroDocX can do
          </h1>
          <p className="text-[#7d2347]/70 text-lg max-w-xl mx-auto">
            A full-stack AI document intelligence platform — built for students, researchers, and professionals.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="bg-[#a83060] py-10 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-[#f9c8d9] text-sm mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#2d1a22] mb-2">All Features</h2>
            <p className="text-[#7d2347]/60">Every feature is fully built and working</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl p-6 border border-[#ffe4ee] hover:shadow-lg hover:border-[#a83060]/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#ffe4ee] flex items-center justify-center group-hover:bg-[#a83060] transition-colors">
                    <f.icon size={20} className="text-[#a83060] group-hover:text-white transition-colors" />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColors[f.badge]}`}>
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-bold text-[#2d1a22] text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-[#7d2347]/70 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Cpu size={18} className="text-[#a83060]" />
              <h2 className="text-3xl font-extrabold text-[#2d1a22]">Technology Stack</h2>
            </div>
            <p className="text-[#7d2347]/60">Production-grade technologies, all open source</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl bg-[#fff8fb] border border-[#ffe4ee] hover:border-[#a83060]/20 transition-colors"
              >
                <h3 className="text-xs font-bold text-[#a83060] uppercase tracking-widest mb-3">{t.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {t.items.map((item, j) => (
                    <span key={j} className="text-xs bg-white border border-[#f0a0c0]/40 text-[#2d1a22] px-2.5 py-1 rounded-lg font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#ffe4ee]/30 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#2d1a22] mb-2">How it works</h2>
            <p className="text-[#7d2347]/60">From upload to insight in seconds</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Upload PDF', desc: 'Drop any PDF. Text is extracted, chunked, and embedded automatically.', icon: FileText },
              { step: '02', title: 'AI Indexes', desc: 'FAISS vector index built locally. Semantic search ready instantly.', icon: Cpu },
              { step: '03', title: 'Ask Anything', desc: 'Type or speak your question. MMR retrieval finds the best context.', icon: MessageSquare },
              { step: '04', title: 'Get Answers', desc: 'Expert-level response with page citations, sources, and insights.', icon: Brain },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="text-center p-6 rounded-2xl bg-white border border-[#ffe4ee] shadow-sm"
              >
                <div className="text-4xl font-extrabold text-[#a83060]/10 mb-3">{item.step}</div>
                <div className="w-11 h-11 rounded-xl bg-[#a83060] flex items-center justify-center mx-auto mb-3 shadow">
                  <item.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-[#2d1a22] mb-1.5 text-sm">{item.title}</h3>
                <p className="text-xs text-[#7d2347]/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#a83060] to-[#c4527e]">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">Try it yourself</h2>
          <p className="text-[#f9c8d9] mb-8">Upload a PDF and experience all these features in action — completely free.</p>
          <Link to="/chat"
            className="inline-flex items-center gap-2 bg-white text-[#a83060] font-bold px-8 py-4 rounded-2xl hover:bg-[#ffe4ee] transition-all shadow-lg">
            <Brain size={20} />
            Start for Free
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
