import React, { useState } from 'react';
import { 
  LayoutDashboard, Gift, MessageSquare, History, Settings as SettingsIcon, 
  QrCode, ExternalLink, LogOut, CheckSquare, Tv, MonitorPlay
} from 'lucide-react';


import { DashboardStats } from './DashboardStats';
import { RewardsManager } from './RewardsManager';
import { ReviewsInbox } from './ReviewsInbox';
import { ClaimHistory } from './ClaimHistory';
import { SettingsManager } from './SettingsManager';
import { TableQrPoster } from './TableQrPoster';
import type { Restaurant } from '../../lib/types';


interface AdminLayoutProps {
  restaurant: Restaurant;
  allRestaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onRestaurantUpdated: (restaurant: Restaurant) => void;
  onLogout?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  restaurant,
  allRestaurants,
  onSelectRestaurant,
  onRestaurantUpdated,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    'stats' | 'rewards' | 'reviews' | 'history' | 'settings' | 'poster'
  >('stats');

  const navigation = [
    { id: 'stats', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { id: 'rewards', label: 'Lots de la Roue', icon: Gift },
    { id: 'reviews', label: 'Avis Privés Clients', icon: MessageSquare },
    { id: 'history', label: 'Historique Gains', icon: History },
    { id: 'poster', label: 'Chevalets Table QR', icon: QrCode },
    { id: 'settings', label: 'Paramètres & Marque', icon: SettingsIcon },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shrink-0 border-r border-slate-800">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-3 py-3 mb-3 border-b border-slate-800">
            <div className="w-10 h-10 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-black text-white text-base tracking-tight leading-none truncate">
                GoGift Admin
              </h1>
              <span className="text-[10px] text-slate-400 font-medium block truncate mt-1">
                Multi-Établissements
              </span>
            </div>
          </div>

          {/* Restaurant Tenant Selector */}
          <div className="mb-4 px-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Établissement Actif :
            </label>
            <select
              value={restaurant.id}
              onChange={(e) => {
                const selected = allRestaurants.find(r => r.id === e.target.value);
                if (selected) onSelectRestaurant(selected);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              {allRestaurants.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.name} ({r.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Direct Launch Kiosk Mode Button in Sidebar */}
          <div className="mb-3 px-1">
            <a
              href={`/${restaurant.slug}/kiosk`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 text-white text-xs font-black shadow-lg shadow-rose-900/30 hover:opacity-95 transition-all cursor-pointer group animate-pulse"
            >
              <Tv className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Lancer Mode Borne QR</span>
            </a>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Links / Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <a
            href={`/${restaurant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Vue Client ({restaurant.slug})</span>
            </span>
          </a>

          <a
            href={`/${restaurant.slug}/staff`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Caisse Serveur</span>
            </span>
          </a>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Action Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200"
              />
            )}
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight leading-tight">
                {restaurant.name}
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">
                ID : {restaurant.id} • Slug : /{restaurant.slug}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={`/${restaurant.slug}/kiosk`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <MonitorPlay className="w-4 h-4 text-amber-400" />
              <span>Lancer le Mode Borne / Présentoir QR</span>
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
          {activeTab === 'stats' && <DashboardStats restaurantId={restaurant.id} />}
          {activeTab === 'rewards' && <RewardsManager restaurantId={restaurant.id} restaurantSlug={restaurant.slug} />}
          {activeTab === 'reviews' && <ReviewsInbox restaurantId={restaurant.id} />}

          {activeTab === 'history' && <ClaimHistory restaurantId={restaurant.id} />}
          {activeTab === 'poster' && <TableQrPoster restaurant={restaurant} />}
          {activeTab === 'settings' && (
            <SettingsManager
              restaurant={restaurant}
              onRestaurantUpdated={onRestaurantUpdated}
            />
          )}
        </main>
      </div>
    </div>
  );
};


