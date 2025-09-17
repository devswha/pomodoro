'use client';

/**
 * useRealtimeSession - Real-time Pomodoro session management hook
 * Handles session synchronization across devices with conflict resolution
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { useUser } from '../contexts/UserContext';
import { supabase, TABLES } from '../supabase/client';

export const useRealtimeSession = () => {
  const { currentUser } = useUser();
  const {
    realtimeSession,
    optimisticUpdate,
    isConnected,
    isOnline,
    addToSyncQueue,
  } = useRealtime();

  const [sessionState, setSessionState] = useState({
    session: null,
    timeRemaining: 0,
    isRunning: false,
    isPaused: false,
    progress: 0,
  });

  const [conflicts, setConflicts] = useState([]);
  const timerRef = useRef();
  const lastServerSyncRef = useRef(Date.now());
  const conflictWindowRef = useRef(3000); // 3-second conflict resolution window

  // Timer management
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSessionState(prev => {
        if (!prev.session || !prev.isRunning) return prev;

        const now = Date.now();
        const endTime = new Date(prev.session.end_time).getTime();
        const duration = prev.session.duration * 60 * 1000; // Convert to milliseconds
        const elapsed = now - new Date(prev.session.start_time).getTime();
        
        const timeRemaining = Math.max(0, endTime - now);
        const progress = Math.min(100, (elapsed / duration) * 100);

        // Auto-complete session when timer reaches zero
        if (timeRemaining <= 0 && prev.session.status === 'active') {
          completeSession();
          return {
            ...prev,
            timeRemaining: 0,
            progress: 100,
            isRunning: false,
          };
        }

        return {
          ...prev,
          timeRemaining: Math.floor(timeRemaining / 1000), // Convert to seconds
          progress,
        };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Session operations with conflict resolution
  const createSession = useCallback(async (sessionData) => {
    if (!currentUser) throw new Error('User not authenticated');

    const now = new Date();
    const duration = (sessionData.duration || 25) * 60 * 1000;
    const startTime = sessionData.scheduledTime ? new Date(sessionData.scheduledTime) : now;
    const endTime = new Date(startTime.getTime() + duration);

    const newSession = {
      id: `session_${Date.now()}_${currentUser.id}`,
      user_id: currentUser.id,
      title: sessionData.title || 'Pomodoro Session',
      goal: sessionData.goal || '',
      tags: sessionData.tags || '',
      location: sessionData.location || '',
      duration: sessionData.duration || 25,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'active',
      shared: sessionData.shared || false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // Optimistic update
    await optimisticUpdate(
      {
        type: 'INSERT',
        table: TABLES.POMODORO_SESSIONS,
        data: newSession,
      },
      newSession
    );

    return newSession;
  }, [currentUser, optimisticUpdate]);

  const updateSession = useCallback(async (sessionId, updates) => {
    if (!currentUser || !sessionState.session) return;

    const updatedSession = {
      ...sessionState.session,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Check for potential conflicts
    const timeSinceLastSync = Date.now() - lastServerSyncRef.current;
    if (timeSinceLastSync < conflictWindowRef.current) {
      // Potential conflict detected, queue the update
      addToSyncQueue({
        type: 'UPDATE',
        table: TABLES.POMODORO_SESSIONS,
        id: sessionId,
        data: updates,
        conflict_resolution: 'last_write_wins',
      });
      return;
    }

    // Optimistic update
    await optimisticUpdate(
      {
        type: 'UPDATE',
        table: TABLES.POMODORO_SESSIONS,
        id: sessionId,
        data: updates,
      },
      updatedSession
    );
  }, [currentUser, sessionState.session, optimisticUpdate, addToSyncQueue]);

  const pauseSession = useCallback(async () => {
    if (!sessionState.session || sessionState.isPaused) return;

    const pauseTime = new Date().toISOString();
    const updates = {
      status: 'paused',
      paused_at: pauseTime,
      updated_at: pauseTime,
    };

    setSessionState(prev => ({
      ...prev,
      isPaused: true,
      isRunning: false,
    }));

    stopTimer();
    await updateSession(sessionState.session.id, updates);
  }, [sessionState.session, sessionState.isPaused, updateSession]);

  const resumeSession = useCallback(async () => {
    if (!sessionState.session || !sessionState.isPaused) return;

    const resumeTime = new Date().toISOString();
    const pausedDuration = sessionState.session.paused_at 
      ? Date.now() - new Date(sessionState.session.paused_at).getTime()
      : 0;

    // Extend end time by paused duration
    const extendedEndTime = new Date(
      new Date(sessionState.session.end_time).getTime() + pausedDuration
    ).toISOString();

    const updates = {
      status: 'active',
      end_time: extendedEndTime,
      paused_at: null,
      updated_at: resumeTime,
    };

    setSessionState(prev => ({
      ...prev,
      isPaused: false,
      isRunning: true,
    }));

    startTimer();
    await updateSession(sessionState.session.id, updates);
  }, [sessionState.session, sessionState.isPaused, updateSession, startTimer]);

  const completeSession = useCallback(async () => {
    if (!sessionState.session) return;

    const completionTime = new Date().toISOString();
    const updates = {
      status: 'completed',
      completed_at: completionTime,
      updated_at: completionTime,
    };

    setSessionState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
    }));

    stopTimer();
    await updateSession(sessionState.session.id, updates);

    // Update user stats optimistically
    if (isConnected) {
      const statsUpdate = {
        type: 'UPDATE',
        table: TABLES.USER_STATS,
        id: currentUser.id,
        data: {
          completed_sessions: 'increment',
          completed_minutes: sessionState.session.duration,
          updated_at: completionTime,
        },
      };

      await optimisticUpdate(statsUpdate, {
        completed_sessions: 'incremented',
        completed_minutes: 'incremented',
      });
    }
  }, [sessionState.session, updateSession, stopTimer, isConnected, currentUser, optimisticUpdate]);

  const stopSession = useCallback(async () => {
    if (!sessionState.session) return;

    const stopTime = new Date().toISOString();
    const updates = {
      status: 'stopped',
      stopped_at: stopTime,
      updated_at: stopTime,
    };

    setSessionState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      session: null,
    }));

    stopTimer();
    await updateSession(sessionState.session.id, updates);
  }, [sessionState.session, updateSession, stopTimer]);

  // Conflict resolution
  const resolveConflict = useCallback(async (conflictId, resolution) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      switch (resolution) {
        case 'accept_server':
          // Accept server version, discard local changes
          setSessionState(prev => ({
            ...prev,
            session: conflict.serverVersion,
          }));
          break;

        case 'accept_local':
          // Push local version to server
          await optimisticUpdate(
            {
              type: 'UPDATE',
              table: TABLES.POMODORO_SESSIONS,
              id: conflict.sessionId,
              data: conflict.localVersion,
            },
            conflict.localVersion
          );
          break;

        case 'merge':
          // Merge strategies based on conflict type
          const merged = mergeSessionData(conflict.localVersion, conflict.serverVersion);
          await optimisticUpdate(
            {
              type: 'UPDATE',
              table: TABLES.POMODORO_SESSIONS,
              id: conflict.sessionId,
              data: merged,
            },
            merged
          );
          setSessionState(prev => ({
            ...prev,
            session: merged,
          }));
          break;
      }

      // Remove resolved conflict
      setConflicts(prev => prev.filter(c => c.id !== conflictId));

    } catch (error) {
      console.error('Conflict resolution failed:', error);
    }
  }, [conflicts, optimisticUpdate]);

  const mergeSessionData = useCallback((local, server) => {
    // Smart merge strategy
    const merged = { ...server }; // Start with server version

    // Keep local status if it's more recent
    if (local.updated_at > server.updated_at) {
      merged.status = local.status;
      merged.updated_at = local.updated_at;
    }

    // Merge pause/resume times intelligently
    if (local.paused_at && !server.paused_at) {
      merged.paused_at = local.paused_at;
    }

    // Keep the later completion time
    if (local.completed_at && server.completed_at) {
      merged.completed_at = new Date(local.completed_at) > new Date(server.completed_at)
        ? local.completed_at
        : server.completed_at;
    } else if (local.completed_at && !server.completed_at) {
      merged.completed_at = local.completed_at;
      merged.status = 'completed';
    }

    return merged;
  }, []);

  // Multi-device synchronization
  const syncSessionAcrossDevices = useCallback(async () => {
    if (!currentUser || !isConnected) return;

    try {
      const { data: serverSession, error } = await supabase
        .from(TABLES.POMODORO_SESSIONS)
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Compare with local session
      if (serverSession && sessionState.session) {
        const localUpdate = new Date(sessionState.session.updated_at);
        const serverUpdate = new Date(serverSession.updated_at);
        const timeDiff = Math.abs(localUpdate - serverUpdate);

        // Detect conflict if updates are within conflict window
        if (timeDiff < conflictWindowRef.current) {
          const conflictId = `conflict_${Date.now()}`;
          setConflicts(prev => [
            ...prev,
            {
              id: conflictId,
              sessionId: sessionState.session.id,
              localVersion: sessionState.session,
              serverVersion: serverSession,
              timestamp: Date.now(),
              type: 'session_update',
            }
          ]);
          return;
        }

        // Apply server version if it's newer
        if (serverUpdate > localUpdate) {
          setSessionState(prev => ({
            ...prev,
            session: serverSession,
          }));
        }
      } else if (serverSession && !sessionState.session) {
        // Resume session from another device
        setSessionState(prev => ({
          ...prev,
          session: serverSession,
          isRunning: serverSession.status === 'active',
          isPaused: serverSession.status === 'paused',
        }));

        if (serverSession.status === 'active') {
          startTimer();
        }
      }

      lastServerSyncRef.current = Date.now();

    } catch (error) {
      console.error('Session sync failed:', error);
    }
  }, [currentUser, isConnected, sessionState.session, startTimer]);

  // Handle real-time session updates
  useEffect(() => {
    if (realtimeSession) {
      const wasRunning = sessionState.isRunning;
      const wasPaused = sessionState.isPaused;

      setSessionState(prev => ({
        ...prev,
        session: realtimeSession,
        isRunning: realtimeSession.status === 'active',
        isPaused: realtimeSession.status === 'paused',
      }));

      // Manage timer based on session status
      if (realtimeSession.status === 'active' && !wasRunning) {
        startTimer();
      } else if (realtimeSession.status !== 'active' && wasRunning) {
        stopTimer();
      }
    } else if (sessionState.session) {
      // Session was stopped or completed
      setSessionState(prev => ({
        ...prev,
        session: null,
        isRunning: false,
        isPaused: false,
      }));
      stopTimer();
    }
  }, [realtimeSession, sessionState.isRunning, sessionState.isPaused, startTimer, stopTimer]);

  // Periodic sync for multi-device support
  useEffect(() => {
    if (!isConnected || !currentUser) return;

    const syncInterval = setInterval(syncSessionAcrossDevices, 10000); // Sync every 10 seconds
    
    return () => clearInterval(syncInterval);
  }, [isConnected, currentUser, syncSessionAcrossDevices]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    // Session state
    session: sessionState.session,
    timeRemaining: sessionState.timeRemaining,
    progress: sessionState.progress,
    isRunning: sessionState.isRunning,
    isPaused: sessionState.isPaused,
    
    // Session operations
    createSession,
    pauseSession,
    resumeSession,
    completeSession,
    stopSession,
    
    // Conflict resolution
    conflicts,
    resolveConflict,
    
    // Utilities
    syncSessionAcrossDevices,
    isConnected,
    isOnline,
  };
};

export default useRealtimeSession;