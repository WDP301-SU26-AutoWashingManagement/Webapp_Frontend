import { useEffect, useState, useRef } from 'react'
import { Save, User, Mail, Phone, Lock, Upload, Key, Briefcase, Star, Award, Share2, Crown } from 'lucide-react'
import { profileService } from '../../services/profileService'
import type { ProfileData } from '../../services/profileService'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'
import { useAuth } from '../../hooks/useAuth'
import { PasswordInput } from '../../components/auth/authUi'

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
      const data = await profileService.getProfile()
      setProfile(data)
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
      })
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
                
                {Boolean(profile.role_data.tier_id) && typeof profile.role_data.tier_id === 'object' && (
                  <div className="flex items-center justify-between text-sm text-slate-700 bg-gradient-to-r from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2"><Crown size={16} className="text-amber-500" /> Hạng thành viên</div>
                    <span className="font-bold text-amber-700 uppercase tracking-wide">{String((profile.role_data.tier_id as any).tier_name || 'N/A')}</span>
                  </div>
                )}

                {(() => {
                  const currentPoints = Number(profile.role_data.membership_points ?? 0);
                  
                  // Chỉ sử dụng FALLBACK_TIERS nếu Backend chưa trả về next_tier
                  // Thiết lập mốc điểm giống với cấu hình hiện tại của bạn: Silver (15 điểm)
                  const FALLBACK_TIERS = [
                    { tier_name: 'Silver', min_membership_points: 15 },
                    { tier_name: 'Gold', min_membership_points: 50 },
                    { tier_name: 'Platinum', min_membership_points: 100 }
                  ];
                  
                  let localNextTier = profile.role_data.next_tier as any;
                  if (!localNextTier) {
                    localNextTier = FALLBACK_TIERS.find(t => t.min_membership_points > currentPoints);
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
                <div className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2"><Award size={16} className="text-cyan-500" /> Điểm thưởng</div>
                  <span className="font-bold">{Number(profile.role_data.reward_points ?? 0).toLocaleString('vi-VN')}</span>
                </div>
                {Boolean(profile.role_data.referral_code) && (
                  <div className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2"><Share2 size={16} className="text-purple-500" /> Mã giới thiệu</div>
                    <span className="font-mono font-bold text-slate-900">{String(profile.role_data.referral_code)}</span>
                  </div>
                )}
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
                  onChange={e => setForm(f => ({...f, full_name: e.target.value}))}
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
                  onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                  disabled={savingProfile}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="submit" className="admin-btn admin-btn--primary flex items-center gap-2" disabled={savingProfile}>
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
                  onChange={e => setPasswordForm(f => ({...f, old_password: e.target.value}))}
                  required
                  disabled={savingPassword}
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Mật khẩu mới *</label>
                <PasswordInput
                  id="new_pwd"
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm(f => ({...f, new_password: e.target.value}))}
                  required
                  disabled={savingPassword}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Nhập lại mật khẩu mới *</label>
                <PasswordInput
                  id="confirm_pwd"
                  value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm(f => ({...f, confirm_password: e.target.value}))}
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
