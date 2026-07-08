import { useEffect, useState, useRef } from 'react'
import { Save, User, Mail, Phone, Lock, Upload, Key, Briefcase, Star, Award, Share2, Crown } from 'lucide-react'
import { profileService } from '../../services/profileService'
import type { ProfileData } from '../../services/profileService'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'
import { useAuth } from '../../hooks/useAuth'
import { PasswordInput } from '../../components/auth/authUi'
import { adminTierService } from '../../services/adminTierService'
import type { Tier } from '../../types/tier'

const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp'

export default function InternalProfilePage() {
  const { user, refreshUserFromProfile } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [tiers, setTiers] = useState<Tier[]>([])

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    loadProfile()
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    }
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const [data, tiersData] = await Promise.all([
        profileService.getProfile(),
        adminTierService.list({ limit: 100 }).catch(() => ({ items: [] }))
      ])
      setProfile(data)
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
      })
      const sortedTiers = tiersData.items.sort((a, b) => (a.min_membership_points || 0) - (b.min_membership_points || 0));
      setTiers(sortedTiers)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể tải thông tin hồ sơ'))
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!AVATAR_ACCEPT.includes(file.type)) {
      showError('Chỉ chấp nhận ảnh PNG, JPEG, WebP')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      showError('Kích thước ảnh tối đa là 5MB')
      return
    }

    setAvatarFile(file)
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.full_name.trim().length < 2) {
      showError('Họ tên phải có ít nhất 2 ký tự')
      return
    }

    setSavingProfile(true)
    try {
      const updated = await profileService.updateProfile({
        full_name: form.full_name,
        phone: form.phone,
        ...(avatarFile ? { avatar: avatarFile } : {})
      })
      setProfile(updated)

      // Clear file input
      setAvatarFile(null)
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
      if (avatarInputRef.current) avatarInputRef.current.value = ''

      // Update global context user
      await refreshUserFromProfile()

      showSuccess('Cập nhật hồ sơ thành công')
    } catch (err) {
      showError(getErrorMessage(err, 'Cập nhật thất bại'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password.length < 6) {
      showError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showError('Nhập lại mật khẩu không khớp')
      return
    }

    setSavingPassword(true)
    try {
      const msg = await profileService.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      })
      showSuccess(msg || 'Đổi mật khẩu thành công')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      showError(getErrorMessage(err, 'Đổi mật khẩu thất bại'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <div className="admin-page"><p className="p-8 text-slate-500">Đang tải dữ liệu...</p></div>
  }

  if (!profile) return null

  let userTierInfo = null;
  if (user?.role === 'customer' && profile?.role_data?.tier_id) {
    const rawTierId = profile.role_data.tier_id as any;
    const rawName = (rawTierId.tier_name || 'member').toLowerCase();
    const tData = tiers.find(t => (t.tier_name || '').toLowerCase() === rawName) || 
                  (typeof rawTierId === 'object' ? rawTierId : { tier_name: 'Member' });
    const tName = (tData.tier_name || 'member').toLowerCase();
    const visualMap: Record<string, any> = {
      member: { icon: '🏅', color: '#888780', colorDark: '#444441', colorLight: '#F1EFE8', subtitle: 'Hạng cơ bản' },
      silver: { icon: '🥈', color: '#888780', colorDark: '#444441', colorLight: '#F1EFE8', subtitle: 'Khách hàng thân thiết' },
      gold: { icon: '👑', color: '#BA7517', colorDark: '#633806', colorLight: '#faeedab0', subtitle: 'Khách VIP', featured: true },
      platinum: { icon: '💎', color: '#1D9E75', colorDark: '#085041', colorLight: '#E1F5EE', subtitle: 'Hạng cao nhất' },
    }
    const v = visualMap[tName] || visualMap['member'];
    userTierInfo = { tData, v };
  }

  const displayedAvatar = avatarPreview || profile.avatar_url

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Hồ sơ cá nhân</h1>
          <p className="admin-page__subtitle">Cập nhật thông tin và đổi mật khẩu bảo mật</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Left Column: Basic Info Overview */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-50 bg-slate-100 shadow-sm">
                {displayedAvatar ? (
                  <img src={displayedAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-300">
                    {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">{profile.full_name}</h3>
              <p className="text-sm font-medium text-cyan-600 uppercase tracking-wide flex items-center gap-1 mt-1">
                <Briefcase size={14} /> {user?.role}
              </p>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.role_data && Boolean(profile.role_data.admin_code) && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Key size={16} className="text-slate-400" />
                  <span>Mã: {String(profile.role_data.admin_code)}</span>
                </div>
              )}
              {profile.role_data && Boolean(profile.role_data.staff_code) && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Key size={16} className="text-slate-400" />
                  <span>Mã: {String(profile.role_data.staff_code)}</span>
                </div>
              )}
            </div>

            {/* Hiển thị điểm cho Customer */}
            {user?.role === 'customer' && profile.role_data && (
              <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Thẻ thành viên</h4>

                {userTierInfo && (
                  <div className="mb-4 flex flex-col rounded-xl bg-white p-4 border border-gray-200/80 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{userTierInfo.v.icon}</span>
                      <h4 className="text-sm font-bold uppercase" style={{ color: userTierInfo.v.colorDark }}>Ưu đãi hạng {userTierInfo.tData.tier_name}</h4>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-2 mb-1">
                      <div
                        className="rounded-xl p-3 flex flex-col gap-0.5"
                        style={{ backgroundColor: userTierInfo.v.colorLight }}
                      >
                        <span className="text-base font-bold leading-tight" style={{ color: userTierInfo.v.color }}>
                          {userTierInfo.tData.booking_window_days || 0} ngày
                        </span>
                        <span className="text-[11px] text-slate-500">Đặt trước</span>
                      </div>
                      <div
                        className="rounded-xl p-3 flex flex-col gap-0.5"
                        style={{ backgroundColor: userTierInfo.v.colorLight }}
                      >
                        <span className="text-base font-bold leading-tight" style={{ color: userTierInfo.v.color }}>
                          {userTierInfo.tData.discount_percentage || 0}%
                        </span>
                        <span className="text-[11px] text-slate-500">Giảm giá</span>
                      </div>
                    </div>

                    {/* Perks */}
                    {userTierInfo.tData.free_features && userTierInfo.tData.free_features.length > 0 && (
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Đặc quyền</p>
                        <ul className="flex flex-col gap-1.5">
                          {userTierInfo.tData.free_features.map((p: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                              <span style={{ color: userTierInfo.v.color }} className="flex-shrink-0 mt-0.5">✓</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {(() => {
                  const currentPoints = Number(profile.role_data.membership_points ?? 0);

                  // Tìm next tier từ danh sách tiers lấy từ DB
                  let localNextTier = profile.role_data.next_tier as any;
                  if (!localNextTier && tiers.length > 0) {
                    localNextTier = tiers.find(t => (t.min_membership_points || 0) > currentPoints);
                  }

                  if (localNextTier) {
                    const nextTierPoints = Number(localNextTier.min_membership_points);
                    const percentage = Math.min(100, (currentPoints / nextTierPoints) * 100);
                    const pointsNeeded = nextTierPoints - currentPoints;

                    return (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-slate-600"><Star size={16} className="text-amber-500" /> Điểm xét hạng</div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-amber-600">{currentPoints.toLocaleString('vi-VN')}</span>
                            <span className="text-sm font-medium text-slate-400"> / {nextTierPoints.toLocaleString('vi-VN')}</span>
                          </div>
                        </div>

                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-100">
                            <div
                              style={{ width: `${percentage}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                            ></div>
                          </div>
                          <div className="absolute right-0 -mt-4 mr-[-8px] text-amber-500 bg-white rounded-full p-0.5 shadow-sm border border-amber-100">
                            <Crown size={14} />
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-2 text-right font-medium">
                          Còn <span className="text-amber-600 font-bold">{pointsNeeded.toLocaleString('vi-VN')}</span> điểm để thăng hạng <span className="uppercase text-amber-600 font-bold">{localNextTier.tier_name}</span>
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2"><Star size={16} className="text-yellow-500" /> Điểm xét hạng</div>
                      <span className="font-bold">{currentPoints.toLocaleString('vi-VN')}</span>
                    </div>
                  );
                })()}
                {/* <div className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2"><Award size={16} className="text-cyan-500" /> Điểm thưởng</div>
                  <span className="font-bold">{Number(profile.role_data.reward_points ?? 0).toLocaleString('vi-VN')}</span>
                </div> */}
                {/* Removed referral_code section */}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="space-y-6 lg:col-span-2">

          {/* Update Profile Form */}
          <form onSubmit={handleProfileSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-cyan-600" /> Thông tin cơ bản
            </h3>

            <div className="admin-form-group">
              <label className="admin-form-label">Ảnh đại diện</label>
              <div className="flex items-center gap-4 mt-2">
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
                  className="admin-btn admin-btn--ghost flex items-center gap-2"
                  disabled={savingProfile}
                >
                  <Upload size={14} /> Tải ảnh lên
                </button>
                <span className="text-xs text-slate-500">
                  {avatarFile ? avatarFile.name : 'Chưa chọn file (Tối đa 5MB)'}
                </span>
              </div>
            </div>

            <div className="admin-form-row mt-4">
              <div className="admin-form-group">
                <label className="admin-form-label">Họ và tên *</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  disabled={savingProfile}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Số điện thoại</label>
                <input
                  type="tel"
                  className="admin-form-input"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  disabled={savingProfile}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                type="submit" 
                className="admin-btn admin-btn--primary flex items-center gap-2" 
                disabled={savingProfile || (profile && form.full_name === (profile.full_name || '') && form.phone === (profile.phone || '') && !avatarFile)}
              >
                <Save size={14} /> {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lock size={18} className="text-cyan-600" /> Đổi mật khẩu
            </h3>

            {profile.auth_provider === 'google' && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                💡 Tài khoản của bạn được tạo qua Google. Nếu bạn muốn dùng mật khẩu thủ công, hãy sử dụng tính năng "Quên mật khẩu" hoặc nhập mật khẩu tạm thời từ email.
              </div>
            )}

            <div className="space-y-4 max-w-md">
              <div className="admin-form-group">
                <label className="admin-form-label">Mật khẩu hiện tại *</label>
                <PasswordInput
                  id="old_pwd"
                  value={passwordForm.old_password}
                  onChange={e => setPasswordForm(f => ({ ...f, old_password: e.target.value }))}
                  required
                  disabled={savingPassword}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Mật khẩu mới *</label>
                <PasswordInput
                  id="new_pwd"
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
                  required
                  disabled={savingPassword}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Nhập lại mật khẩu mới *</label>
                <PasswordInput
                  id="confirm_pwd"
                  value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))}
                  required
                  disabled={savingPassword}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="submit" className="admin-btn admin-btn--ghost flex items-center gap-2" disabled={savingPassword}>
                <Lock size={14} /> {savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
