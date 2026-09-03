import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ltp_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('ltp_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const res = await authApi.getMe()
          setUser(res.user)
          localStorage.setItem('ltp_user', JSON.stringify(res.user))
        } catch (err) {
          console.warn('Session verification failed:', err)
          logout()
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }
    verifyUser()
  }, [token])

  const login = async (email, password) => {
    const data = await authApi.login({ email, password })
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('ltp_token', data.token)
    localStorage.setItem('ltp_user', JSON.stringify(data.user))
    return data
  }

  const register = async (name, email, password, confirmPassword) => {
    const data = await authApi.register({ name, email, password, confirmPassword })
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('ltp_token', data.token)
    localStorage.setItem('ltp_user', JSON.stringify(data.user))
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('ltp_token')
    localStorage.removeItem('ltp_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
