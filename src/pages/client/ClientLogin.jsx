import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  XCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { loginClient, saveAuthSession } from './api';

export default function ClientLogin({
  onNavigateToRegister,
  onLoginSuccess,
}) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [accountStatus, setAccountStatus] = useState(null); // 'PENDING' | 'REJECTED' | null
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
    if (accountStatus) setAccountStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setAccountStatus(null);

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
      const response = await loginClient(credentials);
      const sessionData = { ...response, role: response.role || 'CLIENT' };
      saveAuthSession(sessionData);
      setLoggedInUser(sessionData);
      if (onLoginSuccess) {
        onLoginSuccess(sessionData);
      }
    } catch (err) {
      const message = err.message || 'Invalid email or password.';
      setErrorMessage(message);

      // Check if message relates to PENDING or REJECTED status
      if (message.toLowerCase().includes('pending')) {
        setAccountStatus('PENDING');
      } else if (message.toLowerCase().includes('rejected')) {
        setAccountStatus('REJECTED');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If already logged in, show authenticated session card
  if (loggedInUser) {
    return (
      <div className="text-center py-4">
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm"
          style={{ backgroundColor: 'rgba(8, 217, 214, 0.2)' }}
        >
          <CheckCircle2 className="w-9 h-9" style={{ color: '#08D9D6' }} />
        </div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#252A34' }}>
          Welcome back!
        </h2>
        <p className="text-sm mb-4 text-gray-500">
          Logged in as <span className="font-semibold text-gray-800">{loggedInUser.email}</span>
        </p>
        <div
          className="rounded-2xl p-4 text-xs text-left mb-6 border"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'rgba(37, 42, 52, 0.15)',
            color: '#252A34',
          }}
        >
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span className="text-gray-500">Name:</span>
            <span className="font-bold">{loggedInUser.firstName} {loggedInUser.lastName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span className="text-gray-500">Account Role:</span>
            <span className="font-bold uppercase" style={{ color: '#08D9D6' }}>{loggedInUser.role}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Account Status:</span>
            <span className="font-bold text-green-600">{loggedInUser.status || 'ACCEPTED'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLoggedInUser(null)}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold border hover:bg-gray-100 transition-colors"
          style={{ color: '#FF2E63', borderColor: '#FF2E63' }}
        >
          Sign Out / Switch Account
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Account Pending Status Card */}
      {accountStatus === 'PENDING' && (
        <div
          className="p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3"
          style={{
            backgroundColor: 'rgba(8, 217, 214, 0.1)',
            borderColor: '#08D9D6',
            color: '#252A34',
          }}
        >
          <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#08D9D6' }} />
          <div>
            <p className="font-bold mb-1">Registration Pending Admin Approval</p>
            <p className="text-gray-600 leading-normal">
              Your advertising agency account is currently being reviewed by an administrator.
              You will gain full portal access once verified.
            </p>
          </div>
        </div>
      )}

      {/* Account Rejected Status Card */}
      {accountStatus === 'REJECTED' && (
        <div
          className="p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3"
          style={{
            backgroundColor: 'rgba(255, 46, 99, 0.08)',
            borderColor: '#FF2E63',
            color: '#FF2E63',
          }}
        >
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Account Registration Rejected</p>
            <p className="opacity-90 leading-normal">
              Your registration was declined. Please contact our support desk or re-register with updated agency credentials.
            </p>
          </div>
        </div>
      )}

      {/* General Error alert */}
      {errorMessage && !accountStatus && (
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

      {/* Email Address */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
          Email Address <span className="text-[#FF2E63]">*</span>
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
            placeholder="client@agency.com"
            required
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#252A34' }}>
            Password <span className="text-[#FF2E63]">*</span>
          </label>
          <a
            href="#forgot"
            onClick={(e) => {
              e.preventDefault();
              alert('Please contact your agency admin or support to reset credentials.');
            }}
            className="text-[11px] font-semibold hover:underline text-gray-500 hover:text-gray-700"
          >
            Forgot password?
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
            placeholder="Enter your password"
            required
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm"
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
          className="w-full py-3 px-4 rounded-2xl font-bold text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
            color: '#252A34',
            boxShadow: '0 8px 20px -4px rgba(8, 217, 214, 0.45)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Authenticating...</span>
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
          New advertising agency?{' '}
          <button
            type="button"
            onClick={() => onNavigateToRegister && onNavigateToRegister()}
            className="font-bold underline hover:opacity-80 transition-opacity"
            style={{ color: '#08D9D6' }}
          >
            Register Your Agency
          </button>
        </p>
      </div>
    </form>
  );
}
