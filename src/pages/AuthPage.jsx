import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Gift } from 'lucide-react'
import BrandLogo from '../components/BrandLogo'
import PromoOfferCard from '../components/auth/PromoOfferCard'
import {
  AUTH_INPUT_CLASS,
  AUTH_INPUT_COMPACT,
  AuthError,
  PasswordInput,
} from '../components/auth/authUi'
import { AUTH_OFFERS, AUTH_PROMO_COPY } from '../constants/authPromo'
import { useAuth } from '../hooks/useAuth'

const FORM_SIDE =
  'absolute top-0 z-10 flex h-full w-1/2 flex-col overflow-y-auto bg-white px-7 py-6'

export default function AuthPage() {
  const { pathname, state: locationState } = useLocation()
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const mode = pathname === '/register' ? 'register' : 'login'
  const isLogin = mode === 'login'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false })
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loginSuccess, setLoginSuccess] = useState('')

  const passwordsMatch =
    registerForm.confirmPassword.length > 0 &&
    registerForm.password === registerForm.confirmPassword

  const activeOffer = AUTH_OFFERS[isLogin ? 0 : 1]

  useEffect(() => {
    setError('')
  }, [mode])

  useEffect(() => {
    if (locationState?.message) {
      setLoginSuccess(locationState.message)
      navigate(pathname, { replace: true, state: {} })
    }
  }, [locationState, navigate, pathname])

  const setMode = (next) => {
    navigate(next === 'register' ? '/register' : '/login')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(loginForm.email, loginForm.password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (registerForm.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      setLoading(false)
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp')
      setLoading(false)
      return
    }

    if (registerForm.username.trim().length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự')
      setLoading(false)
      return
    }

    try {
      await register({
        email: registerForm.email,
        username: registerForm.username.trim(),
        password: registerForm.password,
      })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0d2818] p-4">
      <Link
        to="/"
        className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white no-underline backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20 sm:left-6 sm:top-6"
      >
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        Trang chủ
      </Link>

      <div className="relative h-[600px] w-full max-w-[860px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Login — cố định bên trái */}
        <div className={`${FORM_SIDE} left-0 justify-center ${isLogin ? '' : 'pointer-events-none'}`}>
          <div className="mx-auto my-auto w-full max-w-[360px]">
            <h1 className="font-display text-2xl text-slate-900">Đăng nhập</h1>
            <p className="mt-1 text-sm text-slate-500">Nhập thông tin để tiếp tục</p>

            <div className="mt-4">
              {loginSuccess && isLogin && (
                <p className="mb-3 rounded-lg border border-green-200 bg-green-50 p-2.5 text-xs text-green-800">
                  {loginSuccess}
                </p>
              )}
              <AuthError message={isLogin ? error : ''} compact />
            </div>

            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="auth-login-email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email hoặc tên đăng nhập
                </label>
                <input
                  id="auth-login-email"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={loading}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="ban@email.com"
                  className={AUTH_INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="auth-login-password" className="mb-1 block text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
                <PasswordInput
                  id="auth-login-password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={loading}
                    checked={loginForm.remember}
                    onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500/30"
                  />
                  <span className="text-xs text-slate-600">Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-green-600 no-underline hover:text-green-700"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && isLogin ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

          </div>
        </div>

        {/* Register — cố định bên phải */}
        <div className={`${FORM_SIDE} right-0 ${isLogin ? 'pointer-events-none' : ''}`}>
          <div className="mx-auto w-full max-w-[360px]">
            <h1 className="font-display text-2xl text-slate-900">Đăng ký</h1>
            <p className="mt-1 text-sm text-slate-500">Tạo tài khoản mới</p>

            <div className="mt-3">
              <AuthError message={!isLogin ? error : ''} compact />
            </div>

            <form onSubmit={handleRegisterSubmit} className="mt-3 space-y-3">
              <div>
                <label htmlFor="auth-register-username" className="mb-1 block text-sm font-medium text-slate-700">
                  Tên đăng nhập
                </label>
                <input
                  id="auth-register-username"
                  type="text"
                  autoComplete="username"
                  required
                  minLength={3}
                  disabled={loading}
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  placeholder="nguyenvana"
                  className={AUTH_INPUT_COMPACT}
                />
                <p className="mt-1 text-[11px] text-slate-400">Tối thiểu 3 ký tự</p>
              </div>

              <div>
                <label htmlFor="auth-register-email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="auth-register-email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="ban@email.com"
                  className={AUTH_INPUT_COMPACT}
                />
              </div>

              <div>
                <label htmlFor="auth-register-password" className="mb-1 block text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
                <PasswordInput
                  id="auth-register-password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  compact
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  placeholder="••••••••"
                />
                <p className="mt-1 text-[11px] text-slate-400">Tối thiểu 6 ký tự</p>
              </div>

              <div>
                <label
                  htmlFor="auth-register-confirm-password"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Nhập lại mật khẩu
                </label>
                <PasswordInput
                  id="auth-register-confirm-password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  compact
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  className={
                    registerForm.confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-500'
                        : 'border-red-400'
                      : ''
                  }
                  trailing={
                    passwordsMatch ? (
                      <Check size={16} strokeWidth={2.5} className="text-green-600" aria-hidden="true" />
                    ) : null
                  }
                />
                {registerForm.confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-1 text-[11px] text-red-500">Không khớp</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && !isLogin ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
            </form>

          </div>
        </div>

        {/* Panel promo — chỉ panel trượt */}
        <div
          className={`absolute top-0 z-20 flex h-full w-1/2 flex-col overflow-hidden bg-[#0d2818] px-7 py-6 transition-[left] duration-500 ease-in-out ${
            isLogin ? 'left-1/2' : 'left-0'
          }`}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-green-600/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-green-500/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex h-full flex-col">
            <BrandLogo className="text-white [&_span]:text-white" />

            <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-green-400/25 bg-green-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-200">
              <Gift size={11} className="text-green-300" aria-hidden="true" />
              {AUTH_PROMO_COPY.badge}
            </div>

            <h2 className="mt-3 font-display text-[1.65rem] leading-tight text-white">
              {AUTH_PROMO_COPY.titleLine1}
              <br />
              {AUTH_PROMO_COPY.titleLine2}{' '}
              <span className="text-lime-400">{AUTH_PROMO_COPY.titleHighlight}</span>
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-green-100/75">{AUTH_PROMO_COPY.description}</p>

            <div className="mt-4">
              <PromoOfferCard {...activeOffer} />
            </div>

            <button
              type="button"
              onClick={() => setMode(isLogin ? 'register' : 'login')}
              className="mt-auto w-fit rounded-lg border-2 border-white px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#0d2818]"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
