import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Star,
  CheckCircle2,
  ArrowLeft,
  Send,
  MessageSquare,
  Calendar,
  MapPin,
  Mail,
  Phone,
  User,
  Award,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Layers,
  Filter,
  Check,
  AlertCircle,
  ThumbsUp,
  Megaphone,
  Briefcase,
  HelpCircle,
  ChevronRight,
  Loader2,
  Share2,
} from 'lucide-react';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import BackendErrorState from './BackendErrorState';
import { getRealCompanyById } from '../../services/companyService';
import {
  getPublicReviewsForClient,
  getClientReviewSummary,
  submitPublicReviewForClient,
} from '../communication/reviewApi';

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backend connection status states
  const [backendConnected, setBackendConnected] = useState(null); // null (checking) | true | false
  const [backendError, setBackendError] = useState(null);
  const [isOfflineDemoMode, setIsOfflineDemoMode] = useState(false);

  // Review submission state (matches provided ReviewController POST /api/reviews/public/client/{clientId})
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [workReference, setWorkReference] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', text: '' }

  // Filter & sort for reviews list
  const [starFilter, setStarFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest' | 'lowest'

  // Fetch company details, reviews, and summary from backend
  const loadData = async (forceDemo = false) => {
    setLoading(true);
    setBackendError(null);
    try {
      const res = await getRealCompanyById(id, { allowDemoFallback: forceDemo });
      setCompany(res.company);
      setReviews(res.reviews || []);
      setSummary(res.summary);
      setCampaigns(res.campaigns || res.company?.campaigns || []);
      setBackendConnected(res.connected);
      if (res.connected) {
        sessionStorage.removeItem('addanad_offline_demo');
        setIsOfflineDemoMode(false);
      }
    } catch (err) {
      console.warn('Backend connection failed in CompanyDetailsPage:', err);
      setBackendConnected(false);
      setBackendError({
        endpoint: `/api/client/${id} & /api/reviews/public/client/${id}`,
        details: err?.message || 'Connection refused at http://localhost:8080. The Spring Boot backend server is not running or unreachable.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleEnableOfflineDemo = () => {
    sessionStorage.setItem('addanad_offline_demo', 'true');
    setIsOfflineDemoMode(true);
    loadData(true);
  };

  const handleRetryLiveConnection = () => {
    sessionStorage.removeItem('addanad_offline_demo');
    setIsOfflineDemoMode(false);
    loadData(false);
  };

  // Handle public review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      setAlert({ type: 'error', text: 'Please select a star rating between 1 and 5.' });
      return;
    }

    if (!reviewMessage.trim()) {
      setAlert({ type: 'error', text: 'Please write a review message before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const payload = {
        rating: Number(rating),
        reviewerName: reviewerName.trim() || 'Anonymous Visitor',
        reviewTitle: reviewTitle.trim() || (rating === 5 ? 'Exceptional Campaign Quality' : 'Client Brand Review'),
        workReference: workReference.trim() || 'Ad Campaign Placement',
        reviewMessage: reviewMessage.trim(),
        clientName: company?.companyName || 'Client Brand',
      };

      const saved = await submitPublicReviewForClient(id, payload);

      // Optimistically update reviews list and recalculate summary immediately
      const updatedReviews = [saved, ...reviews];
      setReviews(updatedReviews);

      // Recalculate summary
      const sum = updatedReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
      const avg = Number((sum / updatedReviews.length).toFixed(1));
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      updatedReviews.forEach((r) => {
        const s = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        breakdown[s] = (breakdown[s] || 0) + 1;
      });

      setSummary({
        clientId: Number(id),
        brandName: company?.companyName,
        averageRating: avg,
        totalReviews: updatedReviews.length,
        starBreakdown: breakdown,
        reviews: updatedReviews,
      });

      // Update company rating in view
      setCompany((prev) => ({
        ...prev,
        rating: avg,
        reviewCount: updatedReviews.length,
      }));

      // Re-fetch fresh reviews & summary from backend in background to ensure database sync
      try {
        const [freshReviews, freshSummary] = await Promise.all([
          getPublicReviewsForClient(id).catch(() => null),
          getClientReviewSummary(id).catch(() => null),
        ]);
        if (Array.isArray(freshReviews) && freshReviews.length > 0) {
          setReviews(freshReviews);
        }
        if (freshSummary && freshSummary.totalReviews !== undefined) {
          setSummary(freshSummary);
        }
      } catch (e) {
        console.warn('Background sync error:', e);
      }

      // Reset form
      setReviewerName('');
      setReviewTitle('');
      setWorkReference('');
      setReviewMessage('');
      setRating(5);
      setIsFormOpen(false);

      setAlert({
        type: 'success',
        text: 'Thank you! Your review has been submitted and posted publicly.',
      });
    } catch (err) {
      console.error('Error submitting review:', err);
      setAlert({
        type: 'error',
        text: err?.message || 'Could not submit review. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter((r) => {
      if (starFilter === 'ALL') return true;
      return Math.round(r.rating) === Number(starFilter);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.reviewTime || 0) - new Date(a.reviewTime || 0);
      }
      if (sortBy === 'highest') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return (a.rating || 0) - (b.rating || 0);
    });

    if (loading) {
    return (
      <div className="min-h-screen bg-[#EAEAEA] flex flex-col font-sans">
        <PublicNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#08D9D6]" />
          <p className="text-sm font-bold text-[#252A34]">Connecting to backend & loading company details...</p>
        </div>
        <PublicFooter />
      </div>
    );
  }

  // If backend connection failed and user has not chosen offline demo mode, show the dedicated Backend Error State Page
  if (backendConnected === false && !isOfflineDemoMode) {
    return (
      <div className="min-h-screen bg-[#EAEAEA] flex flex-col font-sans">
        <PublicNavbar />
        <main className="flex-1 py-10 px-4">
          <BackendErrorState
            endpoint={backendError?.endpoint}
            errorDetails={backendError?.details}
            onRetry={() => loadData(false)}
            onUseOfflineDemo={handleEnableOfflineDemo}
          />
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#EAEAEA] flex flex-col font-sans">
        <PublicNavbar />
        <div className="flex-1 max-w-xl mx-auto py-20 px-4 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#FF2E63] mx-auto" />
          <h2 className="text-2xl font-black text-[#252A34]">Company Not Found</h2>
          <p className="text-sm text-gray-600">
            The advertising company you requested does not exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#08D9D6] text-[#252A34] text-xs font-bold hover:bg-[#06b5b2] transition-colors"
          >
            ← Back to Homepage
          </button>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const totalReviewsCount = summary?.totalReviews !== undefined ? summary.totalReviews : reviews.length;
  const effectiveRating = summary?.averageRating !== undefined ? Number(summary.averageRating) : Number(company.rating || 0);
  const hasReviews = totalReviewsCount > 0;
  const breakdown = summary?.starBreakdown || summary?.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="min-h-screen bg-[#EAEAEA] flex flex-col font-sans selection:bg-[#08D9D6]/30">
      {/* 1. Header Bar matching wireframe: Logo (left), Add-an-Ad (center), Login/Register (right) */}
      <PublicNavbar />

      {/* Offline Demo Warning Banner when backend is offline and user chose offline preview */}
      {isOfflineDemoMode && backendConnected === false && (
        <div className="bg-amber-400 text-amber-950 px-4 py-2 text-xs font-bold shadow-xs">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-700 animate-ping" />
              <span>
                <strong>Offline Preview Mode:</strong> Spring Boot backend is not running on port 8080. Displaying cached demo company details.
              </span>
            </div>
            <button
              onClick={handleRetryLiveConnection}
              className="px-3 py-1 rounded-lg bg-amber-950 hover:bg-black text-white text-[11px] font-extrabold transition-colors cursor-pointer shrink-0"
            >
              Retry Live Connection
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">
        
        {/* Navigation Breadcrumb Bar */}
        <div className="bg-[#161B26] border-b border-[#252A34] text-gray-300 py-3 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#08D9D6] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Companies</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="hidden sm:inline">Directory</span>
              <ChevronRight className="w-3 h-3 text-gray-500 hidden sm:inline" />
              <span className="text-white font-bold truncate max-w-[200px]">{company.companyName}</span>
            </div>
          </div>
        </div>

        {/* 2. Top Banner Header matching Wireframe 2 layout:
            Left: "Company 1 Name here"
            Right: "User rating about Company 1" */}
        <section className="bg-white border-b border-gray-200 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* LEFT: Company 1 Name here */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#08D9D6]/20 text-[#252A34] border border-[#08D9D6]/40">
                    {company.category}
                  </span>
                  {company.verified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#08D9D6] text-[#252A34] shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Agency Partner
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Pending Verification
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#161B26] text-white">
                    <Megaphone className="w-3.5 h-3.5 text-[#08D9D6]" />
                    {campaigns.length} {campaigns.length === 1 ? 'Live Campaign' : 'Live Campaigns'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#252A34] tracking-tight">
                  {company.companyName}
                </h1>

                {company.tagline && (
                  <p className="text-sm sm:text-base font-bold text-[#FF2E63] tracking-wide">
                    {company.tagline}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
                  {company.representative && (
                    <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                      <User className="w-3.5 h-3.5 text-[#08D9D6]" />
                      <span>Lead: {company.representative}</span>
                    </span>
                  )}
                  {company.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#08D9D6]" />
                      <span>{company.location}</span>
                    </span>
                  )}
                  {company.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#08D9D6]" />
                      <span>{company.email}</span>
                    </span>
                  )}
                  {company.contactNumber && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#08D9D6]" />
                      <span>{company.contactNumber}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT: User rating about Company 1 matching Wireframe 2 */}
              <div className="bg-[#DCEEFA] border-2 border-blue-200 rounded-2xl p-5 sm:p-6 shrink-0 flex flex-col items-start md:items-end justify-center space-y-2 shadow-sm min-w-[240px]">
                <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                  User Rating About {company.companyName.split(' ')[0]}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-[#252A34]">
                    {hasReviews ? effectiveRating.toFixed(1) : '0.0'}
                  </span>
                  <div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            hasReviews && star <= Math.round(effectiveRating)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 block mt-0.5">
                      {hasReviews
                        ? `${totalReviewsCount} verified ${totalReviewsCount === 1 ? 'review' : 'reviews'}`
                        : 'No public reviews yet'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 w-full flex items-center justify-between md:justify-end gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-[#252A34] font-bold border border-blue-200">
                    {campaigns.length} {campaigns.length === 1 ? 'Campaign' : 'Campaigns'}
                  </span>
                  <button
                    onClick={() => {
                      setIsFormOpen(true);
                      setTimeout(() => {
                        document.getElementById('write-review-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="px-3 py-1 rounded-xl bg-[#08D9D6] hover:bg-[#06b5b2] text-[#252A34] font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    + Add a Review
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. Main Body: Company Details & Active Campaigns */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          
          {/* Notification Alert Banner */}
          {alert && (
            <div
              className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold border animate-modal-content ${
                alert.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {alert.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{alert.text}</span>
              </div>
              <button
                onClick={() => setAlert(null)}
                className="text-xs font-bold hover:underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Company Details Section matching wireframe */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Comprehensive Overview & Real Active Campaigns */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Bio / Details */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-[#252A34] tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#08D9D6]" />
                  <span>Company Overview & Background</span>
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed font-normal">
                  {company.companyDetails}
                </p>

                {company.tags && company.tags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block mb-2">
                      Core Specializations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {company.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-[#EAF6FB] text-[#252A34] border border-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Real Active Campaigns Portfolio from /api/campaign/client/:id */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h2 className="text-xl font-black text-[#252A34] tracking-tight flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[#FF2E63]" />
                    <span>Active Campaigns & Ad Placements</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FF2E63]/10 text-[#FF2E63]">
                      {campaigns.length}
                    </span>
                  </h2>
                  <span className="text-xs text-gray-500 font-semibold hidden sm:inline">
                    Live Advertising Portfolio
                  </span>
                </div>

                {campaigns.length === 0 ? (
                  <div className="p-8 rounded-xl bg-gray-50 border border-gray-100 text-center space-y-2">
                    <Megaphone className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-xs font-bold text-gray-600">No active ad campaigns posted yet by this brand.</p>
                    <p className="text-[11px] text-gray-400">Campaigns created through the portal will appear here in real time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {campaigns.map((camp, idx) => (
                      <div
                        key={camp.campaignId || idx}
                        className="p-4 rounded-xl bg-[#DCEEFA]/40 hover:bg-[#DCEEFA]/70 border border-blue-200 hover:border-[#08D9D6] transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-black text-[#252A34] tracking-tight">
                            {camp.campaignName || camp.campaignType || 'Active Campaign'}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {camp.status || 'ACTIVE'}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-gray-400">Type:</span>
                            <span className="font-semibold text-gray-800">{camp.campaignType || 'General Campaign'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-gray-400">Channels:</span>
                            <span className="font-semibold text-[#161B26]">{camp.selectedChannels || 'Multi-Platform'}</span>
                          </div>
                          {camp.campaignPrices && (
                            <div className="flex items-center gap-1.5 font-medium">
                              <span className="text-gray-400">Budget:</span>
                              <span className="font-black text-[#FF2E63]">Rs. {Number(camp.campaignPrices).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Real Performance Stats & Contact Card */}
            <div className="space-y-6">
              
              {/* Real Performance Metrics */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#08D9D6]" />
                  <span>Agency Metrics</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                    <span className="text-xl font-black text-[#252A34] block">
                      {campaigns.length}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      Live Campaigns
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                    <span className="text-xl font-black text-[#08D9D6] block">
                      {totalReviewsCount}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      User Reviews
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                    <span className="text-xl font-black text-[#FF2E63] block">
                      {hasReviews ? effectiveRating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      Average Rating
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                    <span className="text-xs font-black text-emerald-600 block mt-1">
                      {company.status === 'ACCEPTED' ? 'Verified' : 'Pending'}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      Platform Status
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Agency Representative Contact */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#08D9D6]" />
                  <span>Representative & Inquiries</span>
                </h3>

                <div className="space-y-2 text-xs text-gray-600">
                  {company.representative && (
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400">Account Lead:</span>
                      <span className="font-bold text-[#252A34]">{company.representative}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400">Direct Email:</span>
                      <a href={`mailto:${company.email}`} className="font-bold text-[#08D9D6] hover:underline">
                        {company.email}
                      </a>
                    </div>
                  )}
                  {company.contactNumber && (
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400">Contact Number:</span>
                      <span className="font-bold text-[#252A34]">{company.contactNumber}</span>
                    </div>
                  )}
                  {company.location && (
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-400">Location:</span>
                      <span className="font-bold text-[#252A34]">{company.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-gray-400">Platform Status:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {company.status === 'ACCEPTED' ? 'Verified Agency Partner' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 4. PUBLIC REVIEWS & REPUTATION SUMMARY (Matching backend code ReviewController) */}
          <div id="reviews-section" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-8">
            
            {/* Header with Title and "Add a Review" Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#252A34] tracking-tight flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>Public Reviews & Ratings</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#08D9D6]/20 text-[#252A34]">
                    {reviews.length}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Authentic ratings submitted by clients and outside visitors. No account required to submit a review.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(!isFormOpen)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                  isFormOpen
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-[#08D9D6] hover:bg-[#06b5b2] text-[#252A34] shadow-md'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isFormOpen ? 'Close Review Form' : 'Write a Public Review'}</span>
              </button>
            </div>

            {/* Rating Breakdown Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 rounded-2xl bg-[#EAF6FB] border border-blue-100">
              
              {/* Overall Score */}
              <div className="text-center md:border-r border-blue-200 md:pr-6 space-y-1">
                <span className="text-4xl sm:text-5xl font-black text-[#252A34]">
                  {effectiveRating.toFixed(1)}
                </span>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(effectiveRating)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-600 block">
                  Based on {totalReviewsCount} public {totalReviewsCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              {/* 5-Star Distribution Bars */}
              <div className="md:col-span-2 space-y-1.5">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = breakdown[s] || 0;
                  const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;

                  return (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className="w-12 font-bold text-gray-600 flex items-center gap-0.5">
                        {s} <Star className="w-3 h-3 text-amber-500 fill-amber-500 inline" />
                      </span>
                      <div className="flex-1 bg-white rounded-full h-2.5 overflow-hidden border border-blue-200/60">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-gray-500 font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. ADD A REVIEW FORM SECTION
                "after that if he wants, he can add a review also. use as backend code provided." */}
            {isFormOpen && (
              <div
                id="write-review-section"
                className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#08D9D6] shadow-lg animate-modal-content space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-black text-[#252A34] tracking-tight">
                      Leave a Public Review for {company.companyName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Share your experience, product quality feedback, or campaign results. No account required!
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Public & Open
                  </span>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Star Rating Picker */}
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                      Overall Rating * (1 to 5 Stars)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 hover:scale-120 transition-transform cursor-pointer focus:outline-none"
                            title={`${star} Star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-7 h-7 ${
                                star <= (hoverRating || rating)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-[#252A34] ml-2">
                        {hoverRating || rating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Reviewer Name & Work Reference inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="e.g., Alex Johnson (Defaults to 'Anonymous Visitor')"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-[#08D9D6] focus:ring-1 focus:ring-[#08D9D6] bg-gray-50/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                        Work / Campaign Reference (Optional)
                      </label>
                      <input
                        type="text"
                        value={workReference}
                        onChange={(e) => setWorkReference(e.target.value)}
                        placeholder="e.g., Summer Video Promo, Digital Billboard"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-[#08D9D6] focus:ring-1 focus:ring-[#08D9D6] bg-gray-50/50"
                      />
                    </div>
                  </div>

                  {/* Review Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                      Review Headline / Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g., Exceptional creative quality and prompt delivery!"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-[#08D9D6] focus:ring-1 focus:ring-[#08D9D6] bg-gray-50/50"
                    />
                  </div>

                  {/* Review Message (Required) */}
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                      Review Message * (Required)
                    </label>
                    <textarea
                      rows={4}
                      value={reviewMessage}
                      onChange={(e) => setReviewMessage(e.target.value)}
                      placeholder="Write your constructive feedback about their advertising work, communication, creative quality, or campaign results..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-[#08D9D6] focus:ring-1 focus:ring-[#08D9D6] bg-gray-50/50"
                      required
                    />
                  </div>

                  {/* Submit Button & Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#252A34] bg-[#08D9D6] hover:bg-[#06b5b2] transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Publishing Review...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Public Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter and Sort Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
              {/* Star Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Filter:
                </span>
                {['ALL', '5', '4', '3', '2', '1'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setStarFilter(val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      starFilter === val
                        ? 'bg-[#161B26] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {val === 'ALL' ? 'All Stars' : `${val} ★`}
                  </button>
                ))}
              </div>

              {/* Sort Order */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs font-bold text-[#252A34] cursor-pointer"
                >
                  <option value="newest">Most Recent</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>

            {/* Public Reviews List */}
            {filteredReviews.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="text-sm font-bold text-[#252A34]">
                  {starFilter === 'ALL'
                    ? 'No public reviews yet for this agency'
                    : `No reviews found with ${starFilter} stars`}
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Be the first external visitor to share your opinion or rate this advertising agency’s work!
                </p>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#08D9D6] text-[#252A34] text-xs font-bold hover:bg-[#06b5b2] transition-colors"
                >
                  Write the First Review
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((rev) => {
                  const revRating = Number(rev.rating || 5);
                  const reviewer = rev.reviewerName || 'Anonymous Visitor';
                  const dateStr = rev.reviewTime
                    ? new Date(rev.reviewTime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recently';

                  return (
                    <div
                      key={rev.reviewID}
                      className="p-5 rounded-2xl bg-gray-50/70 hover:bg-gray-50 border border-gray-200 transition-all space-y-2.5"
                    >
                      {/* Top row: Avatar + Reviewer + Stars + Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#161B26] text-[#08D9D6] flex items-center justify-center font-black text-sm uppercase shadow-xs">
                            {reviewer.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#252A34]">{reviewer}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                Public Review
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">{dateStr}</span>
                          </div>
                        </div>

                        {/* Star Rating Badge */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= revRating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-[#252A34]">{revRating}.0</span>
                        </div>
                      </div>

                      {/* Review Title */}
                      {rev.reviewTitle && (
                        <h4 className="text-sm font-bold text-[#252A34] pt-1">
                          {rev.reviewTitle}
                        </h4>
                      )}

                      {/* Review Message */}
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
                        {rev.reviewMessage}
                      </p>

                      {/* Work Reference Tag */}
                      {rev.workReference && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                            <Briefcase className="w-3 h-3 text-[#08D9D6]" />
                            <span>Work Reference: {rev.workReference}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Footer matching wireframe */}
      <PublicFooter />
    </div>
  );
}
