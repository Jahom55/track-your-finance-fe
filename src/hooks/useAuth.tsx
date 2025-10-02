import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ModelsUser, ModelsLoginRequest, ModelsRegisterRequest } from '../generated'
import { authApi, userApi } from '../services/api'

interface AuthContextType {
  user: ModelsUser | null
  token: string | null
  login: (credentials: ModelsLoginRequest) => Promise<void>
  register: (data: ModelsRegisterRequest) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ModelsUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      setToken(savedToken)
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const userData = await userApi.getProfile()
      setUser(userData)
    } catch (error) {
      localStorage.removeItem('auth_token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: ModelsLoginRequest) => {
    const response = await authApi.login(credentials)
    if (response.token && response.user) {
      setToken(response.token)
      setUser(response.user)
      localStorage.setItem('auth_token', response.token)
    } else {
      throw new Error('Invalid login response')
    }
  }

  const register = async (data: ModelsRegisterRequest) => {
    const response = await authApi.register(data)
    if (response.token) {
      setToken(response.token)
      localStorage.setItem('auth_token', response.token)
      await fetchUser()
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}