function requireEnv(name: keyof ImportMetaEnv): string {
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
  /** Google OAuth Web client ID — cùng GOOGLE_CLIENT_ID trên backend */
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
}
