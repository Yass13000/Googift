import React, { useState, useEffect } from 'react';
import { Star, Phone, MessageSquare, CheckCircle, Archive, Filter } from 'lucide-react';

import { supabase } from '../../lib/supabase';
import type { ReviewFeedback } from '../../lib/types';

interface ReviewsInboxProps {
  restaurantId: string;
}

export const ReviewsInbox: React.FC<ReviewsInboxProps> = ({ restaurantId }) => {
  const [feedbacks, setFeedbacks] = useState<ReviewFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'treated' | 'archived'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, [restaurantId]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews_feedback')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks((data || []) as ReviewFeedback[]);

    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'treated' | 'archived') => {
    // Optimistic update
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    try {
      const { error } = await supabase
        .from('reviews_feedback')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating feedback status:', err);
      fetchFeedbacks();
    }
  };


  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchesSearch = !search || 
      (f.customer_name && f.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (f.message && f.message.toLowerCase().includes(search.toLowerCase())) ||
      (f.customer_phone && f.customer_phone.includes(search));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Avis & Retours Clients Privés
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Retours constructifs reçus avant publication Google pour vous permettre de recontacter les clients
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          {(['all', 'pending', 'treated', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'all' && 'Tous'}
              {st === 'pending' && 'En attente'}
              {st === 'treated' && 'Traités'}
              {st === 'archived' && 'Archivés'}
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
          placeholder="Rechercher par prénom, téléphone, mot-clé..."
          className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
        />
        <Filter className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
      </div>

      {/* Feedbacks list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Chargement des avis...</div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Aucun avis correspondant</h4>
          <p className="text-xs text-slate-400 mt-1">Tous les retours clients apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Header row: stars & date & status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1">{fb.rating}/5</span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(fb.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Message */}
                {fb.message ? (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 italic">
                    "{fb.message}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-3">
                    (Aucun message laissé - Note seule)
                  </p>
                )}

                {/* Customer Contact */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-3">
                  {fb.customer_name && (
                    <span className="font-semibold text-slate-800">
                      👤 {fb.customer_name}
                    </span>
                  )}
                  {fb.customer_phone && (
                    <a
                      href={`tel:${fb.customer_phone}`}
                      className="inline-flex items-center gap-1 text-rose-600 hover:underline font-semibold"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{fb.customer_phone}</span>
                    </a>
                  )}
                  {fb.redirected_to_google && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                      Redirigé Google
                    </span>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                  fb.status === 'treated' ? 'bg-emerald-100 text-emerald-800' :
                  fb.status === 'archived' ? 'bg-slate-200 text-slate-700' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {fb.status === 'treated' ? 'Traité' : fb.status === 'archived' ? 'Archivé' : 'En attente'}
                </span>

                <div className="flex items-center gap-1">
                  {fb.status !== 'treated' && (
                    <button
                      onClick={() => handleUpdateStatus(fb.id, 'treated')}
                      className="p-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-semibold"
                      title="Marquer comme traité"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Traité</span>
                    </button>
                  )}
                  {fb.status !== 'archived' && (
                    <button
                      onClick={() => handleUpdateStatus(fb.id, 'archived')}
                      className="p-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg flex items-center gap-1 font-semibold"
                      title="Archiver"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archiver</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
