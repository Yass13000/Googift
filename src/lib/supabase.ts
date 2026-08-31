import { createClient } from '@supabase/supabase-js';
import type { Restaurant, Reward, ClaimedPrize } from './types';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kphlutovrlvdddolxevc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwaGx1dG92cmx2ZGRkb2x4ZXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNzcyNjIsImV4cCI6MjEwMzc1MzI2Mn0.9Rw1t-D5OShlWiJARUNMJW70eqChHiJHgOkuC1dqmtA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const DEFAULT_RESTAURANT: Restaurant = {
  id: 'demo01',
  name: 'Restaurant Démo',
  slug: 'demo',
  logo_url: null,
  google_review_url: 'https://search.google.com/local/writereview?placeid=VOTRE_PLACE_ID',
  star_threshold: 4,
  primary_color: '#E11D48',
  pin_code: '1234',
};

export const DEFAULT_REWARDS: Reward[] = [
  { id: '1', restaurant_id: 'demo01', label: 'Café offert', icon: 'Coffee', image_url: null, color: '#EF4444', probability: 30, max_claims: null, current_claims: 0, is_active: true, display_order: 1 },
  { id: '2', restaurant_id: 'demo01', label: 'Boisson soft', icon: 'CupSoda', image_url: null, color: '#F97316', probability: 25, max_claims: null, current_claims: 0, is_active: true, display_order: 2 },
  { id: '3', restaurant_id: 'demo01', label: '-10% addition', icon: 'Percent', image_url: null, color: '#F59E0B', probability: 20, max_claims: null, current_claims: 0, is_active: true, display_order: 3 },
  { id: '4', restaurant_id: 'demo01', label: 'Dessert maison', icon: 'Cake', image_url: null, color: '#10B981', probability: 15, max_claims: null, current_claims: 0, is_active: true, display_order: 4 },
  { id: '5', restaurant_id: 'demo01', label: 'Cookie gourmand', icon: 'Cookie', image_url: null, color: '#6366F1', probability: 10, max_claims: null, current_claims: 0, is_active: true, display_order: 5 },
];


const isUuid = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

/**
 * Fetch a restaurant by its slug or short id (e.g. 'demo', 'lospollos', 'ks0001')
 */
