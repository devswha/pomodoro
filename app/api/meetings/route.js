/**
 * Meetings API Endpoint
 * GET /api/meetings - List accessible meetings
 * POST /api/meetings - Create new meeting
 */

import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '../../../lib/supabase/client.js';

export async function GET(request) {
    try {
        // Get user from session
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get accessible meetings (own meetings + invited meetings + public meetings)
        const { data: meetings, error } = await supabaseAdmin
            .from('meetings')
            .select(`
                *,
                meeting_participants!inner(
                    role,
                    status,
                    user:users(username, display_name)
                )
            `)
            .or(`user_id.eq.${user.id},visibility.eq.public`)
            .order('meeting_date', { ascending: true })
            .order('meeting_time', { ascending: true });

        if (error) {
            console.error('Error fetching meetings:', error);
            return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
        }

        return NextResponse.json({ meetings: meetings || [] });

    } catch (error) {
        console.error('Meetings GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        // Get user from session
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { title, meeting_date, meeting_time, duration, visibility = 'private', max_participants = 10 } = body;

        // Validate required fields
        if (!title || !meeting_date || !meeting_time) {
            return NextResponse.json({
                error: 'Missing required fields: title, meeting_date, meeting_time'
            }, { status: 400 });
        }

        // Create meeting
        const { data: meeting, error: meetingError } = await supabaseAdmin
            .from('meetings')
            .insert([{
                user_id: user.id,
                title,
                meeting_date,
                meeting_time,
                duration: duration || 25, // Default 25 minutes
                visibility,
                max_participants,
                status: 'scheduled'
            }])
            .select()
            .single();

        if (meetingError) {
            console.error('Error creating meeting:', meetingError);
            return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
        }

        return NextResponse.json({
            meeting,
            message: 'Meeting created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Meetings POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}