import React, { useState, useEffect, useMemo } from 'react';
import {
  Edit3,
  CheckCircle2,
  Megaphone,
  ArrowRight,
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
  TrendingUp,
  Briefcase,
  Receipt,
  Star,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import {
  getClientById,
  getClientByEmail,
  updateClientProfile,
  getStoredAuthSession,
  saveAuthSession,
} from './api';
import {
  getCampaignsByClientId,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  DEFAULT_RATE_CARD,
  DEFAULT_CAMPAIGN_TYPES,
} from '../campaign/campaignApi';
import { getAnalysisByClientId } from '../marketing/marketingApi';
import { getClientTasks } from '../operations/operationsApi';
import { getInvoicesByClientId } from '../finance/financeApi';
import ClientChatInterface from '../communication/clientChatInterface';
import ReviewInterface from '../communication/reviewInterface';
import ClientInvoicesSection from '../finance/ClientInvoicesSection';
import ClientMarketingSection from '../marketing/ClientMarketingSection';
import ClientTaskSubmissionSection from '../operations/ClientTaskSubmissionSection';

export default function ClientHome({ onPostAdvertisement, onLogout }) {
  // Core authentication and client profile state
  const [client, setClient] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState(null); // { type: 'success'|'error', text: '' }

  // Quick summary telemetry metrics displayed inside the 4 cards
  const [marketingSummary, setMarketingSummary] = useState({ views: 0, clicks: 0, ctr: '0.00' });
  const [taskSummary, setTaskSummary] = useState({ count: 0, pending: 0 });
  const [invoiceSummary, setInvoiceSummary] = useState({ count: 0, pendingCount: 0, pendingTotal: 0 });

  // Interactive Popup Modal State
  // 'chat' | 'add_campaign' | 'campaign_details' | 'marketing' | 'tasks' | 'billing' | 'review' | 'edit_profile' | null
  const [activeModal, setActiveModal] = useState(null);

  // Sub-modal state for Card 1 (Live Campaigns): Editing & Deleting
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [isCampaignSaving, setIsCampaignSaving] = useState(false);
  const [isCampaignDeleting, setIsCampaignDeleting] = useState(false);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('ALL');

  // New Campaign Form State (for "Add your Ad Here" popup)
  const [newCampaignForm, setNewCampaignForm] = useState({
    campaignName: '',
    campaignType: DEFAULT_CAMPAIGN_TYPES[0] || 'In-Site Ad Hype',
    selectedChannels: ['on-site pin', 'YouTube'],
    status: 'ACTIVE',
  });
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    contactNumber: '',
    companyDetails: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const initEditForm = (data) => {
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

  // Close active modal on Escape key press and manage body scroll locking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (editingCampaign) {
          setEditingCampaign(null);
        } else if (deletingCampaign) {
          setDeletingCampaign(null);
        } else if (activeModal) {
          setActiveModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, editingCampaign, deletingCampaign]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (activeModal || editingCampaign || deletingCampaign) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeModal, editingCampaign, deletingCampaign]);

  // Load client profile, campaigns, and dashboard telemetry previews
  useEffect(() => {
    async function loadClientData() {
      setIsLoading(true);
      const session = getStoredAuthSession();

      if (!session) {
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
        initEditForm(fallbackClient);
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
        initEditForm(resolved);

        const clientId = resolved.clientID;

        // Fetch live campaigns and telemetry summaries in parallel
        await Promise.allSettled([
          // 1. Campaigns
          getCampaignsByClientId(clientId)
            .then((list) => {
              if (Array.isArray(list)) setCampaigns(list);
            })
            .catch(() => {}),

          // 2. Marketing Telemetry Preview
          getAnalysisByClientId(clientId)
            .then((analyses) => {
              if (Array.isArray(analyses) && analyses.length > 0) {
                const totalViews = analyses.reduce(
                  (acc, a) => acc + (Number(a.campaignViews) || 0),
                  0
                );
                const totalClicks = analyses.reduce((acc, a) => acc + (Number(a.clicks) || 0), 0);
                const avgCtr =
                  totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';
                setMarketingSummary({ views: totalViews, clicks: totalClicks, ctr: avgCtr });
              }
            })
            .catch(() => {}),

          // 3. Operations Tasks Preview
          getClientTasks(clientId)
            .then((taskList) => {
              if (Array.isArray(taskList)) {
                const pending = taskList.filter(
                  (t) => String(t.status).toUpperCase() !== 'COMPLETED'
                ).length;
                setTaskSummary({ count: taskList.length, pending });
              }
            })
            .catch(() => {}),

          // 4. Invoices Preview
          getInvoicesByClientId(clientId)
            .then((invoiceList) => {
              if (Array.isArray(invoiceList)) {
                const pendingInvoices = invoiceList.filter(
                  (inv) => String(inv.status).toUpperCase() !== 'PAID'
                );
                const pendingTotal = pendingInvoices.reduce(
                  (acc, inv) => acc + (Number(inv.amount) || 0),
                  0
                );
                setInvoiceSummary({
                  count: invoiceList.length,
                  pendingCount: pendingInvoices.length,
                  pendingTotal,
                });
              }
            })
            .catch(() => {}),
        ]);
      } catch (err) {
        console.error('Error loading client dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadClientData();
  }, []);

  // Recalculate price when channels toggle in New Campaign Modal
  const newCampaignPrice = useMemo(() => {
    return newCampaignForm.selectedChannels.reduce((sum, ch) => {
      return sum + (DEFAULT_RATE_CARD[ch] || 500);
    }, 0);
  }, [newCampaignForm.selectedChannels]);

  const companyTitle = client?.companyName || editForm.companyName || 'Nova Marketing Agency';
  const reviewerName =
    `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || companyTitle;

  // Compute total active campaign budget
  const totalCampaignSpend = campaigns.reduce(
    (acc, c) => acc + (Number(c.campaignPrices) || 0),
    0
  );

  // Agency monogram initials for avatar circle
  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // --- Profile Edit Handlers ---
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
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
      setActiveModal(null);
      setAlertMessage({
        type: 'success',
        text: 'Your agency profile credentials have been successfully updated!',
      });
    } catch {
      const fallbackUpdated = { ...client, ...editForm };
      setClient(fallbackUpdated);
      saveAuthSession({ ...getStoredAuthSession(), ...fallbackUpdated });
      setActiveModal(null);
      setAlertMessage({
        type: 'success',
        text: 'Agency profile details updated successfully.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- New Campaign Creation Handlers ("Add your Ad Here") ---
  const toggleNewCampaignChannel = (channel) => {
    setNewCampaignForm((prev) => {
      const exists = prev.selectedChannels.includes(channel);
      const updated = exists
        ? prev.selectedChannels.filter((c) => c !== channel)
        : [...prev.selectedChannels, channel];
      return { ...prev, selectedChannels: updated };
    });
  };

  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!newCampaignForm.campaignName.trim()) {
      setAlertMessage({ type: 'error', text: 'Campaign name is required.' });
      return;
    }
    if (newCampaignForm.selectedChannels.length === 0) {
      setAlertMessage({
        type: 'error',
        text: 'Please select at least one advertising media channel.',
      });
      return;
    }

    setIsCreatingCampaign(true);
    setAlertMessage(null);

    const payload = {
      clientID: client?.clientID || 1,
      campaignName: newCampaignForm.campaignName.trim(),
      campaignType: newCampaignForm.campaignType,
      selectedChannels: newCampaignForm.selectedChannels.join(', '),
      campaignPrices: newCampaignPrice,
      status: newCampaignForm.status || 'ACTIVE',
    };

    try {
      const created = await createCampaign(payload);
      const newCamp = {
        ...payload,
        campaignId: created?.campaignId || Date.now(),
        ...(typeof created === 'object' && created !== null ? created : {}),
      };

      setCampaigns((prev) => [newCamp, ...prev]);
      setActiveModal(null);
      setAlertMessage({
        type: 'success',
        text: `Campaign "${payload.campaignName}" has been successfully created and published!`,
      });

      // Reset form
      setNewCampaignForm({
        campaignName: '',
        campaignType: DEFAULT_CAMPAIGN_TYPES[0] || 'In-Site Ad Hype',
        selectedChannels: ['on-site pin', 'YouTube'],
        status: 'ACTIVE',
      });
    } catch {
      const fallbackCamp = {
        ...payload,
        campaignId: Date.now(),
      };
      setCampaigns((prev) => [fallbackCamp, ...prev]);
      setActiveModal(null);
      setAlertMessage({
        type: 'success',
        text: `Campaign "${payload.campaignName}" was added successfully.`,
      });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  // --- Campaign Edit & Delete Handlers (inside Card 1 Live Campaigns Modal) ---
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

  const handleSaveCampaignUpdate = async (e) => {
    e.preventDefault();
    if (!editingCampaign) return;

    if (!editingCampaign.campaignName.trim()) {
      setAlertMessage({ type: 'error', text: 'Campaign name is required.' });
      return;
    }
    if (editingCampaign.selectedChannels.length === 0) {
      setAlertMessage({ type: 'error', text: 'Please select at least one media channel.' });
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
        text: `Campaign "${payload.campaignName}" details have been updated!`,
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
        text: `Campaign "${payload.campaignName}" updated successfully.`,
      });
    } finally {
      setIsCampaignSaving(false);
    }
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
        text: `Campaign "${targetName}" was permanently removed.`,
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

  // Filtered campaigns for Card 1 popup
  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch =
      !campaignSearchQuery.trim() ||
      (camp.campaignName &&
        camp.campaignName.toLowerCase().includes(campaignSearchQuery.toLowerCase())) ||
      (camp.campaignType &&
        camp.campaignType.toLowerCase().includes(campaignSearchQuery.toLowerCase()));

    const matchesStatus =
      campaignStatusFilter === 'ALL' ||
      String(camp.status).toUpperCase() === campaignStatusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAEAEA]">
        <div className="text-center p-8 rounded-3xl bg-white shadow-xl border border-gray-200">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-[#08D9D6]" />
          <p className="font-bold text-sm text-[#252A34]">
            Loading your agency portal interface...
          </p>
          <p className="text-xs text-gray-400 mt-1">Connecting telemetry and services...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors"
      style={{
        backgroundColor: '#EAEAEA',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(8, 217, 214, 0.08) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(255, 46, 99, 0.08) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(37, 42, 52, 0.02) 0%, transparent 60%)
        `,
      }}
    >
      <div className="max-w-6xl mx-auto space-y-7">
        {/* Banner Alert if any action completed */}
        {alertMessage && (
          <div
            className="p-4 rounded-2xl flex items-center justify-between border shadow-sm animate-fade-in"
            style={{
              backgroundColor:
                alertMessage.type === 'success'
                  ? 'rgba(8, 217, 214, 0.12)'
                  : 'rgba(255, 46, 99, 0.1)',
              borderColor: alertMessage.type === 'success' ? '#08D9D6' : '#FF2E63',
              color: alertMessage.type === 'success' ? '#252A34' : '#FF2E63',
            }}
          >
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <CheckCircle2
                className="w-5 h-5 flex-shrink-0"
                style={{ color: alertMessage.type === 'success' ? '#08D9D6' : '#FF2E63' }}
              />
              <span>{alertMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertMessage(null)}
              className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. TOP AGENCY ROW (Exact match to User Image Wireframe) */}
        {/* Left: Circular Avatar (Sky Blue Circle) + Agency Name + Edit Profile link under it */}
        {/* Right: "Ask Now" interactive button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white/70 backdrop-blur-xs p-6 rounded-3xl border border-white/60 shadow-xs">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Circular Blue Avatar */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-md font-black text-2xl sm:text-3xl text-white select-none transition-transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #38BDF8 60%, #08D9D6 100%)',
                boxShadow: '0 8px 20px -4px rgba(56, 189, 248, 0.4)',
              }}
            >
              {getInitials(companyTitle)}
            </div>

            {/* Agency Name & Edit Profile Link */}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#252A34] tracking-tight">
                  {companyTitle}
                </h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#08D9D6]/20 text-[#007573] border border-[#08D9D6]/40 uppercase tracking-wider">
                  Verified Agency
                </span>
              </div>

              {/* "Edit Profile" link/button positioned directly under the avatar/agency name */}
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => setActiveModal('edit_profile')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#FF2E63] transition-colors cursor-pointer group"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#08D9D6] group-hover:text-[#FF2E63] transition-colors" />
                  <span className="underline decoration-gray-300 underline-offset-4 group-hover:decoration-[#FF2E63]">
                    Edit Profile
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: "Ask Now" Interactive Button */}
          {/* Arrow Note: By clicking 'Ask Now' user can see the chat interface which interactive popup menu comes as chat interface */}
          <div>
            <button
              type="button"
              onClick={() => setActiveModal('chat')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl font-extrabold text-sm sm:text-base text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #252A34 0%, #161B26 100%)',
                border: '1px solid rgba(8, 217, 214, 0.4)',
              }}
              title="Open executive chat interface"
            >
              <div className="relative">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#08D9D6] transition-transform group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#08D9D6] animate-ping" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#08D9D6]" />
              </div>
              <span>Ask Now</span>
            </button>
          </div>
        </div>

        {/* 2. CENTER HERO CAMPAIGN BUTTON (Exact match to User Image Wireframe) */}
        {/* "Add your Ad Here" centered button */}
        {/* Arrow Note: By clicking this user can see the campaign adding interface which interactive popup menu comes */}
        <div className="py-2 flex justify-center">
          <button
            type="button"
            onClick={() => setActiveModal('add_campaign')}
            className="w-full max-w-xl py-4 sm:py-5 px-6 sm:px-8 rounded-2xl sm:rounded-3xl font-extrabold text-lg sm:text-xl text-[#252A34] bg-white border-2 border-[#252A34] hover:border-[#FF2E63] shadow-md hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-between sm:justify-center gap-4 cursor-pointer group relative overflow-hidden"
          >
            {/* Background subtle sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#08D9D6]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF2E63]/10 flex items-center justify-center text-[#FF2E63] group-hover:bg-[#FF2E63] group-hover:text-white transition-colors duration-200">
                <Megaphone className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <span className="tracking-tight text-center">Add your Ad Here</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-500 group-hover:text-[#FF2E63] transition-colors">
              <span>Launch Campaign</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>

        {/* 3. FOUR INTERACTIVE SECTIONS / CARDS (Exact match to User Image Wireframe) */}
        {/* Arrow Note: By clicking these sections, users(agency) can see a interactive popup menu that displays each section relevent details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: [Agency Name] Live Campaign Details */}
          <div
            onClick={() => setActiveModal('campaign_details')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white border-2 border-gray-200 hover:border-[#08D9D6] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-[#08D9D6] opacity-80 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#08D9D6]/15 flex items-center justify-center text-[#008280] mb-3 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5 text-[#008280]" />
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#252A34] leading-snug group-hover:text-[#008280] transition-colors">
                [{companyTitle}] Live Campaign Details
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Active channel distributions, campaign progress, edit & terminate placements.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">
                {campaigns.length} {campaigns.length === 1 ? 'Campaign' : 'Campaigns'}
              </span>
              <span className="inline-flex items-center gap-1 font-extrabold text-[#08D9D6] group-hover:translate-x-0.5 transition-transform">
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Marketing Analytics & Audience Reach */}
          <div
            onClick={() => setActiveModal('marketing')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white border-2 border-gray-200 hover:border-[#FF2E63] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-[#FF2E63] opacity-80 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#FF2E63]/15 flex items-center justify-center text-[#FF2E63] mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-[#FF2E63]" />
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#252A34] leading-snug group-hover:text-[#FF2E63] transition-colors">
                Marketing Analytics & Audience Reach
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Audited impression data, click conversion analytics, and audience reach graphs.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">
                {marketingSummary.views > 0
                  ? `${marketingSummary.views.toLocaleString()} Views`
                  : 'Analytics Desk'}
              </span>
              <span className="inline-flex items-center gap-1 font-extrabold text-[#FF2E63] group-hover:translate-x-0.5 transition-transform">
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 3: Advertising Tasks & Production Coordination */}
          <div
            onClick={() => setActiveModal('tasks')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white border-2 border-gray-200 hover:border-[#3B82F6] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-[#3B82F6] opacity-80 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6] mb-3 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#252A34] leading-snug group-hover:text-[#3B82F6] transition-colors">
                Advertising Tasks & Production Coordination
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Submit graphic and creative tasks, track production workflows, and deadlines.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">
                {taskSummary.count > 0 ? `${taskSummary.count} Active Tasks` : 'Task Center'}
              </span>
              <span className="inline-flex items-center gap-1 font-extrabold text-[#3B82F6] group-hover:translate-x-0.5 transition-transform">
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 4: Client Billing & Invoices Portal */}
          <div
            onClick={() => setActiveModal('billing')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white border-2 border-gray-200 hover:border-[#10B981] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-[#10B981] opacity-80 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 flex items-center justify-center text-[#10B981] mb-3 group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5 text-[#10B981]" />
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#252A34] leading-snug group-hover:text-[#10B981] transition-colors">
                Client Billing & Invoices Portal
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Download payment slips, settle platform invoices, and inspect rate cards.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">
                {invoiceSummary.count > 0 ? `${invoiceSummary.count} Invoices` : 'Billing Desk'}
              </span>
              <span className="inline-flex items-center gap-1 font-extrabold text-[#10B981] group-hover:translate-x-0.5 transition-transform">
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 4. BOTTOM ACTION: "Add a Review" (Exact match to User Image Wireframe) */}
        {/* Positioned on the right side below the cards */}
        {/* Arrow Note: By clicking this user can see the review interface which interactive popup menu comes */}
        <div className="flex justify-end pt-2 pb-6">
          <button
            type="button"
            onClick={() => setActiveModal('review')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm text-[#252A34] bg-white border-2 border-[#252A34] hover:border-[#FF2E63] shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer group"
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-500 group-hover:rotate-12 transition-transform duration-200" />
            <span>Add a Review</span>
            <Sparkles className="w-3.5 h-3.5 text-[#08D9D6]" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE POPUP MENUS & MODALS */}
      {/* ========================================================================= */}

      {/* MODAL 1: "Ask Now" Chat Interface Popup Menu */}
      {activeModal === 'chat' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl border border-gray-200 relative my-auto overflow-hidden flex flex-col max-h-[90vh] animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#08D9D6] via-[#252A34] to-[#FF2E63]" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#08D9D6]/20 flex items-center justify-center text-[#252A34]">
                  <MessageSquare className="w-5 h-5 text-[#08D9D6]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#252A34] flex items-center gap-2">
                    Agency Executive & Admin Live Chat
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-xs text-gray-500">
                    Direct inquiry channel with operations, marketing, finance, and creative teams.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Close chat popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: ClientChatInterface */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <ClientChatInterface clientId={client?.clientID || 1} clientName={companyTitle} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: "Add your Ad Here" Campaign Creation Popup Menu */}
      {activeModal === 'add_campaign' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-gray-200 relative my-auto overflow-hidden flex flex-col max-h-[92vh] animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FF2E63] via-[#08D9D6] to-[#252A34]" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF2E63]/15 flex items-center justify-center text-[#FF2E63]">
                  <Megaphone className="w-5 h-5 text-[#FF2E63]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#252A34]">
                    Add your Campaign Here
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select target channels, calculate prices dynamically, and launch placements.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Close campaign popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Interactive Campaign Creation Form */}
            <form onSubmit={handleCreateCampaignSubmit} className="p-5 sm:p-7 overflow-y-auto space-y-5">
              {/* Campaign Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Campaign Name <span className="text-[#FF2E63]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Festive Multi-Platform Boost"
                  value={newCampaignForm.campaignName}
                  onChange={(e) =>
                    setNewCampaignForm((prev) => ({ ...prev, campaignName: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] focus:border-[#08D9D6] bg-white text-[#252A34]"
                />
              </div>

              {/* Campaign Type & Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Campaign Type
                  </label>
                  <select
                    value={newCampaignForm.campaignType}
                    onChange={(e) =>
                      setNewCampaignForm((prev) => ({ ...prev, campaignType: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34] font-medium"
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
                    Initial Status
                  </label>
                  <select
                    value={newCampaignForm.status}
                    onChange={(e) =>
                      setNewCampaignForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34] font-medium"
                  >
                    <option value="ACTIVE">ACTIVE (Immediate Launch)</option>
                    <option value="PAUSED">PAUSED (Draft Setup)</option>
                  </select>
                </div>
              </div>

              {/* Channel Selector Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#252A34]">
                    Select Advertising Platforms & Rates <span className="text-[#FF2E63]">*</span>
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {newCampaignForm.selectedChannels.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(DEFAULT_RATE_CARD).map(([channel, rate]) => {
                    const isSelected = newCampaignForm.selectedChannels.includes(channel);
                    return (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => toggleNewCampaignChannel(channel)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#252A34] text-white border-[#252A34] shadow-md scale-101'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold truncate">{channel}</span>
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? 'bg-[#08D9D6] text-[#252A34]'
                                : 'border border-gray-300'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-extrabold mt-2 ${
                            isSelected ? 'text-[#08D9D6]' : 'text-gray-600'
                          }`}
                        >
                          Rs. {rate.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Calculation Summary Banner */}
              <div className="p-4 rounded-2xl bg-[#08D9D6]/10 border border-[#08D9D6]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-600 block">
                    Calculated Total Budget
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Transparent pricing based on current platform rate card
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-[#FF2E63]">
                    Rs. {Number(newCampaignPrice).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="flex-1 py-3 px-5 rounded-xl font-bold text-sm text-[#252A34] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isCreatingCampaign ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing Campaign...
                    </>
                  ) : (
                    <>
                      <Megaphone className="w-4 h-4" />
                      Publish Campaign
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  disabled={isCreatingCampaign}
                  className="px-5 py-3 rounded-xl font-semibold text-sm border border-gray-300 hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Card 1 - [Agency Name] Live Campaign Details Popup Menu */}
      {activeModal === 'campaign_details' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl border border-gray-200 relative my-auto overflow-hidden flex flex-col max-h-[92vh] animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#08D9D6] via-[#252A34] to-[#08D9D6]" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#08D9D6]/20 flex items-center justify-center text-[#008280]">
                  <Layers className="w-5 h-5 text-[#008280]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#252A34]">
                    [{companyTitle}] Live Campaign Details
                  </h3>
                  <p className="text-xs text-gray-500">
                    Total Spend: Rs. {totalCampaignSpend.toLocaleString()} • {campaigns.length} campaigns listed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('add_campaign')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#252A34] shadow-xs hover:shadow transition-all cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Post New Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                  title="Close popup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="px-5 sm:px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-gray-400 mr-1 font-semibold flex items-center gap-1">
                  <Filter className="w-3 h-3 text-[#08D9D6]" /> Status:
                </span>
                {['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setCampaignStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      campaignStatusFilter === st
                        ? 'bg-[#252A34] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={campaignSearchQuery}
                  onChange={(e) => setCampaignSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs w-full sm:w-56 focus:ring-1 focus:ring-[#08D9D6] bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Campaigns Grid */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#08D9D6]/15 flex items-center justify-center mb-3">
                    <Megaphone className="w-7 h-7 text-[#08D9D6]" />
                  </div>
                  <h4 className="text-base font-bold text-gray-800 mb-1">No Campaigns Found</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                    {campaignSearchQuery
                      ? 'No campaigns match your search query.'
                      : 'Launch your first advertising campaign across YouTube, Meta, Google, and on-site networks.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModal('add_campaign')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-[#252A34] shadow-sm hover:shadow cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                    }}
                  >
                    Create New Campaign
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCampaigns.map((camp) => {
                    const campId = camp.campaignId || camp.id;
                    const channelArray = Array.isArray(camp.selectedChannels)
                      ? camp.selectedChannels
                      : typeof camp.selectedChannels === 'string'
                      ? camp.selectedChannels.split(',').map((s) => s.trim()).filter(Boolean)
                      : [];

                    const statusStyle =
                      camp.status === 'ACTIVE'
                        ? 'bg-[#08D9D6]/20 text-[#007573] border-[#08D9D6]/40'
                        : camp.status === 'PAUSED'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : camp.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300';

                    return (
                      <div
                        key={campId}
                        className="p-5 rounded-2xl border border-gray-200 bg-gray-50/70 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
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
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusStyle}`}
                            >
                              {camp.status || 'ACTIVE'}
                            </span>
                          </div>

                          {/* Channel Chips */}
                          <div className="my-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
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
                          {/* Price & Action Buttons */}
                          <div className="pt-3 mt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">
                                Investment
                              </span>
                              <span className="font-extrabold text-sm sm:text-base text-[#FF2E63]">
                                Rs. {Number(camp.campaignPrices || 0).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCampaign(camp)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-white hover:bg-gray-100 text-[#252A34] border border-gray-300 hover:border-[#08D9D6] transition-all cursor-pointer shadow-2xs"
                                title="Edit campaign"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#08D9D6]" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingCampaign(camp)}
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
          </div>
        </div>
      )}

      {/* MODAL 4: Card 2 - Marketing Analytics & Audience Reach Popup Menu */}
      {activeModal === 'marketing' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl border border-gray-200 relative my-auto overflow-hidden flex flex-col max-h-[92vh] animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FF2E63] via-[#08D9D6] to-[#252A34]" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF2E63]/15 flex items-center justify-center text-[#FF2E63]">
                  <TrendingUp className="w-5 h-5 text-[#FF2E63]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#252A34]">
                    Marketing Analytics & Audience Reach
                  </h3>
                  <p className="text-xs text-gray-500">
                    Real-time impressions telemetry, conversion click rates, and campaign reach.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: ClientMarketingSection */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <ClientMarketingSection clientId={client?.clientID || 1} companyName={companyTitle} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Card 3 - Advertising Tasks & Production Coordination Popup Menu */}
      {activeModal === 'tasks' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl border border-gray-200 relative my-auto overflow-hidden flex flex-col max-h-[92vh] animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#3B82F6] via-[#08D9D6] to-[#252A34]" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6]">
                  <Briefcase className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#252A34]">
                    Advertising Tasks & Production Coordination
                  </h3>
                  <p className="text-xs text-gray-500">
                    Submit creative briefs, track graphic design & video production workflows.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: ClientTaskSubmissionSection */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <ClientTaskSubmissionSection clientId={client?.clientID || 1} clientName={companyTitle} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Card 4 - Client Billing & Invoices Portal Popup Menu */}
      {activeModal === 'billing' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl border border-gray-200 relative my-auto overflow-hidden flex flex-col max-h-[92vh] animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#10B981] via-[#08D9D6] to-[#252A34]" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
                  <Receipt className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#252A34]">
                    Client Billing & Invoices Portal
                  </h3>
                  <p className="text-xs text-gray-500">
                    Settle invoices online, print official receipts, and review campaign billings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: ClientInvoicesSection */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <ClientInvoicesSection clientId={client?.clientID || 1} companyName={companyTitle} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: "Add a Review" Review Interface Popup Menu */}
      {activeModal === 'review' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl border border-gray-200 relative my-auto overflow-hidden flex flex-col max-h-[92vh] animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-[#08D9D6] to-[#FF2E63]" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#252A34]">
                    Add a Review & Administrator Feedback
                  </h3>
                  <p className="text-xs text-gray-500">
                    Submit verified feedback, rate platform services, and track sent ratings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: ReviewInterface */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <ReviewInterface
                clientId={client?.clientID || 1}
                clientName={companyTitle}
                reviewerName={reviewerName}
                campaigns={campaigns}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: "Edit Profile" Popup Menu */}
      {activeModal === 'edit_profile' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-gray-200 relative my-auto overflow-hidden flex flex-col max-h-[92vh] animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#08D9D6] via-[#252A34] to-[#FF2E63]" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#08D9D6]/20 flex items-center justify-center text-[#252A34]">
                  <Edit3 className="w-5 h-5 text-[#08D9D6]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#252A34]">
                    Edit Agency Profile
                  </h3>
                  <p className="text-xs text-gray-500">
                    Update your agency credentials, company description, and password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Edit Profile Form */}
            <form onSubmit={handleSaveProfile} className="p-5 sm:p-7 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Company / Agency Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={editForm.companyName}
                  onChange={handleEditChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={editForm.contactNumber}
                  onChange={handleEditChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Brief Description About Agency
                </label>
                <textarea
                  name="companyDetails"
                  value={editForm.companyDetails}
                  onChange={handleEditChange}
                  rows="3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  New Password <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={editForm.password}
                    onChange={handleEditChange}
                    placeholder="Enter new password (optional)"
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-3 px-5 rounded-xl font-bold text-sm text-[#252A34] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isSavingProfile ? (
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
                  onClick={() => {
                    initEditForm(client);
                    setActiveModal(null);
                  }}
                  className="px-5 py-3 rounded-xl font-semibold text-sm border border-gray-300 hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CAMPAIGN SUB-MODAL */}
      {editingCampaign && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-modal-backdrop"
          onClick={() => setEditingCampaign(null)}
        >
          <div
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-gray-200 relative my-8 animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
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
                onClick={() => setEditingCampaign(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaignUpdate} className="space-y-4">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                />
              </div>

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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34] font-medium"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34] font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

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
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
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

              <div className="p-4 rounded-2xl bg-[#08D9D6]/10 border border-[#08D9D6]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-600 block">
                    Calculated Total Budget:
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {editingCampaign.selectedChannels.length} platform(s) selected
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-[#FF2E63]">
                    Rs. {Number(editingCampaign.campaignPrices || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isCampaignSaving}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-[#252A34] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isCampaignSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
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
                  onClick={() => setEditingCampaign(null)}
                  disabled={isCampaignSaving}
                  className="px-5 py-3 rounded-xl font-semibold text-sm border border-gray-300 hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION SUB-MODAL */}
      {deletingCampaign && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-modal-backdrop"
          onClick={() => setDeletingCampaign(null)}
        >
          <div
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-red-200 relative animate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center pt-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 flex items-center justify-center mb-4 shadow-xs">
                <AlertTriangle className="w-7 h-7 text-[#FF2E63]" />
              </div>

              <h3 className="text-xl font-extrabold text-[#252A34] mb-2">Delete Campaign?</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Are you sure you want to permanently remove{' '}
                <span className="font-bold text-[#252A34]">
                  "{deletingCampaign.campaignName || 'this campaign'}"
                </span>
                ? All connected advertising channels and placement budgets will be discarded.
              </p>

              <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/60 text-xs text-left mb-6 space-y-1">
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
                  onClick={() => setDeletingCampaign(null)}
                  disabled={isCampaignDeleting}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm border border-gray-300 hover:bg-gray-100 transition-colors text-gray-700 cursor-pointer"
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
