import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Star, ExternalLink, Palette, Store, Link2, AlertCircle } from 'lucide-react';
import { saveRestaurantSettings } from '../../lib/supabase';
import type { Restaurant } from '../../lib/types';
import { ImageUploader } from '../common/ImageUploader';


interface SettingsManagerProps {
  restaurant: Restaurant;
  onRestaurantUpdated?: (updated: Restaurant) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ restaurant, onRestaurantUpdated }) => {
  const [settings, setSettings] = useState<Restaurant>(restaurant);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setSettings(restaurant);
  }, [restaurant]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    const res = await saveRestaurantSettings(settings);
    setSaving(false);

    if (res.error) {
      showToast('error', `Échec de l'enregistrement : ${res.error}`);
    } else if (res.data) {
      setSettings(res.data);
      if (onRestaurantUpdated) {
        onRestaurantUpdated(res.data);
      }
      showToast('success', 'Paramètres et thème mis à jour avec succès dans Supabase !');
    }
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          Paramètres de l'Établissement
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Identifiant unique : <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-rose-600">{settings.id}</span> • Personnalisez votre marque et vos accès
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Restaurant Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-slate-500" />
                <span>Nom de l'établissement *</span>
              </label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Ex: Le Bistrot Gourmand"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-slate-500" />
                <span>Slug URL (court) *</span>
              </label>
              <input
                type="text"
                required
                value={settings.slug}
                onChange={(e) => setSettings({ ...settings, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                placeholder="ex: bistrot-gourmand"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            Lien d'accès public client : <strong className="text-slate-800 font-mono">{window.location.origin}/{settings.slug}</strong>
          </div>


          {/* Google Review URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Lien direct Google Avis (Fiche d'avis) *</span>
            </label>
            <input
              type="url"
              required
              value={settings.google_review_url}
              onChange={(e) => setSettings({ ...settings, google_review_url: e.target.value })}
              placeholder="https://search.google.com/local/writereview?placeid=..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Pour l'obtenir : Rendez-vous sur votre fiche Google Business Profile &gt; "Demander des avis" &gt; Copiez le lien court.
            </p>
          </div>

          {/* Star Threshold */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Seuil de redirection vers Google Avis</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, star_threshold: 4 })}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  settings.star_threshold === 4
                    ? 'border-rose-500 bg-rose-50/50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">4 & 5 étoiles (Recommandé)</div>
                <div className="text-xs text-slate-500 mt-1">
                  Redirige les clients satisfaits (4 et 5★) vers Google. Les 1, 2 et 3★ restent en privé.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, star_threshold: 5 })}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  settings.star_threshold === 5
                    ? 'border-rose-500 bg-rose-50/50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">5 étoiles uniquement</div>
                <div className="text-xs text-slate-500 mt-1">
                  Seuls les clients ayant mis la note maximale de 5★ sont invités sur Google.
                </div>
              </button>
            </div>
          </div>

          {/* Theme Colors Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-slate-500" />
              <span>Palette de Couleurs de Marque (Borne & Roue)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Couleur Principale
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme_primary || settings.primary_color || '#E11D48'}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value, theme_primary: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={settings.theme_primary || settings.primary_color || '#E11D48'}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value, theme_primary: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Couleur Secondaire
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme_secondary || '#F59E0B'}
                    onChange={(e) => setSettings({ ...settings, theme_secondary: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={settings.theme_secondary || '#F59E0B'}
                    onChange={(e) => setSettings({ ...settings, theme_secondary: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Couleur Accent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme_accent || '#10B981'}
                    onChange={(e) => setSettings({ ...settings, theme_accent: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={settings.theme_accent || '#10B981'}
                    onChange={(e) => setSettings({ ...settings, theme_accent: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Couleur Fond
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme_background || '#0F172A'}
                    onChange={(e) => setSettings({ ...settings, theme_background: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={settings.theme_background || '#0F172A'}
                    onChange={(e) => setSettings({ ...settings, theme_background: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant Logo Uploader */}
          <div>
            <ImageUploader
              value={settings.logo_url}
              onChange={(url) => setSettings({ ...settings, logo_url: url })}
              folder="logos"
              restaurantId={settings.id}
              label="Logo de l'Établissement (Affiché sur la Borne et les Avis)"
              helperText="PNG détouré ou SVG recommandé (Max 5 Mo)"
              aspectRatio="square"
            />
          </div>



          {/* Staff PIN Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Code PIN Staff / Caisse (4 chiffres)
            </label>
            <input
              type="text"
              maxLength={4}
              value={settings.pin_code || '1234'}
              onChange={(e) => setSettings({ ...settings, pin_code: e.target.value.replace(/\D/g, '') })}
              placeholder="1234"
              className="w-full sm:w-48 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-lg tracking-widest focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Code requis pour accéder à l'interface de validation des serveurs sur <span className="font-mono text-slate-600">/staff</span>.
            </p>
          </div>


          {/* Submit Button & Toast */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {toast ? (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                toast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{toast.text}</span>
              </div>
            ) : <div />}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement en cours...' : 'Sauvegarder les paramètres'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
