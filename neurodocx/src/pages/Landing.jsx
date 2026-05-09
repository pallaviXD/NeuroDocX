import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Brain, Upload, MessageSquare, FileSearch, BookOpen,
  Mic, Zap, Shield, Star, ArrowRight, CheckCircle, Sparkles
} from 'lucide-react'

const features = [
  { icon: MessageSquare, title: 'AI PDF Chat', desc: 'Ask anything about your documents in natural language.' },
  { icon: FileSearch, title: 'Semantic Search', desc: 'Vector-powered search that understands context, not just keywords.' },
  { icon: BookOpen, title: 'Smart Summaries', desc: 'Get instant summaries, bullet points, and beginner-friendly breakdowns.' },
  { icon: Brain, title: 'RAG Architecture', desc: 'Retrieval-Augmented Generation for accurate, grounded answers.' },
  { icon: Mic, title: 'Voice Assistant', desc: 'Ask questions and hear responses — fully voice-enabled.' },
  { icon: Zap, title: 'Quiz Generator', desc: 'Auto-generate MCQs, flashcards, and study notes from any PDF.' },
  { icon: Shield, title: 'OCR Support', desc: 'Works with scanned and image-based PDFs via Tesseract & EasyOCR.' },
  { icon: Sparkles, title: 'Multi-PDF Intel', desc: 'Upload multiple docs and compare, cross-query, and analyze together.' },
]

const stats = [
  { value: '10x', label: 'Faster Research' },
  { value: '99%', label: 'Answer Accuracy' },
  { value: '50+', label: 'File Formats' },
  { value: '∞', label: 'Documents' },
]

const useCases = [
  { emoji: '🎓', title: 'Students', desc: 'Generate notes, flashcards, and quizzes from textbooks instantly.' },
  { emoji: '🔬', title: 'Researchers', desc: 'Analyze papers, extract findings, and compare literature.' },
  { emoji: '💼', title: 'Professionals', desc: 'Summarize reports and extract key business insights.' },
  { emoji: '⚖️', title: 'Legal', desc: 'Understand complex legal documents with plain-language explanations.' },
]

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#ffe4ee] via-white to-[#f9c8d9] py-24 px-4">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#a83060]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#f0a0c0]/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#a83060]/10 text-[#a83060] text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-[#a83060]/20"
          >
            <Sparkles size={14} />
            AI-Powered Document Intelligence
          </motion.div>

          <motion.h1
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-[#2d1a22] leading-tight mb-6"
          >
            Chat with your{' '}
            <span className="text-[#a83060]">PDFs</span>
            <br />like never before
          </motion.h1>

          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[#7d2347]/80 max-w-2xl mx-auto mb-10"
          >
            NeuroDocX transforms static documents into intelligent, interactive knowledge systems.
            Upload any PDF and start a conversation powered by RAG, semantic search, and LLMs.
          </motion.p>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/chat"
              className="inline-flex items-center justify-center gap-2 bg-[#a83060] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#7d2347] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base"
            >
              <Upload size={18} />
              Upload & Chat Now
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#a83060] font-bold px-8 py-4 rounded-2xl border-2 border-[#a83060]/30 hover:border-[#a83060] transition-all text-base"
            >
              Explore Features
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#a83060] py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-4xl font-extrabold text-white">{s.value}</div>
              <div className="text-[#f9c8d9] text-sm mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-[#2d1a22] mb-3">Everything you need</h2>
            <p className="text-[#7d2347]/70 text-lg">Powerful AI features built for real document workflows</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group p-6 rounded-2xl border border-[#ffe4ee] hover:border-[#a83060]/30 hover:shadow-lg transition-all bg-[#fff8fb]"
              >
                <div className="w-11 h-11 rounded-xl bg-[#ffe4ee] flex items-center justify-center mb-4 group-hover:bg-[#a83060] transition-colors">
                  <f.icon size={20} className="text-[#a83060] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-[#2d1a22] mb-2">{f.title}</h3>
                <p className="text-sm text-[#7d2347]/70 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#ffe4ee]/40 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-[#2d1a22] mb-3">How it works</h2>
            <p className="text-[#7d2347]/70 text-lg">From upload to insight in seconds</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload PDF', desc: 'Drop one or multiple PDFs. We extract, chunk, and embed the content automatically.', icon: Upload },
              { step: '02', title: 'Ask Anything', desc: 'Type or speak your question. Our RAG engine retrieves the most relevant context.', icon: MessageSquare },
              { step: '03', title: 'Get Answers', desc: 'Receive accurate, cited responses with page references and source highlights.', icon: CheckCircle },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center p-8 rounded-2xl bg-white border border-[#ffe4ee] shadow-sm"
              >
                <div className="text-5xl font-extrabold text-[#a83060]/15 mb-4">{item.step}</div>
                <div className="w-12 h-12 rounded-2xl bg-[#a83060] flex items-center justify-center mx-auto mb-4 shadow-md">
                  <item.icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-[#2d1a22] text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-[#7d2347]/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-[#2d1a22] mb-3">Built for everyone</h2>
            <p className="text-[#7d2347]/70 text-lg">From students to enterprises</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((u, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-[#ffe4ee] to-[#f9c8d9] border border-[#f0a0c0]/30 text-center"
              >
                <div className="text-4xl mb-3">{u.emoji}</div>
                <h3 className="font-bold text-[#2d1a22] mb-2">{u.title}</h3>
                <p className="text-sm text-[#7d2347]/80">{u.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#a83060] to-[#c4527e]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to talk to your documents?</h2>
          <p className="text-[#f9c8d9] text-lg mb-8">Upload your first PDF and experience AI-powered document intelligence.</p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 bg-white text-[#a83060] font-bold px-8 py-4 rounded-2xl hover:bg-[#ffe4ee] transition-all shadow-lg text-base"
          >
            <Brain size={20} />
            Get Started Free
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2d1a22] text-[#f9c8d9]/60 py-8 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain size={16} className="text-[#a83060]" />
          <span className="font-bold text-white">NeuroDocX</span>
        </div>
        <p>AI-Powered PDF Intelligence Platform · Built with React, FastAPI & LangChain</p>
      </footer>
    </div>
  )
}
