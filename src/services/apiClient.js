const API_BASE_URL = '/api/v1'

export function parseApiError(payload, fallback = 'Có lỗi xảy ra') {
  if (!payload) return fallback
  const { message } = payload
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  getToken() {
    return localStorage.getItem('accessToken')
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('accessToken', token)
    } else {
      localStorage.removeItem('accessToken')
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const token = this.getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    let body = null
    try {
      body = await response.json()
    } catch {
      body = null
    }

    if (!response.ok) {
      throw new Error(parseApiError(body, `HTTP ${response.status}`))
    }

    return body
  }

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  post(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  put(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  patch(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

export default new ApiClient()
