import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function resolveProxyPath(apiBaseUrl) {
  if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
    return new URL(apiBaseUrl).pathname
  }
  return apiBaseUrl.startsWith('/') ? apiBaseUrl : `/${apiBaseUrl}`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const apiBaseUrl = env.VITE_API_BASE_URL
  const proxyTarget = env.VITE_API_PROXY_TARGET
  const port = Number(env.VITE_DEV_SERVER_PORT) || 5173

  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required. Copy .env.example to .env')
  }

  const proxyPath = resolveProxyPath(apiBaseUrl)

  const server = { port }

  if (proxyTarget) {
    // Prefer 127.0.0.1 — on Windows, "localhost" often resolves to ::1 and breaks proxy.
    const target = proxyTarget.replace(/\/\/localhost\b/, '//127.0.0.1')
    server.proxy = {
      [proxyPath]: {
        target,
        changeOrigin: true,
      },
      '/uploads': {
        target,
        changeOrigin: true,
      },
    }
  }

  return {
    plugins: [react()],
    server,
  }
})
