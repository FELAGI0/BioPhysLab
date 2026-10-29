/** Контекст авторизации: user (email | null), token, login/register/logout. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  getMe,
  getToken,
  login as apiLogin,
  register as apiRegister,
  setToken,
} from '../api'

interface AuthContextValue {
  user: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)

  // При монтировании: если есть токен, проверяем его через /api/auth/me.
  useEffect(() => {
    const token = getToken()
    if (!token) return
    getMe(token)
      .then((me) => setUser(me.email))
      .catch(() => {
        // Токен невалиден/просрочен — убираем.
        setToken(null)
      })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    setToken(data.access_token)
    setUser(email)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const data = await apiRegister(email, password)
    setToken(data.access_token)
    setUser(email)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Хук доступа к контексту авторизации. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return ctx
}
