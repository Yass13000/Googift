import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Gift, Star } from 'lucide-react';
import type { Restaurant } from '../../lib/types';

interface TableQrPosterProps {
  restaurant: Restaurant;
}

export const TableQrPoster: React.FC<TableQrPosterProps> = ({ restaurant }) => {
  const [customTitle, setCustomTitle] = useState('Votre avis nous intéresse !');
  const [customSubtitle, setCustomSubtitle] = useState('Scannez pour tenter de remporter un cadeau immédiat à la Roue de la Fortune !');

  const clientUrl = `${window.location.origin}/${restaurant.slug}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Chevalets & Affiches QR Code de Table
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Générez et imprimez vos supports de table pour inviter vos clients à flasher et jouer
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer le Chevalet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customization controls */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Personnaliser l'affiche
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Titre principal</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Texte explicatif</label>
            <textarea
              rows={3}
              value={customSubtitle}
              onChange={(e) => setCustomSubtitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none resize-none"
            />
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 space-y-1">
            <strong>💡 Conseil Pro :</strong>
            <p>Placez ce chevalet au centre des tables, près du sel/poivre ou sur l'additionnier lors du paiement.</p>
          </div>
        </div>

        {/* Printable Poster Preview */}
        <div className="lg:col-span-2 flex justify-center">
          <div
            id="printable-poster"
            className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border-4 border-slate-900 text-center flex flex-col items-center relative overflow-hidden"
          >
            {/* Top brand header */}
            <div
              className="w-full py-2.5 px-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider mb-4 shadow-sm"
              style={{ backgroundColor: restaurant.primary_color }}
            >
              {restaurant.name}
            </div>


            {/* Stars row */}
            <div className="flex gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug mb-2">
              {customTitle}
            </h3>

            <p className="text-xs text-slate-600 mb-6 px-2 leading-relaxed">
              {customSubtitle}
            </p>

            {/* QR Code Container */}
            <div className="p-4 bg-slate-50 rounded-3xl border-2 border-slate-200 shadow-inner flex flex-col items-center mb-6">
              <QRCodeSVG
                value={clientUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Flashez avec votre smartphone
              </span>
            </div>

            {/* Bottom Reward Callout */}
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold">
              <Gift className="w-4 h-4 shrink-0 text-rose-600 animate-bounce" />
              <span>1 Tour de Roue OFFERT par table !</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
