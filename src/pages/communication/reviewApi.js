/**
 * Add-an-Ad Advertising Agency Platform
 * Review & Reputation API Services
 * Matches Spring Boot ReviewController (/api/reviews)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// In-memory demo reviews store for fallback/offline testing
let demoReviews = [
  {
    reviewID: 1,
    clientID: 1,
    clientName: 'Nova Marketing Agency',
    reviewerName: 'Alexander Wright',
    rating: 5,
    reviewTitle: 'Outstanding Multi-Channel Ad Campaign',
    reviewMessage: 'The video promo campaign on YouTube and Facebook ads generated exceptional engagement and ROI. The production team delivered well ahead of schedule.',
    workReference: 'Summer Ad Hype (Campaign #1)',
    adminID: 1,
    reviewType: 'CLIENT_TO_ADMIN',
    isPublic: false,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    reviewID: 2,
    clientID: 1,
    clientName: 'Nova Marketing Agency',
    reviewerName: 'Alexander Wright',
    rating: 4,
    reviewTitle: 'Great Creative Quality & Fast Communication',
    reviewMessage: 'The on-site pin creative and ad placement schedule were executed smoothly. Communication executive resolved our inquiries promptly.',
    workReference: 'Digital Brand Launch 2026',
    adminID: null,
    reviewType: 'CLIENT_TO_ADMIN',
    isPublic: false,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    reviewID: 3,
    clientID: 101,
    clientName: 'OmniVanguard Digital',
    reviewerName: 'Marcus Vance',
    rating: 5,
    reviewTitle: 'Flawless Operations & Task Coordination',
    reviewMessage: 'Task manager and creative staff coordinated all design assets efficiently. Transparent rate cards and invoice reporting made budgeting effortless.',
    workReference: 'Q3 Omni Growth Plan',
    adminID: 1,
    reviewType: 'CLIENT_TO_ADMIN',
    isPublic: false,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    reviewID: 4,
    clientID: 102,
    clientName: 'Lumina Creative Labs',
    reviewerName: 'Elena Rostova',
    rating: 5,
    reviewTitle: 'Top Tier Marketing Analytics & Insights',
    reviewMessage: 'Weekly reach metrics and audience demographic breakdowns gave us deep visibility into our advertising performance.',
    workReference: 'Omnichannel Expansion',
    adminID: null,
    reviewType: 'CLIENT_TO_ADMIN',
    isPublic: false,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
  },
];

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const connectionError = new Error('Backend not reachable; utilizing local review store.');
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw err;
  }
}

// =========================================================================
// SECTION 1: CLIENT -> ADMIN REVIEWS (Confidential / Admin-Only Visibility)
// =========================================================================

/**
 * Submit review to agency administrators
 * POST /api/reviews/client-to-admin
 */
