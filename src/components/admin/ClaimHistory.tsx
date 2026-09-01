import React, { useState, useEffect } from 'react';
import {
  Gift,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  User,
  Phone,
  Mail,
  Download,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
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
    if (restaurantId) {
      fetchClaims();
    }
  }, [restaurantId]);

  const fetchClaims = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      // 🔒 CLOISONNEMENT STRICT PAR RESTAURANT_ID & SÉLECTION DES COORDONNÉES
      const { data, error } = await supabase
        .from('claimed_prizes')
        .select(`
          id,
          restaurant_id,
          claim_code,
          reward_id,
          reward_label,
          customer_name,
          customer_phone,
          customer_email,
          optin_marketing,
          is_redeemed,
          redeemed_at,
          created_at,
          expires_at
        `)
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
    setClaims((prev) =>
      prev.map((c) =>
        c.id === prize.id
          ? {
              ...c,
              is_redeemed: newRedeemed,
              redeemed_at: newRedeemed ? new Date().toISOString() : null,
            }
          : c
      )
    );

    try {
      const { error } = await supabase
        .from('claimed_prizes')
        .update({
          is_redeemed: newRedeemed,
          redeemed_at: newRedeemed ? new Date().toISOString() : null,
        })
        .eq('id', prize.id)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling claim status:', err);
      fetchClaims();
    }
  };

  // Export CSV des leads marketing
  const exportToCSV = () => {
    if (claims.length === 0) return;

    const headers = [
      'Code Coupon',
      'Nom Client',
      'Telephone',
      'Email',
      'Opt-in Marketing',
      'Lot Remporte',
      'Date Tirage',
      'Statut',
      'Date Validation',
    ];

    const rows = claims.map((c) => {
      const isExpired = new Date(c.expires_at).getTime() < Date.now();
      const status = c.is_redeemed
        ? 'Valide en caisse'
        : isExpired
        ? 'Expire'
        : 'En attente';

      return [
        `"${c.claim_code}"`,
        `"${c.customer_name || ''}"`,
        `"${c.customer_phone || ''}"`,
        `"${c.customer_email || ''}"`,
        c.optin_marketing !== false ? 'OUI' : 'NON',
        `"${c.reward_label}"`,
        `"${new Date(c.created_at).toLocaleString('fr-FR')}"`,
        `"${status}"`,
        `"${c.redeemed_at ? new Date(c.redeemed_at).toLocaleString('fr-FR') : ''}"`,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gogift_leads_${restaurantId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Formatage téléphone pour affichage
  const formatPhone = (rawPhone?: string | null) => {
    if (!rawPhone) return '-';
    const clean = rawPhone.replace(/\D/g, '');
    if (clean.length === 10) {
      return clean.match(/.{1,2}/g)?.join(' ') || rawPhone;
    }
    return rawPhone;
  };

  const nowTime = Date.now();
  const filteredClaims = claims.filter((c) => {
    const isExpired = new Date(c.expires_at).getTime() < nowTime;
    let matchesStatus = true;
    if (filterStatus === 'redeemed') matchesStatus = c.is_redeemed;
    if (filterStatus === 'pending') matchesStatus = !c.is_redeemed && !isExpired;
    if (filterStatus === 'expired') matchesStatus = !c.is_redeemed && isExpired;

    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.claim_code.toLowerCase().includes(term) ||
      c.reward_label.toLowerCase().includes(term) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(term)) ||
      (c.customer_phone && c.customer_phone.includes(term)) ||
      (c.customer_email && c.customer_email.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Historique des Lots & Leads Clients</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {claims.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordonnées des participants et suivi de validation des coupons en caisse
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton rafraîchir */}
          <button
            onClick={fetchClaims}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Bouton Export CSV */}
          <button
            onClick={exportToCSV}
            disabled={claims.length === 0}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Exporter CSV ({claims.length})</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {(['all', 'pending', 'redeemed', 'expired'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'all' && `Tous (${claims.length})`}
              {st === 'pending' &&
                `En attente (${
                  claims.filter((c) => !c.is_redeemed && new Date(c.expires_at).getTime() >= nowTime)
                    .length
                })`}
              {st === 'redeemed' &&
                `Validés (${claims.filter((c) => c.is_redeemed).length})`}
              {st === 'expired' &&
                `Expirés (${
                  claims.filter((c) => !c.is_redeemed && new Date(c.expires_at).getTime() < nowTime)
                    .length
                })`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, tél, e-mail, code..."
            className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>
      </div>

      {/* Table of Claims & Leads */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-3.5">Code Coupon</th>
                <th className="p-3.5">Coordonnées Client</th>
                <th className="p-3.5">Lot Remporté</th>
                <th className="p-3.5">Date Tirage</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5 text-right">Action Caisse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Chargement des participations...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Aucun coupon trouvé pour cet établissement
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const isExpired = new Date(claim.expires_at).getTime() < nowTime;
                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code Coupon */}
                      <td className="p-3.5 align-top font-mono font-black text-slate-900">
                        <span className="px-2 py-1 bg-slate-100 rounded-lg border border-slate-200">
                          {claim.claim_code}
                        </span>
                      </td>

                      {/* Coordonnées Client */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{claim.customer_name || 'Client anonyme'}</span>
                            {claim.optin_marketing !== false && (
                              <span
                                title="A accepté de recevoir les offres"
                                className="inline-flex items-center text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.2 rounded-md"
                              >
                                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                                Opt-in
                              </span>
                            )}
                          </div>

                          {claim.customer_phone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <a
                                href={`tel:${claim.customer_phone}`}
                                className="hover:text-indigo-600 hover:underline"
                              >
                                {formatPhone(claim.customer_phone)}
                              </a>
                            </div>
                          )}

                          {claim.customer_email && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <a
                                href={`mailto:${claim.customer_email}`}
                                className="hover:text-indigo-600 hover:underline truncate max-w-[180px]"
                                title={claim.customer_email}
                              >
                                {claim.customer_email}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Lot Remporté */}
                      <td className="p-3.5 align-top font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <Gift className="w-3.5 h-3.5" />
                          </div>
                          <span>{claim.reward_label}</span>
                        </div>
                      </td>

                      {/* Date Émission & Expiration */}
                      <td className="p-3.5 align-top text-slate-500">
                        <div>
                          {new Date(claim.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isExpired ? (
                            <span className="text-rose-500 font-medium">Expiré</span>
                          ) : (
                            <span>
                              Valide jusqu'à{' '}
                              {new Date(claim.expires_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="p-3.5 align-top">
                        {claim.is_redeemed ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Validé
                            </span>
                            {claim.redeemed_at && (
                              <p className="text-[9px] text-slate-400">
                                {new Date(claim.redeemed_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                          </div>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            Expiré
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            En attente
                          </span>
                        )}
                      </td>

                      {/* Action Caisse */}
                      <td className="p-3.5 align-top text-right">
                        <button
                          onClick={() => handleToggleRedeem(claim)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            claim.is_redeemed
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {claim.is_redeemed ? 'Annuler validation' : 'Valider en caisse'}
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
