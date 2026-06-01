import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { Save, User, Mail, Phone, Lock, Upload, Briefcase, Star, Award, Share2 } from 'lucide-react'
import { AUTH_INPUT_CLASS, PasswordInput } from '../components/auth/authUi'
import { useAuth } from '../hooks/useAuth'
import { customerService } from '../services/customerService'
import type { CustomerProfile, UpdateProfileInput } from '../types/customer'
import { ApiError, getApiErrorMessage } from '../utils/errors'
import { showError, showSuccess } from '../utils/toast'

const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp'

interface ProfileFormState {
  full_name: string
  phone: string
}

function profileToForm(profile: CustomerProfile): ProfileFormState {
  return {
    full_name: profile.full_name ?? '',
    phone: profile.phone ?? '',
  }
}

function buildUpdatePayload(form: ProfileFormState, avatar?: File | null): UpdateProfileInput {
  const payload: UpdateProfileInput = {
    full_name: form.full_name.trim(),
  }

  const phone = form.phone.trim()
  if (phone) payload.phone = phone
  if (avatar) payload.avatar = avatar

  return payload
}

function validateAvatarFile(file: File): string | null {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!allowed.includes(file.type)) {
    return 'Chỉ chấp nhận ảnh PNG, JPEG hoặc WebP'
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'Ảnh không được lớn hơn 5MB'
  }
  return null
}

export default function AccountPage() {
  const { setUser } = useAuth()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [form, setForm] = useState<ProfileFormState>({
    full_name: '',
    phone: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const clearAvatarSelection = useCallback(() => {
    setAvatarFile(null)
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }, [])

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateAvatarFile(file)
    if (validationError) {
      showError(validationError)
      e.target.value = ''
      return
    }

    setAvatarFile(file)
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (form.full_name.trim().length < 2) {
      showError('Họ tên phải có ít nhất 2 ký tự')
      return
    }

    setSavingProfile(true)
    try {
      const { profile: updated, user } = await customerService.updateProfile(
        buildUpdatePayload(form, avatarFile),
      )
      setProfile(updated)
      setForm(profileToForm(updated))
      clearAvatarSelection()
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
  const displayedAvatar = avatarPreview ?? profile.avatar_url ?? null

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="mt-2 text-slate-600">Quản lý thông tin tài khoản và điểm thưởng của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Basic Info Overview */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-slate-50 bg-slate-100 shadow-sm">
                {displayedAvatar ? (
                  <img src={displayedAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-300">
                    {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-800 text-center">{profile.full_name}</h3>
              <p className="text-sm font-medium text-cyan-600 uppercase tracking-wide flex items-center gap-1 mt-1">
                <Briefcase size={14} /> Khách hàng
              </p>
            </div>
            
            <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Thẻ thành viên</h4>
              <div className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2"><Star size={16} className="text-yellow-500" /> Điểm hạng</div>
                <span className="font-bold">{profile.membership_points ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2"><Award size={16} className="text-cyan-500" /> Điểm thưởng</div>
                <span className="font-bold">{profile.reward_points ?? 0}</span>
              </div>
              {profile.referral_code && (
                <div className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2"><Share2 size={16} className="text-purple-500" /> Mã giới thiệu</div>
                  <span className="font-mono font-bold text-slate-900">{profile.referral_code}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Update Profile Form */}
          <form onSubmit={handleProfileSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User size={20} className="text-cyan-600" /> Cập nhật thông tin
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ảnh đại diện</label>
              <div className="flex items-center gap-4">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={AVATAR_ACCEPT}
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={savingProfile}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-50/50 px-4 py-2.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-50"
                  disabled={savingProfile}
                >
                  <Upload size={16} /> Tải ảnh mới
                </button>
                <span className="text-sm text-slate-500 truncate max-w-[200px] md:max-w-xs">
                  {avatarFile ? avatarFile.name : 'Tối đa 5MB (JPEG, PNG)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên *</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  className={`${AUTH_INPUT_CLASS} bg-slate-50 focus:bg-white`}
                  disabled={savingProfile}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="VD: 0912345678"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className={`${AUTH_INPUT_CLASS} bg-slate-50 focus:bg-white`}
                  disabled={savingProfile}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                type="submit" 
                className="flex items-center gap-2 rounded-xl bg-[#0ea5b7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0c8fa0] disabled:opacity-50 shadow-sm shadow-cyan-500/20"
                disabled={savingProfile}
              >
                <Save size={16} /> {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Lock size={20} className="text-cyan-600" /> Đổi mật khẩu
            </h3>
            
            {isGoogleAccount ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-amber-800">
                <div className="shrink-0 mt-0.5">💡</div>
                <p className="text-sm leading-relaxed">
                  Tài khoản của bạn được đăng nhập bằng Google. Hệ thống đã tạo một mật khẩu ngẫu nhiên cho bạn. Nếu bạn muốn đặt mật khẩu riêng, hãy sử dụng tính năng "Quên mật khẩu" hoặc nhập mật khẩu tạm thời đã được gửi qua Email.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-6">Đảm bảo tài khoản của bạn đang sử dụng một mật khẩu dài, ngẫu nhiên để bảo mật.</p>
            )}

            <div className="space-y-5 max-w-md">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu hiện tại *</label>
                <PasswordInput
                  id="old_pwd"
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))}
                  required
                  disabled={savingPassword}
                  className="bg-slate-50 focus:bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới *</label>
                <PasswordInput
                  id="new_pwd"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                  required
                  disabled={savingPassword}
                  className="bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nhập lại mật khẩu mới *</label>
                <PasswordInput
                  id="confirm_pwd"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                  required
                  disabled={savingPassword}
                  className="bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                type="submit" 
                className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                disabled={savingPassword}
              >
                <Lock size={16} /> {savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>

        </div>
      </div>

      <div className="mt-8 text-center lg:text-left">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-cyan-600 transition">
          ← Quay lại trang chủ
        </Link>
      </div>
    </main>
  )
}
