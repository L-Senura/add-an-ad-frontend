/**
 * Add-an-Ad Platform - Unified API Services & Route Mapping
 * Aggregates all backend controller endpoints for transparent frontend access
 */

// Route mappings corresponding to Spring Boot backend controller paths
export const BACKEND_API_ROUTES = {
  // 1. Client & Admin Authentication Controller (/api/client, /api/admin)
  CLIENT_AUTH: '/api/client/auth',
  CLIENT_LOGIN: '/api/client/login',
  CLIENT_REGISTER: '/api/client/register',
  CLIENT_HOME: '/api/client/home',
  ADMIN_AUTH: '/api/admin/auth',
  ADMIN_LOGIN: '/api/admin/login',
  ADMIN_REGISTER: '/api/admin/register',
  ADMIN_APPROVALS: '/api/admin/approvals',

  // 2. Campaign Controller (/api/campaign)
  CAMPAIGN: '/api/campaign',
  CAMPAIGN_CREATE: '/api/campaign/create',
  CAMPAIGN_DETAILS: '/api/campaign/details',

  // 3. Communication Controllers (/api/admin_chat, /api/client_chat)
  ADMIN_CHAT: '/api/admin_chat',
  CLIENT_CHAT: '/api/client_chat',
  COMMUNICATION: '/api/communication',

  // 4. Finance Controller (/api/finance)
  FINANCE: '/api/finance',
  FINANCE_INVOICES: '/api/finance/invoices',
  FINANCE_REPORT: '/api/finance/report',

  // 5. Marketing Controller (/api/marketing)
  MARKETING: '/api/marketing',
  MARKETING_ANALYSIS: '/api/marketing/analysis',

  // 6. Operations & Task Controllers (/api/client_tasks, /api/coordinator_tasks, /api/employee_tasks)
  OPERATIONS: '/api/operations',
  CLIENT_TASKS: '/api/client_tasks',
  COORDINATOR_TASKS: '/api/coordinator_tasks',
  // 7. Reviews Controller (/api/reviews)
  REVIEWS: '/api/reviews',
  CLIENT_REVIEWS: '/api/reviews/client-to-admin',
  ADMIN_REVIEWS: '/api/reviews/admin/all',
};

// Re-export all sub-module APIs for direct access
export * from '../pages/client/api';
export * from '../pages/campaign/campaignApi';
export * from '../pages/communication/communicationApi';
export * from '../pages/communication/reviewApi';
export * from '../pages/finance/financeApi';
export * from '../pages/marketing/marketingApi';
export * from '../pages/operations/operationsApi';
