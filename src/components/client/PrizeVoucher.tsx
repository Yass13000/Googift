import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, CheckCircle2, Copy, Sparkles, ShieldCheck, Share2 } from 'lucide-react';
import type { ClaimedPrize } from '../../lib/types';
import { DynamicIcon } from '../../lib/icons';

interface PrizeVoucherProps {
  prize: ClaimedPrize;
  restaurantName: string;
  primaryColor?: string;
  iconName?: string;
}

export const PrizeVoucher: React.FC<PrizeVoucherProps> = ({
  prize,
  restaurantName,
  primaryColor = '#E11D48',
  iconName = 'Gift'
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const totalDuration = 30 * 60; // 30 minutes in seconds

  // Save prize locally so client doesn't lose it if page is refreshed
  useEffect(() => {
    try {
      localStorage.setItem('gogift_saved_prize', JSON.stringify(prize));
    } catch {
      // Ignore localstorage errors
    }
  }, [prize]);

  // Trigger double confetti blast on mount
  useEffect(() => {
    const fireConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E11D48', '#F59E0B', '#10B981', '#6366F1', '#EC4899']
      });
    };

    fireConfetti();
    const timeout = setTimeout(fireConfetti, 800);
    return () => clearTimeout(timeout);
  }, []);

  // Countdown timer logic
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiry = new Date(prize.expires_at).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [prize.expires_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prize.claim_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const claimUrl = `${window.location.origin}/claim/${prize.claim_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mon bon cadeau chez ${restaurantName}`,
          text: `J'ai gagné : ${prize.reward_label} chez ${restaurantName} ! Code : ${prize.claim_code}`,
          url: claimUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExpired = timeLeft <= 0;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));
  const qrValue = `${window.location.origin}/staff?code=${prize.claim_code}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col items-center text-center p-6 sm:p-8 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full mx-auto relative overflow-hidden"
    >
      {/* Top Banner accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-3"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="flex items-center gap-1.5 text-amber-500 font-black text-xs uppercase tracking-widest mb-2 mt-1">
        <Sparkles className="w-4 h-4" />
        <span>Gain Confirmé</span>
        <Sparkles className="w-4 h-4" />
      </div>

      <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
        Félicitations ! 🎉
      </h2>
      <p className="text-slate-500 text-xs mb-4">
        Votre lot a été attribué par la Roue Cadeaux
      </p>

      {/* Prize Ticket Highlight Box */}
      <div className="w-full my-2 p-5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-amber-50/50 to-orange-50/80 border border-rose-200/80 flex flex-col items-center justify-center shadow-inner relative">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3"
          style={{ backgroundColor: primaryColor }}
        >
          <DynamicIcon name={iconName} className="w-8 h-8" />
        </div>
        <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
          {prize.reward_label}
        </span>
        <span className="text-xs text-slate-500 mt-1 font-medium">
          Valable chez <strong className="text-slate-800">{restaurantName}</strong>
        </span>
      </div>

      {/* Countdown Timer with Progress Bar */}
      <div className="w-full my-4">
        <div className={`flex items-center justify-between px-4 py-2 rounded-xl mb-1.5 text-xs font-bold border ${
          isExpired 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${!isExpired && 'text-rose-600 animate-spin-slow'}`} />
            <span>{isExpired ? 'Coupon Expiré' : 'Temps restant pour l\'utiliser'}</span>
          </div>
          <span className="font-mono text-sm font-black text-slate-900">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Linear progress bar */}
        {!isExpired && (
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full"
              style={{ width: `${progressPercent}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        )}
      </div>

      {/* QR Code & Claim Code Box */}
      <div className="p-5 bg-white rounded-3xl border-2 border-dashed border-slate-300 shadow-md flex flex-col items-center mb-5 w-full max-w-[280px]">
        <QRCodeSVG
          value={qrValue}
          size={170}
          level="H"
          includeMargin={false}
          className="rounded-xl"
        />
        
        <div className="mt-3.5 flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl w-full justify-between border border-slate-200">
          <span className="font-mono font-black text-lg text-slate-900 tracking-wider">
            {prize.claim_code}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-200 transition-all"
              title="Copier le code"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleShare}
              className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-200 transition-all"
              title="Partager le bon"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions for customer */}
      <div className="w-full bg-slate-50 p-3.5 rounded-2xl text-left flex items-start gap-3 border border-slate-200 mb-4">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Présentez cet écran à votre serveur ou en caisse</strong> au moment du règlement pour appliquer immédiatement votre cadeau.
        </p>
      </div>

      <p className="text-[11px] text-slate-400">
        💡 Vos gains sont automatiquement conservés même si vous quittez la page.
      </p>
    </motion.div>
  );
};

