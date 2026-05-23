/** User + customer role from GET /users/profile. */
export interface CustomerProfile {
  _id?: string
  id?: string
  /** User document id (JWT subject). */
  user_id?: string
  /** Customer role document id — use for vehicles/bookings APIs. */
  customer_id?: string
  email: string
  full_name: string
  phone?: string | null
  avatar_url?: string | null
  registration_channel?: 'app' | 'google' | 'admin'
  has_online_access?: boolean
  membership_points?: number
  reward_points?: number
  is_active?: boolean
  is_email_verified?: boolean
  is_phone_verified?: boolean
  last_login_at?: string | null
  referral_code?: string
  tier_id?: string | null
  created_at?: string
  updated_at?: string
}

/** Body for PUT /users/profile — mirrors backend updateProfileCustomerSchema. */
export interface UpdateProfileInput {
  full_name?: string
  phone?: string
  avatar_url?: string | null
  has_online_access?: boolean
}

/** Body for PATCH /users/profile/password — mirrors backend changePasswordSchema. */
export interface ChangeProfilePasswordInput {
  old_password: string
  new_password: string
}
