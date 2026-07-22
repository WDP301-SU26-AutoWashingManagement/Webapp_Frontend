import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { env } from '../config/env'
import { getAccessToken, onUnauthorized } from '../lib/authSession'
import { requestGoogleAuthCode } from '../lib/googleAuth'
import { authService } from '../services/authService'
import { customerService, mapProfileToAuthUser } from '../services/customerService'
import type { AuthContextValue, AuthUser, RegisterInput, ResetPasswordInput } from '../types/auth'

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const token = getAccessToken()
      const storedUser = authService.getCurrentUser()

      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }

      if (!storedUser) {
        authService.logout()
        if (!cancelled) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      if (!cancelled) setUser(storedUser)

      try {
        const profile = await customerService.getProfile()
        const role = storedUser.role ?? 'customer'
        const mapped = mapProfileToAuthUser(profile, role)
        authService.setCurrentUser(mapped)
        if (!cancelled) setUser(mapped)
      } catch {
        // keep storedUser from login response
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
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

  const refreshUserFromProfile = useCallback(async (): Promise<AuthUser | null> => {
    const token = getAccessToken()
    if (!token) return null

    try {
      const profile = await customerService.getProfile()
      const role = authService.getCurrentUser()?.role ?? 'customer'
      const mapped = mapProfileToAuthUser(profile, role)
      authService.setCurrentUser(mapped)
      setUser(mapped)
      return mapped
    } catch {
      const current = authService.getCurrentUser()
      if (current) setUser(current)
      return current
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password)
    const stored = authService.getCurrentUser()
    if (stored) setUser(stored)
    await refreshUserFromProfile()
  }, [refreshUserFromProfile])

  const loginWithGoogle = useCallback(async () => {
    if (!env.googleClientId) {
      throw new Error('Chưa cấu hình VITE_GOOGLE_CLIENT_ID. Thêm vào file .env của frontend.')
    }

    const code = await requestGoogleAuthCode(env.googleClientId)
    await authService.googleLoginByCode(code, 'postmessage')
    const stored = authService.getCurrentUser()
    if (stored) setUser(stored)

    await refreshUserFromProfile()
  }, [refreshUserFromProfile])

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
    refreshUserFromProfile,
    setUser,
    isAuthenticated: !!user && !!getAccessToken(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
