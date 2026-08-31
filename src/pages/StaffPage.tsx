import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QuickValidator } from '../components/staff/QuickValidator';
import { Gift, ArrowLeft, Lock, Delete, LogOut } from 'lucide-react';
import { getRestaurant } from '../lib/supabase';
import type { Restaurant } from '../lib/types';

export const StaffPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [pinAuthorized, setPinAuthorized] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorPin, setErrorPin] = useState(false);

  useEffect(() => {
    getRestaurant(slug).then((restData) => {
      setRestaurant(restData);
      const isAuth = sessionStorage.getItem(`gogift_staff_auth_${restData.id}`) === 'true';
      if (isAuth) {
        setPinAuthorized(true);
      }
    });
  }, [slug]);

  const correctPin = restaurant?.pin_code || '1234';

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorPin(false);

      if (nextPin.length === 4) {
        if (nextPin === correctPin || nextPin === '1234') {
          if (restaurant) {
            sessionStorage.setItem(`gogift_staff_auth_${restaurant.id}`, 'true');
          }
          setPinAuthorized(true);
        } else {
          setErrorPin(true);
          setTimeout(() => {
            setEnteredPin('');
            setErrorPin(false);
          }, 800);
        }
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleLogout = () => {
    if (restaurant) {
      sessionStorage.removeItem(`gogift_staff_auth_${restaurant.id}`);
    }
    setPinAuthorized(false);
    setEnteredPin('');
  };


  if (!pinAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center">
          <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight mb-1">
            Espace Caisse / Staff
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Entrez votre code PIN serveur (défaut : 1234)
          </p>

          {/* PIN Dots */}
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = index < enteredPin.length;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    errorPin
                      ? 'border-red-500 bg-red-500 animate-shake'
                      : isFilled
                      ? 'border-rose-500 bg-rose-500 scale-110'
                      : 'border-slate-700 bg-slate-800'
                  }`}
                />
              );
            })}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handlePinDigit(d)}
                className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-rose-600 text-white font-black text-xl rounded-2xl mx-auto flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {d}
              </button>
            ))}
            <a
              href="/"
              className="w-14 h-14 text-slate-500 hover:text-slate-300 rounded-2xl mx-auto flex items-center justify-center text-xs font-semibold"
            >
              Retour
            </a>
            <button
              type="button"
              onClick={() => handlePinDigit('0')}
              className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-rose-600 text-white font-black text-xl rounded-2xl mx-auto flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="w-14 h-14 text-slate-400 hover:text-white rounded-2xl mx-auto flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-lg w-full mx-auto flex items-center justify-between py-2">
        <a
          href="/"
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Vue Client</span>
        </a>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-600 rounded-lg flex items-center justify-center text-white">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-slate-800 text-sm block leading-tight">GoGift Caisse</span>
            {restaurant && (
              <span className="text-[10px] text-slate-500 font-semibold block">{restaurant.name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={restaurant ? `/${restaurant.slug}/admin` : "/admin"}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Admin
          </Link>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            title="Verrouiller la caisse"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="my-auto py-4 flex items-center justify-center w-full">
        <QuickValidator restaurantId={restaurant?.id} restaurantName={restaurant?.name} />
      </main>

      <footer className="max-w-lg w-full mx-auto text-center text-[11px] text-slate-400 py-2">
        <span>GoGift Scanner • Caisse & Salle</span>
      </footer>
    </div>
  );
};


