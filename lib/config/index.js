/**
 * Central Configuration Export
 * Single import point for all application configurations
 */

// Version
export { APP_VERSION } from './version';

// API Configuration
export {
  API_ENDPOINTS,
  buildApiUrl,
} from './api.config';

// Security Configuration
export {
  SESSION_CONFIG,
  SECURITY_CONFIG,
  PASSWORD_CONFIG,
  USERNAME_CONFIG,
  CRYPTO_CONFIG,
  ADMIN_CONFIG,
  STORAGE_KEYS,
} from './security.config';

// Pomodoro Configuration
export {
  POMODORO_CONFIG,
  NOTIFICATION_CONFIG,
  GOALS_CONFIG,
  USER_STATS_CONFIG,
} from './pomodoro.config';

// UI Configuration
export {
  UI_CONFIG,
  PAGINATION_CONFIG,
  ANALYTICS_CONFIG,
  COLORS,
  ANIMATION_CONFIG,
} from './ui.config';

// Messages and Labels
export {
  AUTH_MESSAGES,
  LABELS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  NOTIFICATION_MESSAGES,
} from './messages.config';

// Default export - all configurations
import apiConfig from './api.config';
import securityConfig from './security.config';
import pomodoroConfig from './pomodoro.config';
import uiConfig from './ui.config';
import messagesConfig from './messages.config';
import { APP_VERSION } from './version';

export default {
  APP_VERSION,
  ...apiConfig,
  ...securityConfig,
  ...pomodoroConfig,
  ...uiConfig,
  ...messagesConfig,
};
