import React, { useState } from 'react';
import { Star, ExternalLink, Gift, ArrowRight } from 'lucide-react';

interface GoogleReviewRedirectProps {
  rating: number;
  googleReviewUrl: string;
  onProceedToWheel: () => void;
  primaryColor?: string;
}

export const GoogleReviewRedirect: React.FC<GoogleReviewRedirectProps> = ({
  rating,
  googleReviewUrl,
  onProceedToWheel,
  primaryColor = '#E11D48',
}) => {
  const [hasClickedReview, setHasClickedReview] = useState(false);

  const handleOpenGoogle = () => {
    setHasClickedReview(true);
    window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col items-center text-center p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 max-w-md w-full mx-auto transition-all animate-fadeIn">
      {/* 5 Stars Display */}
      <div className="flex items-center gap-1.5 bg-amber-50 px-4 py-1.5 rounded-full mb-4 border border-amber-200/60">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
        ))}
        <span className="text-amber-800 text-sm font-bold ml-1">{rating}/5</span>
      </div>

      <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
        Merci pour votre superbe note ! 🎉
      </h2>

      <p className="text-slate-600 text-sm mb-6 leading-relaxed">
        Votre soutien compte énormément pour toute l'équipe. <br />
        <strong className="text-slate-800">Partagez votre avis sur Google</strong> en 1 clic pour débloquer immédiatement la <strong>Roue Cadeaux</strong> !
      </p>

      {/* Google Review Button */}
      <button
        onClick={handleOpenGoogle}
        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-bold text-base shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-4 group"
        style={{ backgroundColor: primaryColor }}
      >
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
        </svg>
        <span>Laisser mon avis sur Google</span>
        <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* Button to unlock wheel */}
      <div className="w-full pt-2">
        <button
          onClick={onProceedToWheel}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
            hasClickedReview
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md animate-bounce'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Gift className="w-4 h-4 text-rose-500" />
          <span>{hasClickedReview ? 'Tourner la Roue maintenant !' : "J'ai déjà laissé mon avis / Continuer"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-4">
        🔒 100% sans inscription • Un cadeau garanti à chaque passage
      </p>
    </div>
  );
};
