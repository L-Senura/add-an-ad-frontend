import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  LogOut,
} from 'lucide-react';
import {
  getPendingClients,
  getAllClients,
  acceptClient,
  rejectClient,
} from './api';
import logoImg from '../../assets/Add-an-Ad.png';

// Initial mock clients for demo/offline resilience
const MOCK_CLIENTS = [
  {
    clientID: 101,
    companyName: 'OmniVanguard Digital',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus@omnivanguard.io',
    contactNumber: '+1 (555) 849-2041',
    companyDetails:
      'Full-funnel digital marketing agency focusing on e-commerce acceleration and performance video advertising across YouTube and social platforms.',
    status: 'PENDING',
  },
  {
    clientID: 102,
    companyName: 'Lumina Creative Labs',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena@luminacreative.com',
    contactNumber: '+1 (555) 672-1194',
    companyDetails:
      'High-impact visual production studio crafting interactive viral ads and brand stories for consumer tech enterprises.',
    status: 'PENDING',
  },
  {
    clientID: 103,
    companyName: 'Apex Brand Strategies',
    firstName: 'Julian',
    lastName: 'Holloway',
    email: 'julian@apexbrand.co',
    contactNumber: '+1 (555) 438-9920',
    companyDetails:
      'Omnichannel advertising consultancy with 12+ years optimizing search engine hype, social campaigns, and on-site media pins.',
    status: 'ACCEPTED',
  },
  {
    clientID: 104,
    companyName: 'EchoSphere Media',
    firstName: 'Claire',
    lastName: 'Bennett',
    email: 'claire@echosphere.net',
    contactNumber: '+1 (555) 201-7782',
    companyDetails:
      'Social influencer aggregator and multi-channel campaign manager specializing in Gen-Z TikTok & Instagram ad hyper-scaling.',
    status: 'REJECTED',
  },
];

