import React, { useState, useEffect } from 'react';
import {
  Star,
  Shield,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Building2,
  Tag,
  RefreshCw,
  Award,
  Users,
  MessageSquare,
  X,
} from 'lucide-react';
import {
  getAllClientToAdminReviews,
  getAgencyReviewStats,
  adminDeleteReview,
} from './reviewApi';

export default function AdminReviewDesk({ adminSession }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL'); // 'ALL' | '5' | '4' | '3' | '2' | '1'

  // Delete modal state
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadAdminReviews = async () => {
    setIsLoading(true);
    try {
      const [allRev, reviewStats] = await Promise.all([
        getAllClientToAdminReviews(),
        getAgencyReviewStats(),
      ]);
      setReviews(Array.isArray(allRev) ? allRev : []);
      setStats(reviewStats);
    } catch (err) {
      console.warn('Error loading admin reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminReviews();
  }, []);

  const handleDeleteReview = async () => {
    if (!deletingReviewId) return;
    setIsDeleting(true);
    setAlert(null);

    try {
      await adminDeleteReview(deletingReviewId);
      setReviews((prev) => prev.filter((r) => (r.reviewID || r.id) !== deletingReviewId));
      setAlert({
        type: 'success',
        text: 'Review record has been successfully moderated and removed.',
      });
      setDeletingReviewId(null);
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.message || 'Failed to delete review.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter logic
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (r.clientName && r.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.reviewerName && r.reviewerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.reviewTitle && r.reviewTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.workReference && r.workReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.reviewMessage && r.reviewMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRating =
      ratingFilter === 'ALL' || String(r.rating) === String(ratingFilter);

    return matchesSearch && matchesRating;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Average Rating Card */}
        <div
          className="p-5 rounded-3xl bg-white border shadow-xs flex items-center justify-between"
          style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
        >
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Overall Agency Rating
            </span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-[#252A34]">
                {stats?.formattedAvg || '4.9'}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(stats?.formattedAvg || 5)
                        ? 'fill-amber-400 text-amber-500'
                        : 'fill-transparent text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-[11px] text-gray-400">Calculated from client ratings</span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(8, 217, 214, 0.15)' }}
          >
            <Award className="w-6 h-6 text-[#08D9D6]" />
          </div>
        </div>

        {/* Client to Admin Reviews Count */}
        <div
          className="p-5 rounded-3xl bg-white border shadow-xs flex items-center justify-between"
          style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
        >
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Confidential Client Reviews
            </span>
            <span className="text-3xl font-extrabold text-[#FF2E63]">
              {reviews.length || stats?.clientToAdminCount || 0}
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              Private feedback to leadership
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 46, 99, 0.12)' }}
          >
            <Shield className="w-6 h-6 text-[#FF2E63]" />
          </div>
        </div>

        {/* Public Visitor Feedback */}
        <div
          className="p-5 rounded-3xl bg-white border shadow-xs flex items-center justify-between"
          style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
        >
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Public Brand Evaluations
            </span>
            <span className="text-3xl font-extrabold text-[#252A34]">
              {stats?.publicToClientCount || 0}
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              Visitor reviews across agency clients
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100"
          >
            <Users className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-xs animate-fade-in ${
            alert.type === 'success'
              ? 'bg-[#08D9D6]/10 border-[#08D9D6] text-[#252A34]'
              : 'bg-red-50 border-red-300 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#08D9D6]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#FF2E63]" />
            )}
            <span>{alert.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlert(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="p-4 rounded-2xl bg-white border shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, title, campaign..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#08D9D6] bg-gray-50 focus:bg-white transition-all text-[#252A34]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            {['ALL', '5', '4', '3', '2', '1'].map((starOpt) => (
              <button
                key={starOpt}
                type="button"
                onClick={() => setRatingFilter(starOpt)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  ratingFilter === starOpt
                    ? 'bg-[#252A34] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {starOpt === 'ALL' ? 'All' : `${starOpt}★`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadAdminReviews}
            disabled={isLoading}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-all cursor-pointer shadow-2xs"
            title="Refresh review records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Reviews Grid */}
      {isLoading ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#08D9D6] mb-2" />
          <p className="text-xs font-semibold text-gray-500">Loading confidential reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-200/80">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-gray-800">No Matching Reviews Found</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {searchQuery || ratingFilter !== 'ALL'
              ? 'Try adjusting your search criteria or rating filter.'
              : 'Clients have not submitted any reviews yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => {
            const revId = rev.reviewID || rev.id;
            return (
              <div
                key={revId}
                className="p-5 rounded-3xl border bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
              >
                <div>
                  {/* Top Bar: Company Info & Rating */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm text-[#252A34] shadow-2xs"
                        style={{ backgroundColor: 'rgba(8, 217, 214, 0.2)' }}
                      >
                        <Building2 className="w-5 h-5 text-[#252A34]" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-gray-900 block leading-tight">
                          {rev.clientName || 'Client Agency'}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          by {rev.reviewerName || 'Client Representative'} • Client #{rev.clientID}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span className="text-xs font-bold text-amber-800">{rev.rating}.0</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-extrabold text-sm sm:text-base text-gray-900 mt-2 mb-1">
                    {rev.reviewTitle || 'Agency Service Evaluation'}
                  </h4>

                  {/* Work Reference Tag */}
                  {rev.workReference && (
                    <div className="mb-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        <Tag className="w-3 h-3 text-[#08D9D6]" />
                        {rev.workReference}
                      </span>
                    </div>
                  )}

                  {/* Review Message Text */}
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                    "{rev.reviewMessage}"
                  </p>
                </div>

                {/* Footer Bar */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {rev.reviewTime
                        ? new Date(rev.reviewTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recently'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingReviewId(revId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all cursor-pointer shadow-2xs"
                    title="Moderate / Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Moderate</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELETE / MODERATE CONFIRMATION MODAL */}
      {deletingReviewId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-sm w-full shadow-2xl border relative text-center"
            style={{ borderColor: 'rgba(255, 46, 99, 0.2)' }}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 bg-red-100">
              <Trash2 className="w-6 h-6 text-[#FF2E63]" />
            </div>
            <h3 className="text-lg font-extrabold text-[#252A34] mb-1">Moderate Review?</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this client review record from the administrative database?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingReviewId(null)}
                className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs border hover:bg-gray-100 transition-colors text-gray-700 cursor-pointer"
                style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5 hover:bg-red-700 cursor-pointer disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #FF2E63 0%, #e01a4f 100%)',
                }}
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
