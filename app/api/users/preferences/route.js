/**
 * User Preferences Management API Endpoint
 * GET /api/users/preferences - Get user preferences
 * PUT /api/users/preferences - Update user preferences
 * 
 * Manages user preferences for Pomodoro timer settings.
 */

import { supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { userPreferencesSchema, validateSchema } from '../../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError,
  sendNotFound,
  sendValidationError,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';

async function getPreferencesHandler(req, res) {
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

    const { data: preferences, error } = await supabaseAdmin
      .from(TABLES.USER_PREFERENCES)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !preferences) {
      // If preferences don't exist, create default ones
      const defaultPreferences = {
        user_id: userId,
        default_pomodoro_length: 25,
        break_length: 5,
        long_break_length: 15,
        weekly_goal: 140,
        theme: 'default',
        sound_enabled: true,
        notifications_enabled: true,
        auto_start_break: false,
        auto_start_pomodoro: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newPreferences, error: insertError } = await supabaseAdmin
        .from(TABLES.USER_PREFERENCES)
        .insert(defaultPreferences)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create default preferences:', insertError);
        return sendError(res, 'Failed to retrieve preferences', 500);
      }

      return sendSuccess(res, newPreferences);
    }

    return sendSuccess(res, preferences);

  } catch (error) {
    console.error('Get preferences error:', error);
    return sendError(res, 'Failed to retrieve preferences', 500);
  }
}

async function updatePreferencesHandler(req, res) {
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
  const validation = validateSchema(userPreferencesSchema, req.body);
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const userId = req.userId;
    const updates = validation.data;

    // Check if preferences exist
    const { data: existingPrefs, error: existsError } = await supabaseAdmin
      .from(TABLES.USER_PREFERENCES)
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existsError && existsError.code !== 'PGRST116') {
      console.error('Error checking existing preferences:', existsError);
      return sendError(res, 'Failed to check existing preferences', 500);
    }

    let result;
    
    if (!existingPrefs) {
      // Create new preferences
      const newPreferences = {
        user_id: userId,
        ...updates,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from(TABLES.USER_PREFERENCES)
        .insert(newPreferences)
        .select()
        .single();

      if (error) {
        console.error('Failed to create preferences:', error);
        return sendError(res, 'Failed to create preferences', 500);
      }

      result = data;
    } else {
      // Update existing preferences
      const { data, error } = await supabaseAdmin
        .from(TABLES.USER_PREFERENCES)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update preferences:', error);
        return sendError(res, 'Failed to update preferences', 500);
      }

      result = data;
    }

    return sendSuccess(res, result, 'Preferences updated successfully');

  } catch (error) {
    console.error('Update preferences error:', error);
    return sendError(res, 'Failed to update preferences', 500);
  }
}

// Named exports for App Router
export const GET = withErrorHandling(getPreferencesHandler);
export const PUT = withErrorHandling(updatePreferencesHandler);