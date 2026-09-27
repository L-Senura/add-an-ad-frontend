/**
 * Add-an-Ad Advertising Agency Platform
 * Finance & Invoicing API Services
 * Matches Spring Boot FinanceController (/api/finance)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'add_an_ad_finance_invoices';

// Seed invoices if none saved in localStorage yet
const INITIAL_DEMO_INVOICES = [
  {
    invoiceId: 1001,
    clientId: 1,
    campaignId: 1,
    chargedCategory: 'Campaign Charges',
    categoryPrice: 2000.0,
    paymentStatus: 'PAID',
    payedDatetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    clientDescription: 'Charges for campaign: Summer Sale Blitz (on-site pin, YouTube)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    invoiceId: 1002,
    clientId: 1,
    campaignId: 1,
    chargedCategory: 'Platform Charges',
    categoryPrice: 500.0,
    paymentStatus: 'PAID',
    payedDatetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    clientDescription: 'Web agency platform service fee for campaign #1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    invoiceId: 1003,
    clientId: 1,
    campaignId: 2,
    chargedCategory: 'Campaign Charges',
    categoryPrice: 2500.0,
    paymentStatus: 'PENDING',
    payedDatetime: null,
    clientDescription: 'Charges for campaign: Multi-Channel Launch (on-site pin, YouTube, FaceBook)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    invoiceId: 1004,
    clientId: 1,
    campaignId: 2,
    chargedCategory: 'Platform Charges',
    categoryPrice: 500.0,
    paymentStatus: 'PENDING',
    payedDatetime: null,
    clientDescription: 'Web agency platform service fee for campaign #2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    invoiceId: 1005,
    clientId: 101,
    campaignId: 3,
    chargedCategory: 'Campaign Charges',
    categoryPrice: 1800.0,
    paymentStatus: 'PENDING',
    payedDatetime: null,
    clientDescription: 'Charges for campaign: OmniVanguard Video Hype (YouTube, Instagram)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    invoiceId: 1006,
    clientId: 101,
    campaignId: 3,
    chargedCategory: 'Platform Charges',
    categoryPrice: 500.0,
    paymentStatus: 'PENDING',
    payedDatetime: null,
    clientDescription: 'Web agency platform service fee for campaign #3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

function getStoredInvoices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored invoices from localStorage:', e);
  }
  return [...INITIAL_DEMO_INVOICES];
}

function saveStoredInvoices(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save invoices to localStorage:', e);
  }
}

let demoInvoices = getStoredInvoices();

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
        data = { message: text };
      }
    }

    if (!response.ok) {
      const errorMessage =
        data?.message || data?.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const connectionError = new Error(
        'Backend server not connected; running in local finance storage mode.'
      );
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw err;
  }
}

/**
 * Automatically generate platform charges and campaign charges for an existing campaign
 * POST /api/finance/invoice/generate/{campaignId}?platformCharge={platformCharge}
 */
export async function generateCampaignInvoices(campaignId, platformCharge = 500.0, campaignDetails = null) {
  const pCharge = Number(platformCharge != null ? platformCharge : 500.0);
  try {
    return await request(
      `/api/finance/invoice/generate/${campaignId}?platformCharge=${pCharge}`,
      {
        method: 'POST',
      }
    );
  } catch {
    // Offline / demo fallback generator
    const campPrice = Number(campaignDetails?.campaignPrices || 2000.0);
    const clientRefId = Number(campaignDetails?.clientID || 1);
    const campName = campaignDetails?.campaignName || `Campaign #${campaignId}`;
    const channels = campaignDetails?.selectedChannels || 'Standard ad placement';

    const campInvoice = {
      invoiceId: Date.now(),
      clientId: clientRefId,
      campaignId: Number(campaignId),
      chargedCategory: 'Campaign Charges',
      categoryPrice: campPrice,
      paymentStatus: 'PENDING',
      payedDatetime: null,
      clientDescription: `Charges for campaign: ${campName} (${channels})`,
      createdAt: new Date().toISOString(),
    };

    const platInvoice = {
      invoiceId: Date.now() + 1,
      clientId: clientRefId,
      campaignId: Number(campaignId),
      chargedCategory: 'Platform Charges',
      categoryPrice: pCharge,
      paymentStatus: 'PENDING',
      payedDatetime: null,
      clientDescription: `Web agency platform service fee for campaign #${campaignId}`,
      createdAt: new Date().toISOString(),
    };

    demoInvoices.unshift(platInvoice);
    demoInvoices.unshift(campInvoice);
    saveStoredInvoices(demoInvoices);

    return {
      success: true,
      message: `Invoices generated successfully for campaign #${campaignId}`,
      campaignChargesInvoice: campInvoice,
      platformChargesInvoice: platInvoice,
      totalAmount: campPrice + pCharge,
    };
  }
}

