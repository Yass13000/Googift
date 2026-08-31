import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Gift } from 'lucide-react';

interface StarRatingProps {
  onRatingSelected: (rating: number) => void;
  restaurantName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string;
}

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80';

export const StarRating: React.FC<StarRatingProps> = ({
  onRatingSelected,
  restaurantName,
  logoUrl,
  bannerUrl,
  primaryColor = '#E11D48',
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (star: number) => {
    setSelected(star);
    // Court délai pour apprécier l'animation de sélection
    setTimeout(() => {
      onRatingSelected(star);
    }, 380);
  };

  const getRatingFeedback = (stars: number | null) => {
    if (!stars) return { text: 'Touchez une étoile pour donner votre note', emoji: '✨' };
    switch (stars) {
      case 5:
        return { text: 'Incroyable ! Expérience parfaite !', emoji: '🤩' };
      case 4:
        return { text: 'Très bien ! Merci beaucoup !', emoji: '😊' };
      case 3:
        return { text: 'Correct, nous pouvons nous améliorer', emoji: '🙂' };
      case 2:
        return { text: 'Décevant, dites-nous tout', emoji: '😕' };
      case 1:
        return { text: 'Insatisfait, nous sommes désolés', emoji: '😔' };
      default:
        return { text: 'Votre avis compte pour nous', emoji: '✨' };
    }
  };

  const activeStar = hovered || selected;
  const feedback = getRatingFeedback(activeStar);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-100/80 overflow-hidden relative">
      {/* 1. BANNIÈRE SUPÉRIEURE PLEINE LARGEUR (~180px - 210px) */}
      <div className="w-full h-44 sm:h-52 relative overflow-hidden bg-slate-900">
        <img
          src={bannerUrl || DEFAULT_BANNER}
          alt={restaurantName}
          className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
        />
        {/* Dégradé doux pour faire ressortir le bas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* LOGO EN MÉDAILLON CENTRÉ À CHEVAL (-bottom-10) */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 z-20">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center p-1">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-2xl shadow-inner"
                style={{ backgroundColor: primaryColor }}
              >
                <Gift className="w-8 h-8" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. CORPS DE LA PAGE (ESPACEMENT SOUS LE MÉDAILLON) */}
      <div className="pt-14 sm:pt-16 pb-8 px-6 sm:px-8 text-center flex flex-col items-center">
        {/* Texte d'introduction discret */}
        <span className="text-slate-500 text-sm font-medium tracking-wide">
          Merci pour votre passage.
        </span>

        {/* Titre principal percutant */}
        <h1 className="text-slate-900 font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight mt-2">
          Notez votre expérience
        </h1>
        <h2 className="text-slate-900 font-black text-2xl sm:text-3xl tracking-tight leading-tight mt-0.5 max-w-xs truncate">
          {restaurantName}
        </h2>

        {/* 3. ZONE DE NOTATION PAR ÉTOILES (ENCADRÉ PASTEL) */}
        <div className="w-full bg-amber-50/50 sm:bg-slate-50/80 border border-amber-100/80 sm:border-slate-100 rounded-3xl p-6 sm:p-7 mt-6 shadow-inner flex flex-col items-center">
          {/* Ligne des 5 Grandes Étoiles Dorées */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 my-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = activeStar ? star <= activeStar : false;
              return (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.18 }}
                  whileTap={{ scale: 1.25 }}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleSelect(star)}
                  className="p-1 sm:p-1.5 focus:outline-none cursor-pointer transition-transform"
                  aria-label={`${star} étoiles sur 5`}
                >
                  <Star
                    className={`w-10 h-10 sm:w-11 sm:h-11 transition-all duration-200 ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 stroke-amber-500 drop-shadow-md'
                        : 'stroke-amber-400 stroke-[1.5] text-transparent hover:stroke-amber-500'
                    }`}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Feedback dynamique sous les étoiles */}
          <div className="h-8 flex items-center justify-center gap-2 text-slate-700 font-bold text-xs sm:text-sm mt-3 transition-all duration-200">
            <span className="text-lg">{feedback.emoji}</span>
            <span>{feedback.text}</span>
          </div>
        </div>

        {/* Mention discrète sous l'encadré */}
        <p className="text-[11px] text-slate-400 mt-5">
          🎁 Donnez votre avis pour débloquer votre tirage sur la Roue Cadeaux
        </p>
      </div>
    </div>
  );
};
