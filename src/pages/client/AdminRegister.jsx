import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  BarChart3,
  CalendarCheck,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { registerAdmin, ADMIN_TYPES } from './api';

export default function AdminRegister({ onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    adminType: 'Marketing_Analyst',
    contactNumber: '',
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

  const handleTypeSelect = (typeId) => {
    setFormData((prev) => ({ ...prev, adminType: typeId }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessResponse(null);

    // Validation
    if (!formData.firstName.trim()) {
      setErrorMessage('First name is required.');
      return;
    }
    if (!formData.lastName.trim()) {
      setErrorMessage('Last name is required.');
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
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (!formData.adminType) {
      setErrorMessage('Admin type must be selected.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerAdmin(formData);
      setSuccessResponse(response);
    } catch (err) {
      setErrorMessage(
        err.message || 'Admin registration failed. Please verify credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getAdminIcon = (type) => {
    switch (type) {
      case 'Marketing_Analyst':
        return <BarChart3 className="w-4 h-4" />;
      case 'Task_Manager':
        return <CalendarCheck className="w-4 h-4" />;
      case 'Finance_Officer':
        return <CreditCard className="w-4 h-4" />;
      case 'Communication_Executive':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <ShieldCheck className="w-4 h-4" />;
    }
  };

  // Success view
  if (successResponse) {
    return (
      <div className="text-center py-4">
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm"
          style={{ backgroundColor: 'rgba(255, 46, 99, 0.15)' }}
        >
          <CheckCircle2 className="w-9 h-9" style={{ color: '#FF2E63' }} />
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: '#252A34' }}>
          Admin Registered!
        </h2>
        <p className="text-sm mb-4 leading-relaxed text-gray-500">
          Admin account created for{' '}
          <span className="font-semibold text-gray-800">
            {formData.firstName} {formData.lastName}
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
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold">Allocated Role:</span>
            <span
              className="px-2.5 py-1 rounded-full font-bold text-xs text-white"
              style={{ backgroundColor: '#FF2E63' }}
            >
              {formData.adminType.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-600">
            You can now log in to the Add-an-Ad Administration Suite with your registered email and password.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToLogin && onNavigateToLogin('admin')}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all duration-200 inline-flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #FF2E63 0%, #e01a4f 100%)',
          }}
        >
          Go to Admin Login
          <ArrowRight className="w-4 h-4" />
        </button>
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
              placeholder="e.g. Sarah"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#FF2E63] focus:border-transparent bg-white shadow-sm"
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
              placeholder="e.g. Jenkins"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#FF2E63] focus:border-transparent bg-white shadow-sm"
              style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
            />
          </div>
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
            placeholder="admin@addanad.com"
            required
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#FF2E63] focus:border-transparent bg-white shadow-sm"
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
            placeholder="Create an admin password (min 6 chars)"
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

      {/* Admin Type Selection */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#252A34' }}>
            Admin Type <span className="text-[#FF2E63]">*</span>
          </label>
          <span className="text-[11px] font-medium text-gray-500">
            Defines allocated dashboard module
          </span>
        </div>

        {/* Radio Card Grid for Admin Roles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ADMIN_TYPES.map((type) => {
            const isSelected = formData.adminType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeSelect(type.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'ring-2 shadow-sm'
                    : 'hover:border-gray-300 bg-white'
                }`}
                style={{
                  borderColor: isSelected ? '#FF2E63' : 'rgba(37, 42, 52, 0.15)',
                  backgroundColor: isSelected ? '#FFFFFF' : '#FFFFFF',
                  ringColor: '#FF2E63',
                }}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className="font-bold text-xs flex items-center gap-1.5"
                    style={{ color: isSelected ? '#FF2E63' : '#252A34' }}
                  >
                    {getAdminIcon(type.id)}
                    {type.label}
                  </span>
                  {isSelected && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#FF2E63' }}
                    />
                  )}
                </div>
                <p className="text-[11px] leading-tight line-clamp-2 text-gray-500">
                  {type.description}
                </p>
              </button>
            );
          })}
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
            placeholder="+1 (555) 482-1980"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#FF2E63] focus:border-transparent bg-white shadow-sm"
            style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
          />
        </div>
      </div>

      {/* Register CTA Button */}
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
              <span>Registering Admin...</span>
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
          Already have an administrator account?{' '}
          <button
            type="button"
            onClick={() => onNavigateToLogin && onNavigateToLogin('admin')}
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
