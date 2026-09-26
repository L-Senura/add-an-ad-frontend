/**
 * Add-an-Ad Advertising Agency Platform
 * Authentication & Client/Admin API Services
 * Matches Spring Boot AdminController & ClientController
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Generic request wrapper with credentials, JSON headers and descriptive error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    credentials: 'include', // Support HttpSession in Spring Boot
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
        'Unable to connect to backend server. Please verify the Spring Boot server is running on port 8080.'
      );
      connectionError.isNetworkError = true;
      throw connectionError;
    }
    throw err;
  }
}

// -------------------------------------------------------------
// CLIENT API ENDPOINTS (ClientController: /api/client)
// -------------------------------------------------------------

/**
 * Register a new advertising agency client.
 * Status is initialized as "PENDING" awaiting admin review.
 * @param {Object} payload { firstName, lastName, companyName, companyDetails, email, password, contactNumber }
 */
export async function registerClient(payload) {
  return request('/api/client/register', {
    method: 'POST',
    body: JSON.stringify({
      firstName: payload.firstName?.trim(),
      lastName: payload.lastName?.trim(),
      companyName: payload.companyName?.trim(),
      companyDetails: payload.companyDetails?.trim() || '',
      email: payload.email?.trim(),
      password: payload.password,
      contactNumber: payload.contactNumber?.trim() || '',
    }),
  });
}

/**
 * Client login with email and password.
 * @param {Object} credentials { email, password }
 */
export async function loginClient(credentials) {
  return request('/api/client/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email?.trim(),
      password: credentials.password,
    }),
  });
}

/**
 * Client logout (invalidates HTTP session)
 */
export async function logoutClient() {
  return request('/api/client/logout', {
    method: 'POST',
  });
}

/**
 * Get client profile by clientId
 */
export async function getClientById(clientId) {
  return request(`/api/client/${clientId}`);
}

/**
 * Get client profile by email
 */
export async function getClientByEmail(email) {
  return request(`/api/client/by-email/${encodeURIComponent(email)}`);
}

/**
 * Update client profile
 */
export async function updateClientProfile(clientId, updatedData) {
  return request(`/api/client/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedData),
  });
}

// -------------------------------------------------------------
// ADMIN API ENDPOINTS (AdminController: /api/admin)
// -------------------------------------------------------------

export const ADMIN_TYPES = [
  {
    id: 'Marketing_Analyst',
    label: 'Marketing Analyst',
    badge: 'Analytics & Strategy',
    description: 'Track campaign reach, audience metrics, visible ad schedules, and marketing ROI.',
  },
  {
    id: 'Task_Manager',
    label: 'Task Manager',
    badge: 'Operations & Tasks',
    description: 'Coordinate client creative tasks among production staff, set deadlines, and track execution.',
  },
  {
    id: 'Finance_Officer',
    label: 'Finance Officer',
    badge: 'Billing & Invoices',
    description: 'Manage rate cards, platform ad placements, invoices, budgeting, and billing processing.',
  },
  {
    id: 'Communication_Executive',
    label: 'Communication Executive',
    badge: 'Client Messaging',
    description: 'Handle client inquiries, real-time messaging, feedback loop, and campaign correspondence.',
  },
];

/**
 * Register a new admin with a specific adminType
 * @param {Object} payload { firstName, lastName, email, password, adminType, contactNumber }
 */
export async function registerAdmin(payload) {
  return request('/api/admin/register', {
    method: 'POST',
    body: JSON.stringify({
      firstName: payload.firstName?.trim(),
      lastName: payload.lastName?.trim(),
      email: payload.email?.trim(),
      password: payload.password,
      adminType: payload.adminType,
      contactNumber: payload.contactNumber?.trim() || '',
    }),
  });
}

/**
 * Admin login with email and password
 * @param {Object} credentials { email, password }
 */
export async function loginAdmin(credentials) {
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email?.trim(),
      password: credentials.password,
    }),
  });
}

/**
 * Admin logout (invalidates HTTP session)
 */
export async function logoutAdmin() {
  return request('/api/admin/logout', {
    method: 'POST',
  });
}

/**
 * Retrieve role-specific allocated details for an admin
 */
export async function getAdminAllocatedDetails(adminId) {
  return request(`/api/admin/${adminId}/allocated-details`);
}

/**
 * Get pending client accounts awaiting admin approval
 */
export async function getPendingClients() {
  return request('/api/admin/clients/pending');
}

/**
 * Admin approves a client
 */
export async function acceptClient(clientId) {
  return request(`/api/admin/clients/${clientId}/accept`, {
    method: 'PUT',
  });
}

/**
 * Admin rejects a client
 */
export async function rejectClient(clientId) {
  return request(`/api/admin/clients/${clientId}/reject`, {
    method: 'PUT',
  });
}

/**
 * View all clients (optional filter by ?status=ACCEPTED/PENDING/REJECTED)
 */
export async function getAllClients(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/api/admin/clients${query}`);
}

// -------------------------------------------------------------
// LOCAL STORAGE AUTH HELPERS
// -------------------------------------------------------------

const STORAGE_KEY = 'addanad_auth_session';

export function saveAuthSession(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Could not persist session', e);
  }
}

export function getStoredAuthSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Could not clear session', e);
  }
}
