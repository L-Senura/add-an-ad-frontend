/**
 * Add-an-Ad Advertising Agency Platform
 * Marketing & Campaign Analysis API Services
 * Matches Spring Boot MarketingController (/api/marketing)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'add_an_ad_marketing_analyses';

// Seed demo analyses if none saved in localStorage yet
const INITIAL_DEMO_ANALYSES = [
  {
    analysisId: 201,
    clientId: 1,
    campaignId: 1,
    campaignName: 'Summer Sale Multi-Channel Blitz',
    campaignViews: 14850,
    clicks: 1240,
    visibleStartDate: '2026-06-01',
    visibleEndDate: '2026-07-15',
    campaignProgress: '85% In Progress',
    remarks: 'High CTR across on-site pin and YouTube bumper ads. Recommended scaling budget for weekend prime slots.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    analysisId: 202,
    clientId: 1,
    campaignId: 2,
    campaignName: 'Product Launch Mega Promotion',
    campaignViews: 4230,
    clicks: 310,
    visibleStartDate: '2026-08-01',
    visibleEndDate: '2026-08-30',
    campaignProgress: '45% Active - In Flight',
    remarks: 'Campaign launched smoothly across social media and billboard placements. Audience engagement velocity is steady.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    analysisId: 203,
    clientId: 101,
    campaignId: 3,
    campaignName: 'OmniVanguard Brand Refresh',
    campaignViews: 28900,
    clicks: 2870,
    visibleStartDate: '2026-05-15',
    visibleEndDate: '2026-06-30',
    campaignProgress: '100% Concluded',
    remarks: 'Campaign target accomplished with 13% over-index in video views. Final marketing audit archived.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
  },
];

function getStoredAnalyses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored analyses from localStorage:', e);
  }
  return [...INITIAL_DEMO_ANALYSES];
}

function saveStoredAnalyses(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: list }));
    }
  } catch (e) {
    console.warn('Failed to save analyses to localStorage:', e);
  }
}

let demoAnalyses = getStoredAnalyses();

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
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
        data = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && (data?.message || data?.error)) ||
        (typeof data === 'string' && data) ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const connectionError = new Error(
        'Backend server not connected; running in local marketing storage mode.'
      );
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw err;
  }
}

/**
 * 1. Create a new campaign analysis record for a client.
 * POST /api/marketing/analysis/create
 */
export async function createAnalysis(analysisData) {
  const payload = {
    clientId: Number(analysisData.clientId),
    campaignId: analysisData.campaignId ? Number(analysisData.campaignId) : null,
    campaignName: analysisData.campaignName || 'Campaign Analysis',
    campaignViews: Number(analysisData.campaignViews) || 0,
    clicks: Number(analysisData.clicks) || 0,
    visibleStartDate: analysisData.visibleStartDate || new Date().toISOString().split('T')[0],
    visibleEndDate:
      analysisData.visibleEndDate ||
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
    campaignProgress: analysisData.campaignProgress || '15% Scheduled',
    remarks: analysisData.remarks || '',
  };

  try {
    const res = await request('/api/marketing/analysis/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: res }));
    }
    return res;
  } catch {
    const newRecord = {
      analysisId: Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
    };
    demoAnalyses = getStoredAnalyses();
    demoAnalyses.unshift(newRecord);
    saveStoredAnalyses(demoAnalyses);
    return newRecord;
  }
}

/**
 * 2. Retrieve all campaign analysis and progress records allocated for a specific client.
 * GET /api/marketing/analysis/client/{clientId}
 */
export async function getAnalysisByClientId(clientId) {
  try {
    const data = await request(`/api/marketing/analysis/client/${clientId}`);
    return Array.isArray(data) ? data : [];
  } catch {
    demoAnalyses = getStoredAnalyses();
    return demoAnalyses.filter((a) => Number(a.clientId) === Number(clientId));
  }
}

/**
 * 3. Retrieve campaign analysis for a specific campaign.
 * GET /api/marketing/analysis/campaign/{campaignId}
 */
export async function getAnalysisByCampaignId(campaignId) {
  try {
    const data = await request(`/api/marketing/analysis/campaign/${campaignId}`);
    return Array.isArray(data) ? data : [];
  } catch {
    demoAnalyses = getStoredAnalyses();
    return demoAnalyses.filter((a) => Number(a.campaignId) === Number(campaignId));
  }
}

/**
 * 4. Retrieve a specific analysis record by its primary key (analysis_id).
 * GET /api/marketing/analysis/{analysisId}
 */
export async function getAnalysisById(analysisId) {
  try {
    return await request(`/api/marketing/analysis/${analysisId}`);
  } catch {
    demoAnalyses = getStoredAnalyses();
    const found = demoAnalyses.find((a) => Number(a.analysisId) === Number(analysisId));
    if (!found) throw new Error(`Campaign analysis #${analysisId} not found.`);
    return found;
  }
}

/**
 * 5. Retrieve all campaign analysis records across the platform.
 * GET /api/marketing/analysis/all
 */
