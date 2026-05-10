import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, Eye, EyeOff, Loader, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { checkPasswordStrength, generatePassword } from '../api'

const STRENGTH_COLORS = {
  'Very Strong': '#16a34a',
  'Strong':      '#16a34a',
  'Good':        '#2563eb',
  'Fair':        '#d97706',
  'Weak':        '#ea580c',
  'Very Weak':   '#dc2626',
}

const STRENGTH_BG = {
  'Very Strong': 'bg-green-100 text-green-700',
  'Strong':      'bg-green-100 text-green-700',
  'Good':        'bg-blue-100 text-blue-700',
  'Fair':        'bg-yellow-100 text-yellow-700',
  'Weak':        'bg-orange-100 text-orange-700',
  'Very Weak':   'bg-red-100 text-red-700',
}

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [strength, setStrength] = useState(null)
  const [checkingStrength, setCheckingStrength] = useState(false)
  const [genLoading, setGenLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Redirect back to where user came from, default to /chat
  const from = location.state?.from || '/chat'

  // Live password strength check
  useEffect(() => {
    if (mode !== 'register' || !form.password) {
      setStrength(null)
      return
    }
    const timer = setTimeout(async () => {
      setCheckingStrength(true)
      try {
        const res = await checkPasswordStrength(form.password)
        setStrength(res)
      } catch {
        // fallback client-side check
        setStrength(clientStrength(form.password))
      } finally {
        setCheckingStrength(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [form.password, mode])

  // Fallback client-side strength check
  function clientStrength(pw) {
    let score = 0
    const feedback = []
    if (pw.length >= 8) score++; else feedback.push('At least 8 characters')
    if (pw.length >= 12) score++
    if (/[A-Z]/.test(pw)) score++; else feedback.push('Add uppercase letters')
    if (/[a-z]/.test(pw)) score++; else feedback.push('Add lowercase letters')
    if (/\d/.test(pw)) score++; else feedback.push('Add numbers')
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++; else feedback.push('Add special characters')
    if (!/(.)\\1{2,}/.test(pw)) score++; else feedback.push('Avoid repeating characters')
    const levels = { 7: 'Very Strong', 6: 'Strong', 5: 'Good', 4: 'Fair', 3: 'Weak', 2: 'Very Weak', 1: 'Very Weak', 0: 'Very Weak' }
    const level = levels[score] || 'Very Weak'
    return { score, max_score: 7, level, percentage: Math.round((score / 7) * 100), feedback }
  }

  const handleGenerate = async () => {
    setGenLoading(true)
    try {
      const res = await generatePassword(16, true)
      setForm(f => ({ ...f, password: res.password }))
      setStrength(res.strength)
    } catch {
      // fallback
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
      const pw = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      setForm(f => ({ ...f, password: pw }))
    } finally {
      setGenLoading(false)
    }
  }

  const handle = async (e) => {
    e.preventDefault()
    setError('')

    // Block weak passwords on register
    if (mode === 'register' && strength && strength.score < 5) {
      setError(`Password too weak (${strength.level}). ${strength.feedback.join('. ')}.`)
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.email, form.username, form.password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isRegisterDisabled = mode === 'register' && strength && strength.score < 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffe4ee] via-white to-[#f9c8d9] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#ffe4ee] p-8"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#a83060] flex items-center justify-center">
            <Brain size={22} className="text-white" />
          </div>
          <span className="font-extrabold text-2xl text-[#a83060]">NeuroDocX</span>
        </div>

        <h2 className="text-2xl font-extrabold text-[#2d1a22] text-center mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-[#7d2347]/60 text-sm text-center mb-6">
          {mode === 'login' ? 'Sign in to your account' : 'Start chatting with your PDFs'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handle} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-[#7d2347] mb-1 block">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full border border-[#f0a0c0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#a83060] bg-[#fff8fb]"
            />
          </div>

          {/* Username (register only) */}
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-[#7d2347] mb-1 block">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Your name"
                className="w-full border border-[#f0a0c0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#a83060] bg-[#fff8fb]"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#7d2347]">Password</label>
              {mode === 'register' && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={genLoading}
                  className="flex items-center gap-1 text-xs text-[#a83060] hover:underline font-semibold"
                >
                  {genLoading
                    ? <Loader size={11} className="animate-spin" />
                    : <RefreshCw size={11} />
                  }
                  Generate strong password
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full border border-[#f0a0c0] rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#a83060] bg-[#fff8fb]"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a83060]/60"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Live strength meter (register only) */}
            {mode === 'register' && form.password && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                {/* Bar */}
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div
                      key={i}
                      className="flex-1 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: strength && i <= strength.score
                          ? STRENGTH_COLORS[strength.level] || '#dc2626'
                          : '#f0a0c0',
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${strength ? STRENGTH_BG[strength.level] : 'bg-gray-100 text-gray-500'}`}>
                    {checkingStrength ? 'Checking...' : (strength?.level || '—')}
                  </span>
                  <span className="text-xs text-[#7d2347]/50">
                    {strength ? `${strength.score}/7` : ''}
                  </span>
                </div>

                {/* Requirements checklist */}
                {strength && (
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { label: 'At least 8 characters', ok: form.password.length >= 8 },
                      { label: 'At least 12 characters', ok: form.password.length >= 12 },
                      { label: 'Uppercase letter (A-Z)', ok: /[A-Z]/.test(form.password) },
                      { label: 'Lowercase letter (a-z)', ok: /[a-z]/.test(form.password) },
                      { label: 'Number (0-9)', ok: /\d/.test(form.password) },
                      { label: 'Special character (!@#$...)', ok: /[!@#$%^&*(),.?":{}|<>]/.test(form.password) },
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {req.ok
                          ? <CheckCircle size={12} className="text-green-500 shrink-0" />
                          : <XCircle size={12} className="text-red-400 shrink-0" />
                        }
                        <span className={`text-xs ${req.ok ? 'text-green-700' : 'text-[#7d2347]/50'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Block message */}
                {strength && strength.score < 5 && (
                  <p className="text-xs text-red-500 mt-2 font-medium">
                    ⚠️ Password must be at least "Good" strength to register.
                  </p>
                )}
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (mode === 'register' && !!isRegisterDisabled)}
            className="w-full bg-[#a83060] text-white font-bold py-3 rounded-xl hover:bg-[#7d2347] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#7d2347]/60 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setStrength(null) }}
            className="text-[#a83060] font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
