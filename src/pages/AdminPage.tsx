import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminLoginPage } from './AdminLoginPage';
import { supabase, getRestaurant, getAllRestaurants } from '../lib/supabase';
import type { Restaurant } from '../lib/types';

export const AdminPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    // Check if session or localStorage token is present
    const localLogged = localStorage.getItem('gogift_admin_logged') === 'true';
    if (localLogged) {
      setIsAuthenticated(true);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsAuthenticated(true);
        }
      });
    }

    // Load active restaurant and all available tenants
    Promise.all([
      getRestaurant(slug),
      getAllRestaurants()
    ]).then(([currentRest, list]) => {
      setRestaurant(currentRest);
      setAllRestaurants(list);
      setCheckingAuth(false);
    });
  }, [slug]);

  const handleLogout = async () => {
    localStorage.removeItem('gogift_admin_logged');
    await supabase.auth.signOut().catch(() => {});
    setIsAuthenticated(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        Chargement des données de l'établissement...
      </div>
    );
  }

  return (
    <AdminLayout
      restaurant={restaurant}
      allRestaurants={allRestaurants}
      onSelectRestaurant={(newRest) => setRestaurant(newRest)}
      onRestaurantUpdated={(updated) => {
        setRestaurant(updated);
        setAllRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
      }}
      onLogout={handleLogout}
    />
  );
};

