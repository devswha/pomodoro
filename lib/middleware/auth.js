/**
 * Authentication Middleware
 * 
 * JWT token validation, user authentication, and authorization
 * for API routes in the Pomodoro Timer application.
 */

import jwt from 'jsonwebtoken';
import { getAuthenticatedUser, supabase } from '../supabase/client.js';
import { sendUnauthorized, sendForbidden } from '../utils/api-response.js';

/**
 * Extract JWT token from Authorization header
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) return null;
  
  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
};

/**
 * Verify JWT token (for local tokens)
 */
const verifyJwtToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

/**
 * Get user from Supabase using JWT token
 */
const getUserFromSupabase = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
};

/**
 * Main authentication middleware
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return sendUnauthorized(res, 'Access token required');
    }
    
    // Try Supabase auth first (primary method)
    let user = await getUserFromSupabase(token);
    
    // Fallback to JWT verification for local development
    if (!user) {
      const decoded = verifyJwtToken(token);
      if (decoded && decoded.userId) {
        user = { id: decoded.userId, email: decoded.email };
      }
    }
    
    if (!user) {
      return sendUnauthorized(res, 'Invalid or expired token');
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return sendUnauthorized(res, 'Authentication failed');
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      req.user = null;
      req.userId = null;
      return next();
    }
    
    let user = await getUserFromSupabase(token);
    
    if (!user) {
      const decoded = verifyJwtToken(token);
      if (decoded && decoded.userId) {
        user = { id: decoded.userId, email: decoded.email };
      }
    }
    
    req.user = user;
    req.userId = user?.id || null;
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    req.userId = null;
    next();
  }
};

/**
 * User ownership validation middleware
 */
export const requireOwnership = (resourceUserIdExtractor) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.userId) {
        return sendUnauthorized(res, 'Authentication required');
      }
      
      const resourceUserId = typeof resourceUserIdExtractor === 'function' 
        ? resourceUserIdExtractor(req) 
        : req.params.userId || req.body.userId;
      
      if (!resourceUserId) {
        return sendForbidden(res, 'Resource ownership cannot be determined');
      }
      
      if (req.userId !== resourceUserId) {
        return sendForbidden(res, 'Access denied: resource belongs to another user');
      }
      
      next();
    } catch (error) {
      console.error('Ownership middleware error:', error);
      return sendForbidden(res, 'Access denied');
    }
  };
};

/**
 * Admin role validation middleware
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.userId) {
      return sendUnauthorized(res, 'Authentication required');
    }
    
    // Check if user has admin role in Supabase
    const { data: profile, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.userId)
      .single();
    
    if (error || !profile || profile.role !== 'admin') {
      return sendForbidden(res, 'Admin access required');
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return sendForbidden(res, 'Admin access verification failed');
  }
};

/**
 * Generate JWT token for local use
 */
export const generateJwtToken = (payload, expiresIn = '7d') => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Refresh token middleware
 */
export const refreshToken = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return sendUnauthorized(res, 'Refresh token required');
    }
    
    // Refresh Supabase token
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });
    
    if (error || !data.session) {
      return sendUnauthorized(res, 'Invalid refresh token');
    }
    
    req.newToken = data.session.access_token;
    req.refreshToken = data.session.refresh_token;
    req.user = data.user;
    
    next();
  } catch (error) {
    console.error('Token refresh error:', error);
    return sendUnauthorized(res, 'Token refresh failed');
  }
};

/**
 * Validate session middleware (checks if session is still valid)
 */
export const validateSession = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return sendUnauthorized(res, 'Session token required');
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return sendUnauthorized(res, 'Invalid or expired session');
    }
    
    // Additional session validation can be added here
    // (e.g., check if user is still active, check session timeout, etc.)
    
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return sendUnauthorized(res, 'Session validation failed');
  }
};

/**
 * Rate limiting based on user ID
 */
export const rateLimitByUser = (maxRequests = 60, windowMs = 60000) => {
  const requestCounts = new Map();
  
  return async (req, res, next) => {
    const userId = req.userId || req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [key, data] of requestCounts.entries()) {
      if (data.resetTime < now) {
        requestCounts.delete(key);
      }
    }
    
    // Get or create user request data
    if (!requestCounts.has(userId)) {
      requestCounts.set(userId, {
        count: 0,
        resetTime: now + windowMs
      });
    }
    
    const userData = requestCounts.get(userId);
    
    // Reset if window has passed
    if (userData.resetTime < now) {
      userData.count = 0;
      userData.resetTime = now + windowMs;
    }
    
    // Check rate limit
    if (userData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userData.resetTime - now) / 1000),
        timestamp: new Date().toISOString(),
      });
    }
    
    // Increment counter
    userData.count++;
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - userData.count));
    res.setHeader('X-RateLimit-Reset', new Date(userData.resetTime).toISOString());
    
    next();
  };
};

export default {
  requireAuth,
  optionalAuth,
  requireOwnership,
  requireAdmin,
  generateJwtToken,
  refreshToken,
  validateSession,
  rateLimitByUser,
  extractToken,
};