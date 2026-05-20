import axios from 'axios'
import { env } from '../config/env'
import type { AuthUser } from '../types/auth'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'user'

/** Axios instance without auth interceptors — avoids refresh loops. */
const bareApi = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

interface RefreshTokens {
  accessToken?: string
  refreshToken?: string
}

interface RefreshResponseBody {
  data?: { tokens?: RefreshTokens }
}

type UnauthorizedListener = () => void

const unauthorizedListeners = new Set<UnauthorizedListener>()

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((listener) => listener())
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setStoredUser(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('tokenExpiresAt')
  localStorage.removeItem(USER_KEY)
  notifyUnauthorized()
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

const AUTH_PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/google',
  '/auth/google/code',
  '/auth/forgot-password',
  '/auth/verify-otp',
  '/auth/reset-password',
]

export function isAuthPublicRequest(url?: string): boolean {
  if (!url) return false
  return AUTH_PUBLIC_PATHS.some((path) => url.includes(path))
}

/** POST /auth/refresh — mirrors backend authenticate flow for expired access tokens. */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const { data } = await bareApi.post<RefreshResponseBody>('/auth/refresh', { refreshToken })
    const tokens = data?.data?.tokens
    const accessToken = tokens?.accessToken
    if (!accessToken) return null

    setTokens(accessToken, tokens.refreshToken ?? refreshToken)
    return accessToken
  } catch {
    return null
  }
}

export function redirectToLogin(returnPath?: string): void {
  const path = returnPath && returnPath !== '/login' ? returnPath : undefined
  const search = path ? `?from=${encodeURIComponent(path)}` : ''
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign(`/login${search}`)
  }
}
