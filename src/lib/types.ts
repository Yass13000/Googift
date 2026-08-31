export interface Restaurant {
  id: string; // Ex: 'a8f2k9'
  name: string;
  slug: string; // Ex: 'lospollos'
  logo_url: string | null;
  banner_url?: string | null;
  google_review_url: string;
  star_threshold: number; // 4 ou 5
  primary_color: string;
  theme_primary?: string;
  theme_secondary?: string;
  theme_accent?: string;
  theme_background?: string;
  pin_code: string;
  created_at?: string;
  updated_at?: string;
}


export interface RestaurantUser {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
  created_at?: string;
}


export interface Reward {
  id: string;
  restaurant_id: string;
  label: string;
  icon: string; // Nom de l'icône Lucide
  image_url?: string | null; // URL de l'image PNG détourée (optionnelle)
  color: string; // Hex color code
  probability: number; // 0 - 100
  max_claims: number | null; // null pour illimité
  current_claims: number;
  is_active: boolean;
  display_order: number;
  created_at?: string;
}


export interface ReviewFeedback {
  id: string;
  restaurant_id: string;
  rating: number; // 1 à 5
  message: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  redirected_to_google: boolean;
  status: 'pending' | 'treated' | 'archived';
  created_at: string;
}

export interface ClaimedPrize {
  id: string;
  restaurant_id: string;
  reward_id: string | null;
  reward_label: string;
  claim_code: string;
  is_redeemed: boolean;
  redeemed_at: string | null;
  expires_at: string;
  created_at: string;
}

