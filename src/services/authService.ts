import apiClient from './apiClient'
import {
  clearSession,
  getStoredUser,
  setStoredCustomerProfile,
  setStoredUser,
  setTokens,
} from '../lib/authSession'
import { mapAuthUserToCustomerProfile } from './customerService'
import type { ApiResponse } from '../types/api'
import type { AuthUser } from '../types/auth'

interface JwtPayload {
  id?: string
  role?: string
}

interface AuthTokens {
  accessToken?: string
  refreshToken?: string
}

interface RawUser {
  _id?: string | { toString(): string }
  id?: string
  email?: string
  full_name?: string
  avatar_url?: string | null
  is_active?: boolean
  branch_id?: string | null
}

interface LoginResponseData {
  user?: RawUser
  tokens?: AuthTokens
}

function parseJwtPayload(token: string): JwtPayload {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as JwtPayload
  } catch {
    return {}
  }
}

function normalizeId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return String(value)
  }
  return String(value)
}

function mapUserFromAuthData(user: RawUser | undefined, jwt: JwtPayload): AuthUser {
  const rawRoleData = user && typeof user === 'object' && 'role_data' in user ? (user as any).role_data : null
  return {
    user_id: normalizeId(user?._id ?? user?.id) ?? jwt.id ?? null,
    email: user?.email ?? null,
    full_name: user?.full_name ?? null,
    role: jwt.role ?? 'customer',
    avatar_url: user?.avatar_url ?? null,
    is_active: user?.is_active ?? true,
    staff_type: (user as any)?.staff_type ?? rawRoleData?.staff_type ?? undefined,
    branch_id: user?.branch_id ? normalizeId(user.branch_id) : (rawRoleData?.branch_id ? normalizeId(rawRoleData.branch_id) : null),
  }
}

export const authService = {
  persistSessionFromAuthData(data: LoginResponseData | undefined): AuthUser | null {
    const { user, tokens } = data ?? {}
    const accessToken = tokens?.accessToken
    if (!accessToken) return null

    setTokens(accessToken, tokens.refreshToken)

    const jwt = parseJwtPayload(accessToken)
    const mappedUser = mapUserFromAuthData(user, jwt)
    setStoredUser(mappedUser)

    if (user && typeof user === 'object') {
      setStoredCustomerProfile(
        mapAuthUserToCustomerProfile(user as Record<string, unknown>),
      )
    }

    return mappedUser
  },

  async googleLoginByCode(code: string, redirectUri = 'postmessage'): Promise<ApiResponse<LoginResponseData>> {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/google/code', {
      code,
      redirectUri,
    })

    if (response.data?.tokens) {
      this.persistSessionFromAuthData(response.data)
    }

    return response
  },

  async login(email: string, password: string): Promise<ApiResponse<LoginResponseData>> {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', {
      email,
      password,
    })

    if (response.data?.tokens) {
      this.persistSessionFromAuthData(response.data)
    }

    return response
  },

  async register({
    email,
    full_name,
    password,
    phone,
  }: {
    email: string
    full_name: string
    password: string
    phone?: string
  }): Promise<unknown> {
    return apiClient.post('/auth/register', {
      email,
      password,
      full_name,
      ...(phone ? { phone } : {}),
    })
  },

  async forgotPassword(email: string): Promise<unknown> {
    return apiClient.post('/auth/forgot-password', { email })
  },

  async verifyOtp(email: string, otp: string): Promise<unknown> {
    return apiClient.post('/auth/verify-otp', { email, otp })
  },

  async resetPassword({
    email,
    otp,
    new_password,
  }: {
    email: string
    otp: string
    new_password: string
  }): Promise<unknown> {
    return apiClient.post('/auth/reset-password', { email, otp, new_password })
  },

  logout(): void {
    clearSession()
  },

  getCurrentUser(): AuthUser | null {
    return getStoredUser()
  },

  setCurrentUser(user: AuthUser | null): void {
    setStoredUser(user)
  },
}
