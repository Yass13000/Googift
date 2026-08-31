import React, { useState } from 'react';
import { Gift, Lock, ArrowRight, AlertCircle, Store, Mail, Key } from 'lucide-react';
import { authenticateRestaurantAdmin } from '../lib/supabase';

interface AdminLoginPageProps {
  onLoginSuccess: (slug?: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [restaurantId, setRestaurantId] = useState('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await authenticateRestaurantAdmin(restaurantId.trim(), email.trim(), password);
    setLoading(false);

    if (res.success && res.restaurant) {
      onLoginSuccess(res.restaurant.slug);
    } else {
      setErrorMsg(res.error || 'Identifiants ou restaurant invalides.');
    }
  };

  const handleDemoAccess = () => {
    localStorage.setItem('gogift_admin_logged', 'true');
    localStorage.setItem('gogift_active_restaurant_id', 'demo01');
    onLoginSuccess('demo');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-800 text-center">
        <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-4">
          <Gift className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-1">
          GoGift Admin
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Espace sécurisé pour les gérants & propriétaires
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>ID Restaurant ou Slug *</span>
            </label>
            <input
              type="text"
              required
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value.toLowerCase())}
              placeholder="ex: ks0001 ou krousty-sabaidi"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Email *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@restaurant.fr"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>Mot de passe *</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{loading ? 'Connexion en cours...' : 'Se connecter au Dashboard'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={handleDemoAccess}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Accès Direct Établissement Démo</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

