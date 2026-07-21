/** Mirrors backend `UserRole` in common/types */
export type UserRole = 'customer' | 'admin' | 'boss' | 'staff'

export interface AuthUser {
  user_id: string | null
  email: string | null
  full_name: string | null
  role: string
  avatar_url: string | null
  is_active: boolean
  staff_type?: string
  branch_id?: string | null
  phone?: string | null
}

export interface RegisterInput {
  email: string
  username: string
  password: string
}

export interface ResetPasswordInput {
  email: string
  otp: string
  new_password: string
}

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (data: RegisterInput) => Promise<unknown>
  forgotPassword: (email: string) => Promise<unknown>
  verifyOtp: (email: string, otp: string) => Promise<unknown>
  resetPassword: (data: ResetPasswordInput) => Promise<unknown>
  logout: () => void
  /** Sync session user from GET /users/profile */
  refreshUserFromProfile: () => Promise<AuthUser | null>
  setUser: (user: AuthUser | null) => void
  isAuthenticated: boolean
}

export interface LoginLocationState {
  message?: string
  email?: string
  /** Path to return after login (from ProtectedRoute) */
  from?: string
}
