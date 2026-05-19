import { createContext, useState, useCallback, useEffect } from 'react'
import { authService } from '../services/authService'
import apiClient from '../services/apiClient'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = apiClient.getToken()
    const storedUser = authService.getCurrentUser()

    if (token && storedUser) {
      setUser(storedUser)
    } else if (token) {
      authService.logout()
    }

    setLoading(false)
  }, [])

  const register = useCallback(async (data) => {
    return authService.register({
      email: data.email,
      full_name: data.username,
      password: data.password,
    })
  }, [])

  const login = useCallback(async (email, password) => {
    await authService.login(email, password)
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      throw new Error('Đăng nhập thất bại. Không nhận được thông tin phiên.')
    }
    setUser(currentUser)
  }, [])

  const forgotPassword = useCallback(async (email) => {
    return authService.forgotPassword(email)
  }, [])

  const verifyOtp = useCallback(async (email, otp) => {
    return authService.verifyOtp(email, otp)
  }, [])

  const resetPassword = useCallback(async ({ email, otp, new_password }) => {
    return authService.resetPassword({ email, otp, new_password })
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = {
    user,
    loading,
    login,
    register,
    forgotPassword,
    verifyOtp,
    resetPassword,
    logout,
    isAuthenticated: authService.isAuthenticated(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
