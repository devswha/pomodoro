'use client';

/**
 * RealtimeContext - Comprehensive real-time synchronization system
 * Provides real-time updates, multi-device sync, presence, and collaboration features
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase, TABLES } from '../supabase/client';
import { useUser } from './UserContext';

const RealtimeContext = createContext();

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider = ({ children }) => {
  const { currentUser } = useUser();
  
  // Core state management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting', 'connected', 'reconnecting', 'disconnected'
  const [subscriptions, setSubscriptions] = useState(new Map());
  const [presenceData, setPresenceData] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Sync queue for offline operations
  const [syncQueue, setSyncQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true);
  
  // Real-time data state
  const [realtimeSession, setRealtimeSession] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [realtimeMeetings, setRealtimeMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Collaborative state
  const [sharedSessions, setSharedSessions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  
  // Refs for cleanup and optimization
  const reconnectTimeoutRef = useRef();
  const heartbeatIntervalRef = useRef();
  const subscriptionsRef = useRef(new Map());
  const lastSyncRef = useRef(Date.now());
  const conflictResolutionRef = useRef(new Map());

  // Connection management
  const connect = useCallback(async () => {
    if (!currentUser || connectionStatus === 'connected') return;
    
    setConnectionStatus('connecting');
    
    try {
      // Initialize presence channel
      await initializePresence();
      
      // Subscribe to user-specific channels
      await subscribeToUserChannels();
      
      // Subscribe to collaborative channels if enabled
      await subscribeToCollaborativeChannels();
      
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Start heartbeat
      startHeartbeat();
      
      // Process sync queue if there are pending operations
      if (syncQueue.length > 0) {
        await processSyncQueue();
      }
      
    } catch (error) {
      console.error('Real-time connection failed:', error);
      setConnectionStatus('disconnected');
      scheduleReconnect();
    }
  }, [currentUser, connectionStatus]);

  const disconnect = useCallback(() => {
    setConnectionStatus('disconnected');
    setIsConnected(false);
    
    // Clear all subscriptions
    subscriptionsRef.current.forEach((subscription) => {
      subscription.unsubscribe();
    });
    subscriptionsRef.current.clear();
    setSubscriptions(new Map());
    
    // Clear intervals
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Clear presence
    setPresenceData({});
    setOnlineUsers([]);
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const delay = Math.min(1000 * Math.pow(2, (connectionStatus === 'reconnecting' ? 1 : 0)), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionStatus('reconnecting');
      connect();
    }, delay);
  }, [connect, connectionStatus]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        // Simple heartbeat to detect connection issues
        const { error } = await supabase
          .from(TABLES.USERS)
          .select('id')
          .eq('id', currentUser?.id)
          .limit(1);
        
        if (error) throw error;
        
      } catch (error) {
        console.warn('Heartbeat failed:', error);
        if (isConnected) {
          setConnectionStatus('reconnecting');
          scheduleReconnect();
        }
      }
    }, 30000); // 30 second heartbeat
  }, [currentUser, isConnected, scheduleReconnect]);

  // Presence system
  const initializePresence = useCallback(async () => {
    if (!currentUser) return;
    
    const presenceChannel = supabase.channel(`presence-user-${currentUser.id}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        const users = Object.keys(presenceState).map(userId => {
          const [user] = presenceState[userId];
          return user;
        });
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      });

    const status = await presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track user presence
        await presenceChannel.track({
          user_id: currentUser.id,
          username: currentUser.displayName || currentUser.id,
          status: 'online',
          last_seen: new Date().toISOString(),
          active_session: realtimeSession?.id || null,
        });
      }
    });

    subscriptionsRef.current.set('presence', presenceChannel);
    setSubscriptions(prev => new Map(prev.set('presence', presenceChannel)));
    
  }, [currentUser, realtimeSession]);

  // User-specific channel subscriptions
  const subscribeToUserChannels = useCallback(async () => {
    if (!currentUser) return;

    // Pomodoro sessions channel
    const sessionsChannel = supabase
      .channel(`user-sessions-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.POMODORO_SESSIONS,
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          handleSessionUpdate(payload);
        }
      )
      .subscribe();

    // User stats channel
    const statsChannel = supabase
      .channel(`user-stats-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.USER_STATS,
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          setRealtimeStats(payload.new);
        }
      )
      .subscribe();

    // Meetings channel
    const meetingsChannel = supabase
      .channel(`user-meetings-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.MEETINGS,
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          handleMeetingUpdate(payload);
        }
      )
      .subscribe();

    subscriptionsRef.current.set('sessions', sessionsChannel);
    subscriptionsRef.current.set('stats', statsChannel);
    subscriptionsRef.current.set('meetings', meetingsChannel);
    
    setSubscriptions(prev => new Map([
      ...prev,
      ['sessions', sessionsChannel],
      ['stats', statsChannel],
      ['meetings', meetingsChannel],
    ]));

  }, [currentUser]);

  // Collaborative channel subscriptions
  const subscribeToCollaborativeChannels = useCallback(async () => {
    if (!currentUser) return;

    // Global leaderboard updates
    const leaderboardChannel = supabase
      .channel('global-leaderboard')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.USER_STATS,
        },
        (payload) => {
          updateLeaderboard(payload);
        }
      )
      .subscribe();

    // Shared sessions channel
    const sharedChannel = supabase
      .channel('shared-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.POMODORO_SESSIONS,
          filter: 'shared=eq.true',
        },
        (payload) => {
          updateSharedSessions(payload);
        }
      )
      .subscribe();

    subscriptionsRef.current.set('leaderboard', leaderboardChannel);
    subscriptionsRef.current.set('shared', sharedChannel);
    
    setSubscriptions(prev => new Map([
      ...prev,
      ['leaderboard', leaderboardChannel],
      ['shared', sharedChannel],
    ]));

  }, [currentUser]);

  // Event handlers
  const handleSessionUpdate = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord.status === 'active') {
          setRealtimeSession(newRecord);
          addNotification({
            type: 'session_started',
            message: `Pomodoro session "${newRecord.title}" started`,
            session: newRecord,
            timestamp: new Date().toISOString(),
          });
        }
        break;
        
      case 'UPDATE':
        // Handle session updates with conflict resolution
        if (newRecord.user_id === currentUser?.id) {
          if (shouldUpdateSession(newRecord, oldRecord)) {
            setRealtimeSession(newRecord.status === 'active' ? newRecord : null);
          }
        }
        break;
        
      case 'DELETE':
        if (oldRecord.user_id === currentUser?.id && oldRecord.status === 'active') {
          setRealtimeSession(null);
        }
        break;
    }
  }, [currentUser]);

  const handleMeetingUpdate = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setRealtimeMeetings(prev => {
      switch (eventType) {
        case 'INSERT':
          return [...prev, newRecord];
        case 'UPDATE':
          return prev.map(meeting => 
            meeting.id === newRecord.id ? newRecord : meeting
          );
        case 'DELETE':
          return prev.filter(meeting => meeting.id !== oldRecord.id);
        default:
          return prev;
      }
    });
    
    // Add meeting notifications
    if (eventType === 'INSERT') {
      const meetingTime = new Date(`${newRecord.date}T${newRecord.time}`);
      const reminderTime = new Date(meetingTime.getTime() - (newRecord.reminder_minutes || 15) * 60 * 1000);
      
      // Schedule reminder notification
      if (reminderTime > new Date()) {
        setTimeout(() => {
          addNotification({
            type: 'meeting_reminder',
            message: `Meeting "${newRecord.title}" starting in ${newRecord.reminder_minutes || 15} minutes`,
            meeting: newRecord,
            timestamp: new Date().toISOString(),
          });
        }, reminderTime.getTime() - Date.now());
      }
    }
  }, []);

  const updateLeaderboard = useCallback((payload) => {
    // Update leaderboard efficiently
    setLeaderboard(prev => {
      const updated = prev.map(entry => 
        entry.user_id === payload.new.user_id ? { ...entry, ...payload.new } : entry
      );
      
      // Sort by completed_minutes descending
      return updated.sort((a, b) => b.completed_minutes - a.completed_minutes);
    });
  }, []);

  const updateSharedSessions = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setSharedSessions(prev => {
      switch (eventType) {
        case 'INSERT':
          return [...prev, newRecord];
        case 'UPDATE':
          return prev.map(session => 
            session.id === newRecord.id ? newRecord : session
          );
        case 'DELETE':
          return prev.filter(session => session.id !== oldRecord.id);
        default:
          return prev;
      }
    });
  }, []);

  // Conflict resolution
  const shouldUpdateSession = useCallback((newRecord, oldRecord) => {
    const key = `session_${newRecord.id}`;
    const lastConflictTime = conflictResolutionRef.current.get(key) || 0;
    const timeSinceLastConflict = Date.now() - lastConflictTime;
    
    // Implement last-write-wins with 5-second buffer to prevent rapid updates
    if (timeSinceLastConflict > 5000) {
      conflictResolutionRef.current.set(key, Date.now());
      return true;
    }
    
    // For rapid updates, prefer the server version (new record)
    return new Date(newRecord.updated_at) >= new Date(oldRecord.updated_at);
  }, []);

  // Sync queue management for offline operations
  const addToSyncQueue = useCallback((operation) => {
    setSyncQueue(prev => [
      ...prev,
      {
        ...operation,
        id: `sync_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        retries: 0,
      }
    ]);
  }, []);

  const processSyncQueue = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0) return;
    
    const queue = [...syncQueue];
    setSyncQueue([]);
    
    const failed = [];
    
    for (const operation of queue) {
      try {
        await executeOperation(operation);
      } catch (error) {
        console.error('Sync operation failed:', error, operation);
        
        if (operation.retries < 3) {
          failed.push({
            ...operation,
            retries: operation.retries + 1,
          });
        }
      }
    }
    
    if (failed.length > 0) {
      setSyncQueue(prev => [...prev, ...failed]);
    }
  }, [isOnline, syncQueue]);

  const executeOperation = useCallback(async (operation) => {
    const { type, table, data, id } = operation;
    
    switch (type) {
      case 'INSERT':
        const { error: insertError } = await supabase
          .from(table)
          .insert(data);
        if (insertError) throw insertError;
        break;
        
      case 'UPDATE':
        const { error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq('id', id);
        if (updateError) throw updateError;
        break;
        
      case 'DELETE':
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (deleteError) throw deleteError;
        break;
    }
  }, []);

  // Notification system
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [
      {
        ...notification,
        id: `notif_${Date.now()}_${Math.random()}`,
        read: false,
      },
      ...prev.slice(0, 49) // Keep max 50 notifications
    ]);
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Public API methods
  const updatePresence = useCallback(async (updates) => {
    const presenceChannel = subscriptionsRef.current.get('presence');
    if (presenceChannel) {
      await presenceChannel.track({
        ...presenceData,
        ...updates,
        last_seen: new Date().toISOString(),
      });
    }
  }, [presenceData]);

  const broadcastMessage = useCallback(async (channelName, event, payload) => {
    const channel = subscriptionsRef.current.get(channelName);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }, []);

  // Optimistic update helper
  const optimisticUpdate = useCallback(async (operation, optimisticData) => {
    // Apply optimistic update immediately
    switch (operation.table) {
      case TABLES.POMODORO_SESSIONS:
        if (operation.type === 'UPDATE' && optimisticData.status === 'active') {
          setRealtimeSession(optimisticData);
        }
        break;
      case TABLES.USER_STATS:
        if (operation.type === 'UPDATE') {
          setRealtimeStats(prev => ({ ...prev, ...optimisticData }));
        }
        break;
    }
    
    // Add to sync queue or execute immediately if online
    if (isOnline && isConnected) {
      try {
        await executeOperation(operation);
      } catch (error) {
        // Rollback optimistic update on failure
        console.error('Optimistic update failed, rolling back:', error);
        // Implement rollback logic here
        
        // Add to sync queue for retry
        addToSyncQueue(operation);
      }
    } else {
      addToSyncQueue(operation);
    }
  }, [isOnline, isConnected, addToSyncQueue, executeOperation]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (currentUser) {
        connect();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('disconnected');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, connect]);

  // Auto-connect when user is available
  useEffect(() => {
    if (currentUser && isOnline && connectionStatus === 'disconnected') {
      connect();
    } else if (!currentUser && connectionStatus !== 'disconnected') {
      disconnect();
    }
  }, [currentUser, isOnline, connectionStatus, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Periodic sync for missed updates
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (isConnected && currentUser) {
        const timeSinceLastSync = Date.now() - lastSyncRef.current;
        
        // Sync every 5 minutes or if there are queued operations
        if (timeSinceLastSync > 300000 || syncQueue.length > 0) {
          await processSyncQueue();
          lastSyncRef.current = Date.now();
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(syncInterval);
  }, [isConnected, currentUser, syncQueue, processSyncQueue]);

  const value = {
    // Connection state
    isConnected,
    connectionStatus,
    isOnline,
    
    // Real-time data
    realtimeSession,
    realtimeStats,
    realtimeMeetings,
    notifications,
    
    // Presence
    presenceData,
    onlineUsers,
    updatePresence,
    
    // Collaborative features
    sharedSessions,
    leaderboard,
    activityFeed,
    
    // Sync management
    syncQueue,
    optimisticUpdate,
    addToSyncQueue,
    
    // Notifications
    addNotification,
    markNotificationAsRead,
    clearNotifications,
    
    // Connection management
    connect,
    disconnect,
    broadcastMessage,
    
    // Utilities
    subscriptions: Array.from(subscriptions.keys()),
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeProvider;