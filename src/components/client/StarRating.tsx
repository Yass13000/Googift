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
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop';


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
    // Court délai pour apprécier l'animation de tap
    setTimeout(() => {
      onRatingSelected(star);
    }, 350);
  };

  const activeStar = hovered || selected;

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. BANNIÈRE PLEINE LARGEUR EN HAUT (100% écran, collée au sommet) */}
      <div className="w-full h-48 sm:h-56 relative bg-slate-900 overflow-hidden">
        <img
          src={bannerUrl || DEFAULT_BANNER}
          alt={restaurantName}
          className="w-full h-full object-cover opacity-90"
        />
      </div>

      {/* 2. LOGO MÉDAILLON CENTRÉ HORS OVERFLOW (-mt-10) */}
      <div className="-mt-10 relative z-10 mx-auto">
        <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden p-1">
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

      {/* 3. TYPOGRAPHIE & ESPACEMENTS EXACTS */}
      <div className="w-full px-4 text-center flex flex-col items-center">
        <p className="mt-4 text-slate-500 text-sm font-normal text-center">
          Merci pour votre passage.
        </p>

        <h1 className="mt-3 text-slate-900 font-extrabold text-2xl text-center tracking-tight">
          Notez votre expérience
        </h1>

        <h2 className="mt-1 text-slate-900 font-extrabold text-2xl text-center max-w-xs truncate">
          {restaurantName}
        </h2>

        {/* 4. ZONE D'ÉTOILES ÉPURÉE (bg-slate-50/70, sans textes superflus) */}
        <div className="mx-auto mt-8 p-6 bg-slate-50/70 rounded-2xl max-w-xs w-full flex justify-center items-center">
          <div className="flex justify-center items-center gap-2 sm:gap-2.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = activeStar ? star <= activeStar : false;
              return (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 1.25 }}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleSelect(star)}
                  className="p-1 focus:outline-none cursor-pointer"
                  aria-label={`${star} étoiles sur 5`}
                >
                  <Star
                    className={`w-9 h-9 transition-all duration-150 ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'stroke-amber-400 stroke-[1.5] text-transparent'
                    }`}
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