export default function AdminClientApproval({ onBackToDashboard, onLogout }) {
  const [clients, setClients] = useState(MOCK_CLIENTS);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('PENDING'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', text: '' }
  const [selectedModalClient, setSelectedModalClient] = useState(null);

  // Refresh client data from server
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      let data = [];
      try {
        data = await getAllClients();
      } catch {
        try {
          data = await getPendingClients();
        } catch {
          data = [];
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        setClients(data);
      }
    } catch {
      // Keep existing data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        let data = [];
        try {
          data = await getAllClients();
        } catch {
          data = await getPendingClients();
        }
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setClients(data);
        }
      } catch {
        // use default MOCK_CLIENTS
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAccept = async (clientId, companyName) => {
    setActionLoadingId(clientId);
    setNotification(null);
    try {
      try {
        await acceptClient(clientId);
      } catch (err) {
        console.warn('Backend offline or mocked:', err);
      }

      // Update local state
      setClients((prev) =>
        prev.map((c) => (c.clientID === clientId ? { ...c, status: 'ACCEPTED' } : c))
      );
      setNotification({
        type: 'success',
        text: `Client "${companyName}" has been ACCEPTED. They can now log in to post advertisements.`,
      });
      if (selectedModalClient?.clientID === clientId) {
        setSelectedModalClient((prev) => ({ ...prev, status: 'ACCEPTED' }));
      }
    } catch {
      setNotification({
        type: 'error',
        text: `Failed to accept client "${companyName}". Please try again.`,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (clientId, companyName) => {
    setActionLoadingId(clientId);
    setNotification(null);
    try {
      try {
        await rejectClient(clientId);
      } catch (err) {
        console.warn('Backend offline or mocked:', err);
      }

      // Update local state
      setClients((prev) =>
        prev.map((c) => (c.clientID === clientId ? { ...c, status: 'REJECTED' } : c))
      );
      setNotification({
        type: 'error',
        text: `Client "${companyName}" registration has been REJECTED.`,
      });
      if (selectedModalClient?.clientID === clientId) {
        setSelectedModalClient((prev) => ({ ...prev, status: 'REJECTED' }));
      }
    } catch {
      setNotification({
        type: 'error',
        text: `Failed to reject client "${companyName}".`,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered clients list
  const filteredClients = clients.filter((c) => {
    const matchesStatus =
      selectedStatusFilter === 'ALL'
        ? true
        : c.status?.toUpperCase() === selectedStatusFilter;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.companyName?.toLowerCase().includes(query) ||
      c.firstName?.toLowerCase().includes(query) ||
      c.lastName?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.companyDetails?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  // Summary counts
  const pendingCount = clients.filter((c) => c.status === 'PENDING').length;
  const acceptedCount = clients.filter((c) => c.status === 'ACCEPTED').length;
  const rejectedCount = clients.filter((c) => c.status === 'REJECTED').length;

  return (
    <div
      className="min-h-screen w-full py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundColor: '#EAEAEA',
        backgroundImage: `
          radial-gradient(circle at 10% 15%, rgba(8, 217, 214, 0.14) 0%, transparent 40%),
          radial-gradient(circle at 90% 85%, rgba(255, 46, 99, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(37, 42, 52, 0.03) 0%, transparent 60%)
        `,
      }}
    >
      {/* Top Navbar */}
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
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-[#08D9D6]/20 text-[#252A34] border border-[#08D9D6]/40"
              >
                Admin Verification Desk
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500">
              Client Registration Approval & Agency Access Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 bg-white hover:bg-gray-50 text-[#252A34] border-gray-300 shadow-xs hover:border-[#08D9D6]"
            >
              <ArrowLeft className="w-4 h-4 text-[#252A34]" />
              Back to Admin Suite
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 bg-white hover:bg-red-50 text-red-600 border-red-200 shadow-xs hover:border-red-400 cursor-pointer"
              title="Logout and return to main home page"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Approval Dashboard */}
      <main className="max-w-6xl mx-auto">
        {/* Notification Alert Banner */}
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

        {/* Page Title & Context */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#252A34]">
              Agency Registration Review
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-600">
              Review newly registered advertising agencies and accept or decline their portal access.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchClients}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors bg-white hover:bg-gray-50 text-[#252A34] border-gray-300 shadow-xs hover:border-[#08D9D6]"
          >
            <Loader2 className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#08D9D6]' : ''}`} />
            Refresh Queue
          </button>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
          {/* Pending Card */}
          <div
            onClick={() => setSelectedStatusFilter('PENDING')}
            className={`p-4 rounded-2xl border bg-white shadow-xs cursor-pointer transition-all ${
              selectedStatusFilter === 'PENDING'
                ? 'ring-2 ring-[#FF2E63] border-[#FF2E63]'
                : 'border-[#FF2E63]/30 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF2E63]">
                Pending Review
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#FF2E63]"
                />
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF2E63]"
                />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#FF2E63]">
                {pendingCount}
              </span>
              <span className="text-xs font-medium text-gray-500">Agencies</span>
            </div>
          </div>

          {/* Accepted Card */}
          <div
            onClick={() => setSelectedStatusFilter('ACCEPTED')}
            className={`p-4 rounded-2xl border bg-white shadow-xs cursor-pointer transition-all ${
              selectedStatusFilter === 'ACCEPTED'
                ? 'ring-2 ring-[#08D9D6] border-[#08D9D6]'
                : 'border-[#08D9D6]/40 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#252A34]">
                Approved
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#08D9D6]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#08D9D6]">
                {acceptedCount}
              </span>
              <span className="text-xs font-medium text-gray-500">Active</span>
            </div>
          </div>

          {/* Rejected Card */}
          <div
            onClick={() => setSelectedStatusFilter('REJECTED')}
            className={`p-4 rounded-2xl border bg-white shadow-xs cursor-pointer transition-all ${
              selectedStatusFilter === 'REJECTED'
                ? 'ring-2 ring-[#FF2E63] border-[#FF2E63]'
                : 'border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Rejected
              </span>
              <XCircle className="w-4 h-4 text-[#FF2E63]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#252A34]">
                {rejectedCount}
              </span>
              <span className="text-xs font-medium text-gray-500">Declined</span>
            </div>
          </div>

          {/* Total Registrations */}
          <div
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`p-4 rounded-2xl border bg-white shadow-xs cursor-pointer transition-all ${
              selectedStatusFilter === 'ALL'
                ? 'ring-2 ring-[#252A34] border-[#252A34]'
                : 'border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total Registrations
              </span>
              <Building2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#252A34]">
                {clients.length}
              </span>
              <span className="text-xs font-medium text-gray-500">Total</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          className="rounded-3xl p-4 sm:p-5 bg-white border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          {/* Status Filter Tabs */}
          <div className="inline-flex p-1 rounded-2xl bg-gray-100 w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedStatusFilter === 'PENDING'
                  ? 'bg-white shadow-sm text-[#FF2E63]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('ACCEPTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedStatusFilter === 'ACCEPTED'
                  ? 'bg-white shadow-sm text-[#252A34]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#08D9D6]" />
              Accepted ({acceptedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('REJECTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedStatusFilter === 'REJECTED'
                  ? 'bg-white shadow-sm text-[#FF2E63]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Rejected ({rejectedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-white shadow-sm text-[#252A34]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({clients.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, email, name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] focus:border-transparent bg-white shadow-xs text-[#252A34]"
            />
          </div>
        </div>

        {/* Client Cards List */}
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-9 h-9 animate-spin mx-auto mb-3 text-[#08D9D6]" />
            <p className="text-sm font-semibold text-gray-500">
              Loading registration queue...
            </p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div
            className="rounded-3xl p-12 text-center bg-white border border-gray-200 shadow-xs"
          >
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-base font-bold text-[#252A34] mb-1">
              No client applications found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are no agencies matching the selected filter ({selectedStatusFilter}) or search query.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => {
              const isPending = client.status === 'PENDING';
              const isAccepted = client.status === 'ACCEPTED';
              const isRejected = client.status === 'REJECTED';
              const isBusy = actionLoadingId === client.clientID;

              return (
                <div
                  key={client.clientID}
                  className={`rounded-[28px] p-6 sm:p-7 bg-white border shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                    isPending ? 'border-[#FF2E63]/30' : 'border-gray-200'
                  }`}
                >
                  {/* Left highlight strip */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{
                      backgroundColor: isPending
                        ? '#FF2E63'
                        : isAccepted
                        ? '#08D9D6'
                        : '#252A34',
                    }}
                  />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pl-2">
                    {/* Left Details */}
                    <div className="space-y-3 max-w-2xl">
                      {/* Agency Name & Status Badge */}
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-extrabold tracking-tight text-[#252A34]">
                          {client.companyName}
                        </h2>

                        {/* Status Tag */}
                        {isPending && (
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF2E63]/15 text-[#FF2E63] border border-[#FF2E63]/30"
                          >
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {isAccepted && (
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#08D9D6]/15 text-[#252A34] border border-[#08D9D6]/40 font-bold"
                          >
                            <CheckCircle2 className="w-3 h-3 text-[#08D9D6]" />
                            Accepted
                          </span>
                        )}
                        {isRejected && (
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-[#FF2E63] border border-[#FF2E63]/30"
                          >
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}

                        <span className="text-xs text-gray-400 font-mono">
                          ID: #{client.clientID}
                        </span>
                      </div>

                      {/* Contact Credentials Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 flex-shrink-0 text-gray-400" />
                          <span className="font-semibold text-gray-800">
                            {client.firstName} {client.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-4 h-4 flex-shrink-0 text-gray-400" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
                          <span>{client.contactNumber || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Brief Company Description */}
                      <div className="text-xs leading-relaxed text-gray-600 bg-[#EAEAEA]/50 p-3.5 rounded-2xl border border-gray-200">
                        <p className="font-semibold mb-1 flex items-center gap-1.5 text-[#252A34]">
                          <FileText className="w-3.5 h-3.5 text-[#08D9D6]" />
                          Company Introduction:
                        </p>
                        <p className="line-clamp-2">
                          {client.companyDetails || 'No description provided by applicant.'}
                        </p>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      {/* Accept Button */}
                      <button
                        type="button"
                        onClick={() => handleAccept(client.clientID, client.companyName)}
                        disabled={isBusy || isAccepted}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${
                          isAccepted
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500'
                            : 'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-[#252A34]'
                        }`}
                        style={{
                          background: isAccepted
                            ? undefined
                            : 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                        }}
                      >
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>{isAccepted ? 'Already Accepted' : 'Accept Client'}</span>
                      </button>

                      {/* Reject Button */}
                      <button
                        type="button"
                        onClick={() => handleReject(client.clientID, client.companyName)}
                        disabled={isBusy || isRejected}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all duration-200 ${
                          isRejected
                            ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
                            : 'border-[#FF2E63] text-[#FF2E63] hover:bg-[#FF2E63]/10 active:translate-y-0'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{isRejected ? 'Declined' : 'Reject Application'}</span>
                      </button>

                      {/* View Profile details Modal button */}
                      <button
                        type="button"
                        onClick={() => setSelectedModalClient(client)}
                        className="text-xs font-semibold text-gray-600 hover:text-[#08D9D6] underline transition-colors mt-1"
                      >
                        View Full Dossier
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Full Dossier Detail Modal */}
      {selectedModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="rounded-[32px] p-6 sm:p-8 bg-white border border-gray-200 shadow-2xl max-w-xl w-full relative"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setSelectedModalClient(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-[#08D9D6]" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Agency Application Dossier #{selectedModalClient.clientID}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold mb-4 text-[#252A34]">
              {selectedModalClient.companyName}
            </h2>

            <div className="space-y-3.5 text-xs sm:text-sm text-gray-700 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Representative:</span>
                <span className="font-bold text-[#252A34]">
                  {selectedModalClient.firstName} {selectedModalClient.lastName}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Email Address:</span>
                <span className="font-mono text-[#252A34]">{selectedModalClient.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Contact Phone:</span>
                <span className="font-semibold text-[#252A34]">{selectedModalClient.contactNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Current Status:</span>
                <span
                  className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-xs ${
                    selectedModalClient.status === 'ACCEPTED'
                      ? 'bg-[#08D9D6]/15 text-[#252A34] border border-[#08D9D6]/40'
                      : selectedModalClient.status === 'PENDING'
                      ? 'bg-[#FF2E63]/15 text-[#FF2E63] border border-[#FF2E63]/40'
                      : 'bg-gray-100 text-[#FF2E63] border border-[#FF2E63]/30'
                  }`}
                >
                  {selectedModalClient.status}
                </span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1.5">
                  Complete Company Background:
                </span>
                <p className="p-3.5 rounded-2xl bg-[#EAEAEA]/60 border border-gray-200 text-xs leading-relaxed text-gray-700">
                  {selectedModalClient.companyDetails || 'No background description provided.'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleAccept(selectedModalClient.clientID, selectedModalClient.companyName)}
                disabled={actionLoadingId === selectedModalClient.clientID || selectedModalClient.status === 'ACCEPTED'}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-[#252A34] shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept Agency
              </button>
              <button
                type="button"
                onClick={() => handleReject(selectedModalClient.clientID, selectedModalClient.companyName)}
                disabled={actionLoadingId === selectedModalClient.clientID || selectedModalClient.status === 'REJECTED'}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border border-[#FF2E63] text-[#FF2E63] flex items-center justify-center gap-2 hover:bg-[#FF2E63]/10 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Add-an-Ad Platform • Admin Operations & Verification</p>
      </footer>
    </div>
  );
}
