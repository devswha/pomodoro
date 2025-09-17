/**
 * Meeting Participants API Endpoint
 * POST /api/meetings/participants - Invite user to meeting
 * PUT /api/meetings/participants - Accept/decline invitation
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/client.js';

export async function POST(request) {
    try {
        // Get user from session
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { meeting_id, username } = body;

        if (!meeting_id || !username) {
            return NextResponse.json({
                error: 'Missing required fields: meeting_id, username'
            }, { status: 400 });
        }

        // Find user by username
        const { data: invitedUser, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (userError || !invitedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user is meeting owner
        const { data: meeting, error: meetingError } = await supabaseAdmin
            .from('meetings')
            .select('user_id, title')
            .eq('id', meeting_id)
            .single();

        if (meetingError || !meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        if (meeting.user_id !== user.id) {
            return NextResponse.json({ error: 'Only meeting owner can invite participants' }, { status: 403 });
        }

        // Add participant
        const { data: participant, error: participantError } = await supabaseAdmin
            .from('meeting_participants')
            .insert([{
                meeting_id,
                user_id: invitedUser.id,
                role: 'participant',
                status: 'pending'
            }])
            .select()
            .single();

        if (participantError) {
            if (participantError.code === '23505') { // Unique constraint violation
                return NextResponse.json({ error: 'User already invited to this meeting' }, { status: 409 });
            }
            console.error('Error inviting participant:', participantError);
            return NextResponse.json({ error: 'Failed to invite participant' }, { status: 500 });
        }

        return NextResponse.json({
            participant,
            message: `${username} invited to meeting successfully`
        }, { status: 201 });

    } catch (error) {
        console.error('Invite participant error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        // Get user from session
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { meeting_id, status } = body;

        if (!meeting_id || !status || !['accepted', 'declined'].includes(status)) {
            return NextResponse.json({
                error: 'Invalid status. Must be "accepted" or "declined"'
            }, { status: 400 });
        }

        // Update participant status
        const { data: participant, error: updateError } = await supabaseAdmin
            .from('meeting_participants')
            .update({
                status,
                responded_at: new Date().toISOString()
            })
            .eq('meeting_id', meeting_id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (updateError || !participant) {
            return NextResponse.json({ error: 'Invitation not found or already responded' }, { status: 404 });
        }

        return NextResponse.json({
            participant,
            message: `Invitation ${status} successfully`
        });

    } catch (error) {
        console.error('Update invitation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}