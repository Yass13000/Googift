import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClaimedPrizeByCode, getRestaurant } from '../lib/supabase';
import type { ClaimedPrize, Restaurant } from '../lib/types';
import { PrizeVoucher } from '../components/client/PrizeVoucher';
import { Gift, ArrowLeft, XCircle } from 'lucide-react';

export const ClaimPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [prize, setPrize] = useState<ClaimedPrize | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadClaim() {
      if (!code) return;
      setLoading(true);
      const claimedData = await getClaimedPrizeByCode(code);

      if (claimedData) {
        setPrize(claimedData);
        const restData = await getRestaurant(claimedData.restaurant_id);
        setRestaurant(restData);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    loadClaim();
  }, [code]);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold">Récupération de votre bon...</span>
      </div>
    );
  }

  const primaryColor = restaurant?.primary_color || '#E11D48';
  const restaurantName = restaurant?.name || 'Notre Restaurant';


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <Link
          to="/"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Accueil</span>
        </Link>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            <Gift className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white">{restaurantName}</span>
        </div>
      </header>

      <main className="my-auto py-6 flex items-center justify-center w-full">
        {notFound || !prize ? (
          <div className="bg-white p-6 rounded-3xl text-center max-w-sm w-full text-slate-800 shadow-2xl">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-black mb-1">Coupon introuvable</h2>
            <p className="text-xs text-slate-500 mb-6">
              Ce coupon n'existe pas ou a expiré.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 py-3 px-5 w-full bg-slate-900 text-white rounded-2xl text-xs font-bold"
            >
              <span>Tenter ma chance à la Roue</span>
            </Link>
          </div>
        ) : (
          <PrizeVoucher
            prize={prize}
            restaurantName={restaurantName}
            primaryColor={primaryColor}
          />
        )}
      </main>

      <footer className="max-w-md w-full mx-auto text-center text-[11px] text-slate-400 py-2">
        <span>GoGift • Bon de fidélité sécurisé</span>
      </footer>
    </div>
  );
};
