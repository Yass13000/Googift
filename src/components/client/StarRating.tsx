import React, { useState } from 'react';
import { Star, Sparkles } from 'lucide-react';

interface StarRatingProps {
  onRatingSelected: (rating: number) => void;
  restaurantName: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ onRatingSelected, restaurantName }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (star: number) => {
    setSelected(star);
    // Slight pause for visual feedback
    setTimeout(() => {
      onRatingSelected(star);
    }, 400);
  };

  const getRatingFeedback = (stars: number | null) => {
    if (!stars) return { text: 'Touchez une étoile pour évaluer', emoji: '✨' };
    switch (stars) {
      case 5: return { text: 'Incroyable ! Expérience parfaite !', emoji: '🤩' };
      case 4: return { text: 'Très bien ! Merci beaucoup !', emoji: '😊' };
      case 3: return { text: 'Correct, nous pouvons nous améliorer', emoji: '🙂' };
      case 2: return { text: 'Décevant, dites-nous tout', emoji: '😕' };
      case 1: return { text: 'Insatisfait, nous sommes désolés', emoji: '😔' };
      default: return { text: 'Votre avis compte pour nous', emoji: '✨' };
    }
  };

  const activeStar = hovered || selected;
  const feedback = getRatingFeedback(activeStar);

  return (
    <div className="flex flex-col items-center text-center p-6 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 max-w-md w-full mx-auto transition-all">
      <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 text-rose-500 shadow-inner">
        <Sparkles className="w-8 h-8 animate-pulse" />
      </div>

      <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
        Comment s'est passée votre visite chez <span className="text-rose-600 font-extrabold">{restaurantName}</span> ?
      </h1>
      
      <p className="text-slate-500 text-sm mb-8 leading-relaxed">
        Donnez votre avis en 2 secondes et tournez la <span className="font-semibold text-slate-700">Roue Cadeaux</span> pour remporter un lot immédiat !
      </p>

      {/* Stars row */}
      <div className="flex justify-center items-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = activeStar ? star <= activeStar : false;
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSelect(star)}
              className="p-1 sm:p-2 transition-all transform hover:scale-125 active:scale-95 focus:outline-none"
              aria-label={`${star} étoiles`}
            >
              <Star
                className={`w-10 h-10 sm:w-12 sm:h-12 transition-all duration-200 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-md scale-105'
                    : 'text-slate-300 hover:text-amber-200'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Dynamic Feedback Text */}
      <div className="h-10 flex items-center justify-center gap-2 text-slate-700 font-medium text-sm transition-all duration-300">
        <span className="text-xl">{feedback.emoji}</span>
        <span>{feedback.text}</span>
      </div>
    </div>
  );
};
