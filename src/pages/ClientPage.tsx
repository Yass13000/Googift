import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRestaurant, getActiveRewards, createClaimedPrize, submitReviewFeedback } from '../lib/supabase';
import type { Restaurant, Reward, ClaimedPrize } from '../lib/types';
import { StarRating } from '../components/client/StarRating';
import { GoogleReviewGate } from '../components/client/GoogleReviewGate';
import { PrivateFeedbackForm } from '../components/client/PrivateFeedbackForm';
import { LuckyWheel } from '../components/client/LuckyWheel';
import { PrizeVoucher } from '../components/client/PrizeVoucher';
import { ClaimRewardModal, type CustomerLeadData } from '../components/client/ClaimRewardModal';
import { Gift, Ticket, X, ShieldCheck } from 'lucide-react';

type Step = 'rating' | 'google_redirect' | 'private_feedback' | 'wheel' | 'lead_capture' | 'voucher' | 'already_played';

export const ClientPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [step, setStep] = useState<Step>('rating');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRating, setUserRating] = useState<number>(5);
  const [wonPrize, setWonPrize] = useState<ClaimedPrize | null>(null);
  const [wonRewardInfo, setWonRewardInfo] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSavedPrize, setActiveSavedPrize] = useState<ClaimedPrize | null>(null);
  const [hasPlayedOnDevice, setHasPlayedOnDevice] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const restData = await getRestaurant(slug);
      setRestaurant(restData);

      const activeRewards = await getActiveRewards(restData.id, restData.slug);
      setRewards(activeRewards);

      // ANTI-TRICHE NIVEAU 1 : Vérification de l'appareil (localStorage)
      try {
        const storageKey = `gogift_played_${restData.id}`;
        const playedSession =
          localStorage.getItem(storageKey) ||
          localStorage.getItem(`gogift_has_played_${restData.id}`);

        const savedJson =
          localStorage.getItem(`gogift_saved_prize_${restData.id}`) ||
          localStorage.getItem('gogift_saved_prize');

        if (savedJson) {
          const parsed = JSON.parse(savedJson) as ClaimedPrize;
          const expiry = new Date(parsed.expires_at).getTime();
          if (expiry > Date.now() && (!parsed.restaurant_id || parsed.restaurant_id === restData.id)) {
            setActiveSavedPrize(parsed);
          }
        }


        if (playedSession) {
          setHasPlayedOnDevice(true);
          setStep('already_played');
        }
      } catch {
        // Ignore
      }

      setLoading(false);

    }
    loadData();
  }, [slug]);

  const handleRatingSelected = (rating: number) => {
    setUserRating(rating);

    // Si le joueur a déjà joué sur cet appareil
    if (hasPlayedOnDevice) {
      if (activeSavedPrize) {
        setWonPrize(activeSavedPrize);
        setStep('voucher');
        return;
      } else {
        setStep('already_played');
        return;
      }
    }

    const threshold = restaurant?.star_threshold || 4;
    if (rating >= threshold) {
      if (restaurant) {
        submitReviewFeedback({
          restaurant_id: restaurant.id,
          rating,
          redirected_to_google: true,
        });
      }
      setStep('google_redirect');
    } else {
      setStep('private_feedback');
    }
  };

  const handlePrivateFeedbackSubmit = (rating: number) => {
    setUserRating(rating);
    setStep('wheel');
  };

  const handleRewardWon = (reward: Reward) => {
    setWonRewardInfo(reward);
    setStep('lead_capture');
  };

  const handleLeadSubmit = async (leadData: CustomerLeadData) => {
    if (!restaurant || !wonRewardInfo) return;
    const res = await createClaimedPrize(
      restaurant.id,
      wonRewardInfo.id,
      wonRewardInfo.label,
      leadData
    );

    if (res.alreadyParticipated) {
      if (res.prize) {
        setWonPrize(res.prize);
        setActiveSavedPrize(res.prize);
        setStep('voucher');
      } else {
        setStep('already_played');
      }
      return;
    }

    if (res.prize) {
      setWonPrize(res.prize);
      setActiveSavedPrize(null);
      try {
        localStorage.setItem(
          `gogift_played_${restaurant.id}`,
          JSON.stringify({
            playedAt: new Date().toISOString(),
            rewardName: wonRewardInfo.label,
            claimCode: res.prize.claim_code,
          })
        );
        localStorage.setItem(`gogift_saved_prize_${restaurant.id}`, JSON.stringify(res.prize));
        localStorage.setItem(`gogift_has_played_${restaurant.id}`, new Date().toISOString());
        setHasPlayedOnDevice(true);
      } catch {}
    }
    setStep('voucher');
  };


  const handleRestoreVoucher = () => {
    if (activeSavedPrize) {
      setWonPrize(activeSavedPrize);
      setStep('voucher');
    }
  };


  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-[#FBFBFE] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-slate-600 text-sm font-semibold tracking-wide">
          Chargement de votre expérience...
        </span>
      </div>
    );
  }

  const primaryColor = restaurant.primary_color || '#7C3AED';
  const restaurantName = restaurant.name || 'Notre Établissement';  return (
    <div className={`min-h-screen flex flex-col justify-between text-slate-800 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white ${
      step === 'rating' ? 'bg-white' : 'bg-[#FBFBFE] p-4 sm:p-6'
    }`}>
      {/* Étoiles dorées flottantes décoratives (étapes roue / sas) */}
      {step !== 'rating' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <motion.div
            animate={{ y: [0, -8, 0], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-12 left-6 sm:left-24 text-amber-300"
          >
            <svg className="w-6 h-6 fill-current drop-shadow-sm" viewBox="0 0 24 24">
              <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
            </svg>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-28 right-8 sm:right-32 text-amber-300"
          >
            <svg className="w-8 h-8 fill-current drop-shadow-sm" viewBox="0 0 24 24">
              <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
            </svg>
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-24 left-10 text-amber-300"
          >
            <svg className="w-7 h-7 fill-current drop-shadow-sm" viewBox="0 0 24 24">
              <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
            </svg>
          </motion.div>
        </div>
      )}

      {/* Bouton restauration coupon si actif */}
      {activeSavedPrize && (
        <div className="max-w-md w-full mx-auto flex justify-end p-3 z-20">
          <button
            onClick={handleRestoreVoucher}
            className="text-xs font-bold tracking-wider text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer animate-pulse"
          >
            <Ticket className="w-3.5 h-3.5 text-amber-600" />
            <span>Voir mon coupon actif</span>
          </button>
        </div>
      )}

      {/* EN-TÊTE CENTRÉ AVEC LOGO (70x70) & TITRE DYNAMIQUE (affiché sur les étapes roue / sas / coupon) */}
      {step !== 'rating' && (
        <header className="max-w-md w-full mx-auto flex flex-col items-center pt-2 pb-3 text-center z-10">
          {/* Logo de l'établissement rond 70x70px */}
          <div className="w-[70px] h-[70px] rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center p-1.5 mb-3">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurantName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-xl shadow-inner"
                style={{ backgroundColor: primaryColor }}
              >
                <Gift className="w-7 h-7" />
              </div>
            )}
          </div>

          {/* Titre en 2 lignes */}
          <h1 className="text-slate-900 font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight">
            Tournez la roue et
          </h1>
          <h2 className="text-indigo-600 font-black text-2xl sm:text-3xl tracking-tight leading-tight mt-0.5">
            découvrez votre cadeau !
          </h2>
        </header>
      )}

      {/* ZONE CENTRALE DE JEU & ÉTAPES */}
      <main className={`w-full flex items-center justify-center z-10 ${
        step === 'rating' ? 'flex-1 items-start' : 'my-auto py-3'
      }`}>
        <AnimatePresence mode="wait">
          {step === 'rating' && (
            <motion.div
              key="rating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center"
            >
              <StarRating
                restaurantName={restaurantName}
                logoUrl={restaurant.logo_url}
                bannerUrl={restaurant.banner_url}
                primaryColor={primaryColor}
                onRatingSelected={handleRatingSelected}
              />
            </motion.div>
          )}

          {step === 'google_redirect' && (
            <motion.div
              key="google"
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
                onProceedToWheel={() => setStep('wheel')}
              />
            </motion.div>
          )}

          {step === 'private_feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex justify-center"
            >
              <PrivateFeedbackForm
                restaurantId={restaurant.id}
                rating={userRating}
                primaryColor={primaryColor}
                onProceedToWheel={() => handlePrivateFeedbackSubmit(userRating)}
              />
            </motion.div>
          )}

          {step === 'wheel' && (
            <motion.div
              key="wheel"
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
                restaurantName={restaurantName}
                onRewardWon={handleRewardWon}
              />
            </motion.div>
          )}

          {step === 'lead_capture' && wonRewardInfo && (
            <ClaimRewardModal
              reward={wonRewardInfo}
              restaurantName={restaurantName}
              restaurantId={restaurant.id}
              primaryColor={primaryColor}
              onSubmit={handleLeadSubmit}
              onRestoreExistingPrize={(prize) => {
                setWonPrize(prize);
                setStep('voucher');
              }}
            />
          )}

          {step === 'already_played' && (
            <motion.div
              key="already_played"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm mx-auto bg-white rounded-3xl p-7 shadow-xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Vous avez déjà participé !
              </h3>

              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Une seule participation est autorisée par client dans cet établissement.
              </p>

              {activeSavedPrize && (
                <button
                  type="button"
                  onClick={() => {
                    setWonPrize(activeSavedPrize);
                    setStep('voucher');
                  }}
                  className="mt-5 w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-amber-300" />
                  <span>Voir mon cadeau</span>
                </button>
              )}

              <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 text-left space-y-1">
                <p className="font-bold text-slate-800">Besoin d'aide ?</p>
                <p className="text-[11px] text-slate-500">
                  Présentez votre récapitulatif ou sollicitez un membre de l'équipe <strong className="text-slate-700">{restaurantName}</strong> en salle ou en caisse.
                </p>
              </div>

              {restaurant.google_review_url && (
                <a
                  href={restaurant.google_review_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3.5 w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <span>Voir la fiche de l'établissement</span>
                </a>
              )}
            </motion.div>
          )}


          {step === 'voucher' && wonPrize && (
            <motion.div
              key="voucher"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex justify-center"
            >
              <PrizeVoucher
                prize={wonPrize}
                restaurantName={restaurantName}
                primaryColor={primaryColor}
                iconName={wonRewardInfo?.icon || 'Gift'}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* PIED DE PAGE AVEC LIEN RÈGLEMENT DU JEU */}
      <footer className="w-full text-center pb-8 pt-4 z-10">
        <button
          onClick={() => setShowRulesModal(true)}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 underline underline-offset-4 transition-colors cursor-pointer"
        >
          Règlement du jeu
        </button>
      </footer>


      {/* MODALE DU RÈGLEMENT DU JEU */}
      <AnimatePresence>
        {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative text-left"
            >
              <button
                onClick={() => setShowRulesModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">
                  Règlement du Jeu
                </h3>
              </div>

              <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
                <p>
                  • <strong>Participation :</strong> Le jeu est réservé aux clients de l'établissement <strong className="text-slate-800">{restaurantName}</strong> (1 participation par table ou passage).
                </p>
                <p>
                  • <strong>Attribution des lots :</strong> Chaque tour de roue attribue un lot sélectionné aléatoirement selon les probabilités configurées.
                </p>
                <p>
                  • <strong>Utilisation du coupon :</strong> Le bon cadeau obtenu est valable immédiatement auprès du serveur ou en caisse pour une durée de 30 minutes.
                </p>
                <p>
                  • <strong>Données & Confidentialité :</strong> Aucune donnée personnelle n'est revendue à des tiers.
                </p>
              </div>

              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full mt-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                J'ai compris
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
