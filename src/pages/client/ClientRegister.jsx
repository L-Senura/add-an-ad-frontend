import React, { useState } from 'react';
import {
  User,
  Building2,
  Mail,
  Lock,
  Phone,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { registerClient } from './api';

export default function ClientRegister({ onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: '',
    contactNumber: '',
    companyDetails: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successResponse, setSuccessResponse] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessResponse(null);

    // Frontend validations matching backend constraints
    if (!formData.firstName.trim()) {
      setErrorMessage('First name is required.');
      return;
    }
    if (!formData.lastName.trim()) {
      setErrorMessage('Last name is required.');
      return;
    }
    if (!formData.companyName.trim()) {
      setErrorMessage('Company name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!formData.password) {
      setErrorMessage('Password is required.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerClient(formData);
      setSuccessResponse(response);
    } catch (err) {
      setErrorMessage(
        err.message || 'Registration failed. Please check your details and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // If successfully registered, display approval pending notice
  if (successResponse) {
    return (
      <div className="text-center py-4">
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm"
          style={{ backgroundColor: 'rgba(8, 217, 214, 0.2)' }}
        >
          <CheckCircle2 className="w-9 h-9" style={{ color: '#08D9D6' }} />
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: '#252A34' }}>
          Registration Submitted!
        </h2>
        <p className="text-sm mb-4 leading-relaxed text-gray-600">
          Welcome, <span className="font-semibold text-gray-800">{formData.companyName}</span>!
          Your client account has been registered with status{' '}
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase"
            style={{ backgroundColor: '#08D9D6', color: '#252A34' }}
          >
            PENDING
          </span>
          .
        </p>

        <div
          className="rounded-2xl p-4 text-xs text-left mb-6 border"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'rgba(37, 42, 52, 0.15)',
            color: '#252A34',
          }}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF2E63' }} />
            <div>
              <p className="font-semibold mb-1">Administrator Review Required</p>
              <p className="text-gray-600 leading-normal">
                Per advertising agency policy, an agency admin must review and accept your registration
                before you can log in to upload campaigns or request production tasks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => onNavigateToLogin && onNavigateToLogin()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-[#252A34] shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
            }}
          >
            Go to Client Login
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSuccessResponse(null);
              setFormData({
                firstName: '',
                lastName: '',
                companyName: '',
                email: '',
                password: '',
                contactNumber: '',
                companyDetails: '',
              });
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm border hover:bg-gray-100 transition-colors text-gray-600"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
          >
            Register Another Agency
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error alert */}
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

      {/* First Name & Last Name (Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
            First Name <span className="text-[#FF2E63]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. John"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm"
              style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
            Last Name <span className="text-[#FF2E63]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Anderson"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm"
              style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
            />
          </div>
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
          Company Name <span className="text-[#FF2E63]">*</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Building2 className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="e.g. Apex Media Agency"
            required
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
          />
        </div>
      </div>

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
            value={formData.email}
            onChange={handleChange}
            placeholder="contact@agency.com"
            required
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
          Password <span className="text-[#FF2E63]">*</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a strong password (min 6 chars)"
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

      {/* Contact Number */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
          Contact Number
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Phone className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="+1 (555) 019-2834"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
          />
        </div>
      </div>

      {/* Brief Description About Company */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
          Brief Description About Company
        </label>
        <div className="relative">
          <span className="absolute top-3 left-3.5 pointer-events-none text-gray-400">
            <FileText className="w-4 h-4 text-gray-400" />
          </span>
          <textarea
            name="companyDetails"
            value={formData.companyDetails}
            onChange={handleChange}
            rows="3"
            placeholder="Tell us about your brand, target audience, and advertising objectives..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-sm resize-none"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
          />
        </div>
      </div>

      {/* Register CTA Button */}
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
              <span>Registering Agency...</span>
            </>
          ) : (
            <>
              <span>Register</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Navigation links */}
      <div className="pt-2 text-center text-xs space-y-1.5 text-gray-500">
        <p>
          Already have an agency account?{' '}
          <button
            type="button"
            onClick={() => onNavigateToLogin && onNavigateToLogin()}
            className="font-bold underline hover:opacity-80 transition-opacity"
            style={{ color: '#08D9D6' }}
          >
            Log In here
          </button>
        </p>
      </div>
    </form>
  );
}
