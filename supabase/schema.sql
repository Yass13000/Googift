-- =========================================================================
-- ARCHITECTURE MULTI-TENANT GOGIFT (CORRECTION RLS & SCHÉMA)
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE DES ÉTABLISSEMENTS / RESTAURANTS (TENANTS)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id VARCHAR(6) PRIMARY KEY, -- Ex: 'a8f2k9', 'demo01'
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- Ex: 'lospollos', 'demo'
    logo_url TEXT,
    banner_url TEXT,
    google_review_url TEXT NOT NULL DEFAULT 'https://search.google.com/local/writereview?placeid=VOTRE_PLACE_ID',
    star_threshold INT NOT NULL DEFAULT 4, -- 4 ou 5
    primary_color TEXT NOT NULL DEFAULT '#E11D48',
    theme_primary TEXT DEFAULT '#E11D48',
    theme_secondary TEXT DEFAULT '#F59E0B',
    theme_accent TEXT DEFAULT '#10B981',
    theme_background TEXT DEFAULT '#0F172A',
    pin_code VARCHAR(10) NOT NULL DEFAULT '1234',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assurer la présence des colonnes si la table existait déjà
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS theme_primary TEXT DEFAULT '#E11D48';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS theme_secondary TEXT DEFAULT '#F59E0B';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS theme_accent TEXT DEFAULT '#10B981';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS theme_background TEXT DEFAULT '#0F172A';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10) DEFAULT '1234';


-- 3. TABLE DES LOTS DE LA ROUE (CLOISONNÉ PAR RESTAURANT)
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id VARCHAR(6) NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    icon TEXT DEFAULT 'Gift',
    image_url TEXT, -- Image PNG détourée du lot
    color TEXT NOT NULL DEFAULT '#F59E0B',
    probability NUMERIC NOT NULL DEFAULT 20,
    max_claims INT DEFAULT NULL,
    current_claims INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assurer la présence de la colonne image_url si la table existait déjà
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS image_url TEXT;


-- 4. TABLE DES AVIS & FEEDBACKS CLIENTS (CLOISONNÉ PAR RESTAURANT)
CREATE TABLE IF NOT EXISTS public.reviews_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id VARCHAR(6) NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    redirected_to_google BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'treated', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLE DES GAINS DÉLIVRÉS (CLOISONNÉ PAR RESTAURANT)
CREATE TABLE IF NOT EXISTS public.claimed_prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id VARCHAR(6) NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
    reward_label TEXT NOT NULL,
    claim_code TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    optin_marketing BOOLEAN DEFAULT true,
    is_redeemed BOOLEAN DEFAULT false,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assurer la présence des colonnes de leads si la table existait déjà
ALTER TABLE public.claimed_prizes ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.claimed_prizes ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.claimed_prizes ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.claimed_prizes ADD COLUMN IF NOT EXISTS optin_marketing BOOLEAN DEFAULT true;

-- 5.1 TABLE COMPLÈTE DES SESSIONS DE JEU / SPINS (LEADS MARKETING)
CREATE TABLE IF NOT EXISTS public.wheel_spins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id VARCHAR(6) NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
    reward_name TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    optin_marketing BOOLEAN DEFAULT true,
    claim_code TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEX POUR LES PERFORMANCES MULTI-TENANT
CREATE INDEX IF NOT EXISTS idx_rewards_restaurant_id ON public.rewards(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON public.reviews_feedback(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_claimed_prizes_restaurant_id ON public.claimed_prizes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_restaurant_id ON public.wheel_spins(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);

ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces complet wheel_spins" ON public.wheel_spins;
CREATE POLICY "Acces complet wheel_spins" ON public.wheel_spins FOR ALL USING (true) WITH CHECK (true);


-- 6. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS OUVERTES & ROBUSTES)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claimed_prizes ENABLE ROW LEVEL SECURITY;

-- Nettoyage des anciennes politiques
DROP POLICY IF EXISTS "Lecture publique des restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admin gère son restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Acces complet restaurants" ON public.restaurants;
CREATE POLICY "Acces complet restaurants" ON public.restaurants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lecture publique des lots actifs" ON public.rewards;
DROP POLICY IF EXISTS "Admin gère ses lots" ON public.rewards;
DROP POLICY IF EXISTS "Acces complet rewards" ON public.rewards;
CREATE POLICY "Acces complet rewards" ON public.rewards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Client peut insérer un avis" ON public.reviews_feedback;
DROP POLICY IF EXISTS "Admin gère ses avis" ON public.reviews_feedback;
DROP POLICY IF EXISTS "Acces complet reviews_feedback" ON public.reviews_feedback;
CREATE POLICY "Acces complet reviews_feedback" ON public.reviews_feedback FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Client peut enregistrer un lot gagné" ON public.claimed_prizes;
DROP POLICY IF EXISTS "Lecture publique d'un lot par code" ON public.claimed_prizes;
DROP POLICY IF EXISTS "Admin gère et valide ses lots" ON public.claimed_prizes;
DROP POLICY IF EXISTS "Acces complet claimed_prizes" ON public.claimed_prizes;
CREATE POLICY "Acces complet claimed_prizes" ON public.claimed_prizes FOR ALL USING (true) WITH CHECK (true);

-- 7. RESTAURANT INITIAL PAR DÉFAUT (TENANT DÉMO)
INSERT INTO public.restaurants (id, name, slug, google_review_url, star_threshold, primary_color, pin_code)
VALUES ('demo01', 'Restaurant Démo', 'demo', 'https://search.google.com/local/writereview?placeid=VOTRE_PLACE_ID', 4, '#E11D48', '1234')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO public.rewards (restaurant_id, label, icon, color, probability, display_order) VALUES
('demo01', 'Café offert', 'Coffee', '#EF4444', 30, 1),
('demo01', 'Boisson soft', 'CupSoda', '#F97316', 25, 2),
('demo01', '-10% addition', 'Percent', '#F59E0B', 20, 3),
('demo01', 'Dessert maison', 'Cake', '#10B981', 15, 4),
('demo01', 'Cookie gourmand', 'Cookie', '#6366F1', 10, 5)
ON CONFLICT DO NOTHING;

-- 8. CONFIGURATION DU BUCKET SUPABASE STORAGE ('restaurant-assets')
-- Créer le bucket public s'il n'existe pas encore
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-assets',
  'restaurant-assets',
  true,
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];

-- Politiques RLS pour Storage (Lecture publique & Upload libre pour gérants)
DROP POLICY IF EXISTS "Public Access restaurant-assets" ON storage.objects;
CREATE POLICY "Public Access restaurant-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'restaurant-assets');

DROP POLICY IF EXISTS "Allow Upload restaurant-assets" ON storage.objects;
CREATE POLICY "Allow Upload restaurant-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'restaurant-assets');

DROP POLICY IF EXISTS "Allow Update restaurant-assets" ON storage.objects;
CREATE POLICY "Allow Update restaurant-assets" ON storage.objects
FOR UPDATE USING (bucket_id = 'restaurant-assets');

DROP POLICY IF EXISTS "Allow Delete restaurant-assets" ON storage.objects;
CREATE POLICY "Allow Delete restaurant-assets" ON storage.objects
FOR DELETE USING (bucket_id = 'restaurant-assets');



