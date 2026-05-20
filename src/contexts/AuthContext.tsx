import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { env } from '../config/env'
import { getAccessToken, onUnauthorized } from '../lib/authSession'
import { requestGoogleAuthCode } from '../lib/googleAuth'
import { authService } from '../services/authService'
import type { AuthContextValue, AuthUser, RegisterInput, ResetPasswordInput } from '../types/auth'

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAccessToken()
    const storedUser = authService.getCurrentUser()

    if (token && storedUser) {
      setUser(storedUser)
    } else if (token) {
      authService.logout()
      setUser(null)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    return onUnauthorized(() => setUser(null))
  }, [])

  const register = useCallback(async (data: RegisterInput) => {
    return authService.register({
      email: data.email,
      full_name: data.username,
      password: data.password,
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password)
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('Đăng nhập thất bại. Không nhận được thông tin phiên.')
    }
    setUser(currentUser)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (!env.googleClientId) {
      throw new Error('Chưa cấu hình VITE_GOOGLE_CLIENT_ID. Thêm vào file .env của frontend.')
    }

    const code = await requestGoogleAuthCode(env.googleClientId)
    await authService.googleLoginByCode(code, 'postmessage')

    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('Đăng nhập Google thất bại. Không nhận được thông tin phiên.')
    }
    setUser(currentUser)
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    return authService.forgotPassword(email)
  }, [])

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    return authService.verifyOtp(email, otp)
  }, [])

  const resetPassword = useCallback(async (data: ResetPasswordInput) => {
    return authService.resetPassword(data)
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    forgotPassword,
    verifyOtp,
    resetPassword,
    logout,
    isAuthenticated: !!user && !!getAccessToken(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
