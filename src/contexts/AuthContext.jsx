import { createContext, useState, useCallback, useEffect } from 'react'
import { authService } from '../services/authService'
import apiClient from '../services/apiClient'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const storedUser = authService.getCurrentUser()
    if (storedUser && apiClient.getToken()) {
      setUser(storedUser)
    }
    setLoading(false)
  }, [])

  const register = useCallback(async (data) => {
    try {
      setError(null)
      const response = await authService.registerAndLogin({
        email: data.email,
        username: data.username,
        password: data.password,
      })
      const currentUser = authService.getCurrentUser()
      if (currentUser) setUser(currentUser)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const login = useCallback(async (username, password) => {
    try {
      setError(null)
      await authService.login(username, password)
      const currentUser = authService.getCurrentUser()
      if (currentUser) setUser(currentUser)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const forgotPassword = useCallback(async (email) => {
    try {
      setError(null)
      return await authService.forgotPassword(email)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const verifyOtp = useCallback(async (otp) => {
    try {
      setError(null)
      return await authService.verifyOtp(otp)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      setError(null)
      return await authService.resetPassword(token, newPassword)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setError(null)
  }, [])

  const value = {
    user,
    loading,
    error,
    login,
    register,
    forgotPassword,
    verifyOtp,
    resetPassword,
    logout,
    isAuthenticated: !!user && authService.isAuthenticated(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
