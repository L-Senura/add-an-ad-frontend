/**
 * Add-an-Ad Advertising Agency Platform
 * Review & Reputation API Services
 * Matches Spring Boot ReviewController (/api/reviews)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// In-memory demo reviews store for fallback/offline testing
const INITIAL_DEMO_REVIEWS = [
  // Client to Admin confidential reviews
  {
    reviewID: 1,
    clientID: 999,
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
    clientID: 999,
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
  // Public-to-Client brand reviews (Visitable by external users without account)
  {
    reviewID: 1001,
    clientID: 101,
    clientName: 'OmniVanguard Digital',
    reviewerName: 'Daniel Vance - DTC Brand Lead',
    rating: 5,
    reviewTitle: 'Tripled Our ROAS Within 45 Days!',
    reviewMessage: 'OmniVanguard transformed our performance video pipeline. Their audience targeting hooks and creative variations drove our customer acquisition cost down by 42%. Absolutely world-class ad agency.',
    workReference: 'Q3 YouTube & Meta Performance Blitz',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    reviewID: 1002,
    clientID: 101,
    clientName: 'OmniVanguard Digital',
    reviewerName: 'Sarah Jenkins',
    rating: 5,
    reviewTitle: 'Rapid Creative Delivery & Clear Reporting',
    reviewMessage: 'Delivered 14 high-impact video variations in under two weeks. The transparent weekly reporting and rate cards made stakeholder updates effortless.',
    workReference: 'Spring Product Launch 2026',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    reviewID: 1003,
    clientID: 101,
    clientName: 'OmniVanguard Digital',
    reviewerName: 'Anonymous Visitor',
    rating: 4,
    reviewTitle: 'Solid Campaign Execution',
    reviewMessage: 'Great work scaling our social media channels. Communication was always responsive and professional.',
    workReference: 'Brand Re-engagement Sprint',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(),
  },
  {
    reviewID: 1004,
    clientID: 102,
    clientName: 'Lumina Creative Labs',
    reviewerName: 'Kavita Patel - Consumer Tech CMO',
    rating: 5,
    reviewTitle: 'Viral TikTok Ad Reached 3.2M Impressions',
    reviewMessage: 'Lumina has unmatched artistic sense. Their 3D product animation captured viewers within the first 3 seconds, leading to our highest organic engagement surge ever.',
    workReference: 'Next-Gen Earbuds Launch',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    reviewID: 1005,
    clientID: 102,
    clientName: 'Lumina Creative Labs',
    reviewerName: 'Anonymous Visitor',
    rating: 5,
    reviewTitle: 'Breathtaking 3D Visuals & Storytelling',
    reviewMessage: 'Clean, elegant visual language that immediately elevated our brand perception. Very easy team to work with.',
    workReference: 'Interactive Digital Billboard Campaign',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
  },
  {
    reviewID: 1006,
    clientID: 103,
    clientName: 'Apex Brand Strategies',
    reviewerName: 'Julian Holloway - Retail Director',
    rating: 5,
    reviewTitle: 'Unrivaled Search Engine Visibility & Media Pins',
    reviewMessage: 'Apex combined physical location media pins with aggressive Google Ads bidding. We saw a 65% foot traffic increase in targeted metropolitan stores.',
    workReference: 'Metropolitan Omnichannel Rollout',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
  },
  {
    reviewID: 1007,
    clientID: 103,
    clientName: 'Apex Brand Strategies',
    reviewerName: 'Liam O’Connor',
    rating: 4,
    reviewTitle: 'Strategic Media Buying Experts',
    reviewMessage: '12+ years of media buying intelligence shows in their rate negotiations. Saved us over 20% on our placement budget.',
    workReference: 'Regional Brand Awareness Flight',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(),
  },
  {
    reviewID: 1008,
    clientID: 999,
    clientName: 'Nova Marketing Agency',
    reviewerName: 'Rachel Green',
    rating: 5,
    reviewTitle: 'Flawless Multi-Channel Execution',
    reviewMessage: 'Nova handled our entire ad creative lifecycle from script to conversion tracking. Truly an all-in-one advertising powerhouse.',
    workReference: 'Summer Promo Campaign 2026',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    reviewID: 1009,
    clientID: 104,
    clientName: 'EchoSphere Media',
    reviewerName: 'Mia Torres',
    rating: 5,
    reviewTitle: 'Huge Gen-Z Creator Reach',
    reviewMessage: 'Coordinated 30 micro-influencers within 5 days. Generated hundreds of genuine user-generated videos that converted like crazy.',
    workReference: 'Viral Trend Booster',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    reviewID: 1010,
    clientID: 105,
    clientName: 'Pulse Velocity Advertising',
    reviewerName: 'TechVibe Media',
    rating: 5,
    reviewTitle: 'Automated Programmatic Bidding That Works',
    reviewMessage: 'Real-time dynamic banner optimization gave us higher CTR than any static ad network we’ve tested. Exceptional machine learning setup.',
    workReference: 'Global Programmatic Retargeting',
    adminID: null,
    reviewType: 'PUBLIC_TO_CLIENT',
    isPublic: true,
    reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 64).toISOString(),
  },
];

function getStoredReviews() {
  try {
    const raw = localStorage.getItem('addanad_all_reviews');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read cached reviews', e);
  }
  return INITIAL_DEMO_REVIEWS;
}

let demoReviews = getStoredReviews();

function persistReviews() {
  try {
    localStorage.setItem('addanad_all_reviews', JSON.stringify(demoReviews));
  } catch (e) {
    console.warn('Could not persist reviews', e);
  }
}

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
 * NO account or authentication required.
 * POST /api/reviews/public/client/{clientId}
 */
