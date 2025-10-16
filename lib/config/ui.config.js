/**
 * UI Configuration
 * Display settings, pagination, and visual thresholds
 */

// Display and Pagination
export const UI_CONFIG = {
  // Loading simulation delay (milliseconds)
  loadingDelay: 500,

  // Upcoming meetings to display
  upcomingMeetingsLimit: 3,

  // Low time styling threshold (seconds)
  lowTimeThreshold: 300, // 5 minutes

  // Warning animation threshold (seconds)
  warningThreshold: 60, // 1 minute
};

// Pagination Settings
export const PAGINATION_CONFIG = {
  // Default page size
  defaultPageSize: 10,

  // Page size options
  pageSizeOptions: [10, 25, 50, 100],

  // Upcoming meetings limit
  upcomingMeetingsLimit: 5,
};

// Analytics Display Settings
export const ANALYTICS_CONFIG = {
  // Days to consider for active user calculation
  activeUserDays: 7,

  // Number of recent sessions to display
  recentSessionsLimit: 10,
};

// Color Constants (Fallback - prefer CSS variables)
export const COLORS = {
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    dark: '#000000',
  },
  text: {
    primary: '#000000',
    secondary: '#6c757d',
    light: '#adb5bd',
  },
  status: {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#007bff',
  },
  focus: {
    border: '#000000',
  },
  ui: {
    border: '#e9ecef',
    hover: '#333333',
    disabled: '#adb5bd',
  },
};

// Animation and Timing
export const ANIMATION_CONFIG = {
  // Standard transition duration (milliseconds)
  transitionDuration: 200,

  // Loading spinner animation duration (milliseconds)
  spinnerDuration: 1000,
};

export default {
  UI_CONFIG,
  PAGINATION_CONFIG,
  ANALYTICS_CONFIG,
  COLORS,
  ANIMATION_CONFIG,
};
