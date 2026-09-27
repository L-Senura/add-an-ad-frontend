import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import ClientRegister from './ClientRegister';
import AdminRegister from './AdminRegister';
import ClientLogin from './ClientLogin';
import AdminLogin from './AdminLogin';
import { getStoredAuthSession, clearAuthSession } from './api';
import { Shield, Building, LogOut } from 'lucide-react';

/**
 * Main Portal coordinating Client & Admin Authentication
 * Synchronizes with backend URL routes in browser address bar:
 * - /api/client/login
 * - /api/client/register
 * - /api/admin/login
 * - /api/admin/register
 */
export default function AuthPortal({
  initialRole = 'client',
  initialMode = 'login',
  onClientLoginSuccess,
  onAdminLoginSuccess,
  onNavigateToApprovals,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive activeRole and activeMode directly from current browser URL
  const activeRole = location.pathname.includes('/admin')
    ? 'admin'
    : location.pathname.includes('/client')
    ? 'client'
    : initialRole;

  const activeMode = location.pathname.includes('register')
    ? 'register'
    : location.pathname.includes('login')
    ? 'login'
    : initialMode;

  const [activeSession, setActiveSession] = useState(() => getStoredAuthSession());

  const handleModeChange = (mode) => {
    navigate(`/api/${activeRole}/${mode}`, { replace: true });
  };

  const handleLogout = () => {
    clearAuthSession();
    setActiveSession(null);
  };

  // Dynamic titles based on role and mode
  const getTitle = () => {
    if (activeRole === 'client') {
      return activeMode === 'register' ? 'Register Your Agency' : 'Client Login';
    } else {
      return activeMode === 'register' ? 'Register As Admin' : 'Admin Login';
    }
  };

  const getSubtitle = () => {
    if (activeRole === 'client') {
      return activeMode === 'register'
        ? 'Create your advertising agency account to access campaigns and marketing analytics'
        : 'Sign in to access your advertising dashboard and campaign allocations';
    } else {
      return activeMode === 'register'
        ? 'Create an internal administrator account for operations, marketing, finance, or comms'
        : 'Sign in to your administration control portal';
    }
  };

  return (
    <AuthLayout
      title={getTitle()}
      subtitle={getSubtitle()}
      activeRole={activeRole}
      activeMode={activeMode}
      onModeChange={handleModeChange}
    >
      {/* Active session bar if user is currently authenticated */}
      {activeSession && (
        <div
          className="mb-6 p-3 rounded-2xl border text-xs flex items-center justify-between"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'rgba(37, 42, 52, 0.15)',
          }}
        >
          <div className="flex items-center gap-2">
            {activeSession.role === 'ADMIN' ? (
              <Shield className="w-4 h-4" style={{ color: '#FF2E63' }} />
            ) : (
              <Building className="w-4 h-4" style={{ color: '#08D9D6' }} />
            )}
            <div>
              <span className="font-bold text-gray-800">
                {activeSession.firstName} ({activeSession.role})
              </span>{' '}
              <span className="text-gray-500 hidden sm:inline">
                • {activeSession.email}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      )}

      {/* Render selected view matching wireframes */}
      {activeRole === 'client' && activeMode === 'register' && (
        <ClientRegister
          onNavigateToLogin={() => handleModeChange('login')}
        />
      )}

      {activeRole === 'client' && activeMode === 'login' && (
        <ClientLogin
          onNavigateToRegister={() => handleModeChange('register')}
          onLoginSuccess={(user) => {
            setActiveSession(user);
            if (onClientLoginSuccess) {
              onClientLoginSuccess(user);
            }
          }}
        />
      )}

      {activeRole === 'admin' && activeMode === 'register' && (
        <AdminRegister
          onNavigateToLogin={() => handleModeChange('login')}
        />
      )}

      {activeRole === 'admin' && activeMode === 'login' && (
        <AdminLogin
          onNavigateToRegister={() => handleModeChange('register')}
          onNavigateToApprovals={onNavigateToApprovals}
          onLoginSuccess={(user) => {
            setActiveSession(user);
            if (onAdminLoginSuccess) {
              onAdminLoginSuccess(user);
            }
          }}
        />
      )}
    </AuthLayout>
  );
}
