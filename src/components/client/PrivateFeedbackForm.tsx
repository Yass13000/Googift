import React, { useState } from 'react';
import { Star, MessageSquare, Send, Gift, AlertCircle, CheckCircle } from 'lucide-react';
import { submitReviewFeedback } from '../../lib/supabase';

interface PrivateFeedbackFormProps {
  restaurantId: string;
  rating: number;
  onProceedToWheel: () => void;
  primaryColor?: string;
}

export const PrivateFeedbackForm: React.FC<PrivateFeedbackFormProps> = ({
  restaurantId,
  rating,
  onProceedToWheel,
  primaryColor = '#E11D48',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await submitReviewFeedback({
      restaurant_id: restaurantId,
      rating,
      message,
      customer_name: name,
      customer_phone: phone,
      redirected_to_google: false
    });


    setIsSubmitting(false);
    if (res.error) {
      // If error, still allow client to play wheel
      setSubmitted(true);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 max-w-md w-full mx-auto">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          Message bien reçu !
        </h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Merci pour votre franchise. La direction prendra directement connaissance de votre retour pour corriger le tir.
        </p>

        <button
          onClick={onProceedToWheel}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-bold text-base shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] animate-bounce"
          style={{ backgroundColor: primaryColor }}
        >
          <Gift className="w-5 h-5" />
          <span>Tourner la Roue Cadeaux !</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 max-w-md w-full mx-auto">
      {/* Stars preview */}
      <div className="flex items-center gap-1.5 bg-amber-50 px-4 py-1.5 rounded-full mb-3 border border-amber-200/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        ))}
        <span className="text-amber-800 text-xs font-bold ml-1">{rating}/5</span>
      </div>

      <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-3">
        <MessageSquare className="w-6 h-6" />
      </div>

      <h2 className="text-xl font-bold text-slate-800 text-center tracking-tight mb-1">
        Nous sommes désolés pour ce désagrément
      </h2>

      <p className="text-slate-500 text-xs text-center mb-5 leading-relaxed">
        Votre retour est lu directement par le responsable de l'établissement. Dites-nous ce qui n'a pas été afin que nous puissions nous rattraper.
      </p>

      {errorMsg && (
        <div className="w-full mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Que pouvons-nous améliorer ? *
          </label>
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Service trop long, plat pas assez chaud, accueil..."
            className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Votre Prénom (optionnel)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Thomas"
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Téléphone (optionnel)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Envoyer & Débloquer mon Cadeau</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