/**
 * Manually create an invoice entry
 * POST /api/finance/invoice/create
 */
export async function createInvoice(invoiceData) {
  const payload = {
    clientId: Number(invoiceData.clientId),
    campaignId: invoiceData.campaignId ? Number(invoiceData.campaignId) : null,
    chargedCategory: invoiceData.chargedCategory || 'Platform Charges',
    categoryPrice: Number(invoiceData.categoryPrice),
    paymentStatus: invoiceData.paymentStatus || 'PENDING',
    clientDescription: invoiceData.clientDescription || '',
  };

  try {
    return await request('/api/finance/invoice/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const newInv = {
      invoiceId: Date.now(),
      clientId: payload.clientId,
      campaignId: payload.campaignId,
      chargedCategory: payload.chargedCategory,
      categoryPrice: payload.categoryPrice,
      paymentStatus: payload.paymentStatus,
      payedDatetime: payload.paymentStatus === 'PAID' ? new Date().toISOString() : null,
      clientDescription: payload.clientDescription || 'Agency invoice entry',
      createdAt: new Date().toISOString(),
    };
    demoInvoices.unshift(newInv);
    saveStoredInvoices(demoInvoices);
    return newInv;
  }
}

/**
 * Mark an invoice as paid, recording the payment datetime and client description/remarks
 * PUT /api/finance/invoice/{invoiceId}/pay
 */
export async function recordInvoicePayment(invoiceId, paymentRemarks = '') {
  try {
    return await request(`/api/finance/invoice/${invoiceId}/pay`, {
      method: 'PUT',
      body: JSON.stringify({ client_description: paymentRemarks }),
    });
  } catch {
    const target = demoInvoices.find((i) => i.invoiceId === Number(invoiceId));
    if (target) {
      target.paymentStatus = 'PAID';
      target.payedDatetime = new Date().toISOString();
      if (paymentRemarks) {
        target.clientDescription = paymentRemarks;
      }
      saveStoredInvoices(demoInvoices);
    }
    return {
      success: true,
      message: `Payment recorded successfully for invoice #${invoiceId}`,
      invoice: target,
    };
  }
}

/**
 * Update an existing invoice (PUT /api/finance/invoice/{invoiceId} or /pay)
 * Provides comprehensive CRUD update support with fallback
 */
