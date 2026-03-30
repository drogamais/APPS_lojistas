import { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const navigate = useNavigate()

  const login = useCallback((jwt) => {
    localStorage.setItem('token', jwt)
    setToken(jwt)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    navigate('/login', { replace: true })
  }, [navigate])

  let isAdmin = false;
  let userDetails = null;

  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]
      const decodedPayload = JSON.parse(atob(payloadBase64))
      isAdmin = !!decodedPayload.is_admin
      userDetails = decodedPayload
    } catch(e) {
      console.error('Erro ao decodificar token JWT', e)
    }
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, isAdmin, userDetails }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
