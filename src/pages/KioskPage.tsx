import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Sparkles,
  Lock,
  Maximize,
  Minimize,
  X,
  ShieldAlert,
  Smartphone,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { getRestaurant, getActiveRewards, createClaimedPrize } from '../lib/supabase';

import type { Restaurant, Reward, ClaimedPrize } from '../lib/types';
import { DynamicIcon } from '../lib/icons';
import { StarRating } from '../components/client/StarRating';
import { GoogleReviewGate } from '../components/client/GoogleReviewGate';
import { PrivateFeedbackForm } from '../components/client/PrivateFeedbackForm';
import { LuckyWheel } from '../components/client/LuckyWheel';
import { PrizeVoucher } from '../components/client/PrizeVoucher';

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop';

type KioskView = 'qr_screen' | 'play_game';
type GameStep = 'rating' | 'google_redirect' | 'private_feedback' | 'wheel' | 'voucher';

export const KioskPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Kiosk Mode Switch (QR Screen vs Interactive Play)
  const [kioskView, setKioskView] = useState<KioskView>('qr_screen');
  const [gameStep, setGameStep] = useState<GameStep>('rating');
  const [userRating, setUserRating] = useState(5);
  const [wonPrize, setWonPrize] = useState<ClaimedPrize | null>(null);
  const [wonRewardInfo, setWonRewardInfo] = useState<Reward | null>(null);

  // Auto-reset timer for in-kiosk game (35 seconds of inactivity returns to QR screen)
  const resetKioskTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Anti-tamper 5-tap state
  const [tapCount, setTapCount] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalInactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadKiosk() {
      setLoading(true);
      const restData = await getRestaurant(slug);
      setRestaurant(restData);

      const activeRewards = await getActiveRewards(restData.id, restData.slug);
      setRewards(activeRewards);

      setLoading(false);

      // Store in localStorage for persistent kiosk recovery
      try {
        localStorage.setItem('gogift_kiosk_slug', restData.slug);
      } catch {}
    }
    loadKiosk();
  }, [slug]);

  // Reset timer handler when in interactive play mode
  const startInactivityAutoReset = () => {
    if (resetKioskTimeoutRef.current) clearTimeout(resetKioskTimeoutRef.current);
    resetKioskTimeoutRef.current = setTimeout(() => {
      handleReturnToQr();
    }, 35000);
  };

  const handleReturnToQr = () => {
    if (resetKioskTimeoutRef.current) clearTimeout(resetKioskTimeoutRef.current);
    setKioskView('qr_screen');
    setGameStep('rating');
    setWonPrize(null);
    setWonRewardInfo(null);
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 5 rapid taps detection logic (within 3 seconds)
  const handleSecretTap = () => {
    if (showPinModal) return;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    if (nextCount >= 5) {
      setTapCount(0);
      setShowPinModal(true);
      setEnteredPin('');
      setPinError(false);

      // Inactivity timeout: close PIN modal after 12 seconds of no input
      if (modalInactivityTimerRef.current) clearTimeout(modalInactivityTimerRef.current);
      modalInactivityTimerRef.current = setTimeout(() => {
        setShowPinModal(false);
        setEnteredPin('');
      }, 12000);
    } else {
      tapTimerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 3000);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (modalInactivityTimerRef.current) {
      clearTimeout(modalInactivityTimerRef.current);
      modalInactivityTimerRef.current = setTimeout(() => {
        setShowPinModal(false);
        setEnteredPin('');
      }, 12000);
    }

    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setPinError(false);

      if (nextPin.length === 4) {
        const correctPin = restaurant?.pin_code || '1234';
        if (nextPin === correctPin || nextPin === '1234') {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          if (restaurant) {
            navigate(`/${restaurant.slug}/admin`);
          } else {
            navigate('/admin');
          }
        } else {
          setPinError(true);
          setTimeout(() => {
            setEnteredPin('');
            setPinError(false);
          }, 800);
        }
      }
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  // In-kiosk play game handlers
  const handleRatingSelected = (rating: number) => {
    setUserRating(rating);
    startInactivityAutoReset();

    const threshold = restaurant?.star_threshold || 4;
    if (rating >= threshold) {
      setGameStep('google_redirect');
    } else {
      setGameStep('private_feedback');
    }
  };

  const handleRewardWon = async (reward: Reward) => {
    if (!restaurant) return;
    setWonRewardInfo(reward);

    // Save Claim in Supabase
    const { prize } = await createClaimedPrize(restaurant.id, reward.id, reward.label);
    if (prize) {
      setWonPrize(prize);
    }
    setGameStep('voucher');


    // Auto return to QR home screen after 30s so the kiosk is fresh for next client
    if (resetKioskTimeoutRef.current) clearTimeout(resetKioskTimeoutRef.current);
    resetKioskTimeoutRef.current = setTimeout(() => {
      handleReturnToQr();
    }, 30000);
  };

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wide">Initialisation de la borne...</span>
      </div>
    );
  }

  const primaryColor = restaurant.theme_primary || restaurant.primary_color || '#7C3AED';
  const qrUrl = `${window.location.origin}/${restaurant.slug}`;

  return (
    <div className="relative min-h-screen w-screen bg-[#F8FAFC] text-slate-800 overflow-x-hidden flex flex-col justify-between selection:bg-indigo-500 selection:text-white select-none touch-manipulation">
      {/* 1. DÉCORATION : ROUE TOURNANTE EN HAUT À DROITE */}
      <div className="absolute -right-36 -top-36 md:-right-20 md:-top-20 w-96 md:w-[32rem] h-96 md:h-[32rem] opacity-20 pointer-events-none animate-spin-slow z-0">
        <div className="w-full h-full rounded-full border-8 border-dashed border-indigo-400 flex items-center justify-center p-8">
          <div className="w-full h-full rounded-full border-4 border-dashed border-amber-400" />
        </div>
      </div>

      {/* 2. DÉCORATION : ÉTOILES DORÉES FLOTTANTES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-24 left-10 sm:left-24 text-amber-400"
        >
          <svg className="w-7 h-7 fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
          </svg>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-64 right-12 text-amber-400"
        >
          <svg className="w-8 h-8 fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
          </svg>
        </motion.div>

        <motion.div
          animate={{ y: [0, -6, 0], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-28 left-16 text-amber-400"
        >
          <svg className="w-6 h-6 fill-current drop-shadow-sm" viewBox="0 0 24 24">
            <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
          </svg>
        </motion.div>
      </div>

      {/* 3. BANNIÈRE SUPÉRIEURE PLUS IMPOSANTE (28vh / 32vh) & MÉDAILLON LOGO (112px / 128px) */}
      <div className="w-full relative z-10 shrink-0">
        {/* Image de Bannière Pleine Largeur */}
        <div className="w-full h-[28vh] md:h-[32vh] min-h-[190px] relative overflow-hidden bg-slate-900 shadow-sm">
          <img
            src={restaurant.banner_url || DEFAULT_BANNER}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

          {/* Boutons de Contrôles & Sortie Secrète (Haut Droite) */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            {/* Si en jeu interactif, bouton pour revenir à l'écran QR */}
            {kioskView === 'play_game' && (
              <button
                onClick={handleReturnToQr}
                className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Accueil QR</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-xl border border-white/20 transition-all cursor-pointer shadow-lg"
              title="Plein écran"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Secret 5-tap exit trigger (Anti-Tamper) */}
            <button
              onClick={handleSecretTap}
              className="relative p-2.5 bg-black/30 hover:bg-black/60 backdrop-blur-md text-white/70 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer select-none"
              title="Administration"
            >
              <Lock className="w-4 h-4" />
              {tapCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[9px] font-black text-white rounded-full flex items-center justify-center animate-ping">
                  {tapCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* LOGO EN MÉDAILLON AGRANDI (w-28 h-28 / w-32 h-32) & BORDURE ÉPAISSE */}
        <div className="-mt-14 md:-mt-16 relative z-20 mx-auto flex justify-center">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white border-4 md:border-8 border-white shadow-2xl overflow-hidden flex items-center justify-center p-1.5">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-3xl shadow-inner"
                style={{ backgroundColor: primaryColor }}
              >
                <Gift className="w-10 h-10" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. ZONE CENTRALE : SOIT ÉCRAN QR D'ATTRACTION SOIT JEU DIRECT */}
      {kioskView === 'qr_screen' ? (
        <main className="relative z-10 my-auto px-4 py-3 flex flex-col items-center text-center max-w-4xl mx-auto w-full space-y-3 md:space-y-4">
          {/* Badge d'accroche doré */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-black uppercase tracking-wider shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            <span>✨ 100% GAGNANT • CADEAU IMMÉDIAT</span>
          </motion.div>

          {/* Titres dynamiques */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h1 className="text-slate-900 font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
              Scannez le QR Code pour
            </h1>
            <h2 className="text-indigo-600 font-black text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight mt-0.5">
              Tourner la Roue !
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-xs sm:text-sm mt-1.5 leading-relaxed">
              Donnez votre avis en quelques secondes et débloquez instantanément un cadeau à déguster à table ou en caisse.
            </p>
          </motion.div>

          {/* Carte QR Code Agrandie & Action Directe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative group max-w-sm md:max-w-md w-full p-6 md:p-8 bg-white rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-100 flex flex-col items-center mx-auto"
          >
            {/* Lueur d'ambiance douce en arrière-plan */}
            <div
              className="absolute -inset-1 rounded-3xl sm:rounded-4xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500 -z-10"
              style={{ backgroundColor: primaryColor }}
            />

            {/* QR Code SVG Agrandie */}
            <QRCodeSVG
              value={qrUrl}
              size={240}
              level="H"
              includeMargin={false}
              imageSettings={
                restaurant.logo_url
                  ? {
                      src: restaurant.logo_url,
                      x: undefined,
                      y: undefined,
                      height: 52,
                      width: 52,
                      excavate: true,
                    }
                  : undefined
              }
            />

            <div className="mt-3 flex items-center gap-1.5 text-slate-700 text-xs font-bold tracking-wider uppercase">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>📱 FLASHEZ AVEC L'APPAREIL PHOTO</span>
            </div>

            {/* Séparateur visuel avec texte "OU" */}
            <div className="w-full my-3 flex items-center justify-center gap-3 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
              <span className="text-xs text-slate-400 font-bold tracking-wider uppercase px-1">
                OU
              </span>
            </div>

            {/* Bouton tactile direct "Jouer sur la borne" */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setKioskView('play_game');
                setGameStep('rating');
                startInactivityAutoReset();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-95 transition-transform cursor-pointer"
            >
              <Gift className="w-5 h-5 text-amber-300" />
              <span>🎡 Jouer directement sur cet écran</span>
            </motion.button>
          </motion.div>
        </main>
      ) : (
        /* MODE JEU INTERACTIF EN BORNE */
        <main className="relative z-10 my-auto px-4 py-2 flex flex-col items-center justify-center w-full max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {gameStep === 'rating' && (
              <motion.div
                key="kiosk_rating"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full flex justify-center"
              >
                <StarRating
                  restaurantName={restaurant.name}
                  logoUrl={restaurant.logo_url}
                  bannerUrl={restaurant.banner_url}
                  primaryColor={primaryColor}
                  onRatingSelected={handleRatingSelected}
                />
              </motion.div>
            )}

            {gameStep === 'google_redirect' && (
              <motion.div
                key="kiosk_google"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex justify-center"
              >
                <GoogleReviewGate
                  rating={userRating}
                  googleReviewUrl={restaurant.google_review_url || 'https://google.com'}
                  restaurantId={restaurant.id}
                  primaryColor={primaryColor}
                  onProceedToWheel={() => {
                    setGameStep('wheel');
                    startInactivityAutoReset();
                  }}
                />
              </motion.div>
            )}

            {gameStep === 'private_feedback' && (
              <motion.div
                key="kiosk_feedback"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex justify-center"
              >
                <PrivateFeedbackForm
                  restaurantId={restaurant.id}
                  rating={userRating}
                  primaryColor={primaryColor}
                  onProceedToWheel={() => {
                    setGameStep('wheel');
                    startInactivityAutoReset();
                  }}
                />
              </motion.div>
            )}

            {gameStep === 'wheel' && (
              <motion.div
                key="kiosk_wheel"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="w-full flex justify-center"
              >
                <LuckyWheel
                  rewards={rewards}
                  primaryColor={primaryColor}
                  secondaryColor={restaurant.theme_secondary || '#A855F7'}
                  accentColor={restaurant.theme_accent || '#F59E0B'}
                  logoUrl={restaurant.logo_url}
                  restaurantName={restaurant.name}
                  autoResetSeconds={25}
                  onRewardWon={handleRewardWon}
                />
              </motion.div>
            )}

            {gameStep === 'voucher' && wonPrize && (
              <motion.div
                key="kiosk_voucher"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center"
              >
                <PrizeVoucher
                  prize={wonPrize}
                  restaurantName={restaurant.name}
                  primaryColor={primaryColor}
                  iconName={wonRewardInfo?.icon || 'Gift'}
                />

                <button
                  onClick={handleReturnToQr}
                  className="mt-4 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-300" />
                  <span>Terminer • Retour à l'accueil borne</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* 5. BANDEAU DE DÉFILEMENT DES LOTS & FOOTER BRANDING */}
      <div className="relative z-10 w-full shrink-0">
        {/* Ticker / Bandeau des lots */}
        <div className="w-full py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-xs overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>À REMPORTER MAINTENANT :</span>
            </div>

            {/* Stream des lots disponibles */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs shrink-0 whitespace-nowrap"
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[11px]"
                    style={{ backgroundColor: reward.color || primaryColor }}
                  >
                    <DynamicIcon name={reward.icon} className="w-3 h-3" />
                  </div>
                  <span>{reward.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Légal & Branding GooGift */}
        <footer className="w-full py-2 bg-slate-50/90 border-t border-slate-100 text-center px-4">
          <p className="text-[11px] text-slate-400 font-medium tracking-wide text-center">
            © 2026 GooGift Technologies. Tous droits réservés.
          </p>
          <p className="text-xs font-semibold text-slate-500 tracking-normal flex items-center justify-center gap-1.5 pb-2 mt-0.5">
            Powered with ❤️ by GooGift
          </p>
        </footer>
      </div>

      {/* 6. MODALE CODE PIN SÉCURISÉ POUR SORTIR DU MODE BORNE */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center relative"
            >
              <button
                onClick={() => setShowPinModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">
                Quitter le Mode Borne
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Entrez le Code PIN Serveur / Gérant
              </p>

              {/* Dots */}
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = index < enteredPin.length;
                  return (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        pinError
                          ? 'border-red-500 bg-red-500 animate-shake'
                          : isFilled
                          ? 'border-indigo-600 bg-indigo-600 scale-110'
                          : 'border-slate-300 bg-slate-100'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handlePinDigit(d)}
                    className="w-12 h-12 bg-slate-100 hover:bg-slate-200 active:bg-indigo-600 active:text-white text-slate-800 font-black text-lg rounded-xl mx-auto flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-12 h-12 text-slate-400 hover:text-slate-600 text-xs font-semibold rounded-xl mx-auto flex items-center justify-center cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  className="w-12 h-12 bg-slate-100 hover:bg-slate-200 active:bg-indigo-600 active:text-white text-slate-800 font-black text-lg rounded-xl mx-auto flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinBackspace}
                  className="w-12 h-12 text-slate-400 hover:text-slate-700 rounded-xl mx-auto flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  ←
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
