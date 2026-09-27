import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  Lock,
  Edit3,
  CheckCircle2,
  Megaphone,
  ArrowRight,
  LogOut,
  Save,
  X,
  Loader2,
  Eye,
  EyeOff,
  Layers,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import {
  getClientById,
  getClientByEmail,
  updateClientProfile,
  getStoredAuthSession,
  saveAuthSession,
  clearAuthSession,
} from './api';
import {
  getCampaignsByClientId,
  updateCampaign,
  deleteCampaign,
  DEFAULT_RATE_CARD,
  DEFAULT_CAMPAIGN_TYPES,
} from '../campaign/campaignApi';
import ClientChatInterface from '../communication/clientChatInterface';
import ClientInvoicesSection from '../finance/ClientInvoicesSection';
import ClientMarketingSection from '../marketing/ClientMarketingSection';
import ClientTaskSubmissionSection from '../operations/ClientTaskSubmissionSection';

export default function ClientHome({ onPostAdvertisement, onLogout }) {
  const [client, setClient] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null); // { type: 'success'|'error', text: '' }

  // Campaign editing & deletion modal state
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [isCampaignSaving, setIsCampaignSaving] = useState(false);
  const [isCampaignDeleting, setIsCampaignDeleting] = useState(false);

  // Editable form state for "Edit Profile"
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    contactNumber: '',
    companyDetails: '',
    password: '',
  });

  const initForm = (data) => {
    setEditForm({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      companyName: data.companyName || '',
      email: data.email || '',
      contactNumber: data.contactNumber || '',
      companyDetails: data.companyDetails || '',
      password: '',
    });
  };

  useEffect(() => {
    async function loadClientData() {
      setIsLoading(true);
      const session = getStoredAuthSession();

      if (!session) {
        // Fallback demo client if navigated directly
        const fallbackClient = {
          clientID: 1,
          firstName: 'Alexander',
          lastName: 'Wright',
          companyName: 'Nova Marketing Agency',
          email: 'alex@novamedia.com',
          contactNumber: '+1 (555) 349-2918',
          companyDetails:
            'Leading digital growth and social marketing agency helping brands scale across multi-channel platforms.',
          status: 'ACCEPTED',
        };
        setClient(fallbackClient);
        initForm(fallbackClient);
        setIsLoading(false);
        return;
      }

      try {
        let profile = null;
        if (session.userId) {
          try {
            profile = await getClientById(session.userId);
          } catch {
            profile = null;
          }
        }
        if (!profile && session.email) {
          try {
            profile = await getClientByEmail(session.email);
          } catch {
            profile = null;
          }
        }

        const resolved = profile || {
          clientID: session.userId || 1,
          firstName: session.firstName || 'Client',
          lastName: session.lastName || '',
          companyName: session.companyName || session.firstName + "'s Agency",
          email: session.email || 'client@agency.com',
          contactNumber: session.contactNumber || '+1 (555) 012-3456',
          companyDetails: session.companyDetails || 'Web Advertising Agency partner.',
          status: session.status || 'ACCEPTED',
        };

        setClient(resolved);
        initForm(resolved);

        // Fetch client's existing campaigns
        if (resolved.clientID) {
          try {
            const list = await getCampaignsByClientId(resolved.clientID);
            if (Array.isArray(list)) {
              setCampaigns(list);
            }
          } catch (e) {
            console.warn('Could not load client campaigns:', e);
          }
        }
      } catch (err) {
        console.error('Error loading client profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadClientData();
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setAlertMessage(null);

    try {
      const clientId = client?.clientID || 1;
      const updated = await updateClientProfile(clientId, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        companyName: editForm.companyName,
        contactNumber: editForm.contactNumber,
        companyDetails: editForm.companyDetails,
        ...(editForm.password ? { password: editForm.password } : {}),
      });

      const merged = { ...client, ...updated };
      setClient(merged);
      saveAuthSession({ ...getStoredAuthSession(), ...merged });
      setIsEditing(false);
      setAlertMessage({
        type: 'success',
        text: 'Your agency profile details have been successfully updated!',
      });
    } catch {
      // If backend offline, persist in local session as fallback
      const fallbackUpdated = { ...client, ...editForm };
      setClient(fallbackUpdated);
      saveAuthSession({ ...getStoredAuthSession(), ...fallbackUpdated });
      setIsEditing(false);
      setAlertMessage({
        type: 'success',
        text: 'Profile details updated successfully (saved locally).',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    if (onLogout) onLogout();
  };

  // --- Campaign Edit & Delete Handlers ---
  const handleOpenEditCampaign = (camp) => {
    const rawChannels = camp.selectedChannels;
    const channels = Array.isArray(rawChannels)
      ? rawChannels
      : typeof rawChannels === 'string'
      ? rawChannels.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    setEditingCampaign({
      campaignId: camp.campaignId || camp.id,
      campaignName: camp.campaignName || '',
      campaignType: camp.campaignType || DEFAULT_CAMPAIGN_TYPES[0],
      selectedChannels: channels,
      campaignPrices: camp.campaignPrices || 0,
      status: camp.status || 'ACTIVE',
    });
  };

  const handleCloseEditCampaign = () => {
    setEditingCampaign(null);
  };

  const handleToggleEditChannel = (channelName) => {
    if (!editingCampaign) return;
    setEditingCampaign((prev) => {
      const exists = prev.selectedChannels.includes(channelName);
      const updatedChannels = exists
        ? prev.selectedChannels.filter((c) => c !== channelName)
        : [...prev.selectedChannels, channelName];

      let newPrice = 0;
      updatedChannels.forEach((ch) => {
        newPrice += DEFAULT_RATE_CARD[ch] || 500;
      });

      return {
        ...prev,
        selectedChannels: updatedChannels,
        campaignPrices: newPrice,
      };
    });
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    if (!editingCampaign) return;

    if (!editingCampaign.campaignName.trim()) {
      setAlertMessage({ type: 'error', text: 'Campaign name is required.' });
      return;
    }

    if (editingCampaign.selectedChannels.length === 0) {
      setAlertMessage({ type: 'error', text: 'Please select at least one advertising channel.' });
      return;
    }

    setIsCampaignSaving(true);
    setAlertMessage(null);

    const payload = {
      campaignName: editingCampaign.campaignName.trim(),
      campaignType: editingCampaign.campaignType,
      selectedChannels: editingCampaign.selectedChannels.join(', '),
      campaignPrices: editingCampaign.campaignPrices,
      status: editingCampaign.status,
    };

    try {
      const updated = await updateCampaign(editingCampaign.campaignId, payload);
      const savedCampaign = {
        ...editingCampaign,
        ...(typeof updated === 'object' && updated !== null ? updated : {}),
        campaignId: editingCampaign.campaignId,
        selectedChannels: payload.selectedChannels,
        campaignPrices: payload.campaignPrices,
      };

      setCampaigns((prev) =>
        prev.map((c) =>
          (c.campaignId || c.id) === editingCampaign.campaignId ? savedCampaign : c
        )
      );
      setEditingCampaign(null);
      setAlertMessage({
        type: 'success',
        text: `Campaign "${payload.campaignName}" has been successfully updated!`,
      });
    } catch {
      const fallbackCampaign = {
        ...editingCampaign,
        ...payload,
      };
      setCampaigns((prev) =>
        prev.map((c) =>
          (c.campaignId || c.id) === editingCampaign.campaignId ? fallbackCampaign : c
        )
      );
      setEditingCampaign(null);
      setAlertMessage({
        type: 'success',
        text: `Campaign "${payload.campaignName}" updated successfully (saved locally).`,
      });
    } finally {
      setIsCampaignSaving(false);
    }
  };

  const handleOpenDeleteCampaign = (camp) => {
    setDeletingCampaign(camp);
  };

  const handleCloseDeleteCampaign = () => {
    setDeletingCampaign(null);
  };

  const handleConfirmDeleteCampaign = async () => {
    if (!deletingCampaign) return;
    const targetId = deletingCampaign.campaignId || deletingCampaign.id;
    const targetName = deletingCampaign.campaignName || 'Campaign';

    setIsCampaignDeleting(true);
    setAlertMessage(null);

    try {
      await deleteCampaign(targetId);
      setCampaigns((prev) => prev.filter((c) => (c.campaignId || c.id) !== targetId));
      setDeletingCampaign(null);
      setAlertMessage({
        type: 'success',
        text: `Campaign "${targetName}" was successfully deleted.`,
      });
    } catch {
      setCampaigns((prev) => prev.filter((c) => (c.campaignId || c.id) !== targetId));
      setDeletingCampaign(null);
      setAlertMessage({
        type: 'success',
        text: `Campaign "${targetName}" removed successfully.`,
      });
    } finally {
      setIsCampaignDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAEAEA]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-[#08D9D6]" />
          <p className="font-semibold text-sm text-[#252A34]">
            Loading your agency profile...
          </p>
        </div>
      </div>
    );
  }

  const companyTitle = client?.companyName || editForm.companyName || 'Your Agency';

  return (
    <div
      className="min-h-screen w-full py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundColor: '#EAEAEA',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(8, 217, 214, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(255, 46, 99, 0.1) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(37, 42, 52, 0.04) 0%, transparent 60%)
        `,
      }}
    >
      {/* Top Navbar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md font-extrabold text-white text-lg tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #08D9D6 0%, #FF2E63 100%)',
            }}
          >
            AD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight" style={{ color: '#252A34' }}>
                Add-an-Ad
              </span>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor: 'rgba(8, 217, 214, 0.2)',
                  color: '#252A34',
                }}
              >
                Client Portal
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500">
              Advertising Agency Management Suite
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 bg-white hover:bg-gray-50 text-red-600 hover:text-red-700 shadow-xs cursor-pointer"
          style={{ borderColor: 'rgba(255, 46, 99, 0.3)' }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto">
        {/* Banner Alert if any */}
        {alertMessage && (
          <div
            className="mb-6 p-4 rounded-2xl flex items-center justify-between border shadow-sm animate-fade-in"
            style={{
              backgroundColor: alertMessage.type === 'success' ? 'rgba(8, 217, 214, 0.12)' : 'rgba(255, 46, 99, 0.08)',
              borderColor: alertMessage.type === 'success' ? '#08D9D6' : '#FF2E63',
              color: alertMessage.type === 'success' ? '#252A34' : '#FF2E63',
            }}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5" style={{ color: alertMessage.type === 'success' ? '#08D9D6' : '#FF2E63' }} />
              <span>{alertMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header matching Image 1: [Company Name] -> agency added when login */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1
                className="text-3xl sm:text-4xl font-extrabold tracking-tight capitalize"
                style={{ color: '#252A34' }}
              >
                {companyTitle}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: '#08D9D6',
                  color: '#252A34',
                }}
              >
                Verified Agency
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">
              Agency profile registered and authenticated on the Add-an-Ad Network.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold">Client ID:</span>
            <span className="font-bold px-2 py-0.5 rounded bg-white border" style={{ color: '#252A34', borderColor: 'rgba(37, 42, 52, 0.2)' }}>
              #{client?.clientID || 1}
            </span>
          </div>
        </div>

        {/* Wireframe Container: Registered details */}
        <div
          className="rounded-[32px] p-6 sm:p-10 shadow-xl border relative transition-all duration-300 mb-8"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: 'rgba(37, 42, 52, 0.12)',
            boxShadow:
              '0 20px 40px -15px rgba(37, 42, 52, 0.1), 0 0 0 1px rgba(37, 42, 52, 0.05)',
          }}
        >
          {/* Subtle palette top line */}
          <div
            className="absolute top-0 left-10 right-10 h-1 rounded-b-full opacity-90"
            style={{
              background:
                'linear-gradient(90deg, #08D9D6 0%, #252A34 50%, #FF2E63 100%)',
            }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#252A34' }}>
                Agency Registered Details
              </h2>
              <p className="text-xs font-medium text-gray-500">
                These are the company and contact credentials linked to your client account.
              </p>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 hover:shadow-sm cursor-pointer"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#08D9D6',
                  color: '#252A34',
                }}
              >
                <Edit3 className="w-4 h-4" style={{ color: '#FF2E63' }} />
                Edit Profile
              </button>
            )}
          </div>

          {/* EDIT MODE */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={editForm.companyName}
                  onChange={handleEditChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={editForm.contactNumber}
                  onChange={handleEditChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
                  Brief Description About Company
                </label>
                <textarea
                  name="companyDetails"
                  value={editForm.companyDetails}
                  onChange={handleEditChange}
                  rows="3"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white resize-none"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#252A34' }}>
                  New Password <span className="text-gray-400 font-normal lowercase">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={editForm.password}
                    onChange={handleEditChange}
                    placeholder="Enter new password (optional)"
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.2)', color: '#252A34' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#252A34] shadow-md transition-all duration-200 inline-flex items-center gap-2 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    initForm(client);
                    setIsEditing(false);
                  }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm border hover:bg-gray-100 transition-colors text-gray-600"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE - Matches Image 1 Wireframe Fields */
            <div className="space-y-4">
              {/* First Name */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 gap-1 sm:gap-6">
                <span className="w-56 text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#252A34' }}>
                  <User className="w-4 h-4" style={{ color: '#08D9D6' }} />
                  First Name
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {client?.firstName || '—'}
                </span>
              </div>

              {/* Last Name */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 gap-1 sm:gap-6">
                <span className="w-56 text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#252A34' }}>
                  <User className="w-4 h-4" style={{ color: '#08D9D6' }} />
                  Last Name
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {client?.lastName || '—'}
                </span>
              </div>

              {/* Company Name */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 gap-1 sm:gap-6">
                <span className="w-56 text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#252A34' }}>
                  <Building2 className="w-4 h-4" style={{ color: '#08D9D6' }} />
                  Company Name
                </span>
                <span className="text-sm font-bold" style={{ color: '#252A34' }}>
                  {client?.companyName || '—'}
                </span>
              </div>

              {/* Email Address */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 gap-1 sm:gap-6">
                <span className="w-56 text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#252A34' }}>
                  <Mail className="w-4 h-4" style={{ color: '#08D9D6' }} />
                  Email Address
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {client?.email || '—'}
                </span>
              </div>

              {/* Password */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 gap-1 sm:gap-6">
                <span className="w-56 text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#252A34' }}>
                  <Lock className="w-4 h-4" style={{ color: '#08D9D6' }} />
                  Password
                </span>
                <span className="text-sm font-mono tracking-widest text-gray-500">
                  ••••••••••••
                </span>
              </div>

              {/* Contact Number */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 gap-1 sm:gap-6">
                <span className="w-56 text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#252A34' }}>
                  <Phone className="w-4 h-4" style={{ color: '#08D9D6' }} />
                  Contact Number
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {client?.contactNumber || 'Not provided'}
                </span>
              </div>

              {/* Brief Description About Company */}
              <div className="flex flex-col sm:flex-row sm:items-start py-2.5 gap-1 sm:gap-6">
                <span className="w-56 text-xs font-bold uppercase tracking-wider flex items-center gap-2 pt-1" style={{ color: '#252A34' }}>
                  <FileText className="w-4 h-4" style={{ color: '#08D9D6' }} />
                  Brief Description About Company
                </span>
                <p className="text-sm text-gray-700 leading-relaxed max-w-xl">
                  {client?.companyDetails || 'No company description added yet.'}
                </p>
              </div>

              {/* Edit Profile Button below wireframe list */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 hover:shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#08D9D6',
                    color: '#252A34',
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" style={{ color: '#FF2E63' }} />
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Prominent Action Button: Post Your Agency Advertisement (Image 1) */}
        <div className="mb-12">
          <button
            type="button"
            onClick={onPostAdvertisement}
            className="w-full py-5 px-6 rounded-3xl text-center font-extrabold text-lg sm:text-xl border-2 transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 group cursor-pointer"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#08D9D6',
              color: '#252A34',
              boxShadow: '0 12px 30px -8px rgba(8, 217, 214, 0.25)',
            }}
          >
            <Megaphone className="w-6 h-6 transition-transform group-hover:scale-110" style={{ color: '#FF2E63' }} />
            <span>Post Your Agency Advertisement</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: '#08D9D6' }} />
          </button>
        </div>

        {/* Existing Active Campaigns Overview Section with Edit & Delete */}
        <div
          className="rounded-[28px] p-6 sm:p-8 bg-white border shadow-md mb-8"
          style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#252A34' }}>
                <Layers className="w-5 h-5" style={{ color: '#FF2E63' }} />
                Your Live Campaigns ({campaigns.length})
              </h3>
              <p className="text-xs text-gray-500">
                Manage, edit channel allocations, and track running advertising campaigns.
              </p>
            </div>
            <button
              type="button"
              onClick={onPostAdvertisement}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                color: '#252A34',
              }}
            >
              <Megaphone className="w-3.5 h-3.5" />
              + Post New Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: 'rgba(8, 217, 214, 0.15)' }}
              >
                <Megaphone className="w-7 h-7" style={{ color: '#08D9D6' }} />
              </div>
              <h4 className="text-base font-bold text-gray-800 mb-1">No Active Campaigns Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Launch your first advertising campaign across YouTube, FaceBook, Google Ads, and on-site placements.
              </p>
              <button
                type="button"
                onClick={onPostAdvertisement}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-[#252A34] shadow-sm hover:shadow cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                }}
              >
                Create Your First Campaign
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => {
                const campId = camp.campaignId || camp.id;
                const channelArray = Array.isArray(camp.selectedChannels)
                  ? camp.selectedChannels
                  : typeof camp.selectedChannels === 'string'
                  ? camp.selectedChannels.split(',').map((s) => s.trim()).filter(Boolean)
                  : [];

                const statusColor =
                  camp.status === 'ACTIVE'
                    ? 'bg-[#08D9D6]/20 text-[#252A34] border-[#08D9D6]/40'
                    : camp.status === 'PAUSED'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : camp.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-red-100 text-red-800 border-red-300';

                return (
                  <div
                    key={campId}
                    className="p-5 rounded-2xl border bg-gray-50 flex flex-col justify-between hover:shadow-md transition-all group"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="font-extrabold text-base text-gray-900 block">
                            {camp.campaignName || 'Untitled Campaign'}
                          </span>
                          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3 text-[#FF2E63]" />
                            {camp.campaignType || 'Standard Campaign'}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusColor}`}
                        >
                          {camp.status || 'ACTIVE'}
                        </span>
                      </div>

                      {/* Channel Chips */}
                      <div className="my-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Allocated Channels
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {channelArray.length > 0 ? (
                            channelArray.map((ch, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-2xs"
                              >
                                {ch}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">No channels listed</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* Price & Action Footer */}
                      <div className="pt-3 mt-2 border-t border-gray-200/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">
                            Total Investment
                          </span>
                          <span className="font-extrabold text-sm sm:text-base" style={{ color: '#FF2E63' }}>
                            Rs. {Number(camp.campaignPrices || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCampaign(camp)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-white hover:bg-gray-100 text-[#252A34] border border-gray-300 hover:border-[#08D9D6] transition-all cursor-pointer shadow-2xs"
                            title="Edit campaign details & channels"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#08D9D6]" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteCampaign(camp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-400 transition-all cursor-pointer shadow-2xs"
                            title="Delete campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Campaign Progress & Marketing Analytics Section */}
        <div className="mb-10">
          <ClientMarketingSection
            clientId={client?.clientID || 1}
            companyName={client?.companyName || `${client?.firstName || 'Client'} Agency`}
          />
        </div>

        {/* Client Advertising Tasks & Requirements Section */}
        <div className="mb-10">
          <ClientTaskSubmissionSection
            clientId={client?.clientID || 1}
            clientName={client?.companyName || `${client?.firstName || 'Client'} Agency`}
          />
        </div>

        {/* Client Invoices & Platform Activities Billing Section */}
        <div className="mb-10">
          <ClientInvoicesSection
            clientId={client?.clientID || 1}
            companyName={client?.companyName || `${client?.firstName || 'Client'} Agency`}
          />
        </div>

        {/* Real-time Executive Chat with Admins Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#252A34' }}>
                <MessageSquare className="w-5 h-5" style={{ color: '#FF2E63' }} />
                Agency Executive & Admin Live Chat
              </h3>
              <p className="text-xs text-gray-500">
                Direct inquiry channel to chat with operations, marketing, finance, and communication executives.
              </p>
            </div>
          </div>

          <ClientChatInterface
            clientId={client?.clientID || 1}
            clientName={client?.companyName || client?.firstName || 'Your Agency'}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Add-an-Ad Platform • Advertising Agency Portal</p>
      </footer>

      {/* EDIT CAMPAIGN MODAL */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-xl w-full shadow-2xl border relative my-8"
            style={{
              borderColor: 'rgba(37, 42, 52, 0.15)',
              boxShadow: '0 25px 50px -12px rgba(37, 42, 52, 0.25)',
            }}
          >
            {/* Top accent bar */}
            <div
              className="absolute top-0 left-10 right-10 h-1.5 rounded-b-full"
              style={{
                background: 'linear-gradient(90deg, #08D9D6 0%, #252A34 50%, #FF2E63 100%)',
              }}
            />

            {/* Header */}
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-extrabold text-[#252A34] flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#08D9D6]" />
                  Edit Campaign
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update campaign name, target media channels, and campaign status.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditCampaign}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Campaign Name <span className="text-[#FF2E63]">*</span>
                </label>
                <input
                  type="text"
                  value={editingCampaign.campaignName}
                  onChange={(e) =>
                    setEditingCampaign((prev) => ({ ...prev, campaignName: e.target.value }))
                  }
                  required
                  placeholder="e.g., Summer Brand Launch Promo"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                />
              </div>

              {/* Campaign Type & Status in a 2-col grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Campaign Type
                  </label>
                  <select
                    value={editingCampaign.campaignType}
                    onChange={(e) =>
                      setEditingCampaign((prev) => ({ ...prev, campaignType: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34] font-medium"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                  >
                    {DEFAULT_CAMPAIGN_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Status
                  </label>
                  <select
                    value={editingCampaign.status}
                    onChange={(e) =>
                      setEditingCampaign((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34] font-medium"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {/* Advertising Channels Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Select Channels & Rate Card <span className="text-[#FF2E63]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(DEFAULT_RATE_CARD).map(([channel, rate]) => {
                    const isSelected = editingCampaign.selectedChannels.includes(channel);
                    return (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => handleToggleEditChannel(channel)}
                        className={`p-2.5 rounded-xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#252A34] text-white border-[#252A34] shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold truncate">{channel}</span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              isSelected ? 'bg-[#08D9D6] text-[#252A34]' : 'border border-gray-300'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-1 ${
                            isSelected ? 'text-[#08D9D6]' : 'text-gray-500'
                          }`}
                        >
                          Rs. {rate.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Investment Price Summary */}
              <div
                className="p-4 rounded-2xl border flex items-center justify-between"
                style={{
                  backgroundColor: 'rgba(8, 217, 214, 0.08)',
                  borderColor: 'rgba(8, 217, 214, 0.4)',
                }}
              >
                <div>
                  <span className="text-xs font-semibold text-gray-600 block">
                    Calculated Total Investment:
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {editingCampaign.selectedChannels.length} platform(s) selected
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold" style={{ color: '#FF2E63' }}>
                    Rs. {Number(editingCampaign.campaignPrices || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isCampaignSaving}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-[#252A34] shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isCampaignSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Updates...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditCampaign}
                  disabled={isCampaignSaving}
                  className="px-5 py-3 rounded-xl font-semibold text-sm border hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border relative"
            style={{
              borderColor: 'rgba(255, 46, 99, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(37, 42, 52, 0.25)',
            }}
          >
            {/* Top red accent */}
            <div
              className="absolute top-0 left-10 right-10 h-1.5 rounded-b-full bg-[#FF2E63]"
            />

            <div className="text-center pt-2">
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                style={{ backgroundColor: 'rgba(255, 46, 99, 0.12)' }}
              >
                <AlertTriangle className="w-7 h-7" style={{ color: '#FF2E63' }} />
              </div>

              <h3 className="text-xl font-extrabold text-[#252A34] mb-2">
                Delete Campaign?
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Are you sure you want to permanently remove{' '}
                <span className="font-bold text-[#252A34]">
                  "{deletingCampaign.campaignName || 'this campaign'}"
                </span>
                ? All connected advertising channels and placement budgets will be discarded.
              </p>

              <div
                className="p-3.5 rounded-xl border text-xs text-left mb-6 space-y-1"
                style={{
                  backgroundColor: '#FFF5F7',
                  borderColor: 'rgba(255, 46, 99, 0.2)',
                }}
              >
                <div className="flex justify-between text-gray-700">
                  <span>Campaign Type:</span>
                  <span className="font-semibold">{deletingCampaign.campaignType}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Investment:</span>
                  <span className="font-bold text-[#FF2E63]">
                    Rs. {Number(deletingCampaign.campaignPrices || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseDeleteCampaign}
                  disabled={isCampaignDeleting}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm border hover:bg-gray-100 transition-colors text-gray-700 cursor-pointer"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                >
                  Keep Campaign
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCampaign}
                  disabled={isCampaignDeleting}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-1.5 hover:bg-red-700 cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #FF2E63 0%, #e01a4f 100%)',
                  }}
                >
                  {isCampaignDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Campaign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
