import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';

import { supabase } from '../../lib/supabase';
import type { ClaimedPrize } from '../../lib/types';

interface ClaimHistoryProps {
  restaurantId: string;
}

export const ClaimHistory: React.FC<ClaimHistoryProps> = ({ restaurantId }) => {
  const [claims, setClaims] = useState<ClaimedPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'redeemed' | 'pending' | 'expired'>('all');

  useEffect(() => {
    fetchClaims();
  }, [restaurantId]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('claimed_prizes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims((data || []) as ClaimedPrize[]);

    } catch (err) {
      console.error('Error fetching claims history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRedeem = async (prize: ClaimedPrize) => {
    const newRedeemed = !prize.is_redeemed;
    // Optimistic update
    setClaims(prev =>
      prev.map(c =>
        c.id === prize.id
          ? { ...c, is_redeemed: newRedeemed, redeemed_at: newRedeemed ? new Date().toISOString() : null }
          : c
      )
    );

    try {
      const { error } = await supabase
        .from('claimed_prizes')
        .update({
          is_redeemed: newRedeemed,
          redeemed_at: newRedeemed ? new Date().toISOString() : null
        })
        .eq('id', prize.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling claim status:', err);
      fetchClaims();
    }
  };


  const nowTime = Date.now();
  const filteredClaims = claims.filter(c => {
    const isExpired = new Date(c.expires_at).getTime() < nowTime;
    let matchesStatus = true;
    if (filterStatus === 'redeemed') matchesStatus = c.is_redeemed;
    if (filterStatus === 'pending') matchesStatus = !c.is_redeemed && !isExpired;
    if (filterStatus === 'expired') matchesStatus = !c.is_redeemed && isExpired;

    const matchesSearch = !search ||
      c.claim_code.toLowerCase().includes(search.toLowerCase()) ||
      c.reward_label.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Historique des Coupons & Lots Gagnés
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit complet de tous les coupons émis par la roue et validés en caisse
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          {(['all', 'pending', 'redeemed', 'expired'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'all' && 'Tous'}
              {st === 'pending' && 'En attente'}
              {st === 'redeemed' && 'Validés en caisse'}
              {st === 'expired' && 'Expirés'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par code (ex: WIN-8X2A) ou nom du lot..."
          className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
      </div>

      {/* Table of Claims */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-3.5">Code Coupon</th>
                <th className="p-3.5">Lot Remporté</th>
                <th className="p-3.5">Date Émission</th>
                <th className="p-3.5">Validité</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Chargement de l'historique...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Aucun coupon trouvé
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const isExpired = new Date(claim.expires_at).getTime() < nowTime;
                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-mono font-black text-slate-900">
                        {claim.claim_code}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-rose-500" />
                        <span>{claim.reward_label}</span>
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(claim.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {isExpired ? (
                          <span className="text-red-500">Expiré</span>
                        ) : (
                          <span>Jusqu'à {new Date(claim.expires_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {claim.is_redeemed ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Validé
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-red-500" />
                            Expiré
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleRedeem(claim)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            claim.is_redeemed
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {claim.is_redeemed ? 'Annuler' : 'Valider'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
