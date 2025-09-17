/**
 * Validation Schemas using Zod
 * 
 * Type-safe validation schemas for all API endpoints.
 * Provides consistent validation across the application.
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
const emailSchema = z.string().email('Invalid email address').toLowerCase();
const passwordSchema = z.string().min(4, 'Password must be at least 4 characters');
const usernameSchema = z.string().min(1, 'Username is required').max(50, 'Username too long');
const uuidSchema = z.string().uuid('Invalid UUID format');
const positiveIntSchema = z.number().int().positive();
const dateSchema = z.string().datetime('Invalid date format');

/**
 * Authentication schemas
 */
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

/**
 * User schemas
 */
export const updateUserProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  email: emailSchema.optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

export const userPreferencesSchema = z.object({
  defaultPomodoroLength: z.number().int().min(1).max(120).default(25),
  breakLength: z.number().int().min(1).max(30).default(5),
  longBreakLength: z.number().int().min(1).max(60).default(15),
  weeklyGoal: z.number().int().min(1).max(1000).default(140),
  theme: z.enum(['default', 'dark', 'minimal']).default('default'),
  soundEnabled: z.boolean().default(true),
  notificationsEnabled: z.boolean().default(true),
  autoStartBreak: z.boolean().default(false),
  autoStartPomodoro: z.boolean().default(false),
});

/**
 * Pomodoro session schemas
 */
export const createSessionSchema = z.object({
  title: z.string().min(1, 'Session title is required').max(200),
  goal: z.string().max(500).optional(),
  tags: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  duration: z.number().int().min(1).max(120).default(25),
  scheduledTime: dateSchema.optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  goal: z.string().max(500).optional(),
  tags: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  status: z.enum(['scheduled', 'active', 'completed', 'stopped']).optional(),
});

export const sessionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['scheduled', 'active', 'completed', 'stopped']).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  tags: z.string().optional(),
});

/**
 * Meeting schemas
 */
export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(200),
  description: z.string().max(1000).optional(),
  date: z.string().date('Invalid date format'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z.number().int().min(15).max(480).default(60), // 15 min to 8 hours
  location: z.string().max(200).optional(),
  participants: z.array(z.string().email()).optional(),
  type: z.enum(['meeting', 'call', 'presentation', 'workshop', 'other']).default('meeting'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  reminderMinutes: z.number().int().min(0).max(10080).default(15), // up to 1 week
});

export const updateMeetingSchema = createMeetingSchema.partial();

export const meetingQuerySchema = z.object({
  date: z.string().date().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  type: z.enum(['meeting', 'call', 'presentation', 'workshop', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

/**
 * Dashboard and statistics schemas
 */
export const statsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('week'),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const leaderboardQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year']).default('week'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Common query schemas
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Validation helper function
 */
export const validateSchema = (schema, data) => {
  try {
    return {
      success: true,
      data: schema.parse(data),
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: (error.errors || []).map(err => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message,
          code: err.code,
        })),
      };
    }
    
    return {
      success: false,
      data: null,
      errors: [{ message: 'Validation failed', code: 'unknown_error' }],
    };
  }
};

/**
 * Middleware function for request validation
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const validation = validateSchema(schema, req.body);
    
    if (!validation.success) {
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
        timestamp: new Date().toISOString(),
      });
    }
    
    req.validatedData = validation.data;
    next();
  };
};

/**
 * Query parameter validation
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const validation = validateSchema(schema, req.query);
    
    if (!validation.success) {
      return res.status(422).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.errors,
        timestamp: new Date().toISOString(),
      });
    }
    
    req.validatedQuery = validation.data;
    next();
  };
};

export default {
  // Schemas
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateUserProfileSchema,
  userPreferencesSchema,
  createSessionSchema,
  updateSessionSchema,
  sessionQuerySchema,
  createMeetingSchema,
  updateMeetingSchema,
  meetingQuerySchema,
  statsQuerySchema,
  leaderboardQuerySchema,
  paginationSchema,
  sortSchema,
  
  // Helpers
  validateSchema,
  validateRequest,
  validateQuery,
};