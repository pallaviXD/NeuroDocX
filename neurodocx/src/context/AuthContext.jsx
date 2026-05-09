import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, getMe } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('neurodocx_token')
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem('neurodocx_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const data = await apiLogin(email, password)
    localStorage.setItem('neurodocx_token', data.access_token)
    setUser(data.user)
    return data
  }

  const register = async (email, username, password) => {
    const data = await apiRegister(email, username, password)
    localStorage.setItem('neurodocx_token', data.access_token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('neurodocx_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
