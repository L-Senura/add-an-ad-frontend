import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Receipt,
  Layers,
  Loader2,
  X,
  Printer,
  Sparkles,
  RefreshCw,
  Edit3,
  Trash2,
  Filter,
  BarChart3,
  Calendar,
  User,
  Megaphone,
} from 'lucide-react';
import {
  generateCampaignInvoices,
  createInvoice,
  recordInvoicePayment,
  updateInvoice,
  deleteInvoice,
  getAllInvoices,
  getInvoicesByClientId,
  getInvoicesByCampaignId,
  getFinanceReport,
} from './financeApi';
import { getAllClients } from '../client/api';
import { getCampaignsByClientId } from '../campaign/campaignApi';

export default function InvoiceManagement({ onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'generate' | 'manual' | 'report'
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Activity generation form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientCampaigns, setClientCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [platformCharge, setPlatformCharge] = useState(500);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual invoice form state
  const [manualForm, setManualForm] = useState({
    clientId: '',
    campaignId: '',
    chargedCategory: 'Platform Charges',
    categoryPrice: '',
    clientDescription: '',
    paymentStatus: 'PENDING',
  });
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  // Ledger filters (matching backend /api/finance/invoices?category=...&status=...)
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterClient, setFilterClient] = useState('ALL');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // Payment Recording Modal
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Edit Invoice Modal (Full CRUD Update)
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState({
    chargedCategory: 'Platform Charges',
    categoryPrice: '',
    paymentStatus: 'PENDING',
    clientDescription: '',
    campaignId: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Invoice Modal (Full CRUD Delete)
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Receipt Preview Modal
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Load initial clients and financial ledger
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsList, invoicesList, reportData] = await Promise.all([
        getAllClients().catch(() => [
          { clientID: 1, companyName: 'Nova Marketing Agency', firstName: 'Alexander' },
          { clientID: 101, companyName: 'OmniVanguard Digital', firstName: 'Marcus' },
        ]),
        getAllInvoices(
          filterCategory !== 'ALL' ? filterCategory : undefined,
          filterStatus !== 'ALL' ? filterStatus : undefined
        ).catch(() => []),
        getFinanceReport().catch(() => null),
      ]);

      if (Array.isArray(clientsList) && clientsList.length > 0) {
        setClients(clientsList);
        if (!selectedClientId) {
          setSelectedClientId(String(clientsList[0].clientID));
        }
        if (!manualForm.clientId) {
          setManualForm((prev) => ({ ...prev, clientId: String(clientsList[0].clientID) }));
        }
      }
      setInvoices(invoicesList || []);
      setReport(reportData);
    } catch (err) {
      console.warn('Error loading finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backend Filter effect: when filterCategory, filterStatus, or filterClient changes
  const applyFilters = async () => {
    setIsFiltering(true);
    try {
      let result = [];
      if (filterCampaignId && filterCampaignId.trim() !== '') {
        // Backend GET /api/finance/invoices/campaign/{campaignId}
        result = await getInvoicesByCampaignId(filterCampaignId.trim());
      } else if (filterClient !== 'ALL') {
        // Backend GET /api/finance/invoices/client/{clientId}
        result = await getInvoicesByClientId(filterClient);
      } else {
        // Backend GET /api/finance/invoices?category={category}&status={status}
        result = await getAllInvoices(
          filterCategory !== 'ALL' ? filterCategory : undefined,
          filterStatus !== 'ALL' ? filterStatus : undefined
        );
      }

      setInvoices(result || []);
    } catch (err) {
      console.warn('Error applying finance filters:', err);
    } finally {
      setIsFiltering(false);
    }
  };

  // Re-fetch when client/category/status filters change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterStatus, filterClient]);

  // When selectedClientId changes in Activity Invoicing, fetch their campaigns
  useEffect(() => {
    async function fetchActivities() {
      if (!selectedClientId) return;
      setIsLoadingCampaigns(true);
      try {
        const camps = await getCampaignsByClientId(selectedClientId);
        if (Array.isArray(camps) && camps.length > 0) {
          setClientCampaigns(camps);
          setSelectedCampaignId(String(camps[0].campaignId));
        } else {
          // Fallback demo activities
          const demoActs = [
            {
              campaignId: 1,
              clientID: Number(selectedClientId),
              campaignName: 'Q3 Brand Awareness Blitz',
              campaignType: 'In-Site Ad Hype',
              selectedChannels: 'on-site pin, YouTube',
              campaignPrices: 2000.0,
              status: 'ACTIVE',
            },
            {
              campaignId: 2,
              clientID: Number(selectedClientId),
              campaignName: 'Social Lead Acceleration',
              campaignType: 'Social Media Campaign',
              selectedChannels: 'FaceBook, Instagram, Google Ads',
              campaignPrices: 2500.0,
              status: 'ACTIVE',
            },
          ];
          setClientCampaigns(demoActs);
          setSelectedCampaignId(String(demoActs[0].campaignId));
        }
      } catch (err) {
        console.warn('Error fetching campaigns for client:', err);
      } finally {
        setIsLoadingCampaigns(false);
      }
    }
    fetchActivities();
  }, [selectedClientId]);

  const selectedCampaign = clientCampaigns.find(
    (c) => String(c.campaignId) === String(selectedCampaignId)
  );

  // 1. GENERATE INVOICES (POST /api/finance/invoice/generate/{campaignId}?platformCharge=...)
  const handleGenerateInvoices = async (e) => {
    e.preventDefault();
    if (!selectedCampaignId) {
      setNotification({ type: 'error', text: 'Please select an active client campaign.' });
      return;
    }

    setIsGenerating(true);
    setNotification(null);

    try {
      const response = await generateCampaignInvoices(
        selectedCampaignId,
        platformCharge,
        selectedCampaign
      );

      setNotification({
        type: 'success',
        text: `Invoices generated successfully for "${selectedCampaign?.campaignName}". Total Billed: Rs. ${Number(
          response.totalAmount || 0
        ).toLocaleString()}`,
      });

      await loadData();
      setActiveTab('ledger');
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to generate campaign invoices.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. CREATE MANUAL INVOICE (POST /api/finance/invoice/create)
  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!manualForm.clientId) {
      setNotification({ type: 'error', text: 'Please select a client.' });
      return;
    }
    if (!manualForm.categoryPrice || Number(manualForm.categoryPrice) <= 0) {
      setNotification({ type: 'error', text: 'Category price must be a valid positive number.' });
      return;
    }

    setIsCreatingManual(true);
    setNotification(null);

    try {
      const created = await createInvoice(manualForm);
      setNotification({
        type: 'success',
        text: `Invoice #${created.invoiceId || 'NEW'} created successfully for Client #${manualForm.clientId} (Rs. ${Number(
          manualForm.categoryPrice
        ).toLocaleString()}).`,
      });
      setManualForm({
        clientId: clients[0]?.clientID || '',
        campaignId: '',
        chargedCategory: 'Platform Charges',
        categoryPrice: '',
        clientDescription: '',
        paymentStatus: 'PENDING',
      });
      await loadData();
      setActiveTab('ledger');
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to create invoice.',
      });
    } finally {
      setIsCreatingManual(false);
    }
  };

  // 3. RECORD PAYMENT (PUT /api/finance/invoice/{invoiceId}/pay)
  const handleConfirmPayment = async () => {
    if (!payingInvoice) return;
    setIsSavingPayment(true);
    try {
      await recordInvoicePayment(payingInvoice.invoiceId, paymentRemarks);
      setNotification({
        type: 'success',
        text: `Payment marked as PAID for Invoice #${payingInvoice.invoiceId}.`,
      });
      setPayingInvoice(null);
      setPaymentRemarks('');
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to record payment.',
      });
    } finally {
      setIsSavingPayment(false);
    }
  };

  // 4. EDIT INVOICE (PUT /api/finance/invoice/{invoiceId})
  const handleOpenEdit = (inv) => {
    setEditingInvoice(inv);
    setEditForm({
      chargedCategory: inv.chargedCategory || 'Platform Charges',
      categoryPrice: inv.categoryPrice || '',
      paymentStatus: inv.paymentStatus || 'PENDING',
      clientDescription: inv.clientDescription || '',
      campaignId: inv.campaignId || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (!editForm.categoryPrice || Number(editForm.categoryPrice) <= 0) {
      setNotification({ type: 'error', text: 'Category price must be a positive number.' });
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateInvoice(editingInvoice.invoiceId, {
        chargedCategory: editForm.chargedCategory,
        categoryPrice: Number(editForm.categoryPrice),
        paymentStatus: editForm.paymentStatus,
        clientDescription: editForm.clientDescription,
        campaignId: editForm.campaignId ? Number(editForm.campaignId) : null,
      });

      setNotification({
        type: 'success',
        text: `Invoice #${editingInvoice.invoiceId} successfully updated.`,
      });
      setEditingInvoice(null);
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to update invoice.',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 5. DELETE INVOICE (DELETE /api/finance/invoice/{invoiceId})
  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;
    setIsDeleting(true);
    try {
      await deleteInvoice(deletingInvoice.invoiceId);
      setNotification({
        type: 'success',
        text: `Invoice #${deletingInvoice.invoiceId} removed from records.`,
      });
      setDeletingInvoice(null);
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to delete invoice.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Search filter across invoices
  const displayedInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      String(inv.invoiceId).includes(q) ||
      String(inv.clientId).includes(q) ||
      String(inv.campaignId || '').includes(q) ||
      inv.clientDescription?.toLowerCase().includes(q) ||
      inv.chargedCategory?.toLowerCase().includes(q) ||
      inv.paymentStatus?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="min-h-screen w-full py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundColor: '#EAEAEA',
        backgroundImage: `
          radial-gradient(circle at 12% 18%, rgba(8, 217, 214, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 88% 82%, rgba(255, 46, 99, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(37, 42, 52, 0.03) 0%, transparent 60%)
        `,
      }}
    >
      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md font-extrabold text-[#252A34] text-lg tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #08D9D6 0%, #FF2E63 100%)',
            }}
          >
            AD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#252A34]">
                Add-an-Ad
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white bg-[#252A34]">
                Finance & Invoicing Desk
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500">
              Agency Platform Charges, Multi-Channel Invoicing & Revenue Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 transition-all duration-200 bg-white hover:bg-gray-50 text-[#252A34] shadow-xs hover:border-[#08D9D6] cursor-pointer"
            title="Refresh financial data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#08D9D6] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>

          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 transition-all duration-200 bg-white hover:bg-gray-50 text-[#252A34] shadow-xs hover:border-[#08D9D6] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#252A34]" />
              Back to Suite
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto">
        {/* Notification Banner */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center justify-between border shadow-sm animate-fade-in ${
              notification.type === 'success'
                ? 'bg-[#08D9D6]/10 border-[#08D9D6] text-[#252A34]'
                : 'bg-[#FF2E63]/10 border-[#FF2E63] text-[#FF2E63]'
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-[#08D9D6]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#FF2E63]" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Financial KPI Cards (Directly matching GET /api/finance/report) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
          <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Total Billed
              </span>
              <DollarSign className="w-4 h-4 text-[#252A34]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#252A34]">
                Rs. {(report?.totalBilledAmount || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              {report?.totalInvoices || invoices.length} Total Invoices
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#08D9D6]">
                Revenue Collected
              </span>
              <TrendingUp className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#08D9D6]">
                Rs. {(report?.totalRevenueCollected || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              {report?.paidInvoicesCount || 0} Settled Invoices
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-[#FF2E63]/30 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF2E63]">
                Pending Balance
              </span>
              <Clock className="w-4 h-4 text-[#FF2E63]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#FF2E63]">
                Rs. {(report?.totalPendingAmount || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              {report?.pendingInvoicesCount || 0} Awaiting Payment
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Platform Charges
              </span>
              <Sparkles className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#252A34]">
                Rs. {(report?.totalPlatformCharges || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">Agency hosting fees</span>
          </div>

          <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Campaign Charges
              </span>
              <Megaphone className="w-4 h-4 text-[#FF2E63]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#252A34]">
                Rs. {(report?.totalCampaignCharges || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">Channel media budgets</span>
          </div>
        </div>

        {/* Action Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex p-1 rounded-2xl bg-gray-200 border border-gray-300 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-white shadow-sm text-[#252A34]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Invoice Ledger ({invoices.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'generate'
                  ? 'bg-white shadow-sm text-[#252A34]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Generate from Campaign
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-white shadow-sm text-[#252A34]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Manual Custom Invoice
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-white shadow-sm text-[#252A34]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Financial Audit Report
            </button>
          </div>
        </div>

        {/* TAB 1: INVOICE LEDGER (FULL CRUD LIST & ACTIONS) */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="rounded-3xl p-4 bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mr-1">
                  <Filter className="w-3.5 h-3.5 text-[#08D9D6]" />
                  <span>Filter:</span>
                </div>

                {/* Filter by Client (GET /api/finance/invoices/client/{clientId}) */}
                <select
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 text-[#252A34] focus:ring-2 focus:ring-[#08D9D6]"
                >
                  <option value="ALL">All Clients</option>
                  {clients.map((c) => (
                    <option key={c.clientID} value={c.clientID}>
                      Client #{c.clientID} - {c.companyName}
                    </option>
                  ))}
                </select>

                {/* Filter by Category (GET /api/finance/invoices?category=...) */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 text-[#252A34] focus:ring-2 focus:ring-[#08D9D6]"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Platform Charges">Platform Charges</option>
                  <option value="Campaign Charges">Campaign Charges</option>
                </select>

                {/* Filter by Status (GET /api/finance/invoices?status=...) */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 text-[#252A34] focus:ring-2 focus:ring-[#08D9D6]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                </select>

                {/* Filter by Campaign ID (GET /api/finance/invoices/campaign/{campaignId}) */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={filterCampaignId}
                    onChange={(e) => setFilterCampaignId(e.target.value)}
                    placeholder="Camp #..."
                    className="w-20 px-2 py-1.5 rounded-xl border border-gray-200 text-xs bg-gray-50 text-[#252A34] focus:ring-2 focus:ring-[#08D9D6]"
                  />
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-2 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    Go
                  </button>
                  {filterCampaignId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterCampaignId('');
                        applyFilters();
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                      title="Clear campaign filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Global Search */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoice #, description..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-[#EAEAEA]/50 focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>
            </div>

            {/* Invoices List */}
            {isFiltering ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-200">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#08D9D6]" />
                <span className="text-xs text-gray-500 mt-2 block">Filtering invoices...</span>
              </div>
            ) : displayedInvoices.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 text-gray-500">
                <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-sm">No invoices found matching current criteria.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try adjusting category, status, or search filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {displayedInvoices.map((inv) => {
                  const isPaid = inv.paymentStatus?.toUpperCase() === 'PAID';
                  return (
                    <div
                      key={inv.invoiceId}
                      className="rounded-2xl p-5 bg-white border border-gray-200 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-[#252A34]">
                            Invoice #{inv.invoiceId}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                              inv.chargedCategory === 'Platform Charges'
                                ? 'bg-[#08D9D6]/15 text-[#252A34] border-[#08D9D6]/30'
                                : 'bg-[#FF2E63]/10 text-[#FF2E63] border-[#FF2E63]/25'
                            }`}
                          >
                            {inv.chargedCategory}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              isPaid
                                ? 'bg-[#08D9D6]/20 text-[#008280] border border-[#08D9D6]/40'
                                : 'bg-[#FF2E63]/15 text-[#FF2E63] border border-[#FF2E63]/30'
                            }`}
                          >
                            {inv.paymentStatus}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600">
                          {inv.clientDescription || 'Agency advertisement charge.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Client #{inv.clientId}
                          </span>
                          {inv.campaignId && (
                            <span className="flex items-center gap-1">
                              <Megaphone className="w-3 h-3" />
                              Campaign #{inv.campaignId}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {inv.createdAt
                              ? new Date(inv.createdAt).toLocaleDateString()
                              : 'Recent'}
                          </span>
                          {inv.payedDatetime && (
                            <span className="text-[#008280] font-medium">
                              Paid: {new Date(inv.payedDatetime).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <span className="text-xl font-extrabold text-[#FF2E63]">
                          Rs. {(inv.categoryPrice || 0).toLocaleString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Receipt Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(inv)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-300 hover:border-[#08D9D6] text-[#252A34] hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                            title="View / Print Receipt Slip"
                          >
                            <Receipt className="w-3.5 h-3.5 text-[#08D9D6]" />
                            <span className="hidden sm:inline">Receipt</span>
                          </button>

                          {/* Record Payment Trigger (PUT /api/finance/invoice/{invoiceId}/pay) */}
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingInvoice(inv);
                                setPaymentRemarks(`Settlement for invoice #${inv.invoiceId}`);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#252A34] shadow-xs hover:shadow-sm cursor-pointer"
                              style={{
                                background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                              }}
                              title="Mark as Paid"
                            >
                              Pay
                            </button>
                          )}

                          {/* Edit Trigger (Full CRUD Update) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(inv)}
                            className="p-1 rounded-lg border border-gray-300 hover:border-[#08D9D6] text-gray-500 hover:text-[#252A34] hover:bg-gray-50 cursor-pointer"
                            title="Edit Invoice Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Trigger (Full CRUD Delete) */}
                          <button
                            type="button"
                            onClick={() => setDeletingInvoice(inv)}
                            className="p-1 rounded-lg border border-gray-300 hover:border-[#FF2E63] text-gray-400 hover:text-[#FF2E63] hover:bg-gray-50 cursor-pointer"
                            title="Delete / Void Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GENERATE FROM CLIENT ACTIVITIES (POST /api/finance/invoice/generate/{campaignId}) */}
        {activeTab === 'generate' && (
          <div className="rounded-[32px] p-6 sm:p-10 bg-white border border-gray-200 shadow-xl relative transition-all">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-[#252A34]">
                Generate Invoices from Campaign Activity
              </h2>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Select an advertising agency client and their registered campaign to automatically produce dual invoices:
                (1) Campaign Channel Charges and (2) Agency Web Platform Service Charges.
              </p>
            </div>

            <form onSubmit={handleGenerateInvoices} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Client */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Select Client Agency <span className="text-[#FF2E63]">*</span>
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  >
                    {clients.map((c) => (
                      <option key={c.clientID} value={c.clientID}>
                        {c.companyName} (Client #{c.clientID})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform Service Charge Fee */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Platform Service Fee (Rs.) <span className="text-[#FF2E63]">*</span>
                  </label>
                  <input
                    type="number"
                    value={platformCharge}
                    onChange={(e) => setPlatformCharge(Number(e.target.value))}
                    min="0"
                    step="50"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Default platform hosting & management fee: Rs. 500
                  </span>
                </div>
              </div>

              {/* Select Client Campaign Activity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Client Platform Campaign <span className="text-[#FF2E63]">*</span>
                </label>

                {isLoadingCampaigns ? (
                  <div className="p-6 text-center border rounded-2xl bg-gray-50 border-gray-200">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#08D9D6]" />
                    <span className="text-xs text-gray-500 mt-2 block">Loading client campaigns...</span>
                  </div>
                ) : clientCampaigns.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 text-xs text-gray-500">
                    No campaigns found for this client. They can post advertisements from their client homepage.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clientCampaigns.map((camp) => {
                      const isSelected = String(camp.campaignId) === String(selectedCampaignId);
                      return (
                        <button
                          key={camp.campaignId}
                          type="button"
                          onClick={() => setSelectedCampaignId(String(camp.campaignId))}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-[#08D9D6] border-[#08D9D6] bg-[#08D9D6]/5 shadow-xs'
                              : 'hover:border-gray-300 bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-[#252A34]">
                              {camp.campaignName || `Campaign #${camp.campaignId}`}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                              {camp.status || 'ACTIVE'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mb-1">
                            Channels: {camp.selectedChannels || 'Standard ad placement'}
                          </p>
                          <div className="flex items-baseline justify-between pt-1 border-t border-gray-200 text-xs">
                            <span className="text-gray-400">Campaign Cost:</span>
                            <span className="font-extrabold text-[#FF2E63]">
                              Rs. {(camp.campaignPrices || 0).toLocaleString()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Itemized Invoice Preview */}
              {selectedCampaign && (
                <div className="p-5 rounded-2xl border border-gray-200 bg-[#EAEAEA]/50 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider block text-[#252A34]">
                    Generated Invoices Breakdown (Spring Boot Spec)
                  </span>

                  <div className="space-y-2 text-xs sm:text-sm">
                    {/* Invoice 1: Campaign Charges */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200">
                      <div>
                        <span className="font-bold text-[#252A34] block">
                          1. Campaign Charges Invoice
                        </span>
                        <span className="text-xs text-gray-500">
                          {selectedCampaign.campaignName} ({selectedCampaign.selectedChannels})
                        </span>
                      </div>
                      <span className="font-extrabold text-[#252A34]">
                        Rs. {(selectedCampaign.campaignPrices || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Invoice 2: Platform Charges */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200">
                      <div>
                        <span className="font-bold text-[#252A34] block">
                          2. Platform Charges Invoice
                        </span>
                        <span className="text-xs text-gray-500">
                          Web agency platform service fee for campaign #{selectedCampaign.campaignId}
                        </span>
                      </div>
                      <span className="font-extrabold text-[#252A34]">
                        Rs. {Number(platformCharge).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Combined Total to Bill Client:
                    </span>
                    <span className="text-2xl font-extrabold text-[#FF2E63]">
                      Rs. {(
                        (selectedCampaign.campaignPrices || 0) + Number(platformCharge)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating || !selectedCampaignId}
                className="w-full py-4 px-6 rounded-2xl text-[#252A34] font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-xl cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Invoices in Database...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>Generate Dual Campaign Invoices</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: MANUAL CUSTOM INVOICE CREATION (POST /api/finance/invoice/create) */}
        {activeTab === 'manual' && (
          <div className="rounded-[32px] p-6 sm:p-10 bg-white border border-gray-200 shadow-xl relative">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-[#252A34]">
                Create Custom Manual Invoice
              </h2>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Post custom ad agency charges, creative design adjustments, or ad hoc platform billing.
              </p>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Client Agency <span className="text-[#FF2E63]">*</span>
                  </label>
                  <select
                    value={manualForm.clientId}
                    onChange={(e) => setManualForm({ ...manualForm, clientId: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c.clientID} value={c.clientID}>
                        {c.companyName} (#{c.clientID})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Charged Category <span className="text-[#FF2E63]">*</span>
                  </label>
                  <select
                    value={manualForm.chargedCategory}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, chargedCategory: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  >
                    <option value="Platform Charges">Platform Charges</option>
                    <option value="Campaign Charges">Campaign Charges</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Category Price (Rs.) <span className="text-[#FF2E63]">*</span>
                  </label>
                  <input
                    type="number"
                    value={manualForm.categoryPrice}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, categoryPrice: e.target.value })
                    }
                    placeholder="e.g. 1500"
                    min="0"
                    step="50"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Campaign ID (Optional)
                  </label>
                  <input
                    type="number"
                    value={manualForm.campaignId}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, campaignId: e.target.value })
                    }
                    placeholder="e.g. 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                    Payment Status
                  </label>
                  <select
                    value={manualForm.paymentStatus}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, paymentStatus: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Client Description / Activity Remarks
                </label>
                <textarea
                  rows="3"
                  value={manualForm.clientDescription}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, clientDescription: e.target.value })
                  }
                  placeholder="Details about creative adjustments or specialized advertising service..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white resize-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingManual}
                className="w-full py-3.5 px-6 rounded-2xl text-[#252A34] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                }}
              >
                {isCreatingManual ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                <span>Create Custom Invoice Entry</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: FINANCIAL AUDIT REPORT (GET /api/finance/report) */}
        {activeTab === 'report' && (
          <div className="rounded-[32px] p-6 sm:p-10 bg-white border border-gray-200 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-extrabold text-[#252A34] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#08D9D6]" />
                  Financial Performance & Audit Report
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  Generated via backend FinanceController (/api/finance/report).
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 bg-white hover:bg-gray-50 text-[#252A34] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#08D9D6]" />
                Print Financial Audit
              </button>
            </div>

            {/* Performance Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#EAEAEA]/50 border border-gray-200 space-y-3">
                <h3 className="font-bold text-sm text-[#252A34]">Revenue Collection Efficiency</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Billed:</span>
                    <span className="font-bold text-[#252A34]">
                      Rs. {(report?.totalBilledAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Collected Revenue:</span>
                    <span className="font-bold text-[#08D9D6]">
                      Rs. {(report?.totalRevenueCollected || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Outstanding Balance:</span>
                    <span className="font-bold text-[#FF2E63]">
                      Rs. {(report?.totalPendingAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between font-bold">
                    <span>Settlement Rate:</span>
                    <span className="text-[#008280]">
                      {report?.totalBilledAmount
                        ? Math.round(
                            ((report.totalRevenueCollected || 0) / report.totalBilledAmount) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#EAEAEA]/50 border border-gray-200 space-y-3">
                <h3 className="font-bold text-sm text-[#252A34]">Charges Category Distribution</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform Charges (Agency Fee):</span>
                    <span className="font-bold text-[#252A34]">
                      Rs. {(report?.totalPlatformCharges || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Campaign Charges (Media Spend):</span>
                    <span className="font-bold text-[#252A34]">
                      Rs. {(report?.totalCampaignCharges || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Settled Invoices Count:</span>
                    <span className="font-bold text-[#008280]">
                      {report?.paidInvoicesCount || 0} Paid
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pending Invoices Count:</span>
                    <span className="font-bold text-[#FF2E63]">
                      {report?.pendingInvoicesCount || 0} Pending
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices Inventory Summary Table */}
            <div>
              <h3 className="font-bold text-sm text-[#252A34] mb-3">Itemized Ledger Snapshot</h3>
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(report?.invoiceList || invoices).map((i) => (
                      <tr key={i.invoiceId} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-bold text-[#252A34]">#{i.invoiceId}</td>
                        <td className="py-2.5 px-3">Client #{i.clientId}</td>
                        <td className="py-2.5 px-3">{i.chargedCategory}</td>
                        <td className="py-2.5 px-3 font-extrabold text-[#252A34]">
                          Rs. {(i.categoryPrice || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              i.paymentStatus?.toUpperCase() === 'PAID'
                                ? 'bg-[#08D9D6]/20 text-[#008280]'
                                : 'bg-[#FF2E63]/15 text-[#FF2E63]'
                            }`}
                          >
                            {i.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate">
                          {i.clientDescription || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: RECORD PAYMENT (PUT /api/finance/invoice/{invoiceId}/pay) */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-md w-full relative">
            <button
              type="button"
              onClick={() => setPayingInvoice(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1 text-[#252A34]">
              Record Payment Settlement
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Invoice #{payingInvoice.invoiceId} • {payingInvoice.chargedCategory}
            </p>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 mb-4 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Amount Due:</span>
                <span className="font-extrabold text-base text-[#FF2E63]">
                  Rs. {(payingInvoice.categoryPrice || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Client ID:</span>
                <span>#{payingInvoice.clientId}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#252A34]">
                Payment Remarks / Reference Note
              </label>
              <input
                type="text"
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
                placeholder="e.g. Bank transfer ref #TX-89210"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isSavingPayment}
              className="w-full py-2.5 rounded-xl text-[#252A34] font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
              }}
            >
              {isSavingPayment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Mark Invoice as PAID</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT INVOICE (PUT /api/finance/invoice/{invoiceId}) */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-md w-full relative">
            <button
              type="button"
              onClick={() => setEditingInvoice(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1 text-[#252A34] flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#08D9D6]" />
              Edit Invoice #{editingInvoice.invoiceId}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Update billing details, category, or payment status.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#252A34]">
                  Charged Category
                </label>
                <select
                  value={editForm.chargedCategory}
                  onChange={(e) => setEditForm({ ...editForm, chargedCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                >
                  <option value="Platform Charges">Platform Charges</option>
                  <option value="Campaign Charges">Campaign Charges</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#252A34]">
                    Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={editForm.categoryPrice}
                    onChange={(e) => setEditForm({ ...editForm, categoryPrice: e.target.value })}
                    min="0"
                    step="50"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#252A34]">
                    Payment Status
                  </label>
                  <select
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#252A34]">
                  Campaign ID (Optional)
                </label>
                <input
                  type="number"
                  value={editForm.campaignId}
                  onChange={(e) => setEditForm({ ...editForm, campaignId: e.target.value })}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#252A34]">
                  Description / Remarks
                </label>
                <textarea
                  rows="2"
                  value={editForm.clientDescription}
                  onChange={(e) => setEditForm({ ...editForm, clientDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white resize-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="flex-1 py-2 rounded-xl border border-gray-300 font-bold text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2 rounded-xl font-bold text-xs text-[#252A34] shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isSavingEdit ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE INVOICE CONFIRMATION (DELETE /api/finance/invoice/{invoiceId}) */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-sm w-full relative text-center">
            <button
              type="button"
              onClick={() => setDeletingInvoice(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-full bg-[#FF2E63]/15 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6 text-[#FF2E63]" />
            </div>

            <h3 className="text-base font-bold text-[#252A34] mb-1">
              Delete Invoice #{deletingInvoice.invoiceId}?
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              This action will remove the invoice record of Rs.{' '}
              {Number(deletingInvoice.categoryPrice || 0).toLocaleString()} for Client #
              {deletingInvoice.clientId}.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingInvoice(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-[#FF2E63] hover:bg-[#e02656] shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RECEIPT VIEW / PRINT SLIP */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-lg w-full relative">
            <button
              type="button"
              onClick={() => setViewingReceipt(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center pb-4 border-b border-gray-200 mb-4">
              <div
                className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center font-bold text-[#252A34] mb-2"
                style={{ background: 'linear-gradient(135deg, #08D9D6 0%, #FF2E63 100%)' }}
              >
                AD
              </div>
              <h3 className="font-extrabold text-lg text-[#252A34]">Add-an-Ad Agency Receipt</h3>
              <p className="text-xs text-gray-500">Official Platform & Campaign Billing Document</p>
            </div>

            {/* Slip Details */}
            <div className="space-y-2 text-xs mb-6">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-bold text-[#252A34]">#INV-{viewingReceipt.invoiceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Billed Client ID:</span>
                <span className="font-bold text-[#252A34]">Client #{viewingReceipt.clientId}</span>
              </div>
              {viewingReceipt.campaignId && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Associated Campaign:</span>
                  <span className="font-bold text-[#252A34]">
                    Campaign #{viewingReceipt.campaignId}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Charge Category:</span>
                <span className="font-bold text-[#252A34]">{viewingReceipt.chargedCategory}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Payment Status:</span>
                <span
                  className="font-bold uppercase px-2 py-0.5 rounded-full text-[10px]"
                  style={{
                    backgroundColor:
                      viewingReceipt.paymentStatus === 'PAID'
                        ? 'rgba(8, 217, 214, 0.2)'
                        : 'rgba(255, 46, 99, 0.15)',
                    color: viewingReceipt.paymentStatus === 'PAID' ? '#008280' : '#FF2E63',
                  }}
                >
                  {viewingReceipt.paymentStatus}
                </span>
              </div>
              {viewingReceipt.payedDatetime && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Paid On:</span>
                  <span className="text-gray-700">
                    {new Date(viewingReceipt.payedDatetime).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="pt-2">
                <span className="text-gray-500 block mb-1">Description:</span>
                <p className="p-3 rounded-xl bg-[#EAEAEA]/50 border border-gray-200 text-gray-700">
                  {viewingReceipt.clientDescription || 'Advertising agency services rendered.'}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="p-4 rounded-2xl bg-[#EAEAEA]/50 border border-gray-200 mb-6 flex items-center justify-between">
              <span className="font-bold text-sm text-[#252A34]">Total Billed:</span>
              <span className="text-2xl font-extrabold text-[#FF2E63]">
                Rs. {(viewingReceipt.categoryPrice || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 text-[#252A34] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#252A34]" />
                Print Slip
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-[#252A34] hover:bg-[#1a1e26] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Add-an-Ad Platform • Financial & Accounting Module</p>
      </footer>
    </div>
  );
}
