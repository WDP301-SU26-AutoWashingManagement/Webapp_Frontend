import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AUTH_INPUT_CLASS, PasswordInput } from '../components/auth/authUi'
import OtpInput from '../components/auth/OtpInput'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage, getResponseMessage } from '../utils/errors'
import { showError, showInfo } from '../utils/toast'

const STEPS = ['email', 'otp', 'reset'] as const
type ForgotStep = (typeof STEPS)[number]

interface StepContent {
  title: string
  description: string
}

const STEP_CONTENT: Record<ForgotStep, StepContent> = {
  email: {
    title: 'Xác Thực Email',
    description: 'Nhập email để nhận mã xác nhận',
  },
  otp: {
    title: 'Nhập Mã OTP',
    description: 'Nhập mã 6 số đã gửi qua email',
  },
  reset: {
    title: 'Đặt Lại Mật Khẩu',
    description: 'Tạo mật khẩu mới cho tài khoản',
  },
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { forgotPassword, verifyOtp, resetPassword } = useAuth()

  const [step, setStep] = useState<ForgotStep>('email')
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (step === 'otp') {
      setOtp('')
    }
  }, [step])

  const handleSendEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      showInfo(getResponseMessage(res, 'Nếu email tồn tại, mã OTP đã được gửi.'))
      setStep('otp')
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể gửi mã xác nhận.'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await verifyOtp(email, otp)
      showInfo(getResponseMessage(res, 'OTP hợp lệ. Nhập mật khẩu mới.'))
      setStep('reset')
    } catch (err) {
      showError(getErrorMessage(err, 'Mã OTP không hợp lệ.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (password !== confirmPassword) {
      showError('Mật khẩu nhập lại không khớp')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ email, otp, new_password: password })
      navigate('/login', { state: { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' } })
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể đặt lại mật khẩu.'))
    } finally {
      setLoading(false)
    }
  }

  const content = STEP_CONTENT[step]

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4">
      <Link
        to="/login"
        className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white no-underline backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20 sm:left-6 sm:top-6"
      >
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        Quay lại đăng nhập
      </Link>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="font-sans text-2xl font-bold text-slate-900">{content.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{content.description}</p>

        <div className="mt-2 flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${STEPS.indexOf(step) >= i ? 'bg-[#0ea5b7]' : 'bg-slate-200'
                }`}
            />
          ))}
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendEmail} className="mt-6 space-y-4">
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
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-6">
            <OtpInput
              id="forgot-otp"
              value={otp}
              onChange={setOtp}
              disabled={loading}
            />
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
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
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