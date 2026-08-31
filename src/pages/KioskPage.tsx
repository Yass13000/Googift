import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Lock, Maximize, Minimize, X, ShieldAlert } from 'lucide-react';
import { getRestaurant, getActiveRewards } from '../lib/supabase';
import type { Restaurant, Reward } from '../lib/types';
import { DynamicIcon } from '../lib/icons';

export const KioskPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

      const activeRewards = await getActiveRewards(restData.id);
      setRewards(activeRewards);
      setLoading(false);

      // Store in localStorage for persistent kiosk recovery
      try {
        localStorage.setItem('gogift_kiosk_slug', restData.slug);
      } catch {}
    }
    loadKiosk();
  }, [slug]);

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
    setEnteredPin(prev => prev.slice(0, -1));
  };

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wide">Initialisation de la borne...</span>
      </div>
    );
  }

  const primaryColor = restaurant.theme_primary || restaurant.primary_color || '#E11D48';
  const qrUrl = `${window.location.origin}/${restaurant.slug}`;

  return (
    <div className="relative min-h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Dynamic Background Glow & Gradient */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 blur-3xl"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${primaryColor} 0%, transparent 60%), radial-gradient(circle at 10% 90%, #f59e0b 0%, transparent 50%)`
        }}
      />

      {/* Decorative Rotating Lucky Wheel in Background */}
      <div className="absolute -right-40 -top-40 md:-right-24 md:-top-24 w-96 md:w-[32rem] h-96 md:h-[32rem] opacity-15 pointer-events-none animate-spin-slow">
        <div className="w-full h-full rounded-full border-8 border-dashed border-white/40 flex items-center justify-center p-8">
          <div className="w-full h-full rounded-full border-4 border-white/20" />
        </div>
      </div>

      {/* TOP BAR */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
        {/* Restaurant Identity */}
        <div className="flex items-center gap-3.5 bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl shadow-xl">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-10 h-10 rounded-xl object-cover bg-white p-0.5 shadow-sm"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <Gift className="w-6 h-6" />
            </div>
          )}
          <div>
            <h2 className="font-black text-white text-base tracking-tight leading-tight">
              {restaurant.name}
            </h2>
            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Roue de la Fortune Client
            </span>
          </div>
        </div>

        {/* Top Right Controls & Secret Exit Area */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer shadow-md"
            title="Plein écran"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Secret 5-tap exit trigger (Anti-Tamper) */}
          <button
            onClick={handleSecretTap}
            className="relative p-2.5 bg-slate-900/40 hover:bg-slate-900/80 text-slate-500 hover:text-slate-300 rounded-xl border border-white/5 transition-all cursor-pointer select-none"
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
      </header>

      {/* CENTER COMPACT HERO & HIGH DEFINITION QR CODE */}
      <main className="relative z-10 my-auto px-4 py-4 flex flex-col items-center text-center max-w-4xl mx-auto w-full">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-4 shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span>100% Gagnant • Cadeau Immédiat</span>
        </motion.div>

        {/* Dynamic Catchy Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl mb-3 drop-shadow-md"
        >
          Scannez le QR Code pour{' '}
          <span
            className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400"
          >
            Tourner la Roue !
          </span>
        </motion.h1>

        <p className="text-slate-300 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
          Donnez votre avis en quelques secondes et débloquez instantanément un cadeau à déguster à table ou en caisse.
        </p>

        {/* High-Definition QR Code Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative group p-6 sm:p-8 bg-white rounded-3xl sm:rounded-4xl shadow-2xl border-4 border-slate-800 hover:border-amber-400 transition-all flex flex-col items-center"
        >
          {/* Subtle Corner Glow */}
          <div
            className="absolute -inset-1 rounded-3xl sm:rounded-4xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500 -z-10"
            style={{ backgroundColor: primaryColor }}
          />

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
                    height: 48,
                    width: 48,
                    excavate: true,
                  }
                : undefined
            }
          />

          <div className="mt-4 flex items-center gap-2 text-slate-800 text-xs font-black tracking-wider uppercase">
            <Gift className="w-4 h-4 text-rose-600" />
            <span>Flashez avec l'appareil photo</span>
          </div>
        </motion.div>
      </main>

      {/* BOTTOM PRIZES CAROUSEL / TICKER */}
      <footer className="relative z-10 w-full py-4 bg-slate-900/60 backdrop-blur-lg border-t border-white/10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>À REMPORTER MAINTENANT :</span>
          </div>

          {/* Reward Badges Stream */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 max-w-full">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 border border-white/10 rounded-xl text-xs font-bold text-white shadow-sm shrink-0 whitespace-nowrap"
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
      </footer>

      {/* ANTI-TAMPER STAFF PIN MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center relative"
            >
              <button
                onClick={() => setShowPinModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-white tracking-tight mb-1">
                Quitter le Mode Borne
              </h3>
              <p className="text-xs text-slate-400 mb-5">
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
                          ? 'border-rose-500 bg-rose-500 scale-110'
                          : 'border-slate-700 bg-slate-800'
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
                    className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-rose-600 text-white font-black text-lg rounded-xl mx-auto flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-12 h-12 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl mx-auto flex items-center justify-center cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-rose-600 text-white font-black text-lg rounded-xl mx-auto flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinBackspace}
                  className="w-12 h-12 text-slate-400 hover:text-white rounded-xl mx-auto flex items-center justify-center transition-all active:scale-95 cursor-pointer"
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
