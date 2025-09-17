/**
 * User Profile Management API Endpoint
 * GET /api/users/profile - Get user profile
 * PUT /api/users/profile - Update user profile
 * 
 * Manages user profile data including personal information and preferences.
 */

import { supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { updateUserProfileSchema, validateSchema } from '../../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError,
  sendNotFound,
  sendValidationError,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';

async function getProfileHandler(req, res) {
  // Apply authentication middleware
  await new Promise((resolve, reject) => {
    requireAuth(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (!supabaseAdmin) {
    return sendError(res, 'Database access not available', 503);
  }

  try {
    const userId = req.userId;

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from(TABLES.USERS)
      .select(`
        id,
        username,
        display_name,
        email,
        avatar_url,
        bio,
        role,
        created_at,
        updated_at,
        last_login_at
      `)
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return sendNotFound(res, 'User profile not found');
    }

    // Get user preferences
    const { data: preferences } = await supabaseAdmin
      .from(TABLES.USER_PREFERENCES)
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get user stats
    const { data: stats } = await supabaseAdmin
      .from(TABLES.USER_STATS)
      .select('*')
      .eq('user_id', userId)
      .single();

    const response = {
      profile,
      preferences,
      stats,
    };

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 'Failed to retrieve profile', 500);
  }
}

async function updateProfileHandler(req, res) {
  // Apply authentication middleware
  await new Promise((resolve, reject) => {
    requireAuth(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (!supabaseAdmin) {
    return sendError(res, 'Database access not available', 503);
  }

  // Validate request body
  const validation = validateSchema(updateUserProfileSchema, req.body);
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const userId = req.userId;
    const updates = validation.data;

    // Check if user exists
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from(TABLES.USERS)
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !existingUser) {
      return sendNotFound(res, 'User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updates.email && updates.email !== existingUser.email) {
      const { data: emailExists } = await supabaseAdmin
        .from(TABLES.USERS)
        .select('id')
        .eq('email', updates.email)
        .neq('id', userId)
        .single();

      if (emailExists) {
        return sendValidationError(res, [{
          field: 'email',
          message: 'Email already in use'
        }]);
      }
    }

    // Update user profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return sendError(res, 'Failed to update profile', 500);
    }

    return sendSuccess(res, updatedProfile, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 'Failed to update profile', 500);
  }
}

// Named exports for App Router
export const GET = withErrorHandling(getProfileHandler);
export const PUT = withErrorHandling(updateProfileHandler);