export async function updateInvoice(invoiceId, updatedFields) {
  const payload = {
    ...updatedFields,
    clientId: updatedFields.clientId ? Number(updatedFields.clientId) : undefined,
    campaignId: updatedFields.campaignId ? Number(updatedFields.campaignId) : null,
    categoryPrice:
      updatedFields.categoryPrice != null ? Number(updatedFields.categoryPrice) : undefined,
  };

  try {
    // If updating payment specifically, route to /pay endpoint
    if (payload.paymentStatus === 'PAID' && updatedFields.clientDescription) {
      await request(`/api/finance/invoice/${invoiceId}/pay`, {
        method: 'PUT',
        body: JSON.stringify({ client_description: updatedFields.clientDescription }),
      }).catch(() => null);
    }

    return await request(`/api/finance/invoice/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch {
    const idx = demoInvoices.findIndex((i) => i.invoiceId === Number(invoiceId));
    if (idx !== -1) {
      demoInvoices[idx] = {
        ...demoInvoices[idx],
        ...payload,
        payedDatetime:
          payload.paymentStatus === 'PAID' && !demoInvoices[idx].payedDatetime
            ? new Date().toISOString()
            : demoInvoices[idx].payedDatetime,
      };
      saveStoredInvoices(demoInvoices);
      return demoInvoices[idx];
    }
    return { invoiceId: Number(invoiceId), ...payload };
  }
}

/**
 * Delete an invoice entry (DELETE /api/finance/invoice/{invoiceId})
 * Provides comprehensive CRUD delete support with fallback
 */
export async function deleteInvoice(invoiceId) {
  try {
    return await request(`/api/finance/invoice/${invoiceId}`, {
      method: 'DELETE',
    });
  } catch {
    demoInvoices = demoInvoices.filter((i) => i.invoiceId !== Number(invoiceId));
    saveStoredInvoices(demoInvoices);
    return {
      success: true,
      message: `Invoice #${invoiceId} removed successfully.`,
    };
  }
}

/**
 * Get all invoices with optional filter by category or status
 * GET /api/finance/invoices?category={category}&status={status}
 */
export async function getAllInvoices(category, status) {
  const params = new URLSearchParams();
  if (category && category !== 'ALL') params.append('category', category.trim());
  if (status && status !== 'ALL') params.append('status', status.trim().toUpperCase());
  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const data = await request(`/api/finance/invoices${query}`);
    return Array.isArray(data) ? data : [];
  } catch {
    let list = [...demoInvoices];
    if (category && category !== 'ALL') {
      list = list.filter((i) => i.chargedCategory === category);
    }
    if (status && status !== 'ALL') {
      list = list.filter(
        (i) => i.paymentStatus?.toUpperCase() === status.toUpperCase()
      );
    }
    return list;
  }
}

/**
 * Get all invoices for a specific client
 * GET /api/finance/invoices/client/{clientId}
 */
export async function getInvoicesByClientId(clientId) {
  try {
    const data = await request(`/api/finance/invoices/client/${clientId}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return demoInvoices.filter((i) => String(i.clientId) === String(clientId));
  }
}

/**
 * Get all invoices for a specific campaign
 * GET /api/finance/invoices/campaign/{campaignId}
 */
export async function getInvoicesByCampaignId(campaignId) {
  try {
    const data = await request(`/api/finance/invoices/campaign/${campaignId}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return demoInvoices.filter((i) => String(i.campaignId) === String(campaignId));
  }
}

/**
 * Generate an aggregated Financial Report
 * GET /api/finance/report
 */
export async function getFinanceReport() {
  try {
    return await request('/api/finance/report');
  } catch {
    const all = [...demoInvoices];
    let totalBilled = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalPlatform = 0;
    let totalCampaign = 0;
    let paidCount = 0;
    let pendingCount = 0;

    all.forEach((inv) => {
      const price = inv.categoryPrice || 0;
      totalBilled += price;

      if (inv.chargedCategory?.toLowerCase() === 'platform charges') {
        totalPlatform += price;
      } else if (inv.chargedCategory?.toLowerCase() === 'campaign charges') {
        totalCampaign += price;
      }

      if (inv.paymentStatus?.toUpperCase() === 'PAID') {
        totalCollected += price;
        paidCount++;
      } else {
        totalPending += price;
        pendingCount++;
      }
    });

    return {
      totalInvoices: all.length,
      totalBilledAmount: totalBilled,
      totalRevenueCollected: totalCollected,
      totalPendingAmount: totalPending,
      totalPlatformCharges: totalPlatform,
      totalCampaignCharges: totalCampaign,
      paidInvoicesCount: paidCount,
      pendingInvoicesCount: pendingCount,
      invoiceList: all,
    };
  }
}
