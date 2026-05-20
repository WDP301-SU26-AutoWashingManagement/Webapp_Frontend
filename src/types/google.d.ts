interface GoogleCodeClientCallbackResponse {
  code?: string
  error?: string
  error_description?: string
}

interface GoogleCodeClientConfig {
  client_id: string
  scope: string
  ux_mode?: 'popup' | 'redirect'
  callback: (response: GoogleCodeClientCallbackResponse) => void
}

interface GoogleCodeClient {
  requestCode: () => void
}

interface GoogleAccounts {
  oauth2: {
    initCodeClient: (config: GoogleCodeClientConfig) => GoogleCodeClient
  }
}

interface Window {
  google?: {
    accounts: GoogleAccounts
  }
}
