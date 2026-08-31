import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Search, CheckCircle2, XCircle, AlertTriangle, Camera, CameraOff, Sparkles, ShieldCheck } from 'lucide-react';
import { getClaimedPrizeByCode, redeemClaimedPrize } from '../../lib/supabase';
import type { ClaimedPrize } from '../../lib/types';

interface QuickValidatorProps {
  restaurantId?: string;
  restaurantName?: string;
}

export const QuickValidator: React.FC<QuickValidatorProps> = ({ restaurantId, restaurantName }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [prize, setPrize] = useState<ClaimedPrize | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Check URL query param ?code=WIN-XXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      handleLookup(urlCode.toUpperCase());
    }
  }, [restaurantId]);

  const handleLookup = async (lookupCode: string) => {
    if (!lookupCode.trim()) return;
    setLoading(true);
    setNotFound(false);
    setRedeemSuccess(false);

    const found = await getClaimedPrizeByCode(lookupCode, restaurantId);
    setLoading(false);
    if (found) {
      setPrize(found);
    } else {
      setPrize(null);
      setNotFound(true);
    }
  };


  const handleRedeem = async () => {
    if (!prize) return;
    setLoading(true);
    const res = await redeemClaimedPrize(prize.id);
    setLoading(false);
    if (res.success) {
      setRedeemSuccess(true);
      setPrize({
        ...prize,
        is_redeemed: true,
        redeemed_at: new Date().toISOString()
      });
    }
  };

  // Camera QR Scanner toggle
  const toggleScanner = async () => {
    if (scannerActive) {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {
          // Ignore stop errors
        }
      }
      setScannerActive(false);
    } else {
      setCameraError(null);
      setScannerActive(true);
      setTimeout(async () => {
        try {
          const qrScanner = new Html5Qrcode('qr-reader');
          html5QrCodeRef.current = qrScanner;
          await qrScanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              // Extract code from text/URL if needed
              let extractedCode = decodedText;
              if (decodedText.includes('code=')) {
                try {
                  const url = new URL(decodedText);
                  extractedCode = url.searchParams.get('code') || decodedText;
                } catch {
                  const match = decodedText.match(/code=([A-Za-z0-9_-]+)/);
                  if (match) extractedCode = match[1];
                }
              }
              setCode(extractedCode);
              handleLookup(extractedCode);
              // Stop camera
              qrScanner.stop().catch(() => {});
              setScannerActive(false);
            },
            () => {}
          );
        } catch (err: any) {
          setCameraError(err.message || 'Impossible d\'accéder à la caméra');
          setScannerActive(false);
        }
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const isExpired = prize ? new Date(prize.expires_at).getTime() < Date.now() : false;

  return (
    <div className="flex flex-col items-center max-w-lg w-full mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="w-full text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Espace Caisse / Serveur</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Validation des Coupons Lots
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {restaurantName ? `Établissement : ${restaurantName} • ` : ''}Scannez le QR code client ou entrez son code court
        </p>
      </div>


      {/* Input Box & Scanner Action */}
      <div className="w-full bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup(code);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Code du Coupon (ex: WIN-8X2A)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="WIN-XXXX"
                  className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono font-bold text-lg text-slate-800 uppercase focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-4" />
              </div>

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all disabled:opacity-50"
              >
                {loading ? '...' : 'Vérifier'}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={toggleScanner}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all border ${
                scannerActive
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {scannerActive ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span>Fermer le Scanner Caméra</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-rose-600" />
                  <span>Scanner un QR Code avec la caméra</span>
                </>
              )}
            </button>
          </div>
        </form>

        {cameraError && (
          <p className="text-xs text-red-600 mt-2 text-center">{cameraError}</p>
        )}

        {/* QR Code Scanner Element */}
        {scannerActive && (
          <div className="mt-4 rounded-2xl overflow-hidden border-2 border-slate-300">
            <div id="qr-reader" className="w-full" />
          </div>
        )}
      </div>

      {/* Result Card */}
      {notFound && (
        <div className="w-full bg-red-50 border border-red-200 text-red-800 p-5 rounded-2xl text-center flex flex-col items-center animate-fadeIn">
          <XCircle className="w-10 h-10 text-red-500 mb-2" />
          <h3 className="font-bold text-base">Coupon introuvable</h3>
          <p className="text-xs text-red-600 mt-1">
            Vérifiez l'orthographe du code ou assurez-vous que le coupon provient bien de cet établissement.
          </p>
        </div>
      )}

      {prize && (
        <div className="w-full bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center animate-fadeIn">
          {/* Status Badge */}
          {prize.is_redeemed ? (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>DÉJÀ UTILISÉ / ENCAISSÉ</span>
            </div>
          ) : isExpired ? (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-800 border border-red-200 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>COUPON EXPIRÉ</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>VALIDE & UTILISABLE</span>
            </div>
          )}

          <span className="text-xs text-slate-400 font-mono tracking-widest">
            {prize.claim_code}
          </span>
          <h2 className="text-2xl font-black text-slate-800 mt-1 mb-2">
            {prize.reward_label}
          </h2>

          <div className="w-full bg-slate-50 rounded-2xl p-4 my-4 text-left text-xs space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Créé le :</span>
              <span className="font-semibold text-slate-700">
                {new Date(prize.created_at).toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expire le :</span>
              <span className="font-semibold text-slate-700">
                {new Date(prize.expires_at).toLocaleString('fr-FR')}
              </span>
            </div>
            {prize.is_redeemed && prize.redeemed_at && (
              <div className="flex justify-between text-amber-700 font-semibold border-t border-slate-200 pt-2">
                <span>Validé le :</span>
                <span>{new Date(prize.redeemed_at).toLocaleString('fr-FR')}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {!prize.is_redeemed && (
            <button
              onClick={handleRedeem}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Valider le lot / Encaisser</span>
            </button>
          )}

          {redeemSuccess && (
            <div className="w-full mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Le lot a été marqué comme utilisé avec succès !</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
