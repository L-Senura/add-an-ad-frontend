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
} from 'lucide-react';
import {
  generateCampaignInvoices,
  createInvoice,
  recordInvoicePayment,
  getAllInvoices,
  getFinanceReport,
} from './financeApi';
import { getAllClients } from '../client/api';
import { getCampaignsByClientId } from '../campaign/campaignApi';

export default function InvoiceManagement({ onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'manual' | 'ledger'
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

  // Ledger filters
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Recording Modal
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

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
        getAllInvoices().catch(() => []),
        getFinanceReport().catch(() => null),
      ]);

      if (Array.isArray(clientsList) && clientsList.length > 0) {
        setClients(clientsList);
        setSelectedClientId(String(clientsList[0].clientID));
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
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const [clientsList, invoicesList, reportData] = await Promise.all([
          getAllClients().catch(() => [
            { clientID: 1, companyName: 'Nova Marketing Agency', firstName: 'Alexander' },
            { clientID: 101, companyName: 'OmniVanguard Digital', firstName: 'Marcus' },
          ]),
          getAllInvoices().catch(() => []),
          getFinanceReport().catch(() => null),
        ]);

        if (isMounted) {
          if (Array.isArray(clientsList) && clientsList.length > 0) {
            setClients(clientsList);
            setSelectedClientId(String(clientsList[0].clientID));
          }
          setInvoices(invoicesList || []);
          setReport(reportData);
        }
      } catch (err) {
        console.warn('Error loading finance data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Generate Invoices from Client Campaign Activity
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
        text: `Invoices generated successfully for "${selectedCampaign?.campaignName}". Total Billed: Rs. ${response.totalAmount?.toLocaleString()}`,
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

  // Create Custom Manual Invoice
  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!manualForm.clientId) {
      setNotification({ type: 'error', text: 'Please select a client.' });
      return;
    }
    if (!manualForm.categoryPrice || Number(manualForm.categoryPrice) <= 0) {
      setNotification({ type: 'error', text: 'Please enter a valid price amount.' });
      return;
    }

    setIsCreatingManual(true);
    setNotification(null);

    try {
      await createInvoice(manualForm);
      setNotification({
        type: 'success',
        text: `Invoice created successfully for Client #${manualForm.clientId} (Rs. ${Number(manualForm.categoryPrice).toLocaleString()}).`,
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

  // Record Payment
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

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesCat =
      filterCategory === 'ALL' || inv.chargedCategory === filterCategory;
    const matchesStatus =
      filterStatus === 'ALL' || inv.paymentStatus?.toUpperCase() === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(inv.invoiceId).includes(q) ||
      String(inv.clientId).includes(q) ||
      inv.clientDescription?.toLowerCase().includes(q) ||
      inv.chargedCategory?.toLowerCase().includes(q);

    return matchesCat && matchesStatus && matchesSearch;
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
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white bg-[#252A34]"
              >
                Finance & Billing Officer
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500">
              Platform Service Charges, Campaign Invoicing & Revenue Analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 transition-all duration-200 bg-white hover:bg-gray-50 text-[#252A34] shadow-xs hover:border-[#08D9D6]"
            title="Refresh financial data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#08D9D6] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 transition-all duration-200 bg-white hover:bg-gray-50 text-[#252A34] shadow-xs hover:border-[#08D9D6]"
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
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
          <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Billed</span>
              <DollarSign className="w-4 h-4 text-[#252A34]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#252A34]">
                Rs. {(report?.totalBilledAmount || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {report?.totalInvoices || invoices.length} Total Invoices
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#08D9D6]">Collected</span>
              <TrendingUp className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#08D9D6]">
                Rs. {(report?.totalRevenueCollected || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {report?.paidInvoicesCount || 0} Paid Invoices
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-[#FF2E63]/30 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF2E63]">Pending Payments</span>
              <Clock className="w-4 h-4 text-[#FF2E63]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FF2E63]">
                Rs. {(report?.totalPendingAmount || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {report?.pendingInvoicesCount || 0} Awaiting Settlement
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Platform Charges</span>
              <Sparkles className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#252A34]">
                Rs. {(report?.totalPlatformCharges || 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">Hosting & Service fees</span>
          </div>
        </div>

        {/* Action Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex p-1 rounded-2xl bg-gray-200 border border-gray-300 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'generate'
                  ? 'bg-white shadow-sm text-[#252A34]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Generate from Client Activities
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
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
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ledger'
                  ? 'bg-white shadow-sm text-[#252A34]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Invoice Ledger ({invoices.length})
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-500 hover:border-[#08D9D6]"
            title="Refresh Invoices"
          >
            <RefreshCw className="w-4 h-4 text-[#252A34]" />
          </button>
        </div>

        {/* TAB 1: GENERATE FROM CLIENT ACTIVITIES */}
        {activeTab === 'generate' && (
          <div
            className="rounded-[32px] p-6 sm:p-10 bg-white border border-gray-200 shadow-xl relative transition-all"
          >
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-[#252A34]">
                Generate Invoices for Client Platform Activity
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
                  Client Platform Activity / Campaign <span className="text-[#FF2E63]">*</span>
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
                          className={`p-4 rounded-2xl border text-left transition-all ${
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
                <div
                  className="p-5 rounded-2xl border border-gray-200 bg-[#EAEAEA]/50 space-y-3"
                >
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
                      Rs. {((selectedCampaign.campaignPrices || 0) + Number(platformCharge)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating || !selectedCampaignId}
                className="w-full py-4 px-6 rounded-2xl text-[#252A34] font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-xl"
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
                    <span>Generate Client Activity Invoices</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: MANUAL CUSTOM INVOICE CREATION */}
        {activeTab === 'manual' && (
          <div
            className="rounded-[32px] p-6 sm:p-10 bg-white border border-gray-200 shadow-xl relative"
          >
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
                    onChange={(e) => setManualForm({ ...manualForm, chargedCategory: e.target.value })}
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
                    onChange={(e) => setManualForm({ ...manualForm, categoryPrice: e.target.value })}
                    placeholder="e.g. 1500"
                    min="0"
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
                    onChange={(e) => setManualForm({ ...manualForm, campaignId: e.target.value })}
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
                    onChange={(e) => setManualForm({ ...manualForm, paymentStatus: e.target.value })}
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
                  onChange={(e) => setManualForm({ ...manualForm, clientDescription: e.target.value })}
                  placeholder="Details about creative adjustments or specialized advertising service..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white resize-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingManual}
                className="w-full py-3.5 px-6 rounded-2xl text-[#252A34] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg"
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

        {/* TAB 3: INVOICE LEDGER TABLE */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div
              className="rounded-3xl p-4 bg-white border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3"
            >
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 text-[#252A34]"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Platform Charges">Platform Charges</option>
                  <option value="Campaign Charges">Campaign Charges</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 text-[#252A34]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoice #, client, description..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-[#EAEAEA]/50 focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>
            </div>

            {/* Invoices List */}
            {filteredInvoices.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 text-gray-500">
                <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-sm">No invoices found for this criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.paymentStatus === 'PAID';
                  return (
                    <div
                      key={inv.invoiceId}
                      className="rounded-2xl p-5 bg-white border border-gray-200 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#252A34]">
                            Invoice #{inv.invoiceId}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-[#08D9D6]/15 text-[#252A34] border border-[#08D9D6]/30"
                          >
                            {inv.chargedCategory}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              isPaid ? 'bg-[#08D9D6]/20 text-[#252A34] border border-[#08D9D6]/40' : 'bg-[#FF2E63]/15 text-[#FF2E63] border border-[#FF2E63]/30'
                            }`}
                          >
                            {inv.paymentStatus}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600">
                          {inv.clientDescription || 'Agency advertisement charge.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                          <span>Client ID: #{inv.clientId}</span>
                          {inv.campaignId && <span>Campaign: #{inv.campaignId}</span>}
                          <span>
                            Date: {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <span className="text-xl font-extrabold text-[#FF2E63]">
                          Rs. {(inv.categoryPrice || 0).toLocaleString()}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(inv)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold border border-gray-300 hover:border-[#08D9D6] text-[#252A34] hover:bg-gray-50 flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5 text-[#08D9D6]" />
                            Receipt
                          </button>

                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingInvoice(inv);
                                setPaymentRemarks(`Settlement for invoice #${inv.invoiceId}`);
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-[#252A34] shadow-xs hover:shadow-sm"
                              style={{
                                background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                              }}
                            >
                              Record Payment
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: RECORD PAYMENT */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-md w-full relative">
            <button
              type="button"
              onClick={() => setPayingInvoice(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
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
              className="w-full py-2.5 rounded-xl text-[#252A34] font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
              }}
            >
              {isSavingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark Invoice as PAID
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: RECEIPT VIEW / SLIP */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-lg w-full relative">
            <button
              type="button"
              onClick={() => setViewingReceipt(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
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
                  <span className="font-bold text-[#252A34]">Campaign #{viewingReceipt.campaignId}</span>
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
                    backgroundColor: viewingReceipt.paymentStatus === 'PAID' ? 'rgba(8, 217, 214, 0.2)' : 'rgba(255, 46, 99, 0.15)',
                    color: viewingReceipt.paymentStatus === 'PAID' ? '#008280' : '#FF2E63',
                  }}
                >
                  {viewingReceipt.paymentStatus}
                </span>
              </div>
              {viewingReceipt.payedDatetime && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Paid On:</span>
                  <span className="text-gray-700">{new Date(viewingReceipt.payedDatetime).toLocaleString()}</span>
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
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 text-[#252A34]"
              >
                <Printer className="w-4 h-4 text-[#252A34]" />
                Print Slip
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-[#252A34] hover:bg-[#1a1e26] transition-colors"
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
