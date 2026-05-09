import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Brain, MessageSquare, FileSearch, BookOpen, Zap, Mic,
  Shield, Sparkles, Globe, GitCompare, Quote, Layers
} from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'AI PDF Chat',
    desc: 'Have natural conversations with your documents. Ask questions, get explanations, and explore content interactively.',
    badge: 'Core',
  },
  {
    icon: Brain,
    title: 'RAG Architecture',
    desc: 'Retrieval-Augmented Generation ensures every answer is grounded in your actual document content — no hallucinations.',
    badge: 'AI',
  },
  {
    icon: FileSearch,
    title: 'Semantic Search',
    desc: 'Vector embeddings power context-aware search that understands meaning, not just keywords.',
    badge: 'AI',
  },
  {
    icon: GitCompare,
    title: 'Multi-PDF Analysis',
    desc: 'Upload multiple documents and compare, cross-reference, and query across all of them simultaneously.',
    badge: 'Pro',
  },
  {
    icon: Quote,
    title: 'Source Citations',
    desc: 'Every AI response includes page references and source paragraphs for full transparency and reliability.',
    badge: 'Core',
  },
  {
    icon: Layers,
    title: 'Smart Summaries',
    desc: 'Generate short, detailed, or bullet-point summaries. Choose beginner-friendly or technical breakdowns.',
    badge: 'Core',
  },
  {
    icon: Shield,
    title: 'OCR Support',
    desc: 'Works with scanned and image-based PDFs using Tesseract and EasyOCR technology.',
    badge: 'AI',
  },
  {
    icon: BookOpen,
    title: 'Notes & Flashcards',
    desc: 'Auto-generate study notes, revision cards, and key concept summaries from any document.',
    badge: 'Pro',
  },
  {
    icon: Zap,
    title: 'Quiz Generator',
    desc: 'Create MCQs, practice quizzes, and interview questions automatically from document content.',
    badge: 'Pro',
  },
  {
    icon: Sparkles,
    title: 'Explain Modes',
    desc: 'Switch between Beginner, Technical, Business, or "Explain Like I\'m 10" modes for tailored responses.',
    badge: 'Core',
  },
  {
    icon: Mic,
    title: 'Voice Assistant',
    desc: 'Ask questions by voice and receive spoken AI responses. Fully accessible and hands-free.',
    badge: 'Pro',
  },
  {
    icon: Globe,
    title: 'Translation',
    desc: 'Translate document content and AI responses into multiple languages instantly.',
    badge: 'Pro',
  },
]

const badgeColors = {
  Core: 'bg-[#ffe4ee] text-[#a83060]',
  AI: 'bg-[#a83060]/10 text-[#7d2347]',
  Pro: 'bg-[#2d1a22]/8 text-[#2d1a22]',
}

const techStack = [
  { category: 'Frontend', items: ['React.js', 'Tailwind CSS', 'Framer Motion'] },
  { category: 'Backend', items: ['FastAPI', 'Python', 'REST APIs'] },
  { category: 'AI & ML', items: ['Groq API', 'LangChain', 'HuggingFace', 'Sentence Transformers'] },
  { category: 'Vector DB', items: ['FAISS', 'ChromaDB'] },
  { category: 'OCR', items: ['Tesseract OCR', 'EasyOCR'] },
  { category: 'Cloud', items: ['Firebase', 'Vercel', 'Render'] },
]

export default function Features() {
  return (
    <div className="min-h-screen bg-[#fff8fb]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#ffe4ee] to-white py-16 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-[#a83060]/10 text-[#a83060] text-sm font-semibold px-4 py-2 rounded-full mb-5 border border-[#a83060]/20">
            <Sparkles size={14} />
            Full Feature Set
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2d1a22] mb-4">
            Everything NeuroDocX can do
          </h1>
          <p className="text-[#7d2347]/70 text-lg">
            A complete AI document intelligence platform built with cutting-edge technology.
          </p>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-[#ffe4ee] hover:shadow-lg hover:border-[#a83060]/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#ffe4ee] flex items-center justify-center group-hover:bg-[#a83060] transition-colors">
                    <f.icon size={22} className="text-[#a83060] group-hover:text-white transition-colors" />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColors[f.badge]}`}>
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-bold text-[#2d1a22] text-base mb-2">{f.title}</h3>
                <p className="text-sm text-[#7d2347]/70 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#2d1a22] mb-3">Technology Stack</h2>
            <p className="text-[#7d2347]/70">Built with modern, production-grade technologies</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl bg-[#fff8fb] border border-[#ffe4ee]"
              >
                <h3 className="text-xs font-bold text-[#a83060] uppercase tracking-widest mb-3">{t.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {t.items.map((item, j) => (
                    <span key={j} className="text-xs bg-white border border-[#f0a0c0]/50 text-[#2d1a22] px-2.5 py-1 rounded-lg font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#a83060] to-[#c4527e]">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center"
        >
          <h2 className="text-3xl font-extrabold text-white mb-4">Try it yourself</h2>
          <p className="text-[#f9c8d9] mb-8">Upload a PDF and experience all these features in action.</p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 bg-white text-[#a83060] font-bold px-8 py-4 rounded-2xl hover:bg-[#ffe4ee] transition-all shadow-lg"
          >
            <Brain size={20} />
            Start for Free
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
