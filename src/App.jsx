import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import AuthPortal from './pages/client/AuthPortal';
import ClientHome from './pages/client/ClientHome';
import CampaignDetails from './pages/campaign/CampaignDetails';
import AdminClientApproval from './pages/client/AdminClientApproval';
import AdminChatDashboard from './pages/communication/adminChatDashboard';
import InvoiceManagement from './pages/finance/InvoiceManagement';
import MarketingDashboard from './pages/marketing/MarketingDashboard';
import OperationsCoordinationDashboard from './pages/operations/OperationsCoordinationDashboard';
import { getStoredAuthSession, clearAuthSession, saveAuthSession } from './pages/client/api';
import { BACKEND_API_ROUTES } from './services/api';
import {
  Home,
  Megaphone,
  UserCheck,
  MessageSquare,
  Receipt,
  TrendingUp,
  Briefcase,
  Shield,
  Building,
  LogOut,
} from 'lucide-react';

// Navigation items for Client accounts ONLY (Clients cannot see Admin tabs)
const CLIENT_NAV_ITEMS = [
  {
    path: BACKEND_API_ROUTES.CLIENT_HOME,
    label: 'Client Home & Chat',
    icon: Home,
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.CAMPAIGN,
    label: 'Post Ad Campaign',
    icon: Megaphone,
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
];

// Navigation items for Admin staff ONLY
const ADMIN_NAV_ITEMS = [
  {
    path: BACKEND_API_ROUTES.ADMIN_APPROVALS,
    label: 'Client Approvals',
    icon: UserCheck,
    activeColor: 'bg-[#FF2E63] text-white font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.ADMIN_CHAT,
    label: 'Admin Live Chat Desk',
    icon: MessageSquare,
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.FINANCE,
    label: 'Finance & Invoices',
    icon: Receipt,
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.MARKETING,
    label: 'Marketing & Analytics',
    icon: TrendingUp,
    activeColor: 'bg-[#FF2E63] text-white font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.OPERATIONS,
    label: 'Operations & Tasks',
    icon: Briefcase,
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
];

/**
 * Route protection wrapper for Client views.
 * Ensures unauthenticated users redirect to client login,
 * and admins redirect to admin approvals.
 */
function ClientRoute({ session, isClient, isAdmin, children }) {
  if (!session) {
    return <Navigate to={BACKEND_API_ROUTES.CLIENT_LOGIN} replace />;
  }
  if (isAdmin) {
    return <Navigate to={BACKEND_API_ROUTES.ADMIN_APPROVALS} replace />;
  }
  if (!isClient) {
    return <Navigate to={BACKEND_API_ROUTES.CLIENT_LOGIN} replace />;
  }
  return children;
}

/**
 * Route protection wrapper for Admin views.
 * Clients cannot access any admin works or tabs.
 */
function AdminRoute({ session, isClient, isAdmin, children }) {
  if (!session) {
    return <Navigate to={BACKEND_API_ROUTES.ADMIN_LOGIN} replace />;
  }
  if (isClient) {
    return <Navigate to={BACKEND_API_ROUTES.CLIENT_HOME} replace />;
  }
  if (!isAdmin) {
    return <Navigate to={BACKEND_API_ROUTES.ADMIN_LOGIN} replace />;
  }
  return children;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getStoredAuthSession());

  // Keep session synchronized on route changes and cross-tab/local storage changes
  useEffect(() => {
    const syncSession = () => {
      setSession(getStoredAuthSession());
    };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, []);

  useEffect(() => {
    setSession(getStoredAuthSession());
  }, [location.pathname]);

  const isClient = Boolean(
    session && (session.role === 'CLIENT' || (!session.role && (session.clientId || session.companyName)))
  );
  const isAdmin = Boolean(
    session && (session.role === 'ADMIN' || (!session.role && (session.adminType || session.adminId)))
  );
  const isAuthenticated = Boolean(session && (isClient || isAdmin));

  // Determine if currently on an auth interface (login/register)
  const isAuthRoute =
    location.pathname.startsWith('/api/client/login') ||
    location.pathname.startsWith('/api/client/register') ||
    location.pathname.startsWith('/api/client/auth') ||
    location.pathname.startsWith('/api/admin/login') ||
    location.pathname.startsWith('/api/admin/register') ||
    location.pathname.startsWith('/api/admin/auth') ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/auth';

  // Role-specific navigation items:
  // Only visible AFTER login/register, and strictly separated between client & admin
  const visibleNavItems = !isAuthenticated || isAuthRoute
    ? []
    : isClient
    ? CLIENT_NAV_ITEMS
    : isAdmin
    ? ADMIN_NAV_ITEMS
    : [];

  const handleClientLoginSuccess = (user) => {
    const sessionData = { ...user, role: user?.role || 'CLIENT' };
    saveAuthSession(sessionData);
    setSession(sessionData);
    navigate(BACKEND_API_ROUTES.CLIENT_HOME);
  };

  const handleAdminLoginSuccess = (user) => {
    const sessionData = { ...user, role: user?.role || 'ADMIN' };
    saveAuthSession(sessionData);
    setSession(sessionData);
    navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS);
  };

  const handleLogout = () => {
    const wasAdmin = isAdmin;
    clearAuthSession();
    setSession(null);
    navigate(wasAdmin ? BACKEND_API_ROUTES.ADMIN_LOGIN : BACKEND_API_ROUTES.CLIENT_LOGIN);
  };

  return (
    <div className="min-h-screen bg-[#EAEAEA] relative flex flex-col font-sans">
      {/* Top Navigation Bar - ONLY shown after login and with role-specific tabs */}
      {isAuthenticated && !isAuthRoute && (
        <nav className="bg-[#161B26] text-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">
            {/* Left: Brand / Logo */}
            <div className="flex items-center space-x-3">
              {isClient ? (
                <div className="px-3 py-1 bg-white text-[#161B26] font-extrabold text-xs sm:text-sm rounded shadow-xs tracking-wider uppercase border border-white/30 flex items-center gap-1.5 select-none">
                  <span className="w-2 h-2 rounded-full bg-[#08D9D6]"></span>
                  <span>Logo</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 font-bold tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF2E63] animate-pulse" />
                  <span className="text-white text-base font-extrabold tracking-tight">Add-an-Ad</span>
                  <span className="text-white/40">|</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-[#FF2E63]/20 text-[#FF2E63] border border-[#FF2E63]/30">
                    Admin Suite
                  </span>
                </div>
              )}
            </div>

            {/* Middle: Centered Add-an-Ad title for Client, or Admin tabs for Admin */}
            {isClient ? (
              <div className="absolute left-1/2 -translate-x-1/2 text-xl sm:text-2xl font-black tracking-wide text-white flex items-center gap-2 select-none">
                <span>Add-an-Ad</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={item.label}
                      className={({ isActive }) =>
                        `px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                          isActive
                            ? `${item.activeColor} shadow-xs scale-102`
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`
                      }
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}

            {/* Right: Authenticated User Badge & Logout Action */}
            <div className="flex items-center gap-3 text-xs">
              <div className="hidden sm:flex items-center gap-1.5 text-white/80">
                {isAdmin ? (
                  <Shield className="w-4 h-4 text-[#FF2E63]" />
                ) : (
                  <Building className="w-4 h-4 text-[#08D9D6]" />
                )}
                <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-[180px]">
                  {session?.firstName || session?.companyName || (isAdmin ? 'Admin' : 'Client')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-[#FF2E63] text-white hover:text-white transition-all cursor-pointer shadow-xs"
                title="Sign out of account"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        <Routes>
          {/* Root Redirect based on authentication & role */}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  isAdmin
                    ? BACKEND_API_ROUTES.ADMIN_APPROVALS
                    : isClient
                    ? BACKEND_API_ROUTES.CLIENT_HOME
                    : BACKEND_API_ROUTES.CLIENT_LOGIN
                }
                replace
              />
            }
          />

          {/* 1. Client & Admin Authentication Routes */}
          <Route
            path={BACKEND_API_ROUTES.CLIENT_AUTH}
            element={
              <AuthPortal
                initialRole="client"
                initialMode="login"
                onClientLoginSuccess={handleClientLoginSuccess}
                onAdminLoginSuccess={handleAdminLoginSuccess}
                onNavigateToApprovals={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CLIENT_LOGIN}
            element={
              <AuthPortal
                initialRole="client"
                initialMode="login"
                onClientLoginSuccess={handleClientLoginSuccess}
                onAdminLoginSuccess={handleAdminLoginSuccess}
                onNavigateToApprovals={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CLIENT_REGISTER}
            element={
              <AuthPortal
                initialRole="client"
                initialMode="register"
                onClientLoginSuccess={handleClientLoginSuccess}
                onAdminLoginSuccess={handleAdminLoginSuccess}
                onNavigateToApprovals={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.ADMIN_AUTH}
            element={
              <AuthPortal
                initialRole="admin"
                initialMode="login"
                onClientLoginSuccess={handleClientLoginSuccess}
                onAdminLoginSuccess={handleAdminLoginSuccess}
                onNavigateToApprovals={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.ADMIN_LOGIN}
            element={
              <AuthPortal
                initialRole="admin"
                initialMode="login"
                onClientLoginSuccess={handleClientLoginSuccess}
                onAdminLoginSuccess={handleAdminLoginSuccess}
                onNavigateToApprovals={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.ADMIN_REGISTER}
            element={
              <AuthPortal
                initialRole="admin"
                initialMode="register"
                onClientLoginSuccess={handleClientLoginSuccess}
                onAdminLoginSuccess={handleAdminLoginSuccess}
                onNavigateToApprovals={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
              />
            }
          />
          <Route
            path="/api/client"
            element={<Navigate to={BACKEND_API_ROUTES.CLIENT_HOME} replace />}
          />
          <Route
            path="/api/admin"
            element={<Navigate to={BACKEND_API_ROUTES.ADMIN_APPROVALS} replace />}
          />

          {/* 2. Client Home & Client Profile (/api/client/home) - CLIENT ONLY */}
          <Route
            path={BACKEND_API_ROUTES.CLIENT_HOME}
            element={
              <ClientRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <ClientHome
                  onPostAdvertisement={() => navigate(BACKEND_API_ROUTES.CAMPAIGN)}
                  onLogout={handleLogout}
                />
              </ClientRoute>
            }
          />

          {/* 3. Campaign Controller Routes (/api/campaign) - CLIENT ONLY */}
          <Route
            path={BACKEND_API_ROUTES.CAMPAIGN}
            element={
              <ClientRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <CampaignDetails
                  onBackToHome={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
                  onCampaignCreated={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
                />
              </ClientRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CAMPAIGN_CREATE}
            element={
              <ClientRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <CampaignDetails
                  onBackToHome={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
                  onCampaignCreated={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
                />
              </ClientRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CAMPAIGN_DETAILS}
            element={
              <ClientRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <CampaignDetails
                  onBackToHome={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
                  onCampaignCreated={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
                />
              </ClientRoute>
            }
          />

          {/* 4. Admin Approvals Route (/api/admin/approvals) - ADMIN ONLY */}
          <Route
            path={BACKEND_API_ROUTES.ADMIN_APPROVALS}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <AdminClientApproval
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />
          <Route
            path="/api/admin/clients"
            element={<Navigate to={BACKEND_API_ROUTES.ADMIN_APPROVALS} replace />}
          />

          {/* 5. Live Communication & Chat Routes - Role protected */}
          <Route
            path={BACKEND_API_ROUTES.ADMIN_CHAT}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <AdminChatDashboard
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CLIENT_CHAT}
            element={
              <ClientRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <ClientHome
                  onPostAdvertisement={() => navigate(BACKEND_API_ROUTES.CAMPAIGN)}
                  onLogout={handleLogout}
                />
              </ClientRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.COMMUNICATION}
            element={<Navigate to={BACKEND_API_ROUTES.ADMIN_CHAT} replace />}
          />

          {/* 6. Finance & Invoices Routes (/api/finance) - ADMIN ONLY */}
          <Route
            path={BACKEND_API_ROUTES.FINANCE}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <InvoiceManagement
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.FINANCE_INVOICES}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <InvoiceManagement
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.FINANCE_REPORT}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <InvoiceManagement
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />

          {/* 7. Marketing & Analytics Routes (/api/marketing) - ADMIN ONLY */}
          <Route
            path={BACKEND_API_ROUTES.MARKETING}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <MarketingDashboard
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.MARKETING_ANALYSIS}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <MarketingDashboard
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />
          <Route
            path="/api/marketing/analytics"
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <MarketingDashboard
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />

          {/* 8. Operations & Task Coordination Routes - ADMIN ONLY */}
          <Route
            path={BACKEND_API_ROUTES.OPERATIONS}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <OperationsCoordinationDashboard
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CLIENT_TASKS}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <OperationsCoordinationDashboard
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.COORDINATOR_TASKS}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <OperationsCoordinationDashboard
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />
          <Route
            path={BACKEND_API_ROUTES.EMPLOYEE_TASKS}
            element={
              <AdminRoute session={session} isClient={isClient} isAdmin={isAdmin}>
                <OperationsCoordinationDashboard
                  onBackToDashboard={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
                />
              </AdminRoute>
            }
          />

          {/* Legacy / Direct Path Aliases */}
          <Route path="/auth" element={<Navigate to={BACKEND_API_ROUTES.CLIENT_LOGIN} replace />} />
          <Route path="/login" element={<Navigate to={BACKEND_API_ROUTES.CLIENT_LOGIN} replace />} />
          <Route path="/register" element={<Navigate to={BACKEND_API_ROUTES.CLIENT_REGISTER} replace />} />
          <Route path="/client-home" element={<Navigate to={BACKEND_API_ROUTES.CLIENT_HOME} replace />} />
          <Route path="/campaign" element={<Navigate to={BACKEND_API_ROUTES.CAMPAIGN} replace />} />
          <Route path="/campaign-details" element={<Navigate to={BACKEND_API_ROUTES.CAMPAIGN} replace />} />
          <Route path="/admin-approvals" element={<Navigate to={BACKEND_API_ROUTES.ADMIN_APPROVALS} replace />} />
          <Route path="/admin-chat" element={<Navigate to={BACKEND_API_ROUTES.ADMIN_CHAT} replace />} />
          <Route path="/finance" element={<Navigate to={BACKEND_API_ROUTES.FINANCE} replace />} />
          <Route path="/marketing" element={<Navigate to={BACKEND_API_ROUTES.MARKETING} replace />} />
          <Route path="/operations" element={<Navigate to={BACKEND_API_ROUTES.OPERATIONS} replace />} />

          {/* Catch-all redirect */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  isAdmin
                    ? BACKEND_API_ROUTES.ADMIN_APPROVALS
                    : isClient
                    ? BACKEND_API_ROUTES.CLIENT_HOME
                    : BACKEND_API_ROUTES.CLIENT_LOGIN
                }
                replace
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