export async function submitClientToAdminReview(reviewData) {
  try {
    return await request('/api/reviews/client-to-admin', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  } catch {
    const newReview = {
      reviewID: Date.now(),
      clientID: reviewData.clientID || 1,
      clientName: reviewData.clientName || 'Client Agency',
      reviewerName: reviewData.reviewerName || 'Client Representative',
      rating: reviewData.rating,
      reviewTitle: reviewData.reviewTitle || '',
      reviewMessage: reviewData.reviewMessage,
      workReference: reviewData.workReference || '',
      adminID: reviewData.adminID || null,
      reviewType: 'CLIENT_TO_ADMIN',
      isPublic: false,
      reviewTime: new Date().toISOString(),
    };
    demoReviews.unshift(newReview);
    return newReview;
  }
}

/**
 * A client views all reviews they have submitted to agency administrators
 * GET /api/reviews/client/{clientId}/sent
 */
export async function getReviewsSentByClient(clientId) {
  try {
    return await request(`/api/reviews/client/${clientId}/sent`);
  } catch {
    return demoReviews.filter(
      (r) => String(r.clientID) === String(clientId) && r.reviewType === 'CLIENT_TO_ADMIN'
    );
  }
}

/**
 * A client updates their previously submitted review to administrators
 * PUT /api/reviews/client/{clientId}/update/{reviewId}
 */
export async function updateClientToAdminReview(clientId, reviewId, updatedData) {
  try {
    return await request(`/api/reviews/client/${clientId}/update/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedData),
    });
  } catch {
    demoReviews = demoReviews.map((r) => {
      if (String(r.reviewID) === String(reviewId)) {
        return {
          ...r,
          ...updatedData,
          rating: updatedData.rating !== undefined ? updatedData.rating : r.rating,
          reviewTitle: updatedData.reviewTitle !== undefined ? updatedData.reviewTitle : r.reviewTitle,
          reviewMessage: updatedData.reviewMessage !== undefined ? updatedData.reviewMessage : r.reviewMessage,
          workReference: updatedData.workReference !== undefined ? updatedData.workReference : r.workReference,
        };
      }
      return r;
    });
    return demoReviews.find((r) => String(r.reviewID) === String(reviewId));
  }
}

/**
 * A client deletes their previously submitted review to administrators
 * DELETE /api/reviews/client/{clientId}/delete/{reviewId}
 */
export async function deleteClientToAdminReview(clientId, reviewId) {
  try {
    return await request(`/api/reviews/client/${clientId}/delete/${reviewId}`, {
      method: 'DELETE',
    });
  } catch {
    demoReviews = demoReviews.filter((r) => String(r.reviewID) !== String(reviewId));
    return { success: true, message: 'Review deleted successfully.' };
  }
}

// =========================================================================
// SECTION 2: ADMIN MANAGEMENT & REPUTATION OVERVIEW
// =========================================================================

/**
 * Administrators view all confidential client-to-admin reviews
 * GET /api/reviews/admin/all
 */
export async function getAllClientToAdminReviews() {
  try {
    return await request('/api/reviews/admin/all');
  } catch {
    return demoReviews.filter((r) => r.reviewType === 'CLIENT_TO_ADMIN');
  }
}

/**
 * Administrators view client reviews targeted to a specific staff/admin member
 * GET /api/reviews/admin/target/{adminId}
 */
export async function getClientReviewsForAdmin(adminId) {
  try {
    return await request(`/api/reviews/admin/target/${adminId}`);
  } catch {
    return demoReviews.filter(
      (r) => String(r.adminID) === String(adminId) && r.reviewType === 'CLIENT_TO_ADMIN'
    );
  }
}

/**
 * Administrators view overall review metrics across the entire agency platform
 * GET /api/reviews/admin/stats
 */
export async function getAgencyReviewStats() {
  try {
    return await request('/api/reviews/admin/stats');
  } catch {
    const clientReviews = demoReviews.filter((r) => r.reviewType === 'CLIENT_TO_ADMIN');
    const total = clientReviews.length;
    const avg = total > 0 ? clientReviews.reduce((sum, r) => sum + r.rating, 0) / total : 5.0;
    return {
      formattedAvg: Number(avg.toFixed(1)),
      clientToAdminCount: total,
      publicToClientCount: 8,
    };
  }
}

/**
 * Administrators delete/moderate any review
 * DELETE /api/reviews/admin/delete/{reviewId}
 */
export async function adminDeleteReview(reviewId) {
  try {
    return await request(`/api/reviews/admin/delete/${reviewId}`, {
      method: 'DELETE',
    });
  } catch {
    demoReviews = demoReviews.filter((r) => String(r.reviewID) !== String(reviewId));
    return { success: true, message: 'Review deleted successfully by administrator.' };
  }
}

/**
 * Retrieve any single review record by ID
 * GET /api/reviews/{reviewId}
 */
export async function getReviewById(reviewId) {
  try {
    return await request(`/api/reviews/${reviewId}`);
  } catch {
    const found = demoReviews.find((r) => String(r.reviewID) === String(reviewId));
    if (!found) throw new Error('Review not found');
    return found;
  }
}

// =========================================================================
// SECTION 3: PUBLIC BRAND REVIEWS & CLIENT BRAND REPUTATION
// =========================================================================

/**
 * Outside visitors / public submit a review for a client brand
 * POST /api/reviews/public/client/{clientId}
 */
export async function submitPublicReviewForClient(clientId, reviewData) {
  return request(`/api/reviews/public/client/${clientId}`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
}

/**
 * Outside visitors view all public reviews for a specific client brand
 * GET /api/reviews/public/client/{clientId}
 */
export async function getPublicReviewsForClient(clientId) {
  try {
    return await request(`/api/reviews/public/client/${clientId}`);
  } catch {
    return [];
  }
}

/**
 * Get client brand reputation and rating summary
 * GET /api/reviews/public/client/{clientId}/summary
 */
export async function getClientReviewSummary(clientId) {
  try {
    return await request(`/api/reviews/public/client/${clientId}/summary`);
  } catch {
    return {
      clientId,
      brandName: 'Client Brand',
      averageRating: 4.8,
      totalReviews: 2,
      starBreakdown: { 5: 2, 4: 0, 3: 0, 2: 0, 1: 0 },
      reviews: [],
    };
  }
}

/**
 * Client views public reviews left by visitors regarding their works
 * GET /api/reviews/client/{clientId}/received
 */
export async function getReviewsReceivedByClient(clientId) {
  try {
    return await request(`/api/reviews/client/${clientId}/received`);
  } catch {
    return [];
  }
}
