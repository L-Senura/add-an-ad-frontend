import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Flame,
  Award,
  TrendingUp,
  Megaphone,
  MapPin,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  User,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import BackendErrorState from './BackendErrorState';
import { getRealCompanies } from '../../services/companyService';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'How does Add-an-Ad help me choose the best suit company for my advertising campaign?',
    answer:
      'Add-an-Ad aggregates verified advertising and production agencies into a single, transparent marketplace. Each company profile showcases their verified service capabilities, client satisfaction scores, completed campaign counts, and genuine public reviews from both past clients and prospective visitors.',
  },
  {
    id: 'faq-2',
    question: 'Can external visitors submit reviews about a company without creating an account?',
    answer:
      'Yes, absolutely! External users and consumers can browse any client company details page and leave genuine reviews and star ratings about their works, products, and campaign deliverables without registering or signing in. This empowers prospective clients with authentic public feedback.',
  },
  {
    id: 'faq-3',
    question: 'How are company user ratings and star breakdowns calculated?',
    answer:
      'Ratings are computed dynamically using a 5-star weighted average of all public reviews submitted for that specific agency. The summary displays the aggregate score rounded to one decimal place, total review count, and a full star distribution breakdown from 5 stars to 1 star.',
  },
  {
    id: 'faq-4',
    question: 'How do client brand companies register and post new ad campaigns?',
    answer:
      'Brand clients can register through our "Login / Register" portal. Once registered, company accounts are submitted to our agency administrative suite for quick verification. Once approved, clients gain full access to post campaigns, coordinate production tasks, view rate cards, and communicate in real time.',
  },
  {
    id: 'faq-5',
    question: 'Are reviews moderated to maintain high quality and trust?',
    answer:
      'Yes. Our administrative team monitors public reviews and moderates spam or inappropriate content using the platform moderation tools, ensuring our community maintains honest, high-integrity feedback for all listed agencies.',
  },
  {
    id: 'faq-6',
    question: 'What types of ad channels and placements do partner agencies specialize in?',
    answer:
      'Partner agencies cover the full digital and physical advertising spectrum: YouTube video ads, TikTok viral creative, Meta (Instagram & Facebook) performance campaigns, high-intent Google Search advertising, programmatic banner bidding, and on-site media pins.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'reviews' | 'name'
  const [openFaqId, setOpenFaqId] = useState('faq-1');

  // Backend connection status states
  const [backendConnected, setBackendConnected] = useState(null); // null (checking) | true | false
  const [backendError, setBackendError] = useState(null);
  const [isOfflineDemoMode, setIsOfflineDemoMode] = useState(false);

  // Load real companies from backend
  const loadData = async (forceDemo = false) => {
    setLoading(true);
    setBackendError(null);
    try {
      const res = await getRealCompanies({ allowDemoFallback: forceDemo });
      setCompanies(res.companies || []);
      setBackendConnected(res.connected);
      if (res.connected) {
        sessionStorage.removeItem('addanad_offline_demo');
        setIsOfflineDemoMode(false);
      }
    } catch (err) {
      console.warn('Backend connection failed:', err);
      setBackendConnected(false);
      setBackendError({
        endpoint: '/api/admin/clients & /api/reviews/public/all',
        details: err?.message || 'Connection refused at http://localhost:8080. The Spring Boot backend server is not running or unreachable.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Filter and sort companies
  const categories = ['ALL', ...new Set(companies.map((c) => c.category).filter(Boolean))];

  const filteredCompanies = companies
    .filter((company) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        company.companyName.toLowerCase().includes(query) ||
        company.companyDetails.toLowerCase().includes(query) ||
        company.category.toLowerCase().includes(query) ||
        (company.tags && company.tags.some((t) => t.toLowerCase().includes(query)));

      const matchesCategory =
        selectedCategory === 'ALL' || company.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'reviews') {
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
      return a.companyName.localeCompare(b.companyName);
    });

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // If backend connection failed and user has not chosen offline demo mode, show the dedicated Backend Error State Page
  if (!loading && backendConnected === false && !isOfflineDemoMode) {
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
                <strong>Offline Preview Mode:</strong> Spring Boot backend is not running on port 8080. Displaying cached demo agencies.
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

      {/* Main Scrollable Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#161B26] via-[#1F2633] to-[#EAEAEA] pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-5xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#08D9D6] text-xs font-bold tracking-wide uppercase border border-white/10 backdrop-blur-sm shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Advertising Agencies Directory
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Find Your <span className="text-[#08D9D6] underline decoration-[#FF2E63] decoration-4 underline-offset-8">Best Suit Company</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Explore verified advertising agencies, compare live public ratings, and inspect company campaign portfolios to choose the perfect marketing partner.
            </p>

            {/* Interactive Search & Filter Control Bar */}
            <div className="pt-6 max-w-3xl mx-auto">
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-2.5 border border-gray-100">
                <div className="relative flex-1 w-full">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by company name, services, e.g., 'Sunil', 'GreenLife', 'SmartBuild'..."
                    className="w-full pl-11 pr-4 py-2.5 text-sm text-[#252A34] placeholder-gray-400 bg-transparent rounded-xl focus:outline-none font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-[#252A34] cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <option value="rating">★ Highest Rated</option>
                    <option value="reviews">💬 Most Reviews</option>
                    <option value="name">A–Z Alphabetical</option>
                  </select>

                  <button
                    onClick={loadData}
                    title="Refresh Directory"
                    className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#08D9D6]' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#08D9D6] text-[#252A34] shadow-md scale-102 font-extrabold'
                        : 'bg-white/10 text-gray-200 hover:bg-white/20'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Companies' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Companies Section matching Wireframe Layout:
            Left: Company Name & Details
            Right: Company User Ratings
            Light blue card container styling */}
        <section id="companies" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-[#252A34] tracking-tight flex items-center gap-2">
              <span>Find Your Best Suit Company</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#08D9D6]/20 text-[#252A34] border border-[#08D9D6]/30">
                {filteredCompanies.length} available
              </span>
            </h2>
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
              Click any company card to view full details and public reviews
            </span>
          </div>

          {/* Cards List */}
          {loading ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#DCEEFA] animate-pulse rounded-2xl h-44 border border-blue-200"
                />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm space-y-3">
              <Building2 className="w-12 h-12 mx-auto text-gray-300" />
              <h3 className="text-base font-bold text-[#252A34]">No companies found matching your search</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Try adjusting your search keywords or select "All Companies" to view all verified advertising agency partners.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-[#08D9D6] text-[#252A34] text-xs font-bold hover:bg-[#06b5b2] transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredCompanies.map((company) => {
                const hasReviews = (company.reviewCount || 0) > 0;
                const rating = hasReviews ? Number(company.rating || 0) : 0;
                const reviewCount = company.reviewCount || 0;

                return (
                  <div
                    key={company.clientID}
                    onClick={() => navigate(`/company/${company.clientID}`)}
                    className="group relative bg-[#DCEEFA] hover:bg-[#D4E8F7] border-2 border-blue-200 hover:border-[#08D9D6] rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {/* Responsive flex layout: Left info, Right ratings */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      
                      {/* LEFT: Company Name Here & Real Company Details */}
                      <div className="flex-1 space-y-2.5">
                        {/* Company Name & Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-black text-[#252A34] tracking-tight group-hover:text-[#161B26]">
                            {company.companyName}
                          </h3>

                          {company.verified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#08D9D6] text-[#252A34] shadow-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified Partner
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Verification
                            </span>
                          )}

                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/80 text-[#252A34] border border-blue-200">
                            {company.category}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#161B26] text-white border border-[#252A34]">
                            <Megaphone className="w-3 h-3 text-[#08D9D6]" />
                            {company.completedCampaigns || 0} {company.completedCampaigns === 1 ? 'Live Campaign' : 'Live Campaigns'}
                          </span>
                        </div>

                        {/* Real Company Details from database */}
                        <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-normal">
                          {company.companyDetails}
                        </p>

                        {/* Real Metadata: Lead, Email, Phone, Location */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-700">
                          {company.representative && (
                            <span className="inline-flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold">
                              <User className="w-3.5 h-3.5 text-[#08D9D6]" />
                              <span className="text-gray-500 font-normal">Lead:</span>
                              <span>{company.representative}</span>
                            </span>
                          )}
                          {company.email && (
                            <span className="inline-flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold">
                              <Mail className="w-3.5 h-3.5 text-[#08D9D6]" />
                              <span>{company.email}</span>
                            </span>
                          )}
                          {company.contactNumber && (
                            <span className="inline-flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold">
                              <Phone className="w-3.5 h-3.5 text-[#08D9D6]" />
                              <span>{company.contactNumber}</span>
                            </span>
                          )}
                          {company.location && (
                            <span className="inline-flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-gray-500" />
                              <span>{company.location}</span>
                            </span>
                          )}
                        </div>

                        {/* Real Active Campaign Placements preview (from /api/campaign/client/:id) */}
                        {company.campaigns && company.campaigns.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mr-1 flex items-center gap-1">
                              <Megaphone className="w-3 h-3 text-[#FF2E63]" />
                              Active Placements:
                            </span>
                            {company.campaigns.slice(0, 3).map((camp, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-bold text-[#161B26] bg-white px-2.5 py-0.5 rounded-md border border-blue-200 shadow-2xs"
                              >
                                {camp.campaignName || camp.campaignType}{' '}
                                <span className="text-gray-500 font-normal">({camp.selectedChannels || 'Digital'})</span>
                              </span>
                            ))}
                            {company.campaigns.length > 3 && (
                              <span className="text-[11px] font-bold text-gray-600 bg-white/60 px-2 py-0.5 rounded-md">
                                +{company.campaigns.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* RIGHT: Company User Ratings Here matching wireframe */}
                      <div className="md:w-64 shrink-0 flex flex-col items-start md:items-end justify-center pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-blue-200/80 md:pl-6 space-y-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
                          User Ratings
                        </span>

                        {/* Star Rating & Score */}
                        {hasReviews ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= Math.round(rating)
                                      ? 'text-amber-500 fill-amber-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xl font-black text-[#252A34]">
                              {rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500 font-bold">/ 5.0</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 text-gray-300" />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-gray-500">Unrated</span>
                          </div>
                        )}

                        {/* Review Count badge */}
                        <span className="text-xs font-semibold text-gray-700 bg-white/90 px-2.5 py-1 rounded-full border border-blue-200">
                          {hasReviews
                            ? `${reviewCount} ${reviewCount === 1 ? 'user review' : 'user reviews'}`
                            : 'No user reviews yet'}
                        </span>

                        {/* Action Callout Button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/company/${company.clientID}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-[#252A34] bg-white group-hover:bg-[#08D9D6] transition-all shadow-xs border border-blue-200 group-hover:border-[#08D9D6] cursor-pointer"
                          >
                            <span>View Details & Reviews</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. FAQs Section matching wireframe: "Likewise add some demo FAQs to this section" */}
        <section id="faqs" className="bg-white border-y border-gray-200 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08D9D6]/10 text-[#08D9D6] text-xs font-extrabold tracking-wider uppercase">
                <HelpCircle className="w-3.5 h-3.5" />
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#252A34] tracking-tight">
                FAQs
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
                Got questions about selecting an agency, reviewing brand works, or posting ad campaigns? Here are quick answers to the most common inquiries.
              </p>
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {FAQ_ITEMS.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl transition-all border ${
                      isOpen
                        ? 'bg-[#EAF6FB] border-[#08D9D6] shadow-sm'
                        : 'bg-gray-50/80 hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <span className="text-sm sm:text-base font-bold text-[#252A34]">
                        {faq.question}
                      </span>
                      <span className="p-1 rounded-lg bg-white/80 text-gray-600 shrink-0">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#FF2E63]" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed font-normal border-t border-blue-100">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* 4. Footer Section matching wireframe: "Ad Agency details and footer." */}
      <PublicFooter />
    </div>
  );
}
