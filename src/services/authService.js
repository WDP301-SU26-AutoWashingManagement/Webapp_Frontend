import apiClient from './apiClient'

function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

function normalizeId(value) {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && typeof value.toString === 'function') {
    return value.toString()
  }
  return String(value)
}

function mapUserFromAuthData(user, jwt) {
  return {
    user_id: normalizeId(user?._id ?? user?.id) ?? jwt.id ?? null,
    email: user?.email ?? null,
    full_name: user?.full_name ?? null,
    role: jwt.role ?? 'customer',
    avatar_url: user?.avatar_url ?? null,
    is_active: user?.is_active ?? true,
  }
}

export const authService = {
  persistSessionFromAuthData(data) {
    const { user, tokens } = data ?? {}
    const accessToken = tokens?.accessToken
    if (!accessToken) return null

    apiClient.setToken(accessToken)

    if (tokens.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken)
    }

    const jwt = parseJwtPayload(accessToken)
    const mappedUser = mapUserFromAuthData(user, jwt)
    this.setCurrentUser(mappedUser)
    return mappedUser
  },

  async login(email, password) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      type: 'customer',
    })

    if (response.data?.tokens) {
      this.persistSessionFromAuthData(response.data)
    }

    return response
  },

  async register({ email, full_name, password, phone }) {
    return apiClient.post('/auth/register', {
      email,
      password,
      full_name,
      ...(phone ? { phone } : {}),
    })
  },

  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email })
  },

  async verifyOtp(email, otp) {
    return apiClient.post('/auth/verify-otp', { email, otp })
  },

  async resetPassword({ email, otp, new_password }) {
    return apiClient.post('/auth/reset-password', { email, otp, new_password })
  },

  logout() {
    apiClient.setToken(null)
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('tokenExpiresAt')
    localStorage.removeItem('user')
  },

  getCurrentUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  },

  isAuthenticated() {
    return !!apiClient.getToken()
  },
}
