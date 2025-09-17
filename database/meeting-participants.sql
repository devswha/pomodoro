-- =====================================================================================
-- MEETING PARTICIPANTS SYSTEM
-- Enables collaborative meetings with multiple users
-- =====================================================================================

-- 1. Create meeting participants table
CREATE TABLE public.meeting_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Participant role
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('owner', 'moderator', 'participant')),

    -- Invitation status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

    -- Timestamps
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,

    -- Unique constraint: one user per meeting
    UNIQUE(meeting_id, user_id)
);

-- 2. Update meetings table to support collaboration
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'team'));
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 10;

-- 3. Create indexes for performance
CREATE INDEX idx_meeting_participants_meeting_id ON public.meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user_id ON public.meeting_participants(user_id);
CREATE INDEX idx_meeting_participants_status ON public.meeting_participants(status);

-- 4. Enable RLS on meeting_participants
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for meeting_participants
CREATE POLICY "Users can view meeting participants they're involved in" ON public.meeting_participants
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT mp.user_id FROM public.meeting_participants mp
            WHERE mp.meeting_id = meeting_participants.meeting_id
        )
    );

CREATE POLICY "Meeting owners can manage participants" ON public.meeting_participants
    FOR ALL USING (
        auth.uid() IN (
            SELECT m.user_id FROM public.meetings m
            WHERE m.id = meeting_participants.meeting_id
        )
    );

-- 6. Update meetings RLS policies to support collaboration
DROP POLICY IF EXISTS "Users can view own meetings" ON public.meetings;

CREATE POLICY "Users can view accessible meetings" ON public.meetings
    FOR SELECT USING (
        -- Own meetings
        auth.uid() = user_id OR
        -- Meetings they're invited to
        auth.uid() IN (
            SELECT mp.user_id FROM public.meeting_participants mp
            WHERE mp.meeting_id = meetings.id
        ) OR
        -- Public meetings
        visibility = 'public'
    );

-- 7. Create function to automatically add meeting owner as participant
CREATE OR REPLACE FUNCTION add_meeting_owner_as_participant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.meeting_participants (meeting_id, user_id, role, status)
    VALUES (NEW.id, NEW.user_id, 'owner', 'accepted');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically add owner as participant
CREATE TRIGGER trigger_add_meeting_owner_as_participant
    AFTER INSERT ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION add_meeting_owner_as_participant();

-- 9. Create function to invite user to meeting
CREATE OR REPLACE FUNCTION invite_user_to_meeting(
    p_meeting_id UUID,
    p_user_id UUID,
    p_invited_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    meeting_owner UUID;
BEGIN
    -- Check if inviter is the meeting owner
    SELECT user_id INTO meeting_owner FROM public.meetings WHERE id = p_meeting_id;

    IF meeting_owner != p_invited_by THEN
        RAISE EXCEPTION 'Only meeting owner can invite participants';
    END IF;

    -- Add participant
    INSERT INTO public.meeting_participants (meeting_id, user_id, role, status)
    VALUES (p_meeting_id, p_user_id, 'participant', 'pending')
    ON CONFLICT (meeting_id, user_id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to accept meeting invitation
CREATE OR REPLACE FUNCTION accept_meeting_invitation(
    p_meeting_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.meeting_participants
    SET status = 'accepted', responded_at = NOW()
    WHERE meeting_id = p_meeting_id AND user_id = p_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;