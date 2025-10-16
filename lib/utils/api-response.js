/**
 * Standardized API Response Utilities
 * 
 * Consistent response formatting, error handling, and HTTP status codes
 * for all API endpoints in the STEP Timer application.
 */

/**
 * Standard API response structure
 */
export const createApiResponse = (success, data = null, message = null, meta = {}) => {
  const response = {
    success,
    timestamp: new Date().toISOString(),
    ...meta
  };

  if (success) {
    response.data = data;
    if (message) response.message = message;
  } else {
    response.error = message || 'An error occurred';
    if (data) response.details = data;
  }

  return response;
};

/**
 * Success response helper
 */
export const successResponse = (data, message = null, meta = {}) => {
  return createApiResponse(true, data, message, meta);
};

/**
 * Error response helper
 */
export const errorResponse = (message, details = null, meta = {}) => {
  return createApiResponse(false, details, message, meta);
};

/**
 * HTTP status code constants
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Send standardized API response
 */
export const sendResponse = (res, statusCode, data) => {
  // Next.js App Router uses Response.json() instead of res.status().json()
  return Response.json(data, { status: statusCode });
};

/**
 * Send success response
 */
export const sendSuccess = (res, data, message = null, statusCode = HTTP_STATUS.OK, meta = {}) => {
  const response = successResponse(data, message, meta);
  return sendResponse(res, statusCode, response);
};

/**
 * Send error response
 */
export const sendError = (res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null, meta = {}) => {
  const response = errorResponse(message, details, meta);
  return sendResponse(res, statusCode, response);
};

/**
 * Common error responses
 */
export const sendBadRequest = (res, message = 'Bad request', details = null) => {
  return sendError(res, message, HTTP_STATUS.BAD_REQUEST, details);
};

export const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
};

export const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, message, HTTP_STATUS.FORBIDDEN);
};

export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, HTTP_STATUS.NOT_FOUND);
};

export const sendConflict = (res, message = 'Resource conflict', details = null) => {
  return sendError(res, message, HTTP_STATUS.CONFLICT, details);
};

export const sendValidationError = (res, errors, message = 'Validation failed') => {
  return sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
};

export const sendTooManyRequests = (res, message = 'Too many requests') => {
  return sendError(res, message, HTTP_STATUS.TOO_MANY_REQUESTS);
};

export const sendInternalError = (res, message = 'Internal server error', error = null) => {
  // Log the actual error for debugging (but don't expose it to client)
  if (error) {
    console.error('Internal server error:', error);
  }
  
  return sendError(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

/**
 * Async wrapper for API routes to handle errors
 */
export const withErrorHandling = (handler) => {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API route error:', error);
      
      // Handle specific error types
      if (error.name === 'ValidationError') {
        return sendValidationError(res, error.errors, error.message);
      }
      
      if (error.name === 'UnauthorizedError') {
        return sendUnauthorized(res, error.message);
      }
      
      if (error.name === 'ForbiddenError') {
        return sendForbidden(res, error.message);
      }
      
      if (error.name === 'NotFoundError') {
        return sendNotFound(res, error.message);
      }
      
      if (error.name === 'ConflictError') {
        return sendConflict(res, error.message, error.details);
      }
      
      // Generic error response
      return sendInternalError(res, 'An unexpected error occurred', error);
    }
  };
};

/**
 * Pagination helpers
 */
export const createPaginationMeta = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage,
      hasPrevPage,
    }
  };
};

/**
 * API method validation
 */
export const validateMethod = (req, res, allowedMethods) => {
  if (!allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods.join(', '));
    return sendError(res, `Method ${req.method} not allowed`, 405);
  }
  return true;
};

/**
 * Request validation helpers
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw {
      name: 'ValidationError',
      message: 'Missing required fields',
      errors: missingFields.map(field => ({
        field,
        message: `${field} is required`
      }))
    };
  }
};

export default {
  createApiResponse,
  successResponse,
  errorResponse,
  HTTP_STATUS,
  sendResponse,
  sendSuccess,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
  sendTooManyRequests,
  sendInternalError,
  withErrorHandling,
  createPaginationMeta,
  validateMethod,
  validateRequiredFields,
};