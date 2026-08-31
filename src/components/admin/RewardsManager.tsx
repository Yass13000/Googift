import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { getAllRewards, saveReward, deleteReward, toggleRewardActive } from '../../lib/supabase';
import type { Reward } from '../../lib/types';
import { DynamicIcon, POPULAR_ICONS } from '../../lib/icons';
import { ImageUploader } from '../common/ImageUploader';



const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', 
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'
];

interface RewardsManagerProps {
  restaurantId: string;
}

export const RewardsManager: React.FC<RewardsManagerProps> = ({ restaurantId }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchRewards();
  }, [restaurantId]);

  const fetchRewards = async () => {
    setLoading(true);
    const data = await getAllRewards(restaurantId);
    setRewards(data);
    setLoading(false);
  };

  const totalProbability = rewards
    .filter(r => r.is_active)
    .reduce((sum, r) => sum + (Number(r.probability) || 0), 0);

  const handleOpenAdd = () => {
    setEditingReward({
      restaurant_id: restaurantId,
      label: '',
      icon: 'Gift',
      image_url: '',
      color: PRESET_COLORS[rewards.length % PRESET_COLORS.length],
      probability: 10,
      max_claims: null,
      current_claims: 0,
      is_active: true,
      display_order: rewards.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reward: Reward) => {
    setEditingReward({ ...reward });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward || !editingReward.label) return;
    setSaveLoading(true);

    const res = await saveReward(restaurantId, editingReward);
    setSaveLoading(false);

    if (res.error) {
      showToast('error', `Échec : ${res.error}`);
    } else {
      setIsModalOpen(false);
      showToast('success', 'Lot enregistré avec succès dans la base !');
      await fetchRewards();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lot de la roue ?')) return;
    
    // Optimistic delete
    setRewards(prev => prev.filter(r => r.id !== id));
    
    const res = await deleteReward(id);
    if (res.error) {
      showToast('error', `Erreur lors de la suppression : ${res.error}`);
      fetchRewards();
    } else {
      showToast('success', 'Lot supprimé avec succès.');
      fetchRewards();
    }
  };

  const handleToggleActive = async (reward: Reward) => {
    const nextState = !reward.is_active;
    
    // Optimistic toggle
    setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, is_active: nextState } : r));

    const res = await toggleRewardActive(reward.id, nextState);
    if (res.error) {
      showToast('error', `Erreur lors de la mise à jour : ${res.error}`);
      fetchRewards();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Lots de la Roue Cadeaux
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurez les segments de la roue, les images PNG, les probabilités et les stocks
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Lot</span>
        </button>
      </div>

      {/* Probabilities Banner */}
      <div className={`p-4 rounded-2xl flex items-center justify-between border ${
        totalProbability === 100 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <div className="flex items-center gap-2">
          {totalProbability === 100 ? (
            <Check className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          )}
          <span className="text-xs font-semibold">
            Somme des probabilités des lots actifs : <strong>{totalProbability}%</strong>
            {totalProbability !== 100 && ' (Recommandé : Ajustez les lots pour atteindre exactement 100%)'}
          </span>
        </div>
      </div>

      {toast && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-fadeIn ${
          toast.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}


      {/* Rewards List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Chargement des lots...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
          <div
            key={reward.id}
            className={`p-4 rounded-2xl bg-white border shadow-sm transition-all flex flex-col justify-between ${
              reward.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: reward.color }}
                  >
                    <DynamicIcon name={reward.icon} className="w-5 h-5" />
                  </div>
                  {reward.image_url && (
                    <img
                      src={reward.image_url}
                      alt={reward.label}
                      className="w-10 h-10 object-contain rounded-xl bg-slate-100 border border-slate-200 p-1 shrink-0"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(reward)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      reward.is_active 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {reward.is_active ? 'Actif' : 'Désactivé'}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(reward)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(reward.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-base text-slate-800 tracking-tight">
                {reward.label}
              </h3>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                Probabilité : {reward.probability}%
              </span>
              <span>
                Gagné : <strong>{reward.current_claims || 0}</strong> {reward.max_claims ? `/ ${reward.max_claims}` : '(illimité)'}
              </span>
            </div>
          </div>
        ))}
      </div>
      )}


      {/* Modal Add / Edit */}
      {isModalOpen && editingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-800 mb-4">
              {editingReward.id ? 'Modifier le lot' : 'Ajouter un nouveau lot'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Intitulé du lot *
                </label>
                <input
                  type="text"
                  required
                  value={editingReward.label || ''}
                  onChange={(e) => setEditingReward({ ...editingReward, label: e.target.value })}
                  placeholder="Ex: Café offert, -15% addition, Dessert maison"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Image PNG Drag & Drop Uploader */}
              <div>
                <ImageUploader
                  value={editingReward.image_url}
                  onChange={(url) => setEditingReward({ ...editingReward, image_url: url })}
                  folder="rewards"
                  restaurantId={restaurantId}
                  label="Image PNG du lot (Affichée sur le segment de la roue)"
                  helperText="PNG transparent détouré 200×200 px recommandé (Max 5 Mo)"
                  aspectRatio="square"
                />
              </div>


              {/* Color selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Couleur du segment
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingReward({ ...editingReward, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        editingReward.color === c ? 'scale-125 ring-2 ring-slate-800' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Icône vectorielle de secours
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {POPULAR_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setEditingReward({ ...editingReward, icon: iconName })}
                      className={`p-2 rounded-lg transition-all ${
                        editingReward.icon === iconName 
                          ? 'bg-rose-500 text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <DynamicIcon name={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Probability */}

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Chance de gain (Probabilité)</span>
                  <span className="text-rose-600 font-extrabold">{editingReward.probability}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={editingReward.probability || 10}
                  onChange={(e) => setEditingReward({ ...editingReward, probability: Number(e.target.value) })}
                  className="w-full accent-rose-600"
                />
              </div>

              {/* Max Stock */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stock maximum (laisser vide pour illimité)
                </label>
                <input
                  type="number"
                  value={editingReward.max_claims || ''}
                  onChange={(e) => setEditingReward({ ...editingReward, max_claims: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 50 (illimité si vide)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md disabled:opacity-50"
                >
                  {saveLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
