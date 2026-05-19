import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AUTH_INPUT_CLASS, AuthError, PasswordInput } from '../components/auth/authUi'
import { useAuth } from '../hooks/useAuth'

const STEPS = ['email', 'otp', 'reset']

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { forgotPassword, verifyOtp, resetPassword } = useAuth()

  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSendEmail = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      setInfo(res.data?.message || 'Mã xác nhận đã được gửi tới email của bạn.')
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Không thể gửi mã xác nhận.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await verifyOtp(otp)
      if (!res.data?.token) {
        setError('Không nhận được token đặt lại mật khẩu.')
        return
      }
      setResetToken(res.data.token)
      setInfo(res.data.message || 'Xác thực thành công. Nhập mật khẩu mới.')
      setStep('reset')
    } catch (err) {
      setError(err.message || 'Mã OTP không hợp lệ.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp')
      return
    }

    setLoading(true)
    try {
      await resetPassword(resetToken, password)
      navigate('/login', { state: { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' } })
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0d2818] p-4">
      <Link
        to="/login"
        className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white no-underline backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20 sm:left-6 sm:top-6"
      >
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        Quay lại đăng nhập
      </Link>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="font-display text-2xl text-slate-900">Quên mật khẩu</h1>
        <p className="mt-1 text-sm text-slate-500">
          {step === 'email' && 'Nhập email để nhận mã xác nhận'}
          {step === 'otp' && 'Nhập mã 6 số đã gửi qua email'}
          {step === 'reset' && 'Tạo mật khẩu mới cho tài khoản'}
        </p>

        <div className="mt-2 flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                STEPS.indexOf(step) >= i ? 'bg-green-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="mt-4">
          <AuthError message={error} compact />
          {info && !error && (
            <p className="mb-3 rounded-lg border border-green-200 bg-green-50 p-2.5 text-xs text-green-800">
              {info}
            </p>
          )}
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendEmail} className="mt-2 space-y-4">
            <div>
              <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@email.com"
                className={AUTH_INPUT_CLASS}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="mt-2 space-y-4">
            <div>
              <label htmlFor="forgot-otp" className="mb-1 block text-sm font-medium text-slate-700">
                Mã OTP (6 số)
              </label>
              <input
                id="forgot-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                disabled={loading}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className={AUTH_INPUT_CLASS}
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận mã'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="mt-2 space-y-4">
            <div>
              <label htmlFor="forgot-new-password" className="mb-1 block text-sm font-medium text-slate-700">
                Mật khẩu mới
              </label>
              <PasswordInput
                id="forgot-new-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="forgot-confirm-password" className="mb-1 block text-sm font-medium text-slate-700">
                Nhập lại mật khẩu
              </label>
              <PasswordInput
                id="forgot-confirm-password"
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
