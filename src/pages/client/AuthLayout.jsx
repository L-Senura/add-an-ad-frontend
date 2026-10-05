import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/Add-an-Ad.png';

/**
 * Shared modern layout wrapper matching the user's wireframe rounded container
 * and color palette (#EAEAEA, #FF2E63, #252A34, #08D9D6).
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
  activeRole = 'client', // 'client' | 'admin'
  activeMode = 'login',  // 'login' | 'register'
  onModeChange,
}) {
  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundColor: '#EAEAEA',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(8, 217, 214, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(255, 46, 99, 0.1) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(37, 42, 52, 0.04) 0%, transparent 60%)
        `,
      }}
    >
      {/* Top Brand Bar */}
      <header className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <Link to="/" className="flex items-center space-x-3 group" title="Return to Homepage">
          <img
            src={logoImg}
            alt="Add-an-Ad Logo"
            className="h-10 w-auto object-contain select-none transition-transform group-hover:scale-105"
          />
          <div>
            <span
              className="text-xl font-bold tracking-tight group-hover:text-[#08D9D6] transition-colors"
              style={{ color: '#252A34' }}
            >
              Add-an-Ad
            </span>
            <span
              className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: activeRole === 'admin' ? 'rgba(255, 46, 99, 0.18)' : 'rgba(8, 217, 214, 0.18)',
                color: activeRole === 'admin' ? '#FF2E63' : '#252A34',
              }}
            >
              {activeRole === 'admin' ? 'Administration Portal' : 'Advertising Agency'}
            </span>
          </div>
        </Link>
      </header>

      {/* Main Form Center Area */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-xl">
          {/* Wireframe Title Display */}
          <div className="text-center mb-6">
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: '#252A34' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-1 text-sm font-medium text-gray-600"
              >
                {subtitle}
              </p>
            )}

            {/* Quick Navigation Tabs: Login vs Register */}
            {onModeChange && (
              <div className="flex justify-center items-center mt-4 gap-6 text-sm">
                <button
                  type="button"
                  onClick={() => onModeChange('login')}
                  className={`pb-1 font-bold transition-colors border-b-2 ${
                    activeMode === 'login'
                      ? 'border-[#08D9D6] text-[#252A34]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Log In
                </button>
                <span style={{ color: '#08D9D6' }}>•</span>
                <button
                  type="button"
                  onClick={() => onModeChange('register')}
                  className={`pb-1 font-bold transition-colors border-b-2 ${
                    activeMode === 'register'
                      ? 'border-[#FF2E63] text-[#FF2E63]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Central Wireframe-inspired Rounded Card */}
          <div
            className="rounded-[32px] p-6 sm:p-10 shadow-xl border relative transition-all duration-300"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(37, 42, 52, 0.12)',
              boxShadow: '0 20px 40px -15px rgba(37, 42, 52, 0.1), 0 0 0 1px rgba(37, 42, 52, 0.05)',
            }}
          >
            {/* Subtle palette accent line at top inside card */}
            <div
              className="absolute top-0 left-10 right-10 h-1 rounded-b-full opacity-90"
              style={{
                background: 'linear-gradient(90deg, #08D9D6 0%, #252A34 50%, #FF2E63 100%)',
              }}
            />

            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Add-an-Ad Web Advertising Agency Platform. All rights reserved.</p>
        <p className="mt-1 text-[11px] opacity-75">
          Secured with Spring Security & BCrypt Password Encryption
        </p>
      </footer>
    </div>
  );
}
