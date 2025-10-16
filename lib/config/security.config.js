/**
 * Security Configuration
 * Authentication, session, and cryptographic settings
 */

// Session Configuration
export const SESSION_CONFIG = {
  // Session timeout (30 minutes)
  timeout: 30 * 60 * 1000,

  // Extended session timeout for "remember me" (7 days)
  extendedTimeout: 7 * 24 * 60 * 60 * 1000,

  // Session cleanup interval (5 minutes)
  cleanupInterval: 5 * 60 * 1000,
};

// Security Settings
export const SECURITY_CONFIG = {
  // Maximum login attempts before account lock
  maxLoginAttempts: 5,

  // Account lock duration (30 minutes)
  accountLockTime: 30 * 60 * 1000,
};

// Password Requirements
export const PASSWORD_CONFIG = {
  // Minimum password length
  minLength: 6,

  // Password validation requirements
  requirements: {
    minLength: 6,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false, // Optional
  },

  // Password validation messages (Korean)
  messages: {
    minLength: '비밀번호는 최소 6자 이상이어야 합니다.',
    requireUppercase: '대문자를 1개 이상 포함해야 합니다.',
    requireLowercase: '소문자를 1개 이상 포함해야 합니다.',
    requireNumber: '숫자를 1개 이상 포함해야 합니다.',
    requireSpecialChar: '특수문자를 1개 이상 포함해야 합니다.',
  },
};

// Username Configuration
export const USERNAME_CONFIG = {
  // Maximum username length
  maxLength: 50,

  // Display name min/max length
  displayNameMin: 2,
  displayNameMax: 30,
};

// Cryptographic Constants
export const CRYPTO_CONFIG = {
  // PBKDF2 iterations for password hashing
  pbkdf2Iterations: 100000,

  // Fallback hash iterations
  fallbackIterations: 1000,

  // Salt size in bytes
  saltSize: 32,

  // Hash size in bits
  hashSize: 256,
};

// Admin Configuration
export const ADMIN_CONFIG = {
  // Admin password (should be moved to environment variable)
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123',

  // Admin session timeout (1 hour)
  sessionTimeout: 60 * 60 * 1000,
};

// Storage Keys
export const STORAGE_KEYS = {
  // User authentication
  sessionToken: 'sessionToken',
  currentUser: 'currentUser',

  // Admin authentication
  adminAuthenticated: 'adminAuthenticated',

  // User data
  registeredUsers: 'registeredUsers',
  userSessions: 'userSessions',
};

export default {
  SESSION_CONFIG,
  SECURITY_CONFIG,
  PASSWORD_CONFIG,
  USERNAME_CONFIG,
  CRYPTO_CONFIG,
  ADMIN_CONFIG,
  STORAGE_KEYS,
};
