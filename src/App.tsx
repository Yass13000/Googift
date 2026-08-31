import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClientPage } from './pages/ClientPage';
import { ClaimPage } from './pages/ClaimPage';
import { StaffPage } from './pages/StaffPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { KioskPage } from './pages/KioskPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Mobile-first Flow (Root & Tenant Slug) */}
        <Route path="/" element={<ClientPage />} />
        <Route path="/r/:slug" element={<ClientPage />} />
        <Route path="/claim/:code" element={<ClaimPage />} />

        {/* Counter Kiosk / Screen Display Mode */}
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="/:slug/kiosk" element={<KioskPage />} />
        <Route path="/r/:slug/kiosk" element={<KioskPage />} />

        {/* Staff / Cashier Code Validator (Global & Tenant Slug) */}
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/valider" element={<StaffPage />} />
        <Route path="/:slug/staff" element={<StaffPage />} />
        <Route path="/:slug/valider" element={<StaffPage />} />

        {/* Admin Dashboard & Auth (Global & Tenant Slug) */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/:slug/admin" element={<AdminPage />} />
        <Route path="/login" element={<AdminLoginPage onLoginSuccess={(slug) => { window.location.href = slug ? `/${slug}/admin` : '/admin'; }} />} />
        <Route path="/admin/login" element={<AdminLoginPage onLoginSuccess={(slug) => { window.location.href = slug ? `/${slug}/admin` : '/admin'; }} />} />

        {/* Tenant Short Slug / Root Slug (e.g. /lospollos or /demo) */}
        <Route path="/:slug" element={<ClientPage />} />

        {/* Catch-all redirect to client view */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};




export default App;
