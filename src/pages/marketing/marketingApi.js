/**
 * Add-an-Ad Advertising Agency Platform
 * Marketing & Campaign Analysis API Services
 * Matches Spring Boot MarketingController (/api/marketing)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Fallback demo analyses for immediate local preview and testing
let demoAnalyses = [
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

let nextAnalysisId = 204;

/**
 * Create a new campaign analysis record for a client.
 * POST /api/marketing/analysis/create
 */
export async function createAnalysis(analysisData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/marketing/analysis/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisData),
    });

    if (response.ok) {
      return await response.json();
    }
    const errText = await response.text();
    throw new Error(errText || 'Failed to create campaign analysis');
  } catch (err) {
    console.warn('Backend unavailable, saving campaign analysis locally:', err.message);

    const newRecord = {
      analysisId: nextAnalysisId++,
      clientId: Number(analysisData.clientId),
      campaignId: analysisData.campaignId ? Number(analysisData.campaignId) : null,
      campaignName: analysisData.campaignName || 'Untitled Campaign Analysis',
      campaignViews: Number(analysisData.campaignViews) || 0,
      clicks: Number(analysisData.clicks) || 0,
      visibleStartDate: analysisData.visibleStartDate || new Date().toISOString().split('T')[0],
      visibleEndDate: analysisData.visibleEndDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
      campaignProgress: analysisData.campaignProgress || '25% Scheduled',
      remarks: analysisData.remarks || '',
      createdAt: new Date().toISOString(),
    };

    demoAnalyses.unshift(newRecord);
    return newRecord;
  }
}

/**
 * Retrieve all campaign analysis records for a specific client.
 * GET /api/marketing/analysis/client/{clientId}
 */
export async function getAnalysisByClientId(clientId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/marketing/analysis/client/${clientId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`Backend unavailable, retrieving local analysis for client #${clientId}:`, err.message);
  }

  return demoAnalyses.filter((a) => Number(a.clientId) === Number(clientId));
}

/**
 * Retrieve campaign analysis for a specific campaign.
 * GET /api/marketing/analysis/campaign/{campaignId}
 */
export async function getAnalysisByCampaignId(campaignId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/marketing/analysis/campaign/${campaignId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`Backend unavailable, retrieving local analysis for campaign #${campaignId}:`, err.message);
  }

  return demoAnalyses.filter((a) => Number(a.campaignId) === Number(campaignId));
}

/**
 * Retrieve a specific analysis record by its primary key (analysis_id).
 * GET /api/marketing/analysis/{analysisId}
 */
export async function getAnalysisById(analysisId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/marketing/analysis/${analysisId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`Backend unavailable, retrieving local analysis #${analysisId}:`, err.message);
  }

  const found = demoAnalyses.find((a) => Number(a.analysisId) === Number(analysisId));
  if (!found) throw new Error(`Campaign analysis #${analysisId} not found.`);
  return found;
}

/**
 * Retrieve all campaign analysis records across the platform.
 * GET /api/marketing/analysis/all
 */
export async function getAllAnalyses() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/marketing/analysis/all`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, retrieving all local analyses:', err.message);
  }

  return [...demoAnalyses];
}

/**
 * Update campaign progress, views, visible dates, or analyst remarks.
 * PUT /api/marketing/analysis/{analysisId}
 */
export async function updateAnalysis(analysisId, updatedData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/marketing/analysis/${analysisId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    if (response.ok) {
      return await response.json();
    }
    const errText = await response.text();
    throw new Error(errText || 'Failed to update analysis');
  } catch (err) {
    console.warn(`Backend unavailable, updating local analysis #${analysisId}:`, err.message);

    const index = demoAnalyses.findIndex((a) => Number(a.analysisId) === Number(analysisId));
    if (index === -1) throw new Error(`Analysis #${analysisId} not found`);

    demoAnalyses[index] = {
      ...demoAnalyses[index],
      ...updatedData,
      analysisId: Number(analysisId),
    };
    return demoAnalyses[index];
  }
}

/**
 * Increment campaign views count by count (default 1), simulating live audience impressions.
 * PUT /api/marketing/analysis/{analysisId}/increment-views?count={count}
 */
export async function incrementViews(analysisId, count = 1) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/marketing/analysis/${analysisId}/increment-views?count=${count}`, {
      method: 'PUT',
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`Backend unavailable, simulating view increment for analysis #${analysisId}:`, err.message);
  }

  const index = demoAnalyses.findIndex((a) => Number(a.analysisId) === Number(analysisId));
  if (index === -1) throw new Error(`Analysis #${analysisId} not found`);

  const currentViews = demoAnalyses[index].campaignViews || 0;
  demoAnalyses[index].campaignViews = currentViews + count;

  return {
    analysisId: demoAnalyses[index].analysisId,
    campaignName: demoAnalyses[index].campaignName,
    updatedCampaignViews: demoAnalyses[index].campaignViews,
  };
}

/**
 * Delete an analysis record.
 * DELETE /api/marketing/analysis/{analysisId}
 */
export async function deleteAnalysis(analysisId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/marketing/analysis/${analysisId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      return await response.text();
    }
  } catch (err) {
    console.warn(`Backend unavailable, deleting local analysis #${analysisId}:`, err.message);
  }

  demoAnalyses = demoAnalyses.filter((a) => Number(a.analysisId) !== Number(analysisId));
  return `Campaign analysis #${analysisId} deleted successfully.`;
}
