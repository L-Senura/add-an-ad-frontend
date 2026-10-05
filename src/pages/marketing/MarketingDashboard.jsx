import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Eye,
  MousePointerClick,
  Calendar,
  Layers,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  X,
  Loader2,
  Activity,
  Zap,
  Filter,
  BarChart2,
  Printer,
  User,
  Info,
} from 'lucide-react';
import {
  getAllAnalyses,
  getAnalysisByClientId,
  getAnalysisByCampaignId,
  getAnalysisById,
  createAnalysis,
  updateAnalysis,
  deleteAnalysis,
} from './marketingApi';
import { getAllClients } from '../client/api';
import { getCampaignsByClientId } from '../campaign/campaignApi';
import logoImg from '../../assets/Add-an-Ad.png';

export default function MarketingDashboard({ onBackToDashboard }) {
  const [analyses, setAnalyses] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', text: '' }

  // Filter & Search states
  const [selectedClientFilter, setSelectedClientFilter] = useState('ALL');
  const [selectedProgressFilter, setSelectedProgressFilter] = useState('ALL');
  const [campaignIdFilter, setCampaignIdFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // Active tab: 'analytics' | 'create' | 'report'
  const [activeTab, setActiveTab] = useState('analytics');

  // Create Analysis Form State
  const [createForm, setCreateForm] = useState(() => {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 1000 * 60 * 60 * 24 * 30);
    return {
      clientId: '',
      campaignId: '',
      campaignName: '',
      campaignViews: 0,
      clicks: 0,
      visibleStartDate: today.toISOString().split('T')[0],
      visibleEndDate: nextMonth.toISOString().split('T')[0],
      campaignProgress: '25% Scheduled',
      remarks: '',
    };
  });
  const [availableClientCampaigns, setAvailableClientCampaigns] = useState([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Analysis Modal State
  const [editingAnalysis, setEditingAnalysis] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Details Modal State
  const [viewingDetails, setViewingDetails] = useState(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch campaigns whenever client selection changes in create form
  const fetchCampaignsForClient = async (cId) => {
    if (!cId) {
      setAvailableClientCampaigns([]);
      return;
    }
    setIsLoadingCampaigns(true);
    try {
      const camps = await getCampaignsByClientId(cId);
      setAvailableClientCampaigns(camps || []);
      if (camps && camps.length > 0) {
        setCreateForm((prev) => ({
          ...prev,
          campaignId: String(camps[0].campaignId),
          campaignName: camps[0].campaignName,
        }));
      } else {
        setCreateForm((prev) => ({
          ...prev,
          campaignId: '',
          campaignName: '',
        }));
      }
    } catch (err) {
      console.warn('Failed to load campaigns for client:', err);
      setAvailableClientCampaigns([]);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analysisList, clientsList] = await Promise.all([
        getAllAnalyses().catch(() => []),
        getAllClients().catch(() => [
          { clientID: 1, companyName: 'Nova Marketing Agency', firstName: 'Alexander' },
          { clientID: 101, companyName: 'OmniVanguard Digital', firstName: 'Marcus' },
        ]),
      ]);

      setAnalyses(analysisList || []);
      setClients(clientsList || []);

      if (clientsList && clientsList.length > 0 && !createForm.clientId) {
        const firstClientId = String(clientsList[0].clientID);
        setCreateForm((prev) => ({ ...prev, clientId: firstClientId }));
        fetchCampaignsForClient(firstClientId);
      }
    } catch (err) {
      console.warn('Error loading marketing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply Client / Campaign / Progress Filters using Backend Endpoints
  const applyFilters = async () => {
    setIsFiltering(true);
    try {
      let result = [];
      if (campaignIdFilter && campaignIdFilter.trim() !== '') {
        // Backend GET /api/marketing/analysis/campaign/{campaignId}
        result = await getAnalysisByCampaignId(campaignIdFilter.trim());
      } else if (selectedClientFilter !== 'ALL') {
        // Backend GET /api/marketing/analysis/client/{clientId}
        result = await getAnalysisByClientId(selectedClientFilter);
      } else {
        // Backend GET /api/marketing/analysis/all
        result = await getAllAnalyses();
      }

      setAnalyses(result || []);
    } catch (err) {
      console.warn('Error applying marketing filters:', err);
    } finally {
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientFilter]);

  const handleClientChange = (e) => {
    const cId = e.target.value;
    setCreateForm((prev) => ({ ...prev, clientId: cId }));
    fetchCampaignsForClient(cId);
  };

  // 1. CREATE ANALYSIS (POST /api/marketing/analysis/create)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.clientId) {
      setNotification({ type: 'error', text: 'client_id is required to connect client with analysis.' });
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const payload = {
        clientId: Number(createForm.clientId),
        campaignId: createForm.campaignId ? Number(createForm.campaignId) : null,
        campaignName: createForm.campaignName || 'Campaign Analysis',
        campaignViews: Number(createForm.campaignViews) || 0,
        clicks: Number(createForm.clicks) || 0,
        visibleStartDate: createForm.visibleStartDate,
        visibleEndDate: createForm.visibleEndDate,
        campaignProgress: createForm.campaignProgress,
        remarks: createForm.remarks,
      };

      await createAnalysis(payload);
      setNotification({
        type: 'success',
        text: `Campaign analysis record created for ${createForm.campaignName}!`,
      });
      await loadData();
      setActiveTab('analytics');
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to create analysis.',
      });
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // 2. OPEN EDIT MODAL
  const openEditModal = (analysis) => {
    setEditingAnalysis(analysis);
    setEditFormData({
      campaignName: analysis.campaignName || '',
      campaignViews: analysis.campaignViews || 0,
      clicks: analysis.clicks || 0,
      visibleStartDate: analysis.visibleStartDate || '',
      visibleEndDate: analysis.visibleEndDate || '',
      campaignProgress: analysis.campaignProgress || '',
      remarks: analysis.remarks || '',
    });
  };

  // 3. SUBMIT EDIT (PUT /api/marketing/analysis/{analysisId})
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingAnalysis) return;

    setIsSubmittingEdit(true);
    try {
      await updateAnalysis(editingAnalysis.analysisId, {
        campaignName: editFormData.campaignName,
        campaignViews: Number(editFormData.campaignViews),
        clicks: Number(editFormData.clicks),
        visibleStartDate: editFormData.visibleStartDate,
        visibleEndDate: editFormData.visibleEndDate,
        campaignProgress: editFormData.campaignProgress,
        remarks: editFormData.remarks,
      });

      setNotification({
        type: 'success',
        text: `Analysis #${editingAnalysis.analysisId} updated successfully.`,
      });
      setEditingAnalysis(null);
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to update analysis.',
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };



  // 5. DELETE ANALYSIS (DELETE /api/marketing/analysis/{analysisId})
  const handleDelete = async (analysisId) => {
    setIsDeleting(true);
    try {
      await deleteAnalysis(analysisId);
      setNotification({
        type: 'success',
        text: `Campaign analysis #${analysisId} deleted successfully.`,
      });
      setDeletingId(null);
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to delete analysis.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 6. VIEW DETAILS (GET /api/marketing/analysis/{analysisId})
  const handleViewDetails = async (analysisId) => {
    try {
      const detail = await getAnalysisById(analysisId);
      setViewingDetails(detail);
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to fetch analysis details.',
      });
    }
  };

  // Aggregate Metrics calculation
  const totalViews = analyses.reduce((acc, a) => acc + (Number(a.campaignViews) || 0), 0);
  const totalClicks = analyses.reduce((acc, a) => acc + (Number(a.clicks) || 0), 0);
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';
  const activeCount = analyses.filter(
    (a) =>
      !String(a.campaignProgress).toLowerCase().includes('concluded') &&
      !String(a.campaignProgress).toLowerCase().includes('completed')
  ).length;
  const concludedCount = analyses.length - activeCount;

  // Filtered List
  const filteredAnalyses = analyses.filter((item) => {
    const matchesProgress =
      selectedProgressFilter === 'ALL' ||
      (selectedProgressFilter === 'ACTIVE' &&
        !String(item.campaignProgress).toLowerCase().includes('concluded') &&
        !String(item.campaignProgress).toLowerCase().includes('completed')) ||
      (selectedProgressFilter === 'CONCLUDED' &&
        (String(item.campaignProgress).toLowerCase().includes('concluded') ||
          String(item.campaignProgress).toLowerCase().includes('completed')));

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.campaignName?.toLowerCase().includes(q) ||
      item.remarks?.toLowerCase().includes(q) ||
      String(item.clientId).includes(q) ||
      String(item.campaignId || '').includes(q) ||
      String(item.analysisId).includes(q);

    return matchesProgress && matchesSearch;
  });

  // Calculate Progress Percentage for progress bar
  const parseProgressPercent = (progressStr) => {
    if (!progressStr) return 50;
    const match = String(progressStr).match(/(\d+)%/);
    if (match) return Math.min(100, Math.max(0, parseInt(match[1], 10)));
    if (
      progressStr.toLowerCase().includes('concluded') ||
      progressStr.toLowerCase().includes('completed')
    )
      return 100;
    if (progressStr.toLowerCase().includes('scheduled')) return 20;
    return 60;
  };

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundColor: '#EAEAEA',
        backgroundImage: `
          radial-gradient(circle at 10% 15%, rgba(8, 217, 214, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 90% 85%, rgba(255, 46, 99, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(37, 42, 52, 0.03) 0%, transparent 60%)
        `,
      }}
    >
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <img
            src={logoImg}
            alt="Add-an-Ad Logo"
            className="h-10 w-auto object-contain select-none"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#252A34]">
                Add-an-Ad
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white bg-[#FF2E63]">
                Marketing & Analytics Desk
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500">
              Campaign Progress, Audience Views Tracking, Visible Date Intervals & Performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 transition-all duration-200 bg-white hover:bg-gray-50 text-[#252A34] shadow-xs hover:border-[#08D9D6] cursor-pointer"
            title="Refresh Analytics"
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
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold">
              <CheckCircle2
                className={`w-4 h-4 flex-shrink-0 ${
                  notification.type === 'success' ? 'text-[#08D9D6]' : 'text-[#FF2E63]'
                }`}
              />
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 ml-3 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total Views
              </span>
              <Eye className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#252A34]">
              {totalViews.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#08D9D6]" />
              Audience Impressions
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total Clicks
              </span>
              <MousePointerClick className="w-4 h-4 text-[#FF2E63]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#252A34]">
              {totalClicks.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Audience Interactions</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Average CTR
              </span>
              <TrendingUp className="w-4 h-4 text-[#FF2E63]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#FF2E63]">{avgCtr}%</div>
            <div className="text-[10px] text-gray-400 mt-1">Click-Through Ratio</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Active Campaigns
              </span>
              <Zap className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#08D9D6]">{activeCount}</div>
            <div className="text-[10px] text-gray-400 mt-1">Live Visibility Period</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total Tracked
              </span>
              <Layers className="w-4 h-4 text-[#252A34]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#252A34]">{analyses.length}</div>
            <div className="text-[10px] text-gray-400 mt-1">{concludedCount} Concluded</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'text-[#252A34] shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
            style={{
              background:
                activeTab === 'analytics'
                  ? 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)'
                  : undefined,
            }}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Campaign Analysis & Tracking ({filteredAnalyses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#FF2E63] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Campaign Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'report'
                ? 'bg-[#252A34] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Audience Performance Report</span>
          </button>
        </div>

        {/* TAB 1: ANALYTICS & CAMPAIGN PROGRESS TRACKING */}
        {activeTab === 'analytics' && (
          <div>
            {/* Filters bar (matching backend GET /analysis/client/{clientId} & /campaign/{campaignId}) */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaign, remarks, client..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34] bg-[#EAEAEA]/50"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Filter className="w-3.5 h-3.5 text-[#08D9D6]" />
                  <span>Client:</span>
                  <select
                    value={selectedClientFilter}
                    onChange={(e) => setSelectedClientFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white text-[#252A34] focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                  >
                    <option value="ALL">All Clients</option>
                    {clients.map((c) => (
                      <option key={c.clientID} value={String(c.clientID)}>
                        Client #{c.clientID} - {c.companyName || c.firstName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Campaign #:</span>
                  <input
                    type="number"
                    value={campaignIdFilter}
                    onChange={(e) => setCampaignIdFilter(e.target.value)}
                    placeholder="Camp ID"
                    className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white text-[#252A34] focus:outline-none focus:ring-1 focus:ring-[#08D9D6]"
                  />
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    Go
                  </button>
                  {campaignIdFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        setCampaignIdFilter('');
                        applyFilters();
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                      title="Clear campaign filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Status:</span>
                  <select
                    value={selectedProgressFilter}
                    onChange={(e) => setSelectedProgressFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white text-[#252A34] focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="CONCLUDED">Concluded</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Campaign Analysis Cards Grid */}
            {isFiltering ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-gray-200">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#08D9D6]" />
                <span className="text-xs text-gray-500 mt-2 block">Filtering analysis records...</span>
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-gray-300">
                <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-[#252A34] mb-1">
                  No Campaign Analyses Found
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                  There are no marketing analysis records matching your criteria. Create a new campaign analysis record or clear filters.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#252A34] shadow-sm cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)' }}
                >
                  + Create First Analysis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredAnalyses.map((item) => {
                  const client = clients.find(
                    (c) => Number(c.clientID) === Number(item.clientId)
                  );
                  const percent = parseProgressPercent(item.campaignProgress);
                  const isConcluded =
                    String(item.campaignProgress).toLowerCase().includes('concluded') ||
                    String(item.campaignProgress).toLowerCase().includes('completed');

                  return (
                    <div
                      key={item.analysisId}
                      className="p-6 rounded-3xl bg-white border border-gray-200 shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow"
                    >
                      <div>
                        {/* Card Header: Client & Status badge */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-[#08D9D6]/15 text-[#252A34] border border-[#08D9D6]/30">
                              Client #{item.clientId} • {client?.companyName || 'Agency Partner'}
                            </span>
                            <h3 className="text-base font-extrabold text-[#252A34] mt-1.5 leading-snug">
                              {item.campaignName || 'Campaign Analysis'}
                            </h3>
                            {item.campaignId && (
                              <span className="text-[11px] text-gray-400">
                                Campaign Reference ID: #{item.campaignId}
                              </span>
                            )}
                          </div>

                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase whitespace-nowrap ${
                              isConcluded
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-[#08D9D6]/15 text-[#252A34] border border-[#08D9D6]/40'
                            }`}
                          >
                            {isConcluded ? 'Concluded' : 'Active'}
                          </span>
                        </div>

                        {/* Visible Dates & Duration Interval */}
                        <div className="p-3 rounded-2xl mb-4 border border-gray-200 flex items-center justify-between text-xs bg-[#EAEAEA]/40">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-[#08D9D6]" />
                            <div>
                              <div className="text-[10px] text-gray-400 font-semibold uppercase">
                                Visibility Interval
                              </div>
                              <span className="font-bold text-[#252A34]">
                                {item.visibleStartDate || 'N/A'} → {item.visibleEndDate || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Audience Views & Clicks Metrics Pill */}
                        <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="text-[10px] text-gray-400 font-bold uppercase">
                              Audience Views
                            </div>
                            <div className="text-base font-black text-[#252A34] mt-0.5">
                              {(Number(item.campaignViews) || 0).toLocaleString()}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="text-[10px] text-gray-400 font-bold uppercase">
                              Clicks
                            </div>
                            <div className="text-base font-black text-[#FF2E63]">
                              {(Number(item.clicks) || 0).toLocaleString()}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="text-[10px] text-gray-400 font-bold uppercase">
                              CTR
                            </div>
                            <div className="text-base font-black text-[#08D9D6]">
                              {Number(item.campaignViews) > 0
                                ? (
                                    ((Number(item.clicks) || 0) / Number(item.campaignViews)) *
                                    100
                                  ).toFixed(2)
                                : '0.00'}
                              %
                            </div>
                          </div>
                        </div>

                        {/* Progress Meter */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="font-bold text-gray-600 flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5 text-[#08D9D6]" />
                              Progress:
                            </span>
                            <span className="font-extrabold text-xs text-[#252A34]">
                              {item.campaignProgress || `${percent}% Completed`}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percent}%`,
                                background: isConcluded
                                  ? '#252A34'
                                  : 'linear-gradient(90deg, #08D9D6 0%, #FF2E63 100%)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Analyst Remarks */}
                        {item.remarks && (
                          <div className="p-3 rounded-xl border border-gray-200 text-xs mb-4 bg-[#EAEAEA]/50 text-[#252A34]">
                            <span className="font-bold block text-[10px] uppercase tracking-wider mb-1 text-[#FF2E63]">
                              Marketing Analyst Remarks:
                            </span>
                            <p className="italic text-gray-700 leading-relaxed">
                              "{item.remarks}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        {/* Audited Telemetry Indicator */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#008280]" />
                            <span>Audited Metrics</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Details Modal Trigger (GET /analysis/{analysisId}) */}
                          <button
                            type="button"
                            onClick={() => handleViewDetails(item.analysisId)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-[#252A34] hover:bg-gray-50 cursor-pointer"
                            title="View analysis details"
                          >
                            <Info className="w-3.5 h-3.5 text-[#08D9D6]" />
                          </button>

                          {/* Edit Trigger (PUT /analysis/{analysisId}) */}
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-[#252A34] hover:bg-gray-50 cursor-pointer"
                            title="Edit campaign progress & remarks"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#08D9D6]" />
                          </button>

                          {/* Delete Trigger (DELETE /analysis/{analysisId}) */}
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.analysisId)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#FF2E63] hover:bg-rose-50 cursor-pointer"
                            title="Delete analysis record"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#FF2E63]" />
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

        {/* TAB 2: CREATE CAMPAIGN ANALYSIS FORM (POST /api/marketing/analysis/create) */}
        {activeTab === 'create' && (
          <div className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-md max-w-2xl mx-auto">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[#252A34]">
                <PlusCircle className="w-5 h-5 text-[#08D9D6]" />
                Create New Campaign Analysis
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Link client campaigns with analytical tracking, visible dates, audience views, and optimization remarks (Spring Boot spec).
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* 1. Client Select */}
              <div>
                <label className="block font-bold text-[#252A34] mb-1.5">
                  Target Client <span className="text-[#FF2E63]">*</span>
                </label>
                <select
                  value={createForm.clientId}
                  onChange={handleClientChange}
                  required
                  className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                >
                  <option value="">Select a registered client...</option>
                  {clients.map((c) => (
                    <option key={c.clientID} value={String(c.clientID)}>
                      Client #{c.clientID} — {c.companyName || `${c.firstName} ${c.lastName}`} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Connected Campaign */}
              <div>
                <label className="block font-bold text-[#252A34] mb-1.5">
                  Platform Campaign Activity (Optional Reference)
                </label>
                {isLoadingCampaigns ? (
                  <div className="p-3 rounded-2xl border border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#08D9D6]" />
                    Loading client campaigns...
                  </div>
                ) : availableClientCampaigns.length > 0 ? (
                  <select
                    value={createForm.campaignId}
                    onChange={(e) => {
                      const selectedCampId = e.target.value;
                      const campObj = availableClientCampaigns.find(
                        (c) => String(c.campaignId) === selectedCampId
                      );
                      setCreateForm((prev) => ({
                        ...prev,
                        campaignId: selectedCampId,
                        campaignName: campObj ? campObj.campaignName : prev.campaignName,
                      }));
                    }}
                    className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] bg-white text-xs text-[#252A34]"
                  >
                    <option value="">Manual / Custom Campaign Name</option>
                    {availableClientCampaigns.map((camp) => (
                      <option key={camp.campaignId} value={String(camp.campaignId)}>
                        Campaign #{camp.campaignId}: {camp.campaignName} ({camp.selectedChannels})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-2xl border border-gray-200 bg-gray-50 text-xs text-gray-500">
                    No active platform campaigns found for this client. You can manually enter the campaign name below.
                  </div>
                )}
              </div>

              {/* 3. Campaign Name */}
              <div>
                <label className="block font-bold text-[#252A34] mb-1.5">
                  Campaign Title / Name <span className="text-[#FF2E63]">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.campaignName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, campaignName: e.target.value }))
                  }
                  required
                  placeholder="e.g. Summer Multi-Channel Launch"
                  className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              {/* 4. Visible Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#252A34] mb-1.5">
                    Visible Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.visibleStartDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, visibleStartDate: e.target.value }))
                    }
                    className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#252A34] mb-1.5">
                    Visible End Date
                  </label>
                  <input
                    type="date"
                    value={createForm.visibleEndDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, visibleEndDate: e.target.value }))
                    }
                    className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>
              </div>

              {/* 5. Initial Views & Clicks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#252A34] mb-1.5">
                    Initial Audience Views
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.campaignViews}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, campaignViews: e.target.value }))
                    }
                    className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#252A34] mb-1.5">
                    Initial Clicks
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.clicks}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, clicks: e.target.value }))
                    }
                    className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>
              </div>

              {/* 6. Campaign Progress Status */}
              <div>
                <label className="block font-bold text-[#252A34] mb-1.5">
                  Campaign Progress Status
                </label>
                <select
                  value={createForm.campaignProgress}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, campaignProgress: e.target.value }))
                  }
                  className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                >
                  <option value="15% Scheduled">15% Scheduled</option>
                  <option value="40% Creative In Flight">40% Creative In Flight</option>
                  <option value="65% Mid-Flight Active">65% Mid-Flight Active</option>
                  <option value="85% High Engagement">85% High Engagement</option>
                  <option value="100% Concluded">100% Concluded</option>
                </select>
              </div>

              {/* 7. Marketing Analyst Remarks */}
              <div>
                <label className="block font-bold text-[#252A34] mb-1.5">
                  Marketing Analyst Remarks & Recommendations
                </label>
                <textarea
                  rows="3"
                  value={createForm.remarks}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                  placeholder="e.g. Strong engagement on YouTube bumper ads; recommend extending campaign visibility."
                  className="w-full p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="px-5 py-3 rounded-2xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-6 py-3 rounded-2xl font-bold text-[#252A34] shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isSubmittingCreate ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Campaign Analysis</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: AUDIENCE PERFORMANCE REPORT */}
        {activeTab === 'report' && (
          <div className="rounded-[32px] p-6 sm:p-10 bg-white border border-gray-200 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-extrabold text-[#252A34] flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#FF2E63]" />
                  Audience Performance & Campaign Audit
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  Overall audience views, CTR analysis, and progress status summary across agency accounts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 bg-white hover:bg-gray-50 text-[#252A34] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#08D9D6]" />
                Print Report
              </button>
            </div>

            {/* Performance Metrics Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3">Analysis #</th>
                    <th className="py-3 px-3">Campaign</th>
                    <th className="py-3 px-3">Client</th>
                    <th className="py-3 px-3">Visibility Interval</th>
                    <th className="py-3 px-3">Views</th>
                    <th className="py-3 px-3">Clicks</th>
                    <th className="py-3 px-3">CTR</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analyses.map((a) => {
                    const views = Number(a.campaignViews) || 0;
                    const clicks = Number(a.clicks) || 0;
                    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : '0.00';
                    return (
                      <tr key={a.analysisId} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-bold text-[#252A34]">#{a.analysisId}</td>
                        <td className="py-3 px-3 font-semibold text-[#252A34]">
                          {a.campaignName}
                        </td>
                        <td className="py-3 px-3">Client #{a.clientId}</td>
                        <td className="py-3 px-3 text-gray-500">
                          {a.visibleStartDate || 'N/A'} → {a.visibleEndDate || 'N/A'}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#252A34]">
                          {views.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#FF2E63]">
                          {clicks.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-[#08D9D6]">{ctr}%</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            {a.campaignProgress}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: EDIT ANALYSIS MODAL (PUT /api/marketing/analysis/{analysisId}) */}
      {editingAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl p-6 sm:p-7 bg-white border border-gray-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-[#252A34]">
                  Update Campaign Analysis #{editingAnalysis.analysisId}
                </h3>
                <p className="text-xs text-gray-500">
                  Client #{editingAnalysis.clientId} • {editingAnalysis.campaignName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAnalysis(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#252A34] mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={editFormData.campaignName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, campaignName: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#252A34] mb-1">Audience Views</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.campaignViews}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, campaignViews: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#252A34] mb-1">Clicks</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.clicks}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, clicks: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#252A34] mb-1">Visible Start Date</label>
                  <input
                    type="date"
                    value={editFormData.visibleStartDate || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, visibleStartDate: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#252A34] mb-1">Visible End Date</label>
                  <input
                    type="date"
                    value={editFormData.visibleEndDate || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, visibleEndDate: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#252A34] mb-1">
                  Campaign Progress Description
                </label>
                <input
                  type="text"
                  value={editFormData.campaignProgress}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, campaignProgress: e.target.value })
                  }
                  placeholder="e.g. 75% In Progress"
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#252A34] mb-1">
                  Marketing Analyst Remarks
                </label>
                <textarea
                  rows="3"
                  value={editFormData.remarks}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, remarks: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#08D9D6] text-[#252A34]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAnalysis(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 rounded-xl font-bold text-[#252A34] shadow-xs cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)' }}
                >
                  {isSubmittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW DETAILS (GET /api/marketing/analysis/{analysisId}) */}
      {viewingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-[#252A34] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#08D9D6]" />
                Analysis Record #{viewingDetails.analysisId}
              </h3>
              <button
                type="button"
                onClick={() => setViewingDetails(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Campaign Name:</span>
                <span className="font-bold text-[#252A34]">{viewingDetails.campaignName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Client ID:</span>
                <span className="font-bold text-[#252A34]">Client #{viewingDetails.clientId}</span>
              </div>
              {viewingDetails.campaignId && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Campaign ID:</span>
                  <span className="font-bold text-[#252A34]">
                    #{viewingDetails.campaignId}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Visible Interval:</span>
                <span className="font-bold text-[#252A34]">
                  {viewingDetails.visibleStartDate} → {viewingDetails.visibleEndDate}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Audience Views:</span>
                <span className="font-bold text-[#252A34]">
                  {(Number(viewingDetails.campaignViews) || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Clicks:</span>
                <span className="font-bold text-[#FF2E63]">
                  {(Number(viewingDetails.clicks) || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Progress:</span>
                <span className="font-bold text-[#08D9D6]">
                  {viewingDetails.campaignProgress}
                </span>
              </div>
              {viewingDetails.remarks && (
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1">Analyst Remarks:</span>
                  <p className="p-2.5 rounded-xl bg-gray-50 text-gray-700 italic">
                    "{viewingDetails.remarks}"
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewingDetails(null)}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#252A34] hover:bg-[#1a1e26] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION (DELETE /api/marketing/analysis/{analysisId}) */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white border border-gray-200 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-[#FF2E63]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#252A34]">Delete Analysis #{deletingId}?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this marketing analysis record? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm bg-[#FF2E63] flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
