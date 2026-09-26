/**
 * Add-an-Ad Advertising Agency Platform
 * Finance & Invoicing API Services
 * Matches Spring Boot FinanceController (/api/finance)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Fallback demo invoices for offline / local preview testing
let demoInvoices = [
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
      const connectionError = new Error('Backend server not connected; running in local finance storage mode.');
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw err;
  }
}

/**
 * Generate platform and campaign charges invoices for an existing campaign
 * POST /api/finance/invoice/generate/{campaignId}?platformCharge={platformCharge}
 */
export async function generateCampaignInvoices(campaignId, platformCharge = 500.0, campaignDetails = null) {
  try {
    return await request(`/api/finance/invoice/generate/${campaignId}?platformCharge=${platformCharge}`, {
      method: 'POST',
    });
  } catch {
    // Offline fallback generator
    const campPrice = campaignDetails?.campaignPrices || 2000.0;
    const clientRefId = campaignDetails?.clientID || 1;
    const campName = campaignDetails?.campaignName || `Campaign #${campaignId}`;

    const campInvoice = {
      invoiceId: Date.now(),
      clientId: clientRefId,
      campaignId: Number(campaignId),
      chargedCategory: 'Campaign Charges',
      categoryPrice: campPrice,
      paymentStatus: 'PENDING',
      payedDatetime: null,
      clientDescription: `Charges for campaign: ${campName}`,
      createdAt: new Date().toISOString(),
    };

    const platInvoice = {
      invoiceId: Date.now() + 1,
      clientId: clientRefId,
      campaignId: Number(campaignId),
      chargedCategory: 'Platform Charges',
      categoryPrice: Number(platformCharge),
      paymentStatus: 'PENDING',
      payedDatetime: null,
      clientDescription: `Web agency platform service fee for campaign #${campaignId}`,
      createdAt: new Date().toISOString(),
    };

    demoInvoices.unshift(platInvoice);
    demoInvoices.unshift(campInvoice);

    return {
      success: true,
      message: `Invoices generated successfully for campaign #${campaignId}`,
      campaignChargesInvoice: campInvoice,
      platformChargesInvoice: platInvoice,
      totalAmount: campPrice + Number(platformCharge),
    };
  }
}

/**
 * Manually create an invoice entry
 * POST /api/finance/invoice/create
 */
export async function createInvoice(invoiceData) {
  try {
    return await request('/api/finance/invoice/create', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  } catch {
    const newInv = {
      invoiceId: Date.now(),
      clientId: Number(invoiceData.clientId),
      campaignId: invoiceData.campaignId ? Number(invoiceData.campaignId) : null,
      chargedCategory: invoiceData.chargedCategory,
      categoryPrice: Number(invoiceData.categoryPrice),
      paymentStatus: invoiceData.paymentStatus || 'PENDING',
      payedDatetime: invoiceData.paymentStatus === 'PAID' ? new Date().toISOString() : null,
      clientDescription: invoiceData.clientDescription || 'Agency invoice',
      createdAt: new Date().toISOString(),
    };
    demoInvoices.unshift(newInv);
    return newInv;
  }
}

/**
 * Mark an invoice as paid
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
      if (paymentRemarks) target.clientDescription = paymentRemarks;
    }
    return {
      success: true,
      message: `Payment recorded successfully for invoice #${invoiceId}`,
      invoice: target,
    };
  }
}

/**
 * Get all invoices with optional filter by category or status
 * GET /api/finance/invoices?category={category}&status={status}
 */
export async function getAllInvoices(category, status) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (status) params.append('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    return await request(`/api/finance/invoices${query}`);
  } catch {
    let list = [...demoInvoices];
    if (category) list = list.filter((i) => i.chargedCategory === category);
    if (status) list = list.filter((i) => i.paymentStatus?.toUpperCase() === status.toUpperCase());
    return list;
  }
}

/**
 * Get all invoices for a specific client
 * GET /api/finance/invoices/client/{clientId}
 */
export async function getInvoicesByClientId(clientId) {
  try {
    return await request(`/api/finance/invoices/client/${clientId}`);
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
    return await request(`/api/finance/invoices/campaign/${campaignId}`);
  } catch {
    return demoInvoices.filter((i) => String(i.campaignId) === String(campaignId));
  }
}

/**
 * Get aggregated financial report
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
      if (inv.chargedCategory === 'Platform Charges') totalPlatform += price;
      if (inv.chargedCategory === 'Campaign Charges') totalCampaign += price;
      if (inv.paymentStatus === 'PAID') {
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
      reportGeneratedTime: new Date().toISOString(),
      invoiceList: all,
    };
  }
}
