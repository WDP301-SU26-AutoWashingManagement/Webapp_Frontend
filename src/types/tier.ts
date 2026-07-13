export type TierClass = 'member' | 'silver' | 'gold' | 'platinum';

export interface Tier {
  _id?: string;
  id?: string;
  tier_name: TierClass;
  min_membership_points: number;
  max_membership_points?: number;
  booking_window_days: number;
  discount_percentage: number;
  free_features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTierInput {
  tier_name: TierClass;
  min_membership_points: number;
  max_membership_points?: number;
  booking_window_days: number;
  discount_percentage: number;
  free_features?: string[];
}

export type UpdateTierInput = Partial<CreateTierInput>;
