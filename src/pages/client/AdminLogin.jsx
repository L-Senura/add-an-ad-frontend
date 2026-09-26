import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { loginAdmin, saveAuthSession, getAdminAllocatedDetails } from './api';

export default function AdminLogin({
  onNavigateToRegister,
  onNavigateToClientLogin,
  onNavigateToApprovals,
  onLoginSuccess,
}) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);
  const [allocatedDetails, setAllocatedDetails] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!credentials.email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!credentials.password) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginAdmin(credentials);
      saveAuthSession(response);
      setLoggedInAdmin(response);
      if (onLoginSuccess) {
        onLoginSuccess(response);
      }

      // Automatically fetch allocated role details
      if (response.userId) {
        loadAllocatedDetails(response.userId);
      }
    } catch (err) {
      setErrorMessage(
        err.message || 'Invalid admin credentials. Please check your email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllocatedDetails = async (adminId) => {
    try {
      const details = await getAdminAllocatedDetails(adminId);
      setAllocatedDetails(details);
    } catch (err) {
      console.warn('Could not load allocated details immediately:', err);
    }
  };

  // If logged in, show administrator dashboard session card
  if (loggedInAdmin) {
    return (
      <div className="text-center py-4">
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm"
          style={{ backgroundColor: 'rgba(255, 46, 99, 0.15)' }}
        >
          <ShieldCheck className="w-9 h-9" style={{ color: '#FF2E63' }} />
        </div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#252A34' }}>
          Admin Authenticated
        </h2>
        <p className="text-sm mb-4 text-gray-500">
          Welcome,{' '}
          <span className="font-semibold text-gray-800">
            {loggedInAdmin.firstName} {loggedInAdmin.lastName}
          </span>
        </p>

        <div
          className="rounded-2xl p-4 text-xs text-left mb-6 border space-y-2.5"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'rgba(37, 42, 52, 0.15)',
            color: '#252A34',
          }}
        >
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Assigned Admin Role:</span>
            <span
              className="px-2.5 py-1 rounded-full font-bold text-xs"
              style={{ backgroundColor: '#FF2E63', color: '#FFFFFF' }}
            >
              {loggedInAdmin.status ? loggedInAdmin.status.replace('_', ' ') : 'Administrator'}
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Admin Email:</span>
            <span className="font-semibold">{loggedInAdmin.email}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>Admin ID:</span>
            <span className="font-semibold">#{loggedInAdmin.userId}</span>
          </div>

          {/* Allocated module snippet if available */}
          {allocatedDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="font-bold flex items-center gap-1.5 mb-1" style={{ color: '#FF2E63' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Allocated Module: {allocatedDetails.allocatedRole}
              </p>
              <p className="text-[11px] text-gray-500 leading-snug">
                {allocatedDetails.overview || 'Admin permissions and allocations synchronized.'}
              </p>
            </div>
          )}
        </div>

        {onNavigateToApprovals && (
          <button
            type="button"
            onClick={onNavigateToApprovals}
            className="w-full mb-3 py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-sm transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #FF2E63 0%, #e01a4f 100%)',
            }}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Client Approvals Desk</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setLoggedInAdmin(null);
            setAllocatedDetails(null);
          }}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold border hover:bg-gray-100 transition-colors"
          style={{ color: '#FF2E63', borderColor: '#FF2E63' }}
        >
          Sign Out / Switch Admin
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* General Error alert */}
      {errorMessage && (
        <div
          className="p-3.5 rounded-2xl flex items-start gap-3 border text-xs sm:text-sm animate-shake"
          style={{
            backgroundColor: 'rgba(255, 46, 99, 0.08)',
            borderColor: '#FF2E63',
            color: '#FF2E63',
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Admin Email Address */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
          Admin Email Address <span className="text-[#FF2E63]">*</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Mail className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            placeholder="admin@addanad.com"
            required
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#FF2E63] focus:border-transparent bg-white shadow-sm"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
          />
        </div>
      </div>

      {/* Admin Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#252A34' }}>
            Password <span className="text-[#FF2E63]">*</span>
          </label>
          <a
            href="#admin-support"
            onClick={(e) => {
              e.preventDefault();
              alert('Contact your system master administrator for security credentials reset.');
            }}
            className="text-[11px] font-semibold hover:underline text-gray-500 hover:text-gray-700"
          >
            Trouble signing in?
          </a>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="Enter admin password"
            required
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#FF2E63] focus:border-transparent bg-white shadow-sm"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Log In CTA Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #FF2E63 0%, #e01a4f 100%)',
            boxShadow: '0 8px 20px -4px rgba(255, 46, 99, 0.45)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying Admin Access...</span>
            </>
          ) : (
            <>
              <span>Log in</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Navigation links */}
      <div className="pt-2 text-center text-xs space-y-1.5 text-gray-500">
        <p>
          Need to register an admin staff account?{' '}
          <button
            type="button"
            onClick={() => onNavigateToRegister && onNavigateToRegister()}
            className="font-bold underline hover:opacity-80 transition-opacity"
            style={{ color: '#FF2E63' }}
          >
            Register As Admin
          </button>
        </p>
        <p>
          Are you an advertising client?{' '}
          <button
            type="button"
            onClick={() => onNavigateToClientLogin && onNavigateToClientLogin()}
            className="font-semibold underline hover:opacity-80 transition-opacity"
            style={{ color: '#08D9D6' }}
          >
            Switch to Client Login
          </button>
        </p>
      </div>
    </form>
  );
}
