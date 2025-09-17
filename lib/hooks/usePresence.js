'use client';

/**
 * usePresence - Real-time presence and user status management hook
 * Handles online/offline status, activity tracking, and collaborative features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../supabase/client';

export const usePresence = () => {
  const { currentUser } = useUser();
  const {
    onlineUsers,
    updatePresence,
    isConnected,
    broadcastMessage,
  } = useRealtime();

  const [presenceState, setPresenceState] = useState({
    status: 'online', // 'online', 'away', 'busy', 'offline'
    activity: 'idle', // 'active', 'idle', 'in_session', 'in_meeting'
    lastSeen: new Date().toISOString(),
    customStatus: null,
  });

  const [userStatuses, setUserStatuses] = useState(new Map());
  const [activityHistory, setActivityHistory] = useState([]);
  const [socialFeatures, setSocialFeatures] = useState({
    studyBuddies: [],
    activeRooms: [],
    invitations: [],
  });

  const activityTimeoutRef = useRef();
  const awayTimeoutRef = useRef();
  const lastActivityRef = useRef(Date.now());
  const presenceChannelRef = useRef();

  // Activity detection
  const updateActivity = useCallback((activityType = 'active') => {
    lastActivityRef.current = Date.now();
    
    const newState = {
      ...presenceState,
      activity: activityType,
      lastSeen: new Date().toISOString(),
      status: activityType === 'in_session' ? 'busy' : 'online',
    };

    setPresenceState(newState);
    
    if (isConnected) {
      updatePresence(newState);
    }

    // Reset away timer
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }

    // Set away status after 10 minutes of inactivity
    awayTimeoutRef.current = setTimeout(() => {
      setPresenceState(prev => ({
        ...prev,
        status: 'away',
        activity: 'idle',
      }));
      
      if (isConnected) {
        updatePresence({
          status: 'away',
          activity: 'idle',
          lastSeen: new Date().toISOString(),
        });
      }
    }, 600000); // 10 minutes

  }, [presenceState, isConnected, updatePresence]);

  // Manual status updates
  const setStatus = useCallback(async (status, customMessage = null) => {
    const newState = {
      ...presenceState,
      status,
      customStatus: customMessage,
      lastSeen: new Date().toISOString(),
    };

    setPresenceState(newState);
    
    if (isConnected) {
      await updatePresence(newState);
      
      // Broadcast status change to interested parties
      await broadcastMessage('user-status', 'status_changed', {
        userId: currentUser?.id,
        status,
        customStatus: customMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }, [presenceState, isConnected, updatePresence, broadcastMessage, currentUser]);

  const setActivity = useCallback(async (activity, metadata = {}) => {
    updateActivity(activity);
    
    // Track activity in history
    const activityRecord = {
      id: `activity_${Date.now()}`,
      userId: currentUser?.id,
      activity,
      metadata,
      timestamp: new Date().toISOString(),
    };

    setActivityHistory(prev => [
      activityRecord,
      ...prev.slice(0, 49) // Keep last 50 activities
    ]);

    // Broadcast activity for social features
    if (isConnected && ['in_session', 'completed_session', 'joined_room'].includes(activity)) {
      await broadcastMessage('activity-feed', 'user_activity', activityRecord);
    }
  }, [updateActivity, currentUser, isConnected, broadcastMessage]);

  // Study buddy and collaboration features
  const inviteStudyBuddy = useCallback(async (targetUserId, sessionId = null) => {
    if (!isConnected || !currentUser) return;

    const invitation = {
      id: `invite_${Date.now()}`,
      from: currentUser.id,
      to: targetUserId,
      type: 'study_buddy',
      sessionId,
      message: `${currentUser.displayName || currentUser.id} invited you to study together`,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    await broadcastMessage(`user-${targetUserId}`, 'study_invitation', invitation);
    
    setSocialFeatures(prev => ({
      ...prev,
      invitations: [...prev.invitations, { ...invitation, outgoing: true }],
    }));

    return invitation;
  }, [isConnected, currentUser, broadcastMessage]);

  const respondToInvitation = useCallback(async (invitationId, response) => {
    const invitation = socialFeatures.invitations.find(inv => inv.id === invitationId);
    if (!invitation) return;

    const responseData = {
      invitationId,
      response, // 'accept', 'decline'
      respondedAt: new Date().toISOString(),
    };

    await broadcastMessage(`user-${invitation.from}`, 'invitation_response', responseData);

    if (response === 'accept') {
      // Join study session or create study buddy relationship
      setSocialFeatures(prev => ({
        ...prev,
        studyBuddies: [...prev.studyBuddies, invitation.from],
        invitations: prev.invitations.filter(inv => inv.id !== invitationId),
      }));
    } else {
      setSocialFeatures(prev => ({
        ...prev,
        invitations: prev.invitations.filter(inv => inv.id !== invitationId),
      }));
    }
  }, [socialFeatures.invitations, broadcastMessage]);

  const createStudyRoom = useCallback(async (roomName, isPublic = false) => {
    if (!isConnected || !currentUser) return;

    const room = {
      id: `room_${Date.now()}`,
      name: roomName,
      creator: currentUser.id,
      isPublic,
      members: [currentUser.id],
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    // Create room channel
    const roomChannel = supabase.channel(`study-room-${room.id}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = roomChannel.presenceState();
        const members = Object.keys(presenceState);
        
        setSocialFeatures(prev => ({
          ...prev,
          activeRooms: prev.activeRooms.map(r => 
            r.id === room.id ? { ...r, members } : r
          ),
        }));
      })
      .on('broadcast', { event: 'room_message' }, ({ payload }) => {
        // Handle room messages
        console.log('Room message:', payload);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            user_id: currentUser.id,
            username: currentUser.displayName || currentUser.id,
            joined_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = roomChannel;

    setSocialFeatures(prev => ({
      ...prev,
      activeRooms: [...prev.activeRooms, room],
    }));

    await setActivity('joined_room', { roomId: room.id, roomName });

    return room;
  }, [isConnected, currentUser, setActivity]);

  const joinStudyRoom = useCallback(async (roomId) => {
    if (!isConnected || !currentUser) return;

    // Join existing room channel
    const roomChannel = supabase.channel(`study-room-${roomId}`);
    
    await roomChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await roomChannel.track({
          user_id: currentUser.id,
          username: currentUser.displayName || currentUser.id,
          joined_at: new Date().toISOString(),
        });

        await setActivity('joined_room', { roomId });
      }
    });

    presenceChannelRef.current = roomChannel;
  }, [isConnected, currentUser, setActivity]);

  const leaveStudyRoom = useCallback(async (roomId) => {
    if (presenceChannelRef.current) {
      await presenceChannelRef.current.unsubscribe();
      presenceChannelRef.current = null;
    }

    setSocialFeatures(prev => ({
      ...prev,
      activeRooms: prev.activeRooms.filter(room => room.id !== roomId),
    }));

    await setActivity('left_room', { roomId });
  }, [setActivity]);

  const sendRoomMessage = useCallback(async (roomId, message, type = 'chat') => {
    if (!presenceChannelRef.current) return;

    const messageData = {
      id: `msg_${Date.now()}`,
      userId: currentUser?.id,
      username: currentUser?.displayName || currentUser?.id,
      message,
      type, // 'chat', 'session_update', 'encouragement'
      timestamp: new Date().toISOString(),
    };

    await presenceChannelRef.current.send({
      type: 'broadcast',
      event: 'room_message',
      payload: messageData,
    });
  }, [currentUser]);

  // User status utilities
  const getUserStatus = useCallback((userId) => {
    return userStatuses.get(userId) || {
      status: 'offline',
      activity: 'idle',
      lastSeen: null,
    };
  }, [userStatuses]);

  const getOnlineCount = useCallback(() => {
    return onlineUsers.filter(user => user.status === 'online').length;
  }, [onlineUsers]);

  const getActiveSessionUsers = useCallback(() => {
    return onlineUsers.filter(user => user.activity === 'in_session');
  }, [onlineUsers]);

  const getUsersInSameActivity = useCallback((activity) => {
    return onlineUsers.filter(user => user.activity === activity);
  }, [onlineUsers]);

  // Automatic activity detection from user interactions
  const trackUserInteraction = useCallback((interactionType) => {
    updateActivity('active');
    
    // Track specific interactions for analytics
    const interactions = {
      'session_start': 'in_session',
      'session_complete': 'completed_session',
      'session_pause': 'paused_session',
      'meeting_join': 'in_meeting',
    };

    if (interactions[interactionType]) {
      setActivity(interactions[interactionType]);
    }
  }, [updateActivity, setActivity]);

  // Process online users updates
  useEffect(() => {
    const statusMap = new Map();
    
    onlineUsers.forEach(user => {
      statusMap.set(user.user_id, {
        status: user.status || 'online',
        activity: user.activity || 'idle',
        lastSeen: user.last_seen || new Date().toISOString(),
        customStatus: user.custom_status || null,
        activeSession: user.active_session || null,
      });
    });

    setUserStatuses(statusMap);
  }, [onlineUsers]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity('active');
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial activity
    updateActivity('active');

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }
    };
  }, [updateActivity]);

  // Update presence when going offline/online
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isConnected) {
        updatePresence({
          status: 'offline',
          lastSeen: new Date().toISOString(),
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConnected, updatePresence]);

  return {
    // Current user presence
    presenceState,
    setStatus,
    setActivity,
    trackUserInteraction,
    
    // Other users
    onlineUsers,
    userStatuses,
    getUserStatus,
    getOnlineCount,
    getActiveSessionUsers,
    getUsersInSameActivity,
    
    // Activity tracking
    activityHistory,
    
    // Social features
    socialFeatures,
    inviteStudyBuddy,
    respondToInvitation,
    createStudyRoom,
    joinStudyRoom,
    leaveStudyRoom,
    sendRoomMessage,
    
    // Connection state
    isConnected,
  };
};

export default usePresence;