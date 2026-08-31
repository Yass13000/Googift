import React, { useState, useEffect } from 'react';
import { Star, Gift, TrendingUp, Users, AlertCircle, Award } from 'lucide-react';

import { supabase } from '../../lib/supabase';

interface DashboardStatsProps {
  restaurantId: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ restaurantId }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    googleRedirects: 0,
    internalFeedbacks: 0,
    avgRating: 0,
    totalPrizesClaimed: 0,
    totalPrizesRedeemed: 0,
  });

  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });

  const [topPrizes, setTopPrizes] = useState<{ label: string; count: number }[]>([]);

  useEffect(() => {
    fetchStats();
  }, [restaurantId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [reviewsRes, prizesRes] = await Promise.all([
        supabase
          .from('reviews_feedback')
          .select('rating, redirected_to_google')
          .eq('restaurant_id', restaurantId),
        supabase
          .from('claimed_prizes')
          .select('reward_label, is_redeemed')
          .eq('restaurant_id', restaurantId)
      ]);

      const reviews = reviewsRes.data || [];
      const prizes = prizesRes.data || [];


      const totalReviews = reviews.length;
      const googleRedirects = reviews.filter(r => r.redirected_to_google).length;
      const internalFeedbacks = reviews.filter(r => !r.redirected_to_google).length;
      const avgRating = totalReviews > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
        : '5.0';

      const totalPrizesClaimed = prizes.length;
      const totalPrizesRedeemed = prizes.filter(p => p.is_redeemed).length;

      // Rating breakdown
      const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(r => {
        if (r.rating in dist) dist[r.rating]++;
      });
      setRatingDistribution(dist);

      // Top prizes breakdown
      const prizeCounts: Record<string, number> = {};
      prizes.forEach(p => {
        prizeCounts[p.reward_label] = (prizeCounts[p.reward_label] || 0) + 1;
      });
      const topList = Object.entries(prizeCounts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopPrizes(topList);

      setStats({
        totalReviews,
        googleRedirects,
        internalFeedbacks,
        avgRating: Number(avgRating),
        totalPrizesClaimed,
        totalPrizesRedeemed,
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const googleRate = stats.totalReviews > 0 
    ? Math.round((stats.googleRedirects / stats.totalReviews) * 100) 
    : 0;

  const redemptionRate = stats.totalPrizesClaimed > 0 
    ? Math.round((stats.totalPrizesRedeemed / stats.totalPrizesClaimed) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Total Avis Clients</span>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{loading ? '...' : stats.totalReviews}</h3>
            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Note moyenne : <strong className="text-amber-600">{stats.avgRating}/5</strong>
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Redirections Google</span>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{loading ? '...' : stats.googleRedirects}</h3>
            <span className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {googleRate}% de conversion Google
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Avis Privés Reçus</span>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{loading ? '...' : stats.internalFeedbacks}</h3>
            <span className="text-xs text-slate-500 mt-1">Désamorcés avant Google</span>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Cadeaux Validés</span>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{loading ? '...' : stats.totalPrizesRedeemed}</h3>
            <span className="text-xs text-indigo-600 font-semibold mt-1">
              Sur {stats.totalPrizesClaimed} gagnés ({redemptionRate}%)
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
            <Gift className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Breakdown Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Répartition des Notes Données</span>
          </h4>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDistribution[stars] || 0;
              const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <div className="w-12 flex items-center gap-1 font-bold text-slate-700">
                    <span>{stars}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stars >= 4 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-semibold text-slate-600">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Won Prizes Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-rose-500" />
            <span>Lots les Plus Remportés</span>
          </h4>
          {topPrizes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Aucun gain enregistré pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {topPrizes.map((p) => {
                const maxCount = topPrizes[0]?.count || 1;
                const pct = Math.round((p.count / maxCount) * 100);
                return (
                  <div key={p.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{p.label}</span>
                      <span className="font-bold text-slate-900">{p.count} fois</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Highlights Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <h4 className="text-lg font-black tracking-tight">🚀 Booster d'Avis & Fidélité en Salle</h4>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            GoGift filtre automatiquement les clients insatisfaits pour traiter leurs réclamations en direct, tout en invitant vos clients conquis à poster sur Google Maps.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
        >
          Actualiser les données
        </button>
      </div>
    </div>
  );
};


