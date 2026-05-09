import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Features from './pages/Features'
import Auth from './pages/Auth'
import Quiz from './pages/Quiz'
import ExamPrep from './pages/ExamPrep'

export default function App() {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className={darkMode ? 'dark' : ''}>
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/features" element={<Features />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/exam" element={<ExamPrep />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
