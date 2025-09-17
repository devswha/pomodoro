/**
 * Netlify Functions Wrapper for Next.js API Routes
 * 
 * This function routes all API requests to the appropriate Next.js API route handlers.
 * It provides compatibility between Netlify Functions and Next.js App Router API routes.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current file directory for module resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to resolve API route modules
const resolveApiRoute = (path) => {
  const segments = path.split('/').filter(Boolean);
  const routePath = join(__dirname, '..', '..', 'app', 'api', ...segments, 'route.js');
  return routePath;
};

// Helper to create Next.js compatible request/response objects
const createNextRequest = (event) => {
  const url = new URL(event.rawUrl);
  const method = event.httpMethod.toUpperCase();
  
  // Create request-like object
  const req = {
    method,
    url: event.path,
    headers: event.headers,
    query: event.queryStringParameters || {},
    params: {}, // Will be populated based on route
    body: event.body ? JSON.parse(event.body) : undefined,
    userId: null, // Will be set by auth middleware
    user: null, // Will be set by auth middleware
  };

  return req;
};

// Helper to create Next.js compatible response object
const createNextResponse = () => {
  let statusCode = 200;
  let headers = {};
  let body = '';

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    setHeader: (name, value) => {
      headers[name] = value;
      return res;
    },
    json: (data) => {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
      return res;
    },
    send: (data) => {
      body = data;
      return res;
    },
    end: () => {
      return {
        statusCode,
        headers,
        body
      };
    }
  };

  return res;
};

// Main handler function
export const handler = async (event, context) => {
  try {
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    // Extract API path from the request
    const apiPath = event.path.replace(/^\/api\//, '').replace(/\/$/, '');
    
    if (!apiPath) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'API route not found',
          timestamp: new Date().toISOString()
        }),
      };
    }

    // Dynamic import of the API route
    let routeModule;
    try {
      // Try to resolve the exact route path
      const segments = apiPath.split('/');
      let modulePath = '../../app/api';
      
      // Handle dynamic routes like [sessionId] or [meetingId]
      const resolvedSegments = [];
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        // Check if this could be a dynamic segment
        if (i === segments.length - 1 || !segment.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
          // This might be a dynamic route parameter
          // Try to find a matching dynamic route folder
          try {
            // For now, handle common dynamic routes manually
            if (segments[0] === 'sessions' && segments.length === 2) {
              // /api/sessions/[sessionId]
              modulePath += '/sessions/[sessionId]/route.js';
              resolvedSegments.push('[sessionId]');
              break;
            } else if (segments[0] === 'meetings' && segments.length === 2) {
              // /api/meetings/[meetingId]  
              modulePath += '/meetings/[meetingId]/route.js';
              resolvedSegments.push('[meetingId]');
              break;
            } else {
              resolvedSegments.push(segment);
            }
          } catch (e) {
            resolvedSegments.push(segment);
          }
        } else {
          resolvedSegments.push(segment);
        }
      }
      
      if (!modulePath.endsWith('/route.js')) {
        modulePath += `/${resolvedSegments.join('/')}/route.js`;
      }
      
      routeModule = await import(modulePath);
    } catch (importError) {
      console.error('Failed to import API route:', importError);
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'API route not found',
          path: apiPath,
          timestamp: new Date().toISOString()
        }),
      };
    }

    // Get the appropriate HTTP method handler
    const method = event.httpMethod.toUpperCase();
    const handler = routeModule[method];
    
    if (!handler || typeof handler !== 'function') {
      return {
        statusCode: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: `Method ${method} not allowed`,
          timestamp: new Date().toISOString()
        }),
      };
    }

    // Create Next.js compatible request and response objects
    const req = createNextRequest(event);
    const res = createNextResponse();

    // Extract dynamic route parameters
    const segments = apiPath.split('/');
    if (segments[0] === 'sessions' && segments.length === 2) {
      req.params = { sessionId: segments[1] };
    } else if (segments[0] === 'meetings' && segments.length === 2) {
      req.params = { meetingId: segments[1] };
    }

    // Execute the API route handler
    await handler(req, res);
    
    // Return the response
    const response = res.end();
    return {
      statusCode: response.statusCode,
      headers: { ...corsHeaders, ...response.headers },
      body: response.body,
    };

  } catch (error) {
    console.error('Netlify function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};

export default handler;