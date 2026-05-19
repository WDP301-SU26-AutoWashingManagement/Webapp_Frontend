function requireEnv(name) {
  const value = import.meta.env[name]
  if (value === undefined || value === '') {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and set the required variables.`,
    )
  }
  return value
}

export const env = {
  apiBaseUrl: requireEnv('VITE_API_BASE_URL'),
  devServerPort: Number(import.meta.env.VITE_DEV_SERVER_PORT) || 5173,
}
