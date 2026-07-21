import apiClient from './apiClient'
import {
  getAccessToken,
  getCustomerRoleId,
  getStoredCustomerProfile,
  getStoredUser,
  setStoredCustomerProfile,
  setStoredUser,
} from '../lib/authSession'
import type { ApiResponse } from '../types/api'
import type { AuthUser } from '../types/auth'
import type {
  ChangeProfilePasswordInput,
  CustomerProfile,
  UpdateProfileInput,
} from '../types/customer'
import { ApiError } from '../utils/errors'
import { unwrapApiData } from '../utils/apiResponse'

function normalizeId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return String(value)
  }
  return String(value)
}

/** Map GET /users/profile response to CustomerProfile. */
export function mapUserProfileToCustomerProfile(raw: Record<string, unknown>): CustomerProfile {
  const userId = normalizeId(raw._id ?? raw.id)
  const roleData =
    raw.role_data != null && typeof raw.role_data === 'object'
      ? (raw.role_data as Record<string, unknown>)
      : null
  const customerRoleId = roleData ? normalizeId(roleData._id) : null

  return {
    _id: userId ?? undefined,
    id: userId ?? undefined,
    user_id: userId ?? undefined,
    customer_id: customerRoleId ?? undefined,
    email: String(raw.email ?? ''),
    full_name: String(raw.full_name ?? ''),
    phone: (raw.phone as string | null | undefined) ?? null,
    avatar_url: (raw.avatar_url as string | null | undefined) ?? null,
    registration_channel: roleData?.registration_channel as CustomerProfile['registration_channel'],
    has_online_access: roleData?.has_online_access as boolean | undefined,
    membership_points: Number(roleData?.membership_points ?? 0),
    reward_points: Number(roleData?.reward_points ?? 0),
    is_active: raw.is_active !== false,
    is_email_verified: raw.is_email_verified as boolean | undefined,
    is_phone_verified: raw.is_phone_verified as boolean | undefined,
    last_login_at: (raw.last_login_at as string | null | undefined) ?? null,
    referral_code: roleData?.referral_code as string | undefined,
    tier_id: roleData?.tier_id != null ? (typeof roleData.tier_id === 'object' ? roleData.tier_id as any : String(roleData.tier_id)) : null,
    created_at: raw.created_at as string | undefined,
    updated_at: raw.updated_at as string | undefined,
    staff_type: roleData?.staff_type as string | undefined,
    branch_id: (raw.branch_id ? normalizeId(raw.branch_id) : null) || (roleData?.branch_id ? normalizeId(roleData.branch_id) : null),
  }
}

/** Map user object from POST /auth/login|google (User only, no role_data yet). */
export function mapAuthUserToCustomerProfile(user: Record<string, unknown>): CustomerProfile {
  const id = normalizeId(user._id ?? user.id)
  return {
    _id: id ?? undefined,
    id: id ?? undefined,
    user_id: id ?? undefined,
    email: String(user.email ?? ''),
    full_name: String(user.full_name ?? ''),
    phone: (user.phone as string | null | undefined) ?? null,
    avatar_url: (user.avatar_url as string | null | undefined) ?? null,
    is_active: user.is_active !== false,
    is_email_verified: user.is_email_verified as boolean | undefined,
    is_phone_verified: user.is_phone_verified as boolean | undefined,
    last_login_at: (user.last_login_at as string | null | undefined) ?? null,
    created_at: user.created_at as string | undefined,
    updated_at: user.updated_at as string | undefined,
    branch_id: user.branch_id ? normalizeId(user.branch_id) : null,
  }
}

export function mapProfileToAuthUser(profile: CustomerProfile, role = 'customer'): AuthUser {
  return {
    user_id: normalizeId(profile.user_id ?? profile._id ?? profile.id),
    email: profile.email ?? null,
    full_name: profile.full_name ?? null,
    role,
    avatar_url: profile.avatar_url ?? null,
    is_active: profile.is_active ?? true,
    staff_type: profile.staff_type,
    branch_id: profile.branch_id ?? null,
    phone: profile.phone ?? null,
  }
}

function syncAuthUserFromProfile(profile: CustomerProfile, role = 'customer'): AuthUser {
  const mapped = mapProfileToAuthUser(profile, role)
  setStoredUser(mapped)
  setStoredCustomerProfile(profile)
  return mapped
}

function profileFromSessionUser(): CustomerProfile | null {
  const cached = getStoredCustomerProfile()
  if (cached?.email) return cached

  const authUser = getStoredUser()
  if (!authUser?.email) return null

  return {
    email: authUser.email,
    full_name: authUser.full_name ?? '',
    _id: authUser.user_id ?? undefined,
    id: authUser.user_id ?? undefined,
    user_id: authUser.user_id ?? undefined,
    avatar_url: authUser.avatar_url,
    is_active: authUser.is_active ?? true,
  }
}

let profileRequest: Promise<CustomerProfile> | null = null

/** Customer role id required by POST /vehicles — not the JWT user id. */
export async function resolveCustomerRoleId(): Promise<string> {
  const cached = getCustomerRoleId()
  if (cached) return cached

  const profile = await customerService.getProfile()
  if (!profile.customer_id) {
    throw new ApiError(
      'Không tìm thấy hồ sơ khách hàng. Vui lòng đăng xuất và đăng nhập lại.',
      404,
    )
  }
  return profile.customer_id
}

export const customerService = {
  async getProfile(): Promise<CustomerProfile> {
    const token = getAccessToken()
    if (!token) {
      throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401)
    }

    if (profileRequest) {
      return profileRequest
    }

    profileRequest = (async () => {
      try {
        const body = await apiClient.get<ApiResponse<Record<string, unknown>>>('/profile')
        const raw = unwrapApiData<Record<string, unknown>>(body)
        const profile = mapUserProfileToCustomerProfile(raw)
        if (!profile.email) {
          throw new Error('Không lấy được thông tin hồ sơ')
        }
        setStoredCustomerProfile(profile)
        return profile
      } catch (err) {
        const fallback = profileFromSessionUser()
        if (fallback?.customer_id) {
          return fallback
        }
        throw err
      } finally {
        profileRequest = null
      }
    })()

    return profileRequest
  },

  async updateProfile(
    payload: UpdateProfileInput,
    role = 'customer',
  ): Promise<{ profile: CustomerProfile; user: AuthUser }> {
    const { avatar, ...fields } = payload
    let requestBody: FormData | Record<string, unknown>

    if (avatar) {
      const form = new FormData()
      if (fields.full_name !== undefined) form.append('full_name', fields.full_name)
      if (fields.phone !== undefined) form.append('phone', fields.phone)
      if (fields.has_online_access !== undefined) {
        form.append('has_online_access', String(fields.has_online_access))
      }
      form.append('avatar', avatar)
      requestBody = form
    } else {
      requestBody = { ...fields }
    }

    const body = await apiClient.put<ApiResponse<Record<string, unknown>>>(
      '/profile',
      requestBody,
    )
    const raw = unwrapApiData<Record<string, unknown>>(body)
    const profile = mapUserProfileToCustomerProfile(raw)
    if (!profile.email) {
      throw new Error('Cập nhật hồ sơ thất bại')
    }
    const user = syncAuthUserFromProfile(profile, role)
    return { profile, user }
  },

  async changePassword(input: ChangeProfilePasswordInput): Promise<string> {
    const body = await apiClient.patch<ApiResponse<{ message?: string }>>(
      '/profile/password',
      input,
    )
    const envelope = body as ApiResponse<{ message?: string }>
    return envelope.message ?? 'Đổi mật khẩu thành công'
  },
}
