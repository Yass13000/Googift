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
import { Gift, Ticket } from 'lucide-react';


type Step = 'rating' | 'google_redirect' | 'private_feedback' | 'wheel' | 'voucher';

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

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const restData = await getRestaurant(slug);
      setRestaurant(restData);

      const activeRewards = await getActiveRewards(restData.id, restData.slug);
      setRewards(activeRewards);


      // Check if there is an active (non-expired) prize for this restaurant in localStorage
      try {
        const savedJson = localStorage.getItem(`gogift_saved_prize_${restData.id}`) || localStorage.getItem('gogift_saved_prize');
        if (savedJson) {
          const parsed = JSON.parse(savedJson) as ClaimedPrize;
          const expiry = new Date(parsed.expires_at).getTime();
          if (expiry > Date.now() && (!parsed.restaurant_id || parsed.restaurant_id === restData.id)) {
            setActiveSavedPrize(parsed);
          }
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

  const handleRewardWon = async (reward: Reward) => {
    setWonRewardInfo(reward);
    if (restaurant) {
      const res = await createClaimedPrize(restaurant.id, reward.id, reward.label);
      if (res.prize) {
        setWonPrize(res.prize);
        setActiveSavedPrize(null);
        try {
          localStorage.setItem(`gogift_saved_prize_${restaurant.id}`, JSON.stringify(res.prize));
        } catch {}
      }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-white text-sm font-semibold tracking-wide">
          Chargement de votre expérience...
        </span>
      </div>
    );
  }

  const primaryColor = restaurant.primary_color || '#E11D48';
  const restaurantName = restaurant.name || 'Notre Établissement';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-rose-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurantName}
              className="w-9 h-9 rounded-xl object-cover shadow-md bg-white p-0.5"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <Gift className="w-5 h-5" />
            </div>
          )}
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white drop-shadow-sm">
            {restaurantName}
          </span>
        </div>

        {activeSavedPrize && step === 'rating' ? (
          <button
            onClick={handleRestoreVoucher}
            className="text-[11px] font-bold tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Mon Coupon Actif</span>
          </button>
        ) : (
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-300/80 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
            🎁 Cadeau Garanti
          </div>
        )}
      </header>

      {/* Main Content Step with AnimatePresence */}
      <main className="my-auto py-6 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {step === 'rating' && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex justify-center"
            >
              <StarRating
                restaurantName={restaurantName}
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex justify-center"
            >
              <LuckyWheel
                rewards={rewards}
                primaryColor={primaryColor}
                onRewardWon={handleRewardWon}
              />
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

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500 py-2">
        <span>Propulsé par <strong>GoGift</strong> • Avis Google & Fidélité Client</span>
      </footer>
    </div>
  );
};


