import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Shield,
  User,
  LogOut,
  Sparkles,
  Search,
  HelpCircle,
  Megaphone,
  LogIn,
  UserPlus,
} from 'lucide-react';
import {
  getStoredAuthSession,
  clearAuthSession,
  logoutClient,
  logoutAdmin,
} from '../client/api';
import { BACKEND_API_ROUTES } from '../../services/api';
import logoImg from '../../assets/Add-an-Ad.png';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const session = getStoredAuthSession();

  const isClient = Boolean(
    session && (session.role === 'CLIENT' || (!session.role && (session.clientId || session.companyName)))
  );
  const isAdmin = Boolean(
    session && (session.role === 'ADMIN' || (!session.role && (session.adminType || session.adminId)))
  );
  const isAuthenticated = Boolean(session && (isClient || isAdmin));

  const handleLogout = () => {
    try {
      if (isAdmin) {
        logoutAdmin().catch(() => {});
      } else {
        logoutClient().catch(() => {});
      }
    } catch {}
    clearAuthSession();
    window.location.href = '/';
  };

  const portalRoute = isAdmin
    ? BACKEND_API_ROUTES.ADMIN_APPROVALS
    : isClient
    ? BACKEND_API_ROUTES.CLIENT_HOME
    : BACKEND_API_ROUTES.CLIENT_LOGIN;

  return (
    <header className="sticky top-0 z-50 bg-[#161B26] border-b border-[#252A34] text-white shadow-lg backdrop-blur-md bg-opacity-95 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* LEFT: Logo badge matching wireframe */}
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="group flex items-center gap-2.5 transition-transform hover:scale-105"
              title="Add-an-Ad Homepage"
            >
              <img
                src={logoImg}
                alt="Add-an-Ad Logo"
                className="h-9 sm:h-10 w-auto object-contain select-none"
              />
            </Link>

            {/* Quick in-page nav pills for large screens */}
            <nav className="hidden md:flex items-center space-x-1 ml-4 text-xs font-semibold text-gray-300">
              <a
                href="#companies"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-all"
              >
                Find Companies
              </a>
              <a
                href="#faqs"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-all"
              >
                FAQs
              </a>
              <a
                href="#agency-details"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-all"
              >
                About Platform
              </a>
            </nav>
          </div>

          {/* CENTER: Add-an-Ad Brand Title centered as in wireframe */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 select-none pointer-events-none sm:pointer-events-auto">
            <Link
              to="/"
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white hover:text-[#08D9D6] transition-colors flex items-center gap-2"
            >
              <span>Add-an-Ad</span>
            </Link>
          </div>

          {/* RIGHT: Login / Register as in wireframe */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={portalRoute}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#08D9D6] hover:text-[#161B26] text-white text-xs font-bold transition-all shadow-sm border border-white/10"
                  title="Go to User Portal"
                >
                  {isAdmin ? <Shield className="w-3.5 h-3.5 text-[#FF2E63]" /> : <Building2 className="w-3.5 h-3.5 text-[#08D9D6]" />}
                  <span className="hidden sm:inline">
                    {session?.firstName || session?.companyName || (isAdmin ? 'Admin' : 'Client')}
                  </span>
                  <span className="sm:hidden">Portal</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF2E63] text-gray-300 hover:text-white transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={BACKEND_API_ROUTES.CLIENT_LOGIN}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition-all border border-white/15 flex items-center gap-1.5 shadow-sm"
                  title="Sign In"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#08D9D6]" />
                  <span>Login / Register</span>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
