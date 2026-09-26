/**
 * Add-an-Ad Advertising Agency Platform
 * Campaign API Services
 * Matches Spring Boot CampaignController (/api/campaign)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Fallback pricing catalog matching CampaignPricingService
export const DEFAULT_RATE_CARD = {
  'on-site pin': 1000.0,
  'YouTube': 1000.0,
  'FaceBook': 500.0,
  'Instagram': 800.0,
  'Google Ads': 1200.0,
  'TikTok': 700.0,
};

export const DEFAULT_CAMPAIGN_TYPES = [
  'In-Site Ad Hype',
  'Social Media Campaign',
  'Video Promo Campaign',
  'Search Engine Hype',
  'Omnichannel Campaign',
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
      const connectionError = new Error(
        'Unable to reach backend server on http://localhost:8080. Working in offline fallback mode.'
      );
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw err;
  }
}

/**
 * Get pricing catalog including campaign types and rate card
 */
export async function getPricingCatalog() {
  try {
    return await request('/api/campaign/pricing-catalog');
  } catch {
    // Graceful offline fallback
    return {
      campaignTypes: DEFAULT_CAMPAIGN_TYPES,
      channelRates: DEFAULT_RATE_CARD,
      exampleCalculation: 'on-site pin (Rs.1000) + YouTube (Rs.1000) + FaceBook (Rs.500) = Rs.2500',
    };
  }
}

/**
 * Calculate price breakdown for a list of channels
 */
export async function calculatePrice(channels) {
  try {
    return await request('/api/campaign/calculate-price', {
      method: 'POST',
      body: JSON.stringify(channels),
    });
  } catch {
    // Client-side calculate fallback matching CampaignPricingService
    const items = {};
    let total = 0;
    channels.forEach((ch) => {
      const price = DEFAULT_RATE_CARD[ch] || 500.0;
      items[ch] = price;
      total += price;
    });
    return {
      itemizedPrices: items,
      totalCampaignPrice: total,
    };
  }
}

/**
 * Create a new campaign for a client
 */
export async function createCampaign(campaignData) {
  return request('/api/campaign/create', {
    method: 'POST',
    body: JSON.stringify(campaignData),
  });
}

/**
 * Get all campaigns for a specific client
 */
export async function getCampaignsByClientId(clientId) {
  return request(`/api/campaign/client/${clientId}`);
}

/**
 * Get single campaign by ID
 */
export async function getCampaignById(campaignId) {
  return request(`/api/campaign/${campaignId}`);
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(campaignId, updatedData) {
  return request(`/api/campaign/${campaignId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedData),
  });
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId) {
  return request(`/api/campaign/${campaignId}`, {
    method: 'DELETE',
  });
}
