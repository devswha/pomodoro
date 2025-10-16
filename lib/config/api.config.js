/**
 * API Endpoints Configuration
 * Centralized API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Authentication
  login: '/api/auth/login',
  signup: '/api/auth/signup',

  // User Management
  users: '/api/users',
  deleteUser: '/api/users/delete',

  // Sessions
  sessions: '/api/sessions',

  // Meetings
  meetings: '/api/meetings',

  // Admin
  adminDashboard: '/api/admin/dashboard',
  exportUsers: '/api/admin/export-users',

  // Health Check
  health: '/api/health',
};

/**
 * Build full API URL
 * @param {string} endpoint - Endpoint key from API_ENDPOINTS
 * @param {Object} params - Query parameters
 * @returns {string} Full URL with query parameters
 */
export function buildApiUrl(endpoint, params = {}) {
  const baseUrl = API_ENDPOINTS[endpoint] || endpoint;

  const queryString = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export default API_ENDPOINTS;
