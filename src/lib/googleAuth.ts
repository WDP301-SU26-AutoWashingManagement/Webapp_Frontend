const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Không tải được Google Sign-In')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = GSI_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không tải được Google Sign-In'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

function formatGoogleOAuthError(raw: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const lower = raw.toLowerCase()

  if (lower.includes('origin') || lower.includes('invalid_client')) {
    return (
      `Google OAuth: origin chưa được đăng ký (${origin}). ` +
      'Vào Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client (loại Web application) → ' +
      'thêm origin hiện tại vào Authorized JavaScript origins (ví dụ http://localhost:5173 và http://127.0.0.1:5173). ' +
      'Đợi 1–2 phút rồi thử lại.'
    )
  }

  return raw
}

/** Popup OAuth — redirect_uri phải là `postmessage` (theo Google cho ux_mode popup). */
export function requestGoogleAuthCode(clientId: string): Promise<string> {
  return loadGoogleScript().then(
    () =>
      new Promise((resolve, reject) => {
        if (!window.google?.accounts?.oauth2) {
          reject(new Error('Google Sign-In chưa sẵn sàng'))
          return
        }

        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: (response) => {
            if (response.error) {
              const raw = response.error_description || response.error
              reject(new Error(formatGoogleOAuthError(raw)))
              return
            }
            if (response.code) {
              resolve(response.code)
              return
            }
            reject(new Error('Không nhận được mã xác thực từ Google'))
          },
        })

        client.requestCode()
      }),
  )
}
