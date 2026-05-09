import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, Sun, Moon } from 'lucide-react'

export default function Navbar({ darkMode, setDarkMode }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/chat', label: 'Chat' },
    { to: '/quiz', label: 'Quiz' },
    { to: '/exam', label: 'Exam Prep' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/features', label: 'Features' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#f0a0c0]/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 shrink-0">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
              <rect width="40" height="40" rx="10" fill="#a83060"/>
              <circle cx="17" cy="18" r="8" stroke="#ffe4ee" strokeWidth="2.5" fill="none"/>
              <line x1="23" y1="24" x2="30" y2="31" stroke="#ffe4ee" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="14" cy="17" r="1.5" fill="#ffe4ee"/>
              <circle cx="17" cy="15" r="1.5" fill="#ffe4ee"/>
              <circle cx="20" cy="17" r="1.5" fill="#ffe4ee"/>
              <circle cx="14" cy="20" r="1.5" fill="#ffe4ee"/>
              <circle cx="17" cy="22" r="1.5" fill="#ffe4ee"/>
              <circle cx="20" cy="20" r="1.5" fill="#ffe4ee"/>
              <rect x="25" y="7" width="11" height="13" rx="2" fill="#c4527e"/>
              <rect x="27" y="10" width="7" height="1.5" rx="0.75" fill="white"/>
              <rect x="27" y="13" width="5" height="1.5" rx="0.75" fill="white"/>
              <rect x="27" y="16" width="6" height="1.5" rx="0.75" fill="white"/>
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-lg text-[#a83060] tracking-tight leading-none block">NeuroDocX</span>
            <span className="text-[9px] text-[#7d2347]/50 font-medium tracking-wide">AI PDF Intelligence</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors ${
                pathname === l.to ? 'text-[#a83060]' : 'text-[#7d2347]/70 hover:text-[#a83060]'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-[#ffe4ee] transition-colors text-[#a83060]"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            to="/chat"
            className="hidden md:inline-flex items-center gap-2 bg-[#a83060] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#7d2347] transition-colors shadow"
          >
            Start Chatting
          </Link>
          <button className="md:hidden p-2 text-[#a83060]" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-[#ffe4ee] px-4 py-4 flex flex-col gap-3"
        >
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className="text-sm font-medium text-[#7d2347] hover:text-[#a83060]">
              {l.label}
            </Link>
          ))}
          <Link to="/chat" onClick={() => setOpen(false)}
            className="bg-[#a83060] text-white text-sm font-semibold px-4 py-2 rounded-xl text-center">
            Start Chatting
          </Link>
        </motion.div>
      )}
    </nav>
  )
}
