import React from 'react';
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import AuthPortal from './pages/client/AuthPortal';
import ClientHome from './pages/client/ClientHome';
import CampaignDetails from './pages/campaign/CampaignDetails';
import AdminClientApproval from './pages/client/AdminClientApproval';
import AdminChatDashboard from './pages/communication/adminChatDashboard';
import InvoiceManagement from './pages/finance/InvoiceManagement';
import MarketingDashboard from './pages/marketing/MarketingDashboard';
import OperationsCoordinationDashboard from './pages/operations/OperationsCoordinationDashboard';
import { getStoredAuthSession, clearAuthSession } from './pages/client/api';
import { BACKEND_API_ROUTES } from './services/api';
import {
  Home,
  Megaphone,
  KeyRound,
  UserCheck,
  MessageSquare,
  Receipt,
  TrendingUp,
  Briefcase,
  Globe,
} from 'lucide-react';

// Navigation items linked to backend API address paths
const NAV_ITEMS = [
  {
    path: BACKEND_API_ROUTES.CLIENT_HOME,
    label: 'Client Home & Chat',
    icon: Home,
    controller: 'ClientController (/api/client)',
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.CAMPAIGN,
    label: 'Post Ad Campaign',
    icon: Megaphone,
    controller: 'CampaignController (/api/campaign)',
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.ADMIN_APPROVALS,
    label: 'Client Approvals',
    icon: UserCheck,
    controller: 'AdminController (/api/admin)',
    activeColor: 'bg-[#FF2E63] text-white font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.ADMIN_CHAT,
    label: 'Admin Live Chat Desk',
    icon: MessageSquare,
    controller: 'AdminChatController (/api/admin_chat)',
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.FINANCE,
    label: 'Finance & Invoices',
    icon: Receipt,
    controller: 'FinanceController (/api/finance)',
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.MARKETING,
    label: 'Marketing & Analytics',
    icon: TrendingUp,
    controller: 'MarketingController (/api/marketing)',
    activeColor: 'bg-[#FF2E63] text-white font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.OPERATIONS,
    label: 'Operations & Tasks',
    icon: Briefcase,
    controller: 'ClientTaskController (/api/client_tasks)',
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
  {
    path: BACKEND_API_ROUTES.CLIENT_AUTH,
    label: 'Auth Portal',
    icon: KeyRound,
    controller: 'Client & Admin Auth (/api/client/auth)',
    activeColor: 'bg-[#08D9D6] text-[#252A34] font-bold shadow-xs',
  },
];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getStoredAuthSession();

  // Find active controller info for browser address indicator
  const currentNav = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.path.split('?')[0])
  );

  const handleClientLoginSuccess = () => {
    navigate(BACKEND_API_ROUTES.CLIENT_HOME);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate(BACKEND_API_ROUTES.CLIENT_AUTH);
  };

  return (
    <div className="min-h-screen bg-[#EAEAEA] relative flex flex-col font-sans">
      {/* Top Development & Browser Route Navigation Bar */}
      <nav className="bg-[#252A34] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-2">
          {/* Top row: Brand & Live Address Bar Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/10 pb-2">
            <div className="flex items-center space-x-2 font-bold tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-[#08D9D6] animate-pulse" />
              <span className="text-white text-sm font-extrabold tracking-tight">Add-an-Ad</span>
              <span className="text-white/60">|</span>
              <span className="text-white/80 font-medium">Backend API URL Router</span>
            </div>

            {/* Visual Address Bar badge showing live URL */}
            <div className="flex items-center gap-2 bg-black/35 px-3 py-1.5 rounded-xl border border-white/15 text-white/90">
              <Globe className="w-3.5 h-3.5 text-[#08D9D6]" />
              <span className="text-white/60">Address Bar URL:</span>
              <code className="font-mono text-[11px] font-bold text-[#08D9D6] bg-black/40 px-1.5 py-0.5 rounded border border-[#08D9D6]/20">
                http://localhost:5173{location.pathname}
              </code>
              {currentNav && (
                <span className="text-[10px] hidden sm:inline-block px-2 py-0.5 rounded-md font-semibold bg-[#FF2E63] text-white shadow-xs">
                  {currentNav.controller}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links with exact Backend API routes */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={`Backend Address: ${item.path}`}
                  className={({ isActive }) =>
                    `px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
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
        </div>
      </nav>

      {/* Main View Router matching Backend API Endpoints */}
      <main className="flex-1">
        <Routes>
          {/* Root Redirect */}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  session && session.role === 'CLIENT'
                    ? BACKEND_API_ROUTES.CLIENT_HOME
                    : BACKEND_API_ROUTES.CLIENT_AUTH
                }
                replace
              />
            }
          />

          {/* 1. Client & Admin Authentication Routes (/api/client, /api/admin) */}
          <Route
            path={BACKEND_API_ROUTES.CLIENT_AUTH}
            element={
              <AuthPortal
                initialRole="client"
                initialMode="login"
                onClientLoginSuccess={handleClientLoginSuccess}
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
          <Route
            path={BACKEND_API_ROUTES.ADMIN_AUTH}
            element={
              <AuthPortal
                initialRole="admin"
                initialMode="login"
                onClientLoginSuccess={handleClientLoginSuccess}
                onNavigateToApprovals={() => navigate(BACKEND_API_ROUTES.ADMIN_APPROVALS)}
              />
            }
          />

          {/* 2. Client Home & Client Profile (/api/client/home) */}
          <Route
            path={BACKEND_API_ROUTES.CLIENT_HOME}
            element={
              <ClientHome
                onPostAdvertisement={() => navigate(BACKEND_API_ROUTES.CAMPAIGN)}
                onLogout={handleLogout}
              />
            }
          />

          {/* 3. Campaign Controller Routes (/api/campaign) */}
          <Route
            path={BACKEND_API_ROUTES.CAMPAIGN}
            element={
              <CampaignDetails
                onBackToHome={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
                onCampaignCreated={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CAMPAIGN_CREATE}
            element={
              <CampaignDetails
                onBackToHome={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
                onCampaignCreated={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CAMPAIGN_DETAILS}
            element={
              <CampaignDetails
                onBackToHome={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
                onCampaignCreated={() => navigate(BACKEND_API_ROUTES.CLIENT_HOME)}
              />
            }
          />

          {/* 4. Admin Approvals Route (/api/admin/approvals) */}
          <Route
            path={BACKEND_API_ROUTES.ADMIN_APPROVALS}
            element={
              <AdminClientApproval
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />
          <Route
            path="/api/admin/clients"
            element={<Navigate to={BACKEND_API_ROUTES.ADMIN_APPROVALS} replace />}
          />

          {/* 5. Live Communication & Chat Routes (/api/admin_chat, /api/client_chat) */}
          <Route
            path={BACKEND_API_ROUTES.ADMIN_CHAT}
            element={
              <AdminChatDashboard
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CLIENT_CHAT}
            element={
              <ClientHome
                onPostAdvertisement={() => navigate(BACKEND_API_ROUTES.CAMPAIGN)}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.COMMUNICATION}
            element={<Navigate to={BACKEND_API_ROUTES.ADMIN_CHAT} replace />}
          />

          {/* 6. Finance & Invoices Routes (/api/finance) */}
          <Route
            path={BACKEND_API_ROUTES.FINANCE}
            element={
              <InvoiceManagement
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.FINANCE_INVOICES}
            element={
              <InvoiceManagement
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.FINANCE_REPORT}
            element={
              <InvoiceManagement
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />

          {/* 7. Marketing & Analytics Routes (/api/marketing) */}
          <Route
            path={BACKEND_API_ROUTES.MARKETING}
            element={
              <MarketingDashboard
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.MARKETING_ANALYSIS}
            element={
              <MarketingDashboard
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />
          <Route
            path="/api/marketing/analytics"
            element={
              <MarketingDashboard
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />

          {/* 8. Operations & Task Coordination Routes (/api/operations, /api/client_tasks, /api/coordinator_tasks) */}
          <Route
            path={BACKEND_API_ROUTES.OPERATIONS}
            element={
              <OperationsCoordinationDashboard
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.CLIENT_TASKS}
            element={
              <OperationsCoordinationDashboard
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.COORDINATOR_TASKS}
            element={
              <OperationsCoordinationDashboard
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />
          <Route
            path={BACKEND_API_ROUTES.EMPLOYEE_TASKS}
            element={
              <OperationsCoordinationDashboard
                onBackToDashboard={() => navigate(BACKEND_API_ROUTES.CLIENT_AUTH)}
              />
            }
          />

          {/* Legacy / Direct Path Aliases for convenience */}
          <Route path="/auth" element={<Navigate to={BACKEND_API_ROUTES.CLIENT_AUTH} replace />} />
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

          {/* Catch-all redirect to auth */}
          <Route path="*" element={<Navigate to={BACKEND_API_ROUTES.CLIENT_AUTH} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
