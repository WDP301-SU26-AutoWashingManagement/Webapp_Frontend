import { useState } from 'react'
import { env } from '../../config/env'
import { GoogleIcon } from './authUi'

interface GoogleSignInButtonProps {
  disabled?: boolean
  onClick: () => Promise<void>
}

export default function GoogleSignInButton({ disabled, onClick }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const isDisabled = disabled || loading || !env.googleClientId

  const handleClick = async () => {
    if (isDisabled) return
    setLoading(true)
    try {
      await onClick()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center">
      <button
        type="button"
        disabled={isDisabled}
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-cyan-500/15 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-cyan-500/40 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleIcon />
        {loading ? 'Đang kết nối Google...' : 'Tiếp tục bằng Google'}
      </button>
    </div>
  )
}
