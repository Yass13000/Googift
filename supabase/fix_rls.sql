-- =========================================================================
-- SCRIPT DE RÉSOLUTION RLS (ERROR 42501 403 FORBIDDEN SUR REVIEWS_FEEDBACK)
-- À exécuter dans votre Supabase Dashboard > SQL Editor
-- =========================================================================

-- 1. S'assurer que les tables et colonnes existent
CREATE TABLE IF NOT EXISTS public.reviews_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(10) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    redirected_to_google BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.claimed_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(10) NOT NULL,
    reward_id UUID,
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

CREATE TABLE IF NOT EXISTS public.wheel_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(10) NOT NULL,
    reward_id UUID,
    reward_name TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    optin_marketing BOOLEAN DEFAULT true,
    claim_code TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Accorder les permissions SQL aux rôles anon et authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 3. Activer RLS et créer des politiques d'accès universelles
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claimed_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques pouvant bloquer
DROP POLICY IF EXISTS "Acces complet restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Acces complet rewards" ON public.rewards;
DROP POLICY IF EXISTS "Acces complet reviews_feedback" ON public.reviews_feedback;
DROP POLICY IF EXISTS "Acces complet claimed_prizes" ON public.claimed_prizes;
DROP POLICY IF EXISTS "Acces complet wheel_spins" ON public.wheel_spins;

DROP POLICY IF EXISTS "Lecture publique des restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Client peut insérer un avis" ON public.reviews_feedback;
DROP POLICY IF EXISTS "Admin gère ses avis" ON public.reviews_feedback;
DROP POLICY IF EXISTS "Client peut enregistrer un lot gagné" ON public.claimed_prizes;
DROP POLICY IF EXISTS "Lecture publique d'un lot par code" ON public.claimed_prizes;

-- Création des politiques permissives pour le fonctionnement multi-tenant
CREATE POLICY "Acces complet restaurants" ON public.restaurants FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet rewards" ON public.rewards FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet reviews_feedback" ON public.reviews_feedback FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet claimed_prizes" ON public.claimed_prizes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Acces complet wheel_spins" ON public.wheel_spins FOR ALL TO public USING (true) WITH CHECK (true);
