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

export const authService = {
  persistSession(authPermission) {
    const { token, user_id: userId, expiredTime } = authPermission
    apiClient.setToken(token)

    const jwt = parseJwtPayload(token)
    const user = {
      user_id: userId ?? jwt.id,
      username: jwt.username ?? null,
      role: jwt.role ?? null,
      shop_id: jwt.shop_id ?? null,
      is_active: jwt.is_active,
      expiredTime,
    }

    if (expiredTime) {
      localStorage.setItem('tokenExpiresAt', String(Date.now() + expiredTime * 1000))
    }

    this.setCurrentUser(user)
    return user
  },

  async login(username, password) {
    const response = await apiClient.post('/auth/login', { username, password })

    if (response.data?.token) {
      this.persistSession(response.data)
    }

    return response
  },

  async register({ email, username, password }) {
    return apiClient.post('/auth/register', { email, username, password })
  },

  async registerAndLogin({ email, username, password }) {
    const registerRes = await this.register({ email, username, password })
    await this.login(username, password)
    return registerRes
  },

  async forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email })
  },

  async verifyOtp(otp) {
    return apiClient.post('/auth/verify-otp', { otp })
  },

  async resetPassword(token, newPassword) {
    return apiClient.post('/auth/reset-password', { token, newPassword })
  },

  logout() {
    apiClient.setToken(null)
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
