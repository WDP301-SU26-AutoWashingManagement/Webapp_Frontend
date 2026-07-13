import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Gift } from 'lucide-react'
import BrandLogo from '../components/BrandLogo'
import PromoOfferCard from '../components/auth/PromoOfferCard'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import { AUTH_INPUT_CLASS, AuthDivider, PasswordInput } from '../components/auth/authUi'
import { AUTH_OFFERS, AUTH_PROMO_COPY } from '../constants/authPromo'
import { useAuth } from '../hooks/useAuth'
import type { LoginLocationState } from '../types/auth'
import { getErrorMessage } from '../utils/errors'
import { showError, showSuccess } from '../utils/toast'

const AUTH_GUEST_PATHS = ['/login', '/register', '/forgot-password']

export default function AuthPage() {
  const { state: locationState } = useLocation() as {
    state: LoginLocationState | null
  }
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, loginWithGoogle } = useAuth()

  const redirectAfterAuth = (role?: string) => {
    // Boss → go to boss dashboard
    if (role === 'boss') {
      navigate('/boss/dashboard', { replace: true })
      return
    }
    // Admin → go to admin dashboard
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
      return
    }
    // Customer → honour the ?from= / state.from, else home
    const fromState = locationState?.from
    const fromQuery = searchParams.get('from')
    const target = fromState ?? fromQuery
    if (target && target.startsWith('/') && !AUTH_GUEST_PATHS.includes(target)) {
      navigate(target, { replace: true })
      return
    }
    navigate('/', { replace: true })
  }

  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false })

  const activeOffer = AUTH_OFFERS[0] // Only login offer now

  useEffect(() => {
    if (!locationState?.message) return

    showSuccess(locationState.message)
    if (locationState.email) {
      setLoginForm((prev) => ({ ...prev, email: locationState.email ?? '' }))
    }
    navigate('/login', { replace: true, state: {} })
  }, [locationState, navigate])

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(loginForm.email, loginForm.password)
      showSuccess('Đăng nhập thành công!')
      // user state is updated by AuthContext after login, read role from it
      const role = (await import('../services/authService')).authService.getCurrentUser()?.role
      redirectAfterAuth(role)
    } catch (err) {
      showError(getErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
      showSuccess('Đăng nhập thành công!')
      const role = (await import('../services/authService')).authService.getCurrentUser()?.role
      redirectAfterAuth(role)
    } catch (err) {
      showError(getErrorMessage(err, 'Đăng nhập Google thất bại.'))
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4">
      <Link
        to="/"
        className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white no-underline backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20 sm:left-6 sm:top-6"
      >
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        Trang chủ
      </Link>

      <div className="flex h-[600px] w-full max-w-[860px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Login — cố định bên trái */}
        <div className="flex h-full w-1/2 flex-col overflow-y-auto bg-white px-7 py-6 font-sans">
          <div className="mx-auto my-auto w-full max-w-[360px]">
            <p className="section-label mb-1">Tài khoản</p>
            <h1 className="auth-page-title">Đăng nhập</h1>
            <p className="auth-page-sub mt-1">Nhập thông tin để tiếp tục</p>

            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="auth-login-email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="auth-login-email"
                  type="email"
                  autoComplete="email"
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
                    className="h-4 w-4 rounded border-slate-300 text-[#0ea5b7] focus:ring-cyan-500/30"
                  />
                  <span className="text-xs text-slate-600">Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#0ea5b7] no-underline hover:text-[#0b8fa0]"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              <AuthDivider compact />
              <GoogleSignInButton disabled={loading} onClick={handleGoogleLogin} />
            </form>

          </div>
        </div>

        {/* Panel promo — cố định bên phải */}
        <div className="relative flex h-full w-1/2 flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 px-7 py-6">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-500/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-teal-500/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex h-full flex-col font-sans">
            <BrandLogo variant="dark" />

            <div className="section-label mt-4 !mb-0 flex w-fit items-center gap-2 text-cyan-300">
              <Gift size={11} className="text-cyan-300" aria-hidden="true" />
              {AUTH_PROMO_COPY.badge}
            </div>

            <h2 className="auth-promo-title mt-3 text-white">
              {AUTH_PROMO_COPY.titleLine1}
              <br />
              {AUTH_PROMO_COPY.titleLine2}{' '}
              <span className="text-cyan-400">{AUTH_PROMO_COPY.titleHighlight}</span>
            </h2>

            <p className="auth-page-sub mt-2 !text-cyan-100/75">{AUTH_PROMO_COPY.description}</p>

            <div className="mt-4">
              <PromoOfferCard {...activeOffer} />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
