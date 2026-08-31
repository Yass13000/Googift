import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, Gift, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { submitReviewFeedback } from '../../lib/supabase';

interface GoogleReviewGateProps {
  rating: number;
  googleReviewUrl: string;
  restaurantId: string;
  onProceedToWheel: () => void;
  primaryColor?: string;
}

type GateStatus = 'initial' | 'counting' | 'unlocked';

export const GoogleReviewGate: React.FC<GoogleReviewGateProps> = ({
  rating,
  googleReviewUrl,
  restaurantId,
  onProceedToWheel,
  primaryColor = '#7C3AED',
}) => {
  const [status, setStatus] = useState<GateStatus>('initial');
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTabReturned, setIsTabReturned] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle Tab Focus / Visibility return detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && status === 'counting') {
        setIsTabReturned(true);
      }
    };

    const handleFocus = () => {
      if (status === 'counting') {
        setIsTabReturned(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [status]);

  // 10-Second Countdown Timer
  useEffect(() => {
    if (status === 'counting') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setStatus('unlocked');
            if (navigator.vibrate) {
              navigator.vibrate(20);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const handleOpenGoogle = () => {
    // 1. Open Google Review URL in new tab
    window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');

    // 2. Track feedback redirection in Supabase
    submitReviewFeedback({
      restaurant_id: restaurantId,
      rating,
      redirected_to_google: true,
    }).catch(() => {});

    // 3. Start 10s countdown
    setTimeLeft(10);
    setStatus('counting');
  };

  // SVG Circular Progress calculation
  const totalSeconds = 10;
  const strokeDashoffset = (timeLeft / totalSeconds) * 283; // 2 * PI * 45 ≈ 283

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center p-6 sm:p-8 bg-white/95 backdrop-blur-xl rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-100 max-w-md w-full mx-auto relative overflow-hidden"
    >
      {/* 5 Stars Rating Badge */}
      <div className="flex items-center gap-1.5 bg-amber-50 px-4 py-1.5 rounded-full mb-4 border border-amber-200/80 shadow-sm">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
        <span className="text-amber-800 text-xs font-black ml-1">{rating}/5 Confirmé</span>
      </div>

      <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
        Merci pour votre superbe note ! 🎉
      </h2>

      {/* STEP 1: INITIAL STATE */}
      {status === 'initial' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-4"
        >
          <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">
            Votre avis compte énormément pour nous. <br />
            <strong className="text-slate-800">Partagez votre expérience sur Google</strong> pour débloquer immédiatement l'accès à la <strong className="text-indigo-600">Roue des Cadeaux</strong> !
          </p>

          {/* Google Review Button */}
          <button
            onClick={handleOpenGoogle}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-black text-base shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 10px 25px -5px ${primaryColor}66`,
            }}
          >
            {/* Google G Multi-Color Icon */}
            <svg className="w-5 h-5 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Publier mon avis sur Google</span>
            <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </motion.div>
      )}

      {/* STEP 2: COUNTDOWN TIMER STATE */}
      {status === 'counting' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex flex-col items-center space-y-4 py-2"
        >
          {/* Animated Circular SVG Timer */}
          <div className="relative w-28 h-28 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                className="text-slate-100"
              />
              {/* Animated Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#timerGradient)"
                strokeWidth="7"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered Second Count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                {timeLeft}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider -mt-1">
                sec
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-slate-800 text-xs font-bold">
              Finalisation de votre avis en cours...
            </p>
            <p className="text-slate-500 text-xs max-w-xs">
              Prenez quelques secondes pour valider votre note sur Google.
            </p>
          </div>

          {/* Feedback if user came back to the tab */}
          {isTabReturned && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-spin-slow" />
              <span>Vous êtes de retour ! Finalisez l'attente pour lancer la roue.</span>
            </motion.div>
          )}

          {/* Disabled Countdown Button */}
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm border border-slate-200 cursor-not-allowed"
          >
            <Clock className="w-4 h-4 animate-spin-slow text-amber-500" />
            <span>Déblocage de la roue dans {timeLeft}s...</span>
          </button>
        </motion.div>
      )}

      {/* STEP 3: UNLOCKED STATE */}
      {status === 'unlocked' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full space-y-4 py-2"
        >
          {/* Success Validation Badge */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Votre accès à la Roue Cadeau est maintenant débloqué !</span>
          </div>

          <p className="text-slate-600 text-xs max-w-xs mx-auto">
            Merci pour votre précieux soutien ! Cliquez ci-dessous pour lancer votre tirage.
          </p>

          {/* UNLOCKED SPIN BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onProceedToWheel}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-black text-base shadow-xl transition-all cursor-pointer animate-pulse"
            style={{
              backgroundColor: '#10B981',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Gift className="w-5 h-5 text-amber-300" />
            <span>J'ai bien publié mon avis • Tourner la Roue 🎁</span>
          </motion.button>
        </motion.div>
      )}

      {/* Footer Security Notice */}
      <p className="text-[11px] text-slate-400 mt-4">
        🔒 1 participation par table • Valable immédiatement en caisse
      </p>
    </motion.div>
  );
};
