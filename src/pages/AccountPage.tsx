import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AUTH_INPUT_CLASS, PasswordInput } from '../components/auth/authUi'
import { useAuth } from '../hooks/useAuth'
import { customerService } from '../services/customerService'
import type { CustomerProfile, UpdateProfileInput } from '../types/customer'
import { ApiError, getApiErrorMessage } from '../utils/errors'
import { showError, showSuccess } from '../utils/toast'

interface ProfileFormState {
  full_name: string
  phone: string
  avatar_url: string
}

function profileToForm(profile: CustomerProfile): ProfileFormState {
  return {
    full_name: profile.full_name ?? '',
    phone: profile.phone ?? '',
    avatar_url: profile.avatar_url ?? '',
  }
}

function buildUpdatePayload(form: ProfileFormState): UpdateProfileInput {
  const payload: UpdateProfileInput = {
    full_name: form.full_name.trim(),
  }

  const phone = form.phone.trim()
  if (phone) payload.phone = phone

  const avatar = form.avatar_url.trim()
  payload.avatar_url = avatar || null

  return payload
}

export default function AccountPage() {
  const { setUser } = useAuth()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [form, setForm] = useState<ProfileFormState>({
    full_name: '',
    phone: '',
    avatar_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadErrorStatus, setLoadErrorStatus] = useState<number | undefined>()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    setLoadErrorStatus(undefined)
    try {
      const data = await customerService.getProfile()
      setProfile(data)
      setForm(profileToForm(data))
    } catch (err) {
      const message = getApiErrorMessage(err, 'Không tải được hồ sơ. Vui lòng thử lại.')
      const status = err instanceof ApiError ? err.status : undefined
      setLoadError(message)
      setLoadErrorStatus(status)
      showError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (form.full_name.trim().length < 2) {
      showError('Họ tên phải có ít nhất 2 ký tự')
      return
    }

    setSavingProfile(true)
    try {
      const { profile: updated, user } = await customerService.updateProfile(
        buildUpdatePayload(form),
      )
      setProfile(updated)
      setForm(profileToForm(updated))
      setUser(user)
      showSuccess('Cập nhật hồ sơ thành công')
    } catch (err) {
      showError(getApiErrorMessage(err, 'Cập nhật hồ sơ thất bại'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (passwordForm.new_password.length < 6) {
      showError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showError('Mật khẩu nhập lại không khớp')
      return
    }

    setSavingPassword(true)
    try {
      const message = await customerService.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      })
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
      showSuccess(message)
    } catch (err) {
      showError(getApiErrorMessage(err, 'Đổi mật khẩu thất bại'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-slate-600">Đang tải hồ sơ...</p>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-sans text-3xl font-bold text-slate-900">Tài khoản</h1>

        {loadError ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-300/80 bg-amber-50 px-5 py-4 text-sm text-amber-950"
          >
            <p className="font-semibold">
              {loadErrorStatus === 429 ? 'Quá nhiều yêu cầu' : 'Không tải được hồ sơ'}
            </p>
            <p className="mt-2 leading-relaxed">{loadError}</p>

          </div>
        ) : (
          <p className="mt-2 text-slate-600">Không có dữ liệu hồ sơ.</p>
        )}

        <button
          type="button"
          onClick={() => void loadProfile()}
          disabled={loading || loadErrorStatus === 429}
          className="mt-6 rounded-lg bg-[#0ea5b7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c8fa0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Đang tải...' : 'Thử tải lại'}
        </button>

        <Link
          to="/"
          className="mt-6 inline-block text-sm font-medium text-[#0ea5b7] no-underline hover:underline"
        >
          ← Về trang chủ
        </Link>
      </main>
    )
  }

  const isGoogleAccount = profile.registration_channel === 'google'

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-sans text-3xl font-bold text-slate-900">Tài khoản</h1>
      <p className="mt-2 text-slate-600">Quản lý thông tin hồ sơ khách hàng</p>

      <section className="mt-8 rounded-xl border border-cyan-500/15 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Thông tin cố định</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-500">Email</dt>
            <dd className="mt-1 text-slate-900">{profile.email}</dd>
          </div>
          {profile.referral_code && (
            <div>
              <dt className="font-medium text-slate-500">Mã giới thiệu</dt>
              <dd className="mt-1 font-mono text-slate-900">{profile.referral_code}</dd>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="font-medium text-slate-500">Điểm thành viên</dt>
              <dd className="mt-1 text-slate-900">{profile.membership_points ?? 0}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Điểm thưởng</dt>
              <dd className="mt-1 text-slate-900">{profile.reward_points ?? 0}</dd>
            </div>
          </div>
        </dl>
      </section>

      <form
        onSubmit={handleProfileSubmit}
        className="mt-6 rounded-xl border border-cyan-500/15 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">Cập nhật hồ sơ</h2>


        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Họ và tên *</span>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              className={`${AUTH_INPUT_CLASS} mt-1`}
              disabled={savingProfile}
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Số điện thoại</span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="VD: 0912345678"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className={`${AUTH_INPUT_CLASS} mt-1`}
              disabled={savingProfile}
            />
            <span className="mt-1 block text-xs text-slate-500">9–15 ký tự số, có thể có dấu +</span>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Ảnh đại diện (URL)</span>
            <input
              type="url"
              placeholder="https://..."
              value={form.avatar_url}
              onChange={(e) => setForm((prev) => ({ ...prev, avatar_url: e.target.value }))}
              className={`${AUTH_INPUT_CLASS} mt-1`}
              disabled={savingProfile}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="mt-6 rounded-lg bg-[#0ea5b7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c8fa0] disabled:opacity-50"
        >
          {savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
        </button>
      </form>

      <section className="mt-6 rounded-xl border border-cyan-500/15 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Đổi mật khẩu</h2>

        {isGoogleAccount && (
          <p className="mt-4 text-sm leading-relaxed text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            💡 Tài khoản Google của bạn đã được cấp mật khẩu tạm qua email.
          </p>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Mật khẩu hiện tại * </span>
              <PasswordInput
                id="old_password"
                value={passwordForm.old_password}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))
                }
                autoComplete="current-password"
                required
                className="mt-1"
                disabled={savingPassword}
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Mật khẩu mới *</span>
              <PasswordInput
                id="new_password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))
                }
                autoComplete="new-password"
                required
                className="mt-1"
                disabled={savingPassword}
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Nhập lại mật khẩu mới *</span>
              <PasswordInput
                id="confirm_password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))
                }
                autoComplete="new-password"
                required
                className="mt-1"
                disabled={savingPassword}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="mt-6 rounded-lg border border-cyan-500/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#0ea5b7] transition hover:bg-cyan-50 disabled:opacity-50"
          >
            {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </section>

      <Link
        to="/"
        className="mt-8 inline-block text-sm font-medium text-[#0ea5b7] no-underline hover:underline"
      >
        ← Về trang chủ
      </Link>
    </main>
  )
}