export async function getAllAnalyses() {
  try {
    const data = await request('/api/marketing/analysis/all');
    return Array.isArray(data) ? data : [];
  } catch {
    demoAnalyses = getStoredAnalyses();
    return [...demoAnalyses];
  }
}

/**
 * 6. Update campaign progress, views, visible dates, or analyst remarks.
 * PUT /api/marketing/analysis/{analysisId}
 */
export async function updateAnalysis(analysisId, updatedData) {
  const payload = {
    ...updatedData,
    campaignViews:
      updatedData.campaignViews != null ? Number(updatedData.campaignViews) : undefined,
    clicks: updatedData.clicks != null ? Number(updatedData.clicks) : undefined,
  };

  try {
    const res = await request(`/api/marketing/analysis/${analysisId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: res }));
    }
    return res;
  } catch {
    demoAnalyses = getStoredAnalyses();
    const index = demoAnalyses.findIndex((a) => Number(a.analysisId) === Number(analysisId));
    if (index === -1) throw new Error(`Analysis #${analysisId} not found`);

    demoAnalyses[index] = {
      ...demoAnalyses[index],
      ...payload,
      analysisId: Number(analysisId),
    };
    saveStoredAnalyses(demoAnalyses);
    return demoAnalyses[index];
  }
}

/**
 * 7. Increment campaign views count by 1 (or custom amount).
 * Used automatically when an external user visits/views a campaign.
 * PUT /api/marketing/analysis/{analysisId}/increment-views?count={count}
 */
export async function incrementViews(analysisId, count = 1) {
  const c = Number(count != null ? count : 1);
  try {
    const res = await request(
      `/api/marketing/analysis/${analysisId}/increment-views?count=${c}`,
      {
        method: 'PUT',
      }
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: res }));
    }
    return res;
  } catch {
    demoAnalyses = getStoredAnalyses();
    const index = demoAnalyses.findIndex((a) => Number(a.analysisId) === Number(analysisId));
    if (index === -1) throw new Error(`Analysis #${analysisId} not found`);

    const currentViews = Number(demoAnalyses[index].campaignViews) || 0;
    demoAnalyses[index].campaignViews = currentViews + c;
    saveStoredAnalyses(demoAnalyses);

    return {
      analysisId: demoAnalyses[index].analysisId,
      campaignName: demoAnalyses[index].campaignName,
      updatedCampaignViews: demoAnalyses[index].campaignViews,
    };
  }
}

/**
 * 8. Increment campaign clicks count by 1 (or custom amount).
 * Automatically triggered when an external user clicks on a campaign.
 * PUT /api/marketing/analysis/{analysisId}/increment-clicks?count={count}
 */
export async function incrementClicks(analysisId, count = 1) {
  const c = Number(count != null ? count : 1);
  try {
    const res = await request(
      `/api/marketing/analysis/${analysisId}/increment-clicks?count=${c}`,
      {
        method: 'PUT',
      }
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: res }));
    }
    return res;
  } catch {
    demoAnalyses = getStoredAnalyses();
    const index = demoAnalyses.findIndex((a) => Number(a.analysisId) === Number(analysisId));
    if (index === -1) throw new Error(`Analysis #${analysisId} not found`);

    const currentClicks = Number(demoAnalyses[index].clicks) || 0;
    demoAnalyses[index].clicks = currentClicks + c;
    saveStoredAnalyses(demoAnalyses);

    return {
      analysisId: demoAnalyses[index].analysisId,
      campaignName: demoAnalyses[index].campaignName,
      updatedClicks: demoAnalyses[index].clicks,
    };
  }
}

/**
 * 9. Increment campaign views by campaignId.
 * Automatically triggered when external user views a campaign in marketplace.
 * PUT /api/marketing/analysis/campaign/{campaignId}/increment-views?count={count}
 */
export async function incrementCampaignViews(campaignId, count = 1) {
  const c = Number(count != null ? count : 1);
  try {
    const res = await request(
      `/api/marketing/analysis/campaign/${campaignId}/increment-views?count=${c}`,
      {
        method: 'PUT',
      }
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: res }));
    }
    return res;
  } catch {
    demoAnalyses = getStoredAnalyses();
    let updated = false;
    demoAnalyses.forEach((a) => {
      if (Number(a.campaignId) === Number(campaignId)) {
        a.campaignViews = (Number(a.campaignViews) || 0) + c;
        updated = true;
      }
    });
    if (updated) {
      saveStoredAnalyses(demoAnalyses);
    }
    return { campaignId, updated };
  }
}

/**
 * 10. Increment campaign clicks by campaignId.
 * Automatically triggered when external user clicks on a campaign.
 * PUT /api/marketing/analysis/campaign/{campaignId}/increment-clicks?count={count}
 */