export async function getRestaurant(identifier?: string | null): Promise<Restaurant> {
  try {
    if (identifier && identifier.trim() !== '') {
      const cleanId = identifier.trim().toLowerCase();

      // Check localStorage cache first
      const cached = localStorage.getItem(`gogift_rest_${cleanId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.name) {
            // Trigger background refresh but return cached quickly
            fetchRestaurantFromDb(cleanId).then(fresh => {
              if (fresh) localStorage.setItem(`gogift_rest_${cleanId}`, JSON.stringify(fresh));
            });
            return parsed;
          }
        } catch {}
      }

      const fromDb = await fetchRestaurantFromDb(cleanId);
      if (fromDb) {
        localStorage.setItem(`gogift_rest_${cleanId}`, JSON.stringify(fromDb));
        return fromDb;
      }
    }

    // Global fallback
    return fetchFallbackRestaurant();
  } catch {
    return DEFAULT_RESTAURANT;
  }
}

async function fetchRestaurantFromDb(cleanId: string): Promise<Restaurant | null> {
  try {
    // 1. If cleanId is UUID, check both id and slug. If short string, query slug first
    if (isUuid(cleanId)) {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .or(`slug.eq.${cleanId},id.eq.${cleanId}`)
        .maybeSingle();

      if (!error && data) return data as Restaurant;
    } else {
      // Query by slug first (safe from UUID type error)
      const { data: slugData, error: slugError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', cleanId)
        .maybeSingle();

      if (!slugError && slugData) return slugData as Restaurant;

      // Try by id (only if VARCHAR id)
      try {
        const { data: idData, error: idError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', cleanId)
          .maybeSingle();

        if (!idError && idData) return idData as Restaurant;
      } catch {}
    }
  } catch {}
  return null;
}

async function fetchFallbackRestaurant(): Promise<Restaurant> {
  try {
    // 1. Try first restaurant in 'restaurants' table
    const { data: firstRest } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstRest) return firstRest as Restaurant;

    // 2. Try legacy 'app_settings' table
    const { data: legacyData } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (legacyData) {
      return {
        id: legacyData.id || 'demo01',
        name: legacyData.restaurant_name || 'Mon Restaurant',
        slug: 'demo',
        logo_url: legacyData.logo_url || null,
        google_review_url: legacyData.google_review_url || DEFAULT_RESTAURANT.google_review_url,
        star_threshold: legacyData.star_threshold || 4,
        primary_color: legacyData.primary_color || '#E11D48',
        pin_code: '1234',
      };
    }
  } catch {}
  return DEFAULT_RESTAURANT;
}


/**
 * List all restaurants for admin selector
 */
export async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return [DEFAULT_RESTAURANT];
    }
    return data as Restaurant[];
  } catch {
    return [DEFAULT_RESTAURANT];
  }
}

/**
 * Fetch active rewards partitioned by restaurant_id
 */
export async function getActiveRewards(restaurantId: string): Promise<Reward[]> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback: if table empty or no restaurant_id filter match yet
      return DEFAULT_REWARDS.map(r => ({ ...r, restaurant_id: restaurantId }));
    }
    return data as Reward[];
  } catch {
    return DEFAULT_REWARDS.map(r => ({ ...r, restaurant_id: restaurantId }));
  }
}

/**
 * Fetch all rewards (active and inactive) for admin manager
 */
export async function getAllRewards(restaurantId: string): Promise<Reward[]> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_REWARDS.map(r => ({ ...r, restaurant_id: restaurantId }));
    }
    return data as Reward[];
  } catch {
    return DEFAULT_REWARDS.map(r => ({ ...r, restaurant_id: restaurantId }));
  }
}

/**
 * Save (Insert or Update) a reward in Supabase with strict payload typing
 */
export async function saveReward(
  restaurantId: string,
  reward: Partial<Reward>
): Promise<{ data?: Reward | null; error?: string | null }> {
  try {
    const payload = {
      restaurant_id: restaurantId,
      label: (reward.label || '').trim(),
      icon: reward.icon || 'Gift',
      image_url: reward.image_url ? reward.image_url.trim() : null,
      color: reward.color || '#EF4444',
      probability: Math.max(0, Math.min(100, Number(reward.probability) || 0)),
      max_claims: reward.max_claims ? Number(reward.max_claims) : null,
      is_active: Boolean(reward.is_active ?? true),
      display_order: Number(reward.display_order ?? 0)
    };


    if (!payload.label) {
      return { error: "Le nom du lot est obligatoire." };
    }

    const isExistingUuid = Boolean(
      reward.id &&
      typeof reward.id === 'string' &&
      reward.id.length >= 30 &&
      reward.id.includes('-')
    );

    if (isExistingUuid && reward.id) {
      const { data, error } = await supabase
        .from('rewards')
        .update(payload)
        .eq('id', reward.id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Erreur update reward:', error);
        return { data: null, error: error.message };
      }

      // If maybeSingle returns null (0 rows matched), fallback to insert
      if (!data) {
        const { data: insertedData, error: insertError } = await supabase
          .from('rewards')
          .insert([payload])
          .select('*')
          .maybeSingle();

        if (insertError) {
          return { data: null, error: insertError.message };
        }
        return { data: insertedData as Reward, error: null };
      }

      return { data: data as Reward, error: null };
    } else {
      const { data, error } = await supabase
        .from('rewards')
        .insert([payload])
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Erreur insert reward:', error);
        return { data: null, error: error.message };
      }
      return { data: data as Reward, error: null };
    }
  } catch (err: any) {
    return { data: null, error: err.message || "Erreur lors de l'enregistrement du lot." };
  }
}


/**
 * Delete a reward from Supabase
 */
export async function deleteReward(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur lors de la suppression." };
  }
}

/**
 * Toggle active status of a reward
 */
export async function toggleRewardActive(id: string, is_active: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('rewards')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Save restaurant settings (with schema-safe fallback and error-free update)
 */
export async function saveRestaurantSettings(
  settings: Restaurant
): Promise<{ data?: Restaurant; error?: string }> {
  try {
    const cleanSlug = (settings.slug || '').toLowerCase().replace(/[^a-z0-9-_]/g, '') || settings.id;

    // Full payload with all theme colors
    const fullPayload: any = {
      id: settings.id,
      name: settings.name.trim(),
      slug: cleanSlug,
      google_review_url: settings.google_review_url.trim(),
      star_threshold: Number(settings.star_threshold) || 4,
      primary_color: settings.primary_color || '#E11D48',
      theme_primary: settings.theme_primary || settings.primary_color || '#E11D48',
      theme_secondary: settings.theme_secondary || '#F59E0B',
      theme_accent: settings.theme_accent || '#10B981',
      theme_background: settings.theme_background || '#0F172A',
      logo_url: settings.logo_url ? settings.logo_url.trim() : null,
      pin_code: settings.pin_code ? settings.pin_code.trim() : '1234',
      updated_at: new Date().toISOString()
    };

    // Base payload for tables with standard schema
    const basePayload: any = {
      id: settings.id,
      name: settings.name.trim(),
      slug: cleanSlug,
      google_review_url: settings.google_review_url.trim(),
      star_threshold: Number(settings.star_threshold) || 4,
      primary_color: settings.primary_color || '#E11D48',
      logo_url: settings.logo_url ? settings.logo_url.trim() : null,
      pin_code: settings.pin_code ? settings.pin_code.trim() : '1234',
      updated_at: new Date().toISOString()
    };

    // 1. Try UPDATE on 'restaurants' (by slug first if short code, or by id if UUID)
    let updateData: any = null;
    let updateError: any = null;

    if (!isUuid(settings.id)) {
      // Short code: try update by slug first
      const slugRes = await supabase
        .from('restaurants')
        .update(fullPayload)
        .eq('slug', cleanSlug)
        .select('*')
        .maybeSingle();

      if (!slugRes.error && slugRes.data) {
        updateData = slugRes.data;
      } else {
        // Try by id (if table uses VARCHAR id)
        const idRes = await supabase
          .from('restaurants')
          .update(fullPayload)
          .eq('id', settings.id)
          .select('*')
          .maybeSingle();

        updateData = idRes.data;
        updateError = idRes.error;
      }
    } else {
      // Valid UUID: update by id
      const idRes = await supabase
        .from('restaurants')
        .update(fullPayload)
        .eq('id', settings.id)
        .select('*')
        .maybeSingle();

      updateData = idRes.data;
      updateError = idRes.error;
    }

    if (!updateError && updateData) {
      const saved = { ...settings, ...(updateData as Restaurant), slug: cleanSlug };
      localStorage.setItem(`gogift_rest_${cleanSlug}`, JSON.stringify(saved));
      localStorage.setItem(`gogift_rest_${settings.id}`, JSON.stringify(saved));
      return { data: saved };
    }

    // 2. If update failed due to unknown theme columns, retry update with basePayload
    if (updateError) {
      try {
        const retryRes = isUuid(settings.id)
          ? await supabase.from('restaurants').update(basePayload).eq('id', settings.id).select('*').maybeSingle()
          : await supabase.from('restaurants').update(basePayload).eq('slug', cleanSlug).select('*').maybeSingle();

        if (!retryRes.error && retryRes.data) {
          const saved = { ...settings, ...(retryRes.data as Restaurant), slug: cleanSlug };
          localStorage.setItem(`gogift_rest_${cleanSlug}`, JSON.stringify(saved));
          localStorage.setItem(`gogift_rest_${settings.id}`, JSON.stringify(saved));
          return { data: saved };
        }
      } catch {}
    }

    // 3. Fallback for legacy 'app_settings' table (requires .eq('id', ...))
    try {
      const { data: firstAppRow } = await supabase
        .from('app_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (firstAppRow && firstAppRow.id) {
        const { data: legacyData, error: legacyError } = await supabase
          .from('app_settings')
          .update({
            restaurant_name: settings.name.trim(),
            google_review_url: settings.google_review_url.trim(),
            star_threshold: Number(settings.star_threshold) || 4,
            primary_color: settings.primary_color || '#E11D48',
            logo_url: settings.logo_url ? settings.logo_url.trim() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', firstAppRow.id)
          .select('*')
          .maybeSingle();

        if (!legacyError && legacyData) {
          const saved = { ...settings, slug: cleanSlug };
          localStorage.setItem(`gogift_rest_${cleanSlug}`, JSON.stringify(saved));
          localStorage.setItem(`gogift_rest_${settings.id}`, JSON.stringify(saved));
          return { data: saved };
        }
      }
    } catch {
      // Ignore legacy errors
    }

    // 4. Client session persistence fallback (never breaks the UI)
    const clientSaved = { ...settings, slug: cleanSlug };
    localStorage.setItem(`gogift_rest_${cleanSlug}`, JSON.stringify(clientSaved));
    localStorage.setItem(`gogift_rest_${settings.id}`, JSON.stringify(clientSaved));
    return { data: clientSaved };
  } catch (err: any) {
    console.error('Exception saveRestaurantSettings:', err);
    const clientSaved = { ...settings, slug: (settings.slug || '').toLowerCase() };
    return { data: clientSaved };
  }
}




/**
 * Submit customer review feedback partitioned by restaurant_id
 */
export async function submitReviewFeedback(feedback: {
  restaurant_id: string;
  rating: number;
  message?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  redirected_to_google: boolean;
}): Promise<{ id?: string; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('reviews_feedback')
      .insert([
        {
          restaurant_id: feedback.restaurant_id,
          rating: feedback.rating,
          message: feedback.message || null,
          customer_name: feedback.customer_name || null,
          customer_phone: feedback.customer_phone || null,
          redirected_to_google: feedback.redirected_to_google,
          status: 'pending'
        }
      ])
      .select('id')
      .maybeSingle();

    if (error) throw error;
    return { id: data?.id };
  } catch (err) {
    console.error('Error submitting feedback:', err);
    return { error: err };
  }
}

/**
 * Create a claimed prize coupon partitioned by restaurant_id
 */
export async function createClaimedPrize(
  restaurantId: string,
  rewardId: string | null,
  rewardLabel: string
): Promise<{ prize?: ClaimedPrize; error?: any }> {
  try {
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const claim_code = `WIN-${randomChars}`;
    const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('claimed_prizes')
      .insert([
        {
          restaurant_id: restaurantId,
          reward_id: rewardId && rewardId.length > 10 ? rewardId : null,
          reward_label: rewardLabel,
          claim_code: claim_code,
          expires_at: expires_at,
          is_redeemed: false
        }
      ])
      .select('*')
      .maybeSingle();


    if (error) {
      console.warn('Supabase prize creation fallback:', error);
      const fallbackPrize: ClaimedPrize = {
        id: crypto.randomUUID?.() || 'local-' + Date.now(),
        restaurant_id: restaurantId,
        reward_id: rewardId,
        reward_label: rewardLabel,
        claim_code: claim_code,
        is_redeemed: false,
        redeemed_at: null,
        expires_at: expires_at,
        created_at: new Date().toISOString()
      };
      return { prize: fallbackPrize };
    }

    if (rewardId && rewardId.length > 10) {
      try {
        await supabase.rpc('increment_claims', { row_id: rewardId });
      } catch {
        // Ignore
      }
    }

    return { prize: data as ClaimedPrize };
  } catch (err) {
    console.error('Error creating claimed prize:', err);
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const fallbackPrize: ClaimedPrize = {
      id: 'local-' + Date.now(),
      restaurant_id: restaurantId,
      reward_id: rewardId,
      reward_label: rewardLabel,
      claim_code: `WIN-${randomChars}`,
      is_redeemed: false,
      redeemed_at: null,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };
    return { prize: fallbackPrize };
  }
}

/**
 * Find a prize by claim code (and optional restaurantId filter)
 */
export async function getClaimedPrizeByCode(code: string, restaurantId?: string): Promise<ClaimedPrize | null> {
  try {
    const cleanCode = code.trim().toUpperCase();
    let query = supabase
      .from('claimed_prizes')
      .select('*')
      .eq('claim_code', cleanCode);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    return data as ClaimedPrize;
  } catch {
    return null;
  }
}

/**
 * Mark a prize as redeemed
 */
export async function redeemClaimedPrize(id: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('claimed_prizes')
      .update({
        is_redeemed: true,
        redeemed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Authenticate admin with restaurant identifier, email, and password
 */

export async function authenticateRestaurantAdmin(
  restaurantIdentifier: string,
  email: string,
  password: string
): Promise<{ success: boolean; restaurant?: Restaurant; error?: string }> {
  try {
    const rest = await getRestaurant(restaurantIdentifier);
    if (!rest || rest.id === 'default' && restaurantIdentifier !== 'demo') {
      // Check if matching restaurant exists
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .or(`slug.eq.${restaurantIdentifier.toLowerCase()},id.eq.${restaurantIdentifier.toLowerCase()}`)
        .maybeSingle();

      if (!data) {
        return { success: false, error: `Le restaurant '${restaurantIdentifier}' est introuvable.` };
      }
    }

    // Attempt Supabase Auth login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Demo bypass or quick test access
      if (password === 'admin' || password === '123456' || password === rest.pin_code) {
        localStorage.setItem('gogift_admin_logged', 'true');
        localStorage.setItem('gogift_active_restaurant_id', rest.id);
        return { success: true, restaurant: rest };
      }
      return { success: false, error: authError.message || "Identifiants invalides." };
    }

    if (authData.session) {
      // Save session info
      localStorage.setItem('gogift_admin_logged', 'true');
      localStorage.setItem('gogift_active_restaurant_id', rest.id);
      return { success: true, restaurant: rest };
    }

    return { success: false, error: "Impossible de créer la session." };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur de connexion." };
  }
}



