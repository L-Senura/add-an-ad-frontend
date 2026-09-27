import React, { useState, useEffect } from 'react';
import {
  Star,
  Shield,
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Tag,
  X,
  Save,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  submitClientToAdminReview,
  getReviewsSentByClient,
  updateClientToAdminReview,
  deleteClientToAdminReview,
  getClientReviewSummary,
} from './reviewApi';

const RATING_LABELS = {
  1: '1 - Needs Improvement',
  2: '2 - Fair Quality',
  3: '3 - Satisfactory Performance',
  4: '4 - Very Good Experience',
  5: '5 - Exceptional Execution',
};

export default function ReviewInterface({
  clientId = 1,
  clientName = 'Your Agency',
  reviewerName = 'Client Representative',
  campaigns = [],
}) {
  const [activeTab, setActiveTab] = useState('sent_to_admins'); // 'sent_to_admins' | 'received_from_public'
  const [sentReviews, setSentReviews] = useState([]);
  const [publicSummary, setPublicSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // New review form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [workReference, setWorkReference] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit review state
  const [editingReview, setEditingReview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete review state
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification banners
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', text: '' }

  // Load client's sent reviews and public brand summary
  const loadReviewsData = async () => {
    setIsLoading(true);
    try {
      const [sent, summary] = await Promise.all([
        getReviewsSentByClient(clientId),
        getClientReviewSummary(clientId),
      ]);
      setSentReviews(Array.isArray(sent) ? sent : []);
      setPublicSummary(summary);
    } catch (err) {
      console.warn('Could not load reviews data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, [clientId]);

  // Set default work reference when campaigns load
  useEffect(() => {
    if (campaigns && campaigns.length > 0 && !workReference) {
      setWorkReference(campaigns[0].campaignName || 'Campaign Placement');
    }
  }, [campaigns]);

  // Handle submit review to admin
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewMessage.trim()) {
      setAlert({ type: 'error', text: 'Please write a review message before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    const payload = {
      clientID: clientId,
      clientName: clientName,
      reviewerName: reviewerName,
      rating: rating,
      reviewTitle: reviewTitle.trim() || 'Agency Performance Review',
      workReference: workReference.trim() || 'Completed Campaign',
      reviewMessage: reviewMessage.trim(),
      adminID: null, // General agency administration
    };

    try {
      const created = await submitClientToAdminReview(payload);
      setSentReviews((prev) => [created, ...prev]);
      setAlert({
        type: 'success',
        text: 'Your review has been securely transmitted to agency administrators. Thank you!',
      });
      // Reset form
      setReviewTitle('');
      setReviewMessage('');
      setRating(5);
      setIsFormOpen(false);
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.message || 'Failed to submit review. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = (rev) => {
    setEditingReview({
      reviewID: rev.reviewID || rev.id,
      rating: rev.rating || 5,
      reviewTitle: rev.reviewTitle || '',
      workReference: rev.workReference || '',
      reviewMessage: rev.reviewMessage || '',
    });
  };

  // Save updated review
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    setIsUpdating(true);
    setAlert(null);

    try {
      const updated = await updateClientToAdminReview(clientId, editingReview.reviewID, {
        rating: editingReview.rating,
        reviewTitle: editingReview.reviewTitle,
        workReference: editingReview.workReference,
        reviewMessage: editingReview.reviewMessage,
      });

      setSentReviews((prev) =>
        prev.map((r) => ((r.reviewID || r.id) === editingReview.reviewID ? { ...r, ...updated } : r))
      );
      setAlert({
        type: 'success',
        text: 'Your review was successfully updated.',
      });
      setEditingReview(null);
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.message || 'Could not update review.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm delete review
  const handleConfirmDelete = async () => {
    if (!deletingReviewId) return;

    setIsDeleting(true);
    setAlert(null);

    try {
      await deleteClientToAdminReview(clientId, deletingReviewId);
      setSentReviews((prev) => prev.filter((r) => (r.reviewID || r.id) !== deletingReviewId));
      setAlert({
        type: 'success',
        text: 'Review deleted successfully.',
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

  return (
    <div
      className="rounded-[32px] p-6 sm:p-10 shadow-xl border relative transition-all duration-300"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(37, 42, 52, 0.12)',
        boxShadow: '0 20px 40px -15px rgba(37, 42, 52, 0.1), 0 0 0 1px rgba(37, 42, 52, 0.05)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-10 right-10 h-1 rounded-b-full opacity-90"
        style={{
          background: 'linear-gradient(90deg, #08D9D6 0%, #252A34 50%, #FF2E63 100%)',
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#252A34] flex items-center gap-2">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              Agency Reviews & Feedback
            </h2>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(8, 217, 214, 0.18)',
                color: '#252A34',
              }}
            >
              <Shield className="w-3 h-3 text-[#08D9D6]" />
              Confidential to Admins
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 max-w-xl">
            Evaluate advertising agency performance, campaign execution, and creative services.
            Your reviews are delivered privately to agency leadership and administrators.
          </p>
        </div>

        {/* Action button to open submit form */}
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#252A34] shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            Write Review for Admins
          </button>
        )}
      </div>

      {/* Notification Alert */}
      {alert && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center justify-between border shadow-xs animate-fade-in ${
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

      {/* WRITE REVIEW COLLAPSIBLE CARD */}
      {isFormOpen && (
        <div
          className="mb-8 p-6 rounded-3xl border bg-gray-50/80 shadow-inner relative animate-fade-in"
          style={{ borderColor: 'rgba(8, 217, 214, 0.4)' }}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#08D9D6]" />
              <h3 className="font-extrabold text-sm sm:text-base text-[#252A34]">
                Submit Confidential Review to Agency Admins
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200/50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Interactive 5-Star Rating Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#252A34]">
                Your Rating <span className="text-[#FF2E63]">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-hidden"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-500'
                              : 'fill-transparent text-gray-300 hover:text-amber-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-gray-700">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Review Title & Work Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Review Subject / Title <span className="text-[#FF2E63]">*</span>
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g., Outstanding Campaign Reach & Strategy"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Campaign / Project Reference
                </label>
                {campaigns.length > 0 ? (
                  <select
                    value={workReference}
                    onChange={(e) => setWorkReference(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                  >
                    {campaigns.map((c) => (
                      <option key={c.campaignId || c.id} value={c.campaignName}>
                        {c.campaignName} ({c.campaignType})
                      </option>
                    ))}
                    <option value="General Agency Service">General Agency Service</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={workReference}
                    onChange={(e) => setWorkReference(e.target.value)}
                    placeholder="e.g., Q3 Video Promo Campaign"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                  />
                )}
              </div>
            </div>

            {/* Review Detailed Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                Detailed Review & Agency Feedback <span className="text-[#FF2E63]">*</span>
              </label>
              <textarea
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                rows="4"
                placeholder="Share your experience regarding creative output, advertising ROI, task delivery, and staff communication..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34] resize-none"
                style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-[#252A34] shadow-md transition-all hover:shadow-lg cursor-pointer disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Review...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Private Review
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm border hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
                style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs: Sent to Admins vs Received from Public */}
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('sent_to_admins')}
          className={`pb-1 text-sm font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'sent_to_admins'
              ? 'border-[#08D9D6] text-[#252A34]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <span>Reviews Sent to Administrators ({sentReviews.length})</span>
        </button>
        <span className="text-gray-300">•</span>
        <button
          type="button"
          onClick={() => setActiveTab('received_from_public')}
          className={`pb-1 text-sm font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'received_from_public'
              ? 'border-[#FF2E63] text-[#252A34]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <span>Customer Reviews of Your Brand ({publicSummary?.totalReviews || 0})</span>
        </button>
      </div>

      {/* VIEW: SENT REVIEWS TO ADMINS */}
      {activeTab === 'sent_to_admins' && (
        <div>
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#08D9D6] mb-2" />
              <p className="text-xs font-semibold text-gray-500">Loading your feedback records...</p>
            </div>
          ) : sentReviews.length === 0 ? (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
              <div
                className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: 'rgba(8, 217, 214, 0.15)' }}
              >
                <MessageSquare className="w-6 h-6 text-[#08D9D6]" />
              </div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">No Reviews Submitted Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Share your direct feedback with agency operations, media strategists, and finance administrators.
              </p>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#252A34] shadow-xs cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Submit Your First Review
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentReviews.map((rev) => {
                const revId = rev.reviewID || rev.id;
                return (
                  <div
                    key={revId}
                    className="p-5 rounded-2xl border bg-gray-50 flex flex-col justify-between hover:shadow-md transition-all group"
                    style={{ borderColor: 'rgba(37, 42, 52, 0.12)' }}
                  >
                    <div>
                      {/* Rating Stars & Private badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'fill-transparent text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-gray-700 ml-1.5">
                            {rev.rating}.0
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                          <Shield className="w-3 h-3 text-[#FF2E63]" />
                          Admin Confidential
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-extrabold text-sm sm:text-base text-gray-900 mb-1 leading-snug">
                        {rev.reviewTitle || 'Agency Review'}
                      </h4>

                      {/* Work reference badge */}
                      {rev.workReference && (
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                            <Tag className="w-3 h-3 text-[#08D9D6]" />
                            {rev.workReference}
                          </span>
                        </div>
                      )}

                      {/* Review message text */}
                      <p className="text-xs text-gray-700 leading-relaxed mt-1">
                        "{rev.reviewMessage}"
                      </p>
                    </div>

                    {/* Footer: Date & Edit/Delete actions */}
                    <div className="mt-4 pt-3 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {rev.reviewTime
                            ? new Date(rev.reviewTime).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recently'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-white hover:bg-gray-100 text-[#252A34] border border-gray-200 hover:border-[#08D9D6] transition-all cursor-pointer shadow-2xs"
                        >
                          <Edit2 className="w-3 h-3 text-[#08D9D6]" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingReviewId(revId)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-400 transition-all cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                          Delete
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

      {/* VIEW: CUSTOMER REVIEWS RECEIVED FROM PUBLIC */}
      {activeTab === 'received_from_public' && (
        <div className="space-y-6 animate-fade-in">
          {/* Brand Reputation Summary Card */}
          <div
            className="p-6 rounded-3xl border bg-gradient-to-br from-white to-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6"
            style={{ borderColor: 'rgba(37, 42, 52, 0.1)' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-extrabold text-2xl text-white shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #FF2E63 0%, #e01a4f 100%)',
                }}
              >
                {publicSummary?.averageRating || '5.0'}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(publicSummary?.averageRating || 5)
                          ? 'fill-amber-400 text-amber-500'
                          : 'fill-transparent text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-gray-800 ml-1">
                    {publicSummary?.averageRating || '5.0'} / 5.0
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-gray-900">
                  {clientName} Public Reputation
                </h4>
                <p className="text-xs text-gray-500">
                  Based on {publicSummary?.totalReviews || 0} reviews submitted by prospective customers and visitors.
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs max-w-xs">
              <p className="font-semibold text-gray-800 mb-0.5">Public Visitor Engagement</p>
              <p className="leading-snug">
                Outside clients searching for your company can view and submit reviews at{' '}
                <code className="text-[#FF2E63] font-mono text-[10px]">
                  /api/reviews/public/client/{clientId}
                </code>
              </p>
            </div>
          </div>

          {/* Public Reviews List */}
          {(!publicSummary?.reviews || publicSummary.reviews.length === 0) ? (
            <div className="text-center py-8 text-xs text-gray-500 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No public reviews recorded yet for your agency brand.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicSummary.reviews.map((pr) => (
                <div
                  key={pr.reviewID || pr.id}
                  className="p-4 rounded-2xl border bg-white shadow-2xs"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.1)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= pr.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'fill-transparent text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {pr.reviewerName || 'Anonymous Visitor'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 mb-1">{pr.reviewTitle}</p>
                  <p className="text-xs text-gray-600 leading-normal">"{pr.reviewMessage}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border relative my-8"
            style={{ borderColor: 'rgba(37, 42, 52, 0.15)' }}
          >
            <div
              className="absolute top-0 left-10 right-10 h-1.5 rounded-b-full"
              style={{
                background: 'linear-gradient(90deg, #08D9D6 0%, #252A34 50%, #FF2E63 100%)',
              }}
            />

            <div className="flex items-start justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-extrabold text-[#252A34] flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#08D9D6]" />
                  Edit Submitted Review
                </h3>
                <p className="text-xs text-gray-500">
                  Update your confidential evaluation for agency leadership.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Rating (1 - 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditingReview((prev) => ({ ...prev, rating: star }))}
                      className="p-1 focus:outline-hidden cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= editingReview.rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'fill-transparent text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">
                    {RATING_LABELS[editingReview.rating]}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Subject Title
                </label>
                <input
                  type="text"
                  value={editingReview.reviewTitle}
                  onChange={(e) =>
                    setEditingReview((prev) => ({ ...prev, reviewTitle: e.target.value }))
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                />
              </div>

              {/* Work Reference */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Campaign / Work Reference
                </label>
                <input
                  type="text"
                  value={editingReview.workReference}
                  onChange={(e) =>
                    setEditingReview((prev) => ({ ...prev, workReference: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34]"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                />
              </div>

              {/* Review Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#252A34]">
                  Feedback Message
                </label>
                <textarea
                  value={editingReview.reviewMessage}
                  onChange={(e) =>
                    setEditingReview((prev) => ({ ...prev, reviewMessage: e.target.value }))
                  }
                  rows="4"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[#08D9D6] bg-white text-[#252A34] resize-none"
                  style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-[#252A34] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #08D9D6 0%, #00b4b1 100%)',
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
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
                  onClick={() => setEditingReview(null)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm border hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
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
      {deletingReviewId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="bg-white rounded-[32px] p-6 sm:p-8 max-w-sm w-full shadow-2xl border relative text-center"
            style={{ borderColor: 'rgba(255, 46, 99, 0.2)' }}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 bg-red-100">
              <Trash2 className="w-6 h-6 text-[#FF2E63]" />
            </div>
            <h3 className="text-lg font-extrabold text-[#252A34] mb-1">Delete Review?</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to remove this feedback record? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingReviewId(null)}
                className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs border hover:bg-gray-100 transition-colors text-gray-700 cursor-pointer"
                style={{ borderColor: 'rgba(37, 42, 52, 0.2)' }}
              >
                Keep Review
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5 hover:bg-red-700 cursor-pointer disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #FF2E63 0%, #e01a4f 100%)',
                }}
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
