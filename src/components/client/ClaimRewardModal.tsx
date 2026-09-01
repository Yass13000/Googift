import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, User, Phone, Mail, Sparkles, Loader2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import type { Reward, ClaimedPrize } from '../../lib/types';
import { DynamicIcon } from '../../lib/icons';
import { checkCustomerParticipation } from '../../lib/supabase';

export interface CustomerLeadData {
  name: string;
  phone: string;
  email: string;
  optin: boolean;
}

interface ClaimRewardModalProps {
  reward: Reward;
  restaurantName: string;
  restaurantId?: string;
  primaryColor?: string;
  onSubmit: (lead: CustomerLeadData) => Promise<void>;
  onRestoreExistingPrize?: (prize: ClaimedPrize) => void;
}

export const ClaimRewardModal: React.FC<ClaimRewardModalProps> = ({
  reward,
  restaurantName,
  restaurantId,
  primaryColor = '#7C3AED',
  onSubmit,
  onRestoreExistingPrize,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [optin, setOptin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingPrizeFound, setExistingPrizeFound] = useState<ClaimedPrize | null>(null);

  // Simple French phone formatting (06 12 34 56 78)
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').substring(0, 10);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = raw.match(/.{1,2}/g)?.join(' ') || raw;
    }
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExistingPrizeFound(null);

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\s/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Veuillez renseigner un numéro de téléphone valide (10 chiffres).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Veuillez renseigner une adresse e-mail valide.');
      return;
    }

    setLoading(true);

    // ANTI-TRICHE NIVEAUX 2 & 3 : Vérification Téléphone et Email dans Supabase
    if (restaurantId) {
      try {
        const check = await checkCustomerParticipation(restaurantId, cleanPhone, cleanEmail);
        if (check.hasParticipated) {
          setError(
            check.reason ||
              '⚠️ Ce numéro de téléphone ou cette adresse e-mail a déjà été utilisé pour participer auprès de cet établissement (1 seule participation par client).'
          );
          if (check.existingPrize) {
            setExistingPrizeFound(check.existingPrize);
          }
          setLoading(false);
          return;
        }
      } catch {
        // En cas d'indisponibilité réseau, laisser passer
      }
    }

    try {
      await onSubmit({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        optin,
      });
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de l'enregistrement.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-100 overflow-hidden relative my-auto text-left"
      >
        {/* Lueur d'ambiance festive */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />

        {/* EN-TÊTE DU LOT GAGNANT */}
        <div className="p-6 sm:p-7 pb-4 text-center border-b border-slate-100 relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white shadow-xl"
            style={{ backgroundColor: reward.color || primaryColor }}
          >
            {reward.image_url ? (
              <img
                src={reward.image_url}
                alt={reward.label}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <DynamicIcon name={reward.icon || 'Gift'} className="w-8 h-8" />
            )}
          </motion.div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
            <span>Votre Récompense Débloquée</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Félicitations ! 🎉
          </h2>
          <p className="text-indigo-600 font-extrabold text-lg mt-0.5">
            {reward.label}
          </p>

          <p className="text-slate-500 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
            Renseignez vos coordonnées pour recevoir votre bon cadeau sécurisé chez{' '}
            <strong className="text-slate-700">{restaurantName}</strong>.
          </p>
        </div>

        {/* FORMULAIRE DE CAPTURE DE LEAD */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 pt-5 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold leading-relaxed space-y-2"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>

              {existingPrizeFound && onRestoreExistingPrize && (
                <button
                  type="button"
                  onClick={() => onRestoreExistingPrize(existingPrizeFound)}
                  className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Afficher mon bon cadeau existant ({existingPrizeFound.claim_code})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          )}

          {/* Nom complet */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Nom complet *</span>
            </label>
            <input
              type="text"
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Karim Zidane"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Téléphone portable */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Numéro de mobile *</span>
            </label>
            <input
              type="tel"
              required
              disabled={loading}
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Adresse email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Adresse e-mail *</span>
            </label>
            <input
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="karim@exemple.fr"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Case Opt-in RGPD */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={optin}
              onChange={(e) => setOptin(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500 leading-tight">
              J'accepte de recevoir mon bon cadeau et les offres promotionnelles exclusives de l'établissement.
            </span>
          </label>

          {/* BOUTON D'ACTION PRINCIPAL */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 mt-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base shadow-xl shadow-slate-900/20 transition-all transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Vérification & Génération du coupon...</span>
              </>
            ) : (
              <>
                <Gift className="w-5 h-5 text-amber-300" />
                <span>Obtenir mon cadeau 🎁</span>
              </>
            )}
          </button>

          {/* Footer RGPD sécurisé */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>1 seule participation par client • Données 100% sécurisées</span>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