export async function submitPublicReviewForClient(clientId, reviewData) {
  try {
    const payload = {
      clientID: Number(clientId),
      clientName: reviewData.clientName || 'Client Brand',
      reviewerName: reviewData.reviewerName?.trim() || 'Anonymous Visitor',
      rating: Number(reviewData.rating),
      reviewTitle: reviewData.reviewTitle?.trim() || '',
      reviewMessage: reviewData.reviewMessage?.trim() || '',
      workReference: reviewData.workReference?.trim() || '',
      reviewType: 'PUBLIC_TO_CLIENT',
      isPublic: true,
    };
    const res = await request(`/api/reviews/public/client/${clientId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // Sync into demo store as well
    if (res && res.reviewID) {
      demoReviews.unshift(res);
      persistReviews();
    }
    return res;
  } catch (err) {
    console.warn('Backend unavailable, saving public review locally:', err?.message);
    const newPublicReview = {
      reviewID: Date.now(),
      clientID: Number(clientId),
      clientName: reviewData.clientName || 'Client Brand',
      reviewerName: reviewData.reviewerName?.trim() || 'Anonymous Visitor',
      rating: Number(reviewData.rating) || 5,
      reviewTitle: reviewData.reviewTitle?.trim() || '',
      reviewMessage: reviewData.reviewMessage?.trim() || '',
      workReference: reviewData.workReference?.trim() || 'Direct Client Work',
      adminID: null,
      reviewType: 'PUBLIC_TO_CLIENT',
      isPublic: true,
      reviewTime: new Date().toISOString(),
    };
    demoReviews.unshift(newPublicReview);
    persistReviews();
    return newPublicReview;
  }
}

/**
 * Outside visitors view all public reviews for a specific client brand
 * GET /api/reviews/public/client/{clientId}
 */
export async function getPublicReviewsForClient(clientId) {
  try {
    return await request(`/api/reviews/public/client/${clientId}`);
  } catch {
    return demoReviews.filter(
      (r) =>
        String(r.clientID) === String(clientId) &&
        (r.isPublic === true || r.reviewType === 'PUBLIC_TO_CLIENT')
    );
  }
}

/**
 * Get client brand reputation and rating summary
 * Provides average rating, total review count, star breakdown, and recent reviews.
 * GET /api/reviews/public/client/{clientId}/summary
 */
export async function getClientReviewSummary(clientId) {
  try {
    const data = await request(`/api/reviews/public/client/${clientId}/summary`);
    const breakdown = data.ratingBreakdown || data.starBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const reviewsList = data.recentReviews || data.reviews || [];
    const avg = Number(data.averageRating !== undefined ? data.averageRating : 0);
    const count = Number(data.totalReviews !== undefined ? data.totalReviews : reviewsList.length);

    return {
      clientId: Number(data.clientID || clientId),
      clientID: Number(data.clientID || clientId),
      brandName: data.clientName || 'Partner Agency',
      clientName: data.clientName || 'Partner Agency',
      averageRating: avg,
      totalReviews: count,
      starBreakdown: breakdown,
      ratingBreakdown: breakdown,
      reviews: reviewsList,
      recentReviews: reviewsList,
    };
  } catch {
    const publicReviews = demoReviews.filter(
      (r) =>
        String(r.clientID) === String(clientId) &&
        (r.isPublic === true || r.reviewType === 'PUBLIC_TO_CLIENT')
    );

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (publicReviews.length === 0) {
      return {
        clientId: Number(clientId),
        clientID: Number(clientId),
        brandName: null,
        clientName: null,
        averageRating: 0.0,
        totalReviews: 0,
        starBreakdown: breakdown,
        ratingBreakdown: breakdown,
        reviews: [],
        recentReviews: [],
      };
    }

    let sum = 0;
    publicReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      breakdown[star] = (breakdown[star] || 0) + 1;
      sum += r.rating || 5;
    });

    const averageRating = Number((sum / publicReviews.length).toFixed(1));
    const brandName = publicReviews[0]?.clientName || 'Partner Agency';

    return {
      clientId: Number(clientId),
      clientID: Number(clientId),
      brandName,
      clientName: brandName,
      averageRating,
      totalReviews: publicReviews.length,
      starBreakdown: breakdown,
      ratingBreakdown: breakdown,
      reviews: publicReviews,
      recentReviews: publicReviews,
    };
  }
}

/**
 * Outside people search for client brand reviews by brand name
 * GET /api/reviews/public/search?name=...
 */
export async function searchPublicReviewsByBrandName(name = '') {
  try {
    const query = name ? `?name=${encodeURIComponent(name)}` : '';
    return await request(`/api/reviews/public/search${query}`);
  } catch {
    const term = (name || '').toLowerCase().trim();
    return demoReviews.filter(
      (r) =>
        (r.isPublic === true || r.reviewType === 'PUBLIC_TO_CLIENT') &&
        (!term || (r.clientName && r.clientName.toLowerCase().includes(term)))
    );
  }
}

/**
 * Outside visitors browse all public reviews across all client brand companies
 * GET /api/reviews/public/all
 */
export async function getAllPublicReviews() {
  try {
    return await request('/api/reviews/public/all');
  } catch {
    return demoReviews.filter((r) => r.isPublic === true || r.reviewType === 'PUBLIC_TO_CLIENT');
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
    return demoReviews.filter(
      (r) =>
        String(r.clientID) === String(clientId) &&
        (r.isPublic === true || r.reviewType === 'PUBLIC_TO_CLIENT')
    );
  }
}