export async function incrementCampaignClicks(campaignId, count = 1) {
  const c = Number(count != null ? count : 1);
  try {
    const res = await request(
      `/api/marketing/analysis/campaign/${campaignId}/increment-clicks?count=${c}`,
      {
        method: 'PUT',
      }
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: res }));
    }
    return res;
  } catch {
    demoAnalyses = getStoredAnalyses();
    let updated = false;
    demoAnalyses.forEach((a) => {
      if (Number(a.campaignId) === Number(campaignId)) {
        a.clicks = (Number(a.clicks) || 0) + c;
        updated = true;
      }
    });
    if (updated) {
      saveStoredAnalyses(demoAnalyses);
    }
    return { campaignId, updated };
  }
}

/**
 * 11. Unified automatic interaction tracker for external users:
 * Automatically increments view count and click count in backend database and local storage.
 */
export async function recordExternalCampaignClick({ campaignId, analysisId, clientId, campaignName }) {
  // If we have analysisId, increment clicks and views
  if (analysisId) {
    try {
      await incrementClicks(analysisId, 1);
      await incrementViews(analysisId, 1);
      return;
    } catch {}
  }

  // If we have campaignId, call backend endpoints
  if (campaignId) {
    let backendSuccess = false;
    try {
      await request(`/api/marketing/analysis/campaign/${campaignId}/click`, { method: 'PUT' });
      backendSuccess = true;
    } catch {
      try {
        await Promise.all([
          request(`/api/marketing/analysis/campaign/${campaignId}/increment-clicks`, { method: 'PUT' }),
          request(`/api/marketing/analysis/campaign/${campaignId}/increment-views`, { method: 'PUT' }),
        ]);
        backendSuccess = true;
      } catch {}
    }

    if (backendSuccess) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: { campaignId } }));
      }
      return;
    }
  }

  // Offline / fallback storage update
  demoAnalyses = getStoredAnalyses();
  let matched = false;

  demoAnalyses.forEach((item) => {
    const matchesId = campaignId && Number(item.campaignId) === Number(campaignId);
    const matchesClient =
      clientId &&
      Number(item.clientId) === Number(clientId) &&
      (!campaignName || String(item.campaignName).trim().toLowerCase() === String(campaignName).trim().toLowerCase());

    if (matchesId || matchesClient) {
      item.campaignViews = (Number(item.campaignViews) || 0) + 1;
      item.clicks = (Number(item.clicks) || 0) + 1;
      matched = true;
    }
  });

  if (!matched && (clientId || campaignId)) {
    // If no analysis record existed yet for this campaign, automatically create one so telemetry is never lost!
    const newRecord = {
      analysisId: Date.now(),
      clientId: Number(clientId || 1),
      campaignId: campaignId ? Number(campaignId) : null,
      campaignName: campaignName || 'Marketplace Campaign Placement',
      campaignViews: 1,
      clicks: 1,
      visibleStartDate: new Date().toISOString().split('T')[0],
      visibleEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
      campaignProgress: 'Active In Flight',
      remarks: 'Automated telemetry initialized from authentic external user ad interaction.',
      createdAt: new Date().toISOString(),
    };
    demoAnalyses.unshift(newRecord);
    matched = true;
  }

  if (matched) {
    saveStoredAnalyses(demoAnalyses);
  }
}

/**
 * 12. Automated View Tracker when external user views/browses a campaign in marketplace.
 */
export async function recordExternalCampaignView({ campaignId, analysisId, clientId, campaignName }) {
  if (analysisId) {
    try {
      return await incrementViews(analysisId, 1);
    } catch {}
  }

  if (campaignId) {
    try {
      await request(`/api/marketing/analysis/campaign/${campaignId}/increment-views`, { method: 'PUT' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: { campaignId } }));
      }
      return;
    } catch {}
  }

  demoAnalyses = getStoredAnalyses();
  let matched = false;

  demoAnalyses.forEach((item) => {
    const matchesId = campaignId && Number(item.campaignId) === Number(campaignId);
    const matchesClient =
      clientId &&
      Number(item.clientId) === Number(clientId) &&
      (!campaignName || String(item.campaignName).trim().toLowerCase() === String(campaignName).trim().toLowerCase());

    if (matchesId || matchesClient) {
      item.campaignViews = (Number(item.campaignViews) || 0) + 1;
      matched = true;
    }
  });

  if (matched) {
    saveStoredAnalyses(demoAnalyses);
  }
}

/**
 * 13. Delete an analysis record.
 * DELETE /api/marketing/analysis/{analysisId}
 */
export async function deleteAnalysis(analysisId) {
  try {
    const res = await request(`/api/marketing/analysis/${analysisId}`, {
      method: 'DELETE',
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketing_telemetry_updated', { detail: { analysisId } }));
    }
    return res;
  } catch {
    demoAnalyses = getStoredAnalyses();
    demoAnalyses = demoAnalyses.filter((a) => Number(a.analysisId) !== Number(analysisId));
    saveStoredAnalyses(demoAnalyses);
    return `Campaign analysis with ID ${analysisId} deleted successfully.`;
  }
}